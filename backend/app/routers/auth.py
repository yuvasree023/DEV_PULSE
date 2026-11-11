"""
GitHub OAuth, PAT authentication, and user profile management router for DEV_PULSE.
"""

import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.user_repository import UserRepository
from app.database import persistence_ready
from app.services.auth import (
    get_current_user,
    get_current_user_optional,
    exchange_github_code_for_token,
    fetch_github_user_profile,
    upsert_user_and_token,
    get_or_create_demo_user,
    get_user_github_token,
    create_email_user,
    authenticate_email_user,
    link_github_to_user,
    add_email_password_to_user,
)
from app.services.passwords import validate_password_strength, hash_password
from app.services.emailer import email_configured, send_email
from app.services.security import create_access_token, decode_access_token, mask_token

logger = logging.getLogger("app.routers.auth")

router = APIRouter(prefix="/auth", tags=["Authentication & User Sessions"])


def ensure_persistent_writes():
    """
    Fail closed: when the service is on its ephemeral SQLite fallback, account
    data written now would vanish on the next restart. Refuse the write instead.
    """
    if not persistence_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account storage is temporarily unavailable while the database reconnects. Please try again in a few minutes; nothing was saved.",
        )


def user_payload(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "github_id": user.github_id,
        "username": user.username,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "company": user.company,
    }


def issue_session_response(user: User, response: Response) -> Dict[str, Any]:
    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})
    response.set_cookie(
        key="devpulse_auth_token",
        value=jwt_token,
        httponly=False,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
    )
    return {"access_token": jwt_token, "token_type": "bearer", "user": user_payload(user)}


class SignupRequest(BaseModel):
    name: str = Field("", description="Display name")
    email: str = Field(..., description="Account email")
    password: str = Field(..., description="At least 8 characters")


class EmailLoginRequest(BaseModel):
    email: str
    password: str


class AddEmailPasswordRequest(BaseModel):
    email: str = Field(..., description="Email to sign in with")
    password: str = Field(..., description="At least 8 characters")
    current_password: Optional[str] = Field(None, description="Required when the account already has a password")


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class PATLoginRequest(BaseModel):
    token: str = Field(..., description="GitHub Personal Access Token. Public repos need no scopes; for private repos use a fine-grained token with read-only access to selected repositories.")


class OAuthCallbackRequest(BaseModel):
    code: str = Field(..., description="OAuth code received from GitHub redirect")


@router.get("/github", summary="Get GitHub OAuth authorization URL")
def get_github_oauth_url():
    """
    Returns the GitHub OAuth login URL with configured client ID and scopes.
    """
    client_id = settings.GITHUB_CLIENT_ID
    if not client_id:
        return {
            "oauth_configured": False,
            "message": "GITHUB_CLIENT_ID is not configured. You can use Personal Access Token (PAT) or Demo Sign-In.",
            "url": None,
        }

    redirect_uri = settings.GITHUB_REDIRECT_URI or f"{settings.FRONTEND_URL}/login"
    scope = "read:user,user:email"
    oauth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={scope}&"
        f"state=devpulse_oauth"
    )
    return {
        "oauth_configured": True,
        "url": oauth_url,
    }


@router.post("/github/callback", summary="Exchange GitHub OAuth code for session token")
async def github_oauth_callback(req: OAuthCallbackRequest, response: Response, db: Session = Depends(get_db)):
    """
    Exchanges GitHub OAuth code, retrieves user profile, creates user session, and issues JWT.
    """
    ensure_persistent_writes()
    token_data = await exchange_github_code_for_token(req.code)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to receive access token from GitHub.",
        )

    github_profile = await fetch_github_user_profile(access_token)
    user = upsert_user_and_token(
        db,
        github_profile,
        access_token,
        scope=token_data.get("scope"),
        provider="github",
    )

    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})

    # Set secure cookie
    response.set_cookie(
        key="devpulse_auth_token",
        value=jwt_token,
        httponly=False,  # Accessible for frontend router checks
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
    )

    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "github_id": user.github_id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "company": user.company,
        },
    }


@router.post("/pat", summary="Login or connect with GitHub Personal Access Token")
async def login_with_pat(req: PATLoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Validates a GitHub Personal Access Token against GitHub API, creates/updates user, and sets session.
    """
    ensure_persistent_writes()
    token = req.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Personal access token is required.")

    # Verify against live GitHub API
    github_profile = await fetch_github_user_profile(token)
    user = upsert_user_and_token(db, github_profile, token, scope="read:user,user:email", provider="github")

    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})
    response.set_cookie(
        key="devpulse_auth_token",
        value=jwt_token,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
    )

    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "github_id": user.github_id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "company": user.company,
        },
    }


@router.post("/demo", summary="Instant demo sign-in as Lead ML Engineer")
def login_as_demo(response: Response, db: Session = Depends(get_db)):
    """
    Instant demo sign-in for preview and grading.
    """
    ensure_persistent_writes()
    user = get_or_create_demo_user(db)
    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})
    response.set_cookie(
        key="devpulse_auth_token",
        value=jwt_token,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
    )
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "github_id": user.github_id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
        },
    }


@router.post("/signup", summary="Create an account with email and password")
def signup(req: SignupRequest, response: Response, db: Session = Depends(get_db)):
    """
    Email/password registration. GitHub connection is a separate step after login.
    """
    ensure_persistent_writes()
    pw_error = validate_password_strength(req.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    user = create_email_user(db, req.name, req.email, req.password)
    return issue_session_response(user, response)


@router.post("/login", summary="Log in with email and password")
def login_with_email(req: EmailLoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Email/password login for existing accounts.
    """
    user = authenticate_email_user(db, req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return issue_session_response(user, response)


@router.post("/github/link", summary="Connect GitHub to the signed-in account")
async def link_github(
    req: OAuthCallbackRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Links a GitHub identity to the current account. The user completes GitHub's
    own OAuth consent; the code from that flow is exchanged here. Never merges
    accounts: a GitHub identity already tied to another account is refused.
    """
    ensure_persistent_writes()
    token_data = await exchange_github_code_for_token(req.code)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to receive access token from GitHub.")
    github_profile = await fetch_github_user_profile(access_token)
    linked = link_github_to_user(db, user, github_profile, access_token, scope=token_data.get("scope"))
    return {"linked": True, "user": user_payload(linked)}


@router.post("/email-password", summary="Add or change email/password sign-in on the signed-in account")
def add_email_password(
    req: AddEmailPasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Lets an existing account (for example a GitHub-only account) add email/password
    sign-in, or change it. Being signed in proves control of the account; the
    email is refused when it belongs to a different account (never merged).
    """
    ensure_persistent_writes()
    pw_error = validate_password_strength(req.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    updated = add_email_password_to_user(db, user, req.email, req.password, req.current_password)
    return {"success": True, "user": user_payload(updated)}


@router.post("/password/forgot", summary="Request a password reset email")
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Always returns success so account existence is not leaked. When an email
    provider is configured and the account uses a password, a reset link is sent.
    When no provider is configured the endpoint fails closed with 503 so the UI
    never claims an email was sent when none was.
    """
    if not email_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset by email is not set up yet.",
        )
    user = db.query(User).filter(User.email == (req.email or "").strip().lower()).first()
    # Reset links go only to verified emails: an unverified address may belong to
    # someone else, and it cannot be allowed to receive account-recovery mail.
    if user and user.password_hash and user.email_verified:
        reset_token = create_access_token(
            {"sub": str(user.id), "purpose": "password_reset"},
            expires_delta=timedelta(minutes=30),
        )
        frontend = (settings.FRONTEND_URL or "").rstrip("/") or "https://devpulse-app-snowy.vercel.app"
        link = f"{frontend}/reset-password?token={reset_token}"
        sent = await send_email(
            user.email,
            "Reset your DevPulse password",
            f"<p>Hi {user.name or 'there'},</p>"
            f"<p>Reset your DevPulse password within 30 minutes:<br>"
            f'<a href="{link}">{link}</a></p>'
            f"<p>If you did not ask for this, ignore this email.</p>",
        )
        if not sent:
            logger.warning("Password reset email for user %s was not sent (provider unconfigured or failed).", user.id)
    return {"success": True, "message": "If that email has an account, a reset link is on its way."}


@router.post("/password/reset", summary="Set a new password with a reset token")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Completes a password reset using the emailed token.
    """
    ensure_persistent_writes()
    payload = decode_access_token(req.token)
    if not payload or payload.get("purpose") != "password_reset" or "sub" not in payload:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired. Request a new one.")
    pw_error = validate_password_strength(req.new_password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired. Request a new one.")
    user.password_hash = hash_password(req.new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "message": "Password updated. You can log in with the new password."}


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/email/verify/send", summary="Send an email-verification link to the signed-in account")
async def send_email_verification(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Emails a verification link for the account's current email address. Fails
    closed with 503 while no email provider is configured so the UI never
    claims an email was sent when none was. This is the only mail an
    unverified address can receive; password-reset links require a verified email.
    """
    if not email_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email verification is not set up yet.",
        )
    if not user.email:
        raise HTTPException(status_code=400, detail="Add an email address first.")
    if user.email_verified:
        return {"success": True, "message": "This email is already verified."}
    token = create_access_token(
        {"sub": str(user.id), "purpose": "email_verify"},
        expires_delta=timedelta(hours=24),
    )
    frontend = (settings.FRONTEND_URL or "").rstrip("/") or "https://devpulse-app-snowy.vercel.app"
    link = f"{frontend}/verify-email?token={token}"
    sent = await send_email(
        user.email,
        "Verify your DevPulse email",
        f"<p>Hi {user.name or 'there'},</p>"
        f"<p>Confirm this email for your DevPulse account within 24 hours:<br>"
        f'<a href="{link}">{link}</a></p>'
        f"<p>If you did not ask for this, ignore this email.</p>",
    )
    if not sent:
        raise HTTPException(status_code=502, detail="The verification email could not be sent. Please try again later.")
    return {"success": True, "message": "Verification email sent. Check your inbox."}


@router.post("/email/verify", summary="Confirm an email-verification token")
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Marks the account email verified using the emailed token."""
    ensure_persistent_writes()
    payload = decode_access_token(req.token)
    if not payload or payload.get("purpose") != "email_verify" or "sub" not in payload:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired. Request a new one.")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired. Request a new one.")
    user.email_verified = True
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "message": "Email verified. You can use it for sign-in and password resets."}


@router.get("/me", summary="Get authenticated user profile and connected repos")
def get_current_user_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the authenticated developer's personalized profile and list of tracked repositories.
    """
    tracked_repos = (
        db.query(UserRepository)
        .filter(UserRepository.user_id == user.id)
        .all()
    )

    token = get_user_github_token(user, db)

    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "github_id": user.github_id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "company": user.company,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        "github_connected": token is not None,
        "has_password": user.password_hash is not None,
        "email_verified": bool(user.email_verified),
        "github_token_masked": mask_token(token) if token else None,
        "tracked_repositories_count": len(tracked_repos),
        "tracked_repositories": [
            {
                "repo_id": tr.repo_id,
                "is_selected": tr.is_selected,
                "sync_status": tr.sync_status,
                "sync_progress": tr.sync_progress,
                "prs_count": tr.prs_count,
                "commits_count": tr.commits_count,
                "last_synced_at": tr.last_synced_at.isoformat() if tr.last_synced_at else None,
                "error": tr.error_message,
            }
            for tr in tracked_repos
        ],
    }


@router.post("/logout", summary="Log out and destroy session")
def logout(response: Response):
    """
    Clears the session cookie.
    """
    response.delete_cookie(key="devpulse_auth_token")
    return {"success": True, "message": "Successfully logged out."}
