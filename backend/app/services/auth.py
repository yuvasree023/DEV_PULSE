"""
Authentication service and FastAPI dependency guards for DEV_PULSE.
Supports GitHub OAuth, Personal Access Tokens, user sessions, and profile extraction.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.user import User, UserToken
from app.services.passwords import hash_password, verify_password
from app.services.security import (
    create_access_token,
    decode_access_token,
    encrypt_token,
    decrypt_token,
)

logger = logging.getLogger("app.services.auth")

security_bearer = HTTPBearer(auto_error=False)


def get_current_user_optional(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    request: Request = None,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Extracts current user from Bearer header or session cookie. Returns None if unauthenticated.
    """
    token = None
    if auth_header and auth_header.credentials:
        token = auth_header.credentials
    elif request and "devpulse_auth_token" in request.cookies:
        token = request.cookies.get("devpulse_auth_token")

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload.get("sub")
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except Exception as e:
        logger.error(f"Error resolving user: {e}")
        return None


def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """
    Enforces authentication. Raises 401 Unauthorized if missing or invalid.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def get_user_github_token(user: User, db: Session) -> Optional[str]:
    """
    Retrieves and decrypts the user's stored GitHub personal access token or OAuth token.
    """
    token_record = (
        db.query(UserToken)
        .filter(UserToken.user_id == user.id, UserToken.provider == "github")
        .order_by(UserToken.updated_at.desc())
        .first()
    )
    if not token_record:
        return None
    plain = decrypt_token(token_record.encrypted_access_token)
    if plain:
        token_record.encrypted_access_token = encrypt_token(plain)
        db.commit()
    return plain


async def exchange_github_code_for_token(code: str) -> Dict[str, Any]:
    """
    Exchanges GitHub OAuth temporary code for access token via GitHub API.
    """
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub OAuth is not configured on this server (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET missing). You can log in using a GitHub Personal Access Token (PAT).",
        )

    url = "https://github.com/login/oauth/access_token"
    payload = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
    }
    if settings.GITHUB_REDIRECT_URI:
        payload["redirect_uri"] = settings.GITHUB_REDIRECT_URI

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={"Accept": "application/json"},
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub OAuth token exchange failed: {resp.text}",
            )
        data = resp.json()
        if "error" in data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub OAuth error: {data.get('error_description', data.get('error'))}",
            )
        return data


async def fetch_github_user_profile(access_token: str) -> Dict[str, Any]:
    """
    Queries GitHub API to fetch user profile and verified email.
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevPulse-Analytics/2.0",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        user_resp = await client.get("https://api.github.com/user", headers=headers)
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to authenticate with GitHub API (status {user_resp.status_code}). Token may be invalid or expired.",
            )
        user_data = user_resp.json()

        # Email + verification status come only from the authenticated
        # /user/emails entries: a profile email GitHub merely returned is not
        # proof of verification. verified=true on the exact address is required.
        profile_email = user_data.get("email")
        email_entries = []
        try:
            emails_resp = await client.get("https://api.github.com/user/emails", headers=headers)
            if emails_resp.status_code == 200:
                email_entries = emails_resp.json()
        except Exception:
            email_entries = []

        def _verified(addr):
            if not addr:
                return False
            # noreply aliases cannot receive mail, so they are never verified for us
            if addr.endswith("@users.noreply.github.com"):
                return False
            return any(
                e.get("email", "").lower() == addr.lower() and e.get("verified") is True
                for e in email_entries
            )

        if profile_email:
            email = profile_email
        else:
            primary = next((e["email"] for e in email_entries if e.get("primary")), None)
            email = primary or (email_entries[0]["email"] if email_entries else None)

        email = email or f"{user_data.get('login')}@users.noreply.github.com"
        user_data["primary_email"] = email
        user_data["email_verified"] = _verified(email)
        return user_data


def upsert_user_and_token(
    db: Session,
    github_profile: Dict[str, Any],
    access_token: str,
    scope: Optional[str] = None,
    provider: str = "github",
) -> User:
    """
    Creates or updates the User and encrypted UserToken in the database.
    """
    gh_id = str(github_profile.get("id"))
    username = github_profile.get("login") or "developer"
    email = github_profile.get("primary_email")
    name = github_profile.get("name") or username
    avatar_url = github_profile.get("avatar_url")
    bio = github_profile.get("bio")
    company = github_profile.get("company")

    # Verification is grounded in the authenticated /user/emails entry
    # (verified=true on the exact address), computed in fetch_github_user_profile.
    gh_email_verified = bool(email) and github_profile.get("email_verified") is True

    user = db.query(User).filter(User.github_id == gh_id).first()
    now = datetime.now(timezone.utc)

    if not user:
        user = User(
            github_id=gh_id,
            username=username,
            email=email,
            email_verified=gh_email_verified,
            name=name,
            avatar_url=avatar_url,
            bio=bio,
            company=company,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.flush()
    else:
        user.username = username
        user.email = email
        if gh_email_verified:
            user.email_verified = True
        user.name = name
        user.avatar_url = avatar_url
        user.bio = bio
        user.company = company
        user.updated_at = now

    # Store encrypted token
    enc_token = encrypt_token(access_token)
    token_rec = (
        db.query(UserToken)
        .filter(UserToken.user_id == user.id, UserToken.provider == provider)
        .first()
    )
    if not token_rec:
        token_rec = UserToken(
            user_id=user.id,
            provider=provider,
            encrypted_access_token=enc_token,
            scope=scope or "repo,read:user",
            token_type="bearer",
            created_at=now,
            updated_at=now,
        )
        db.add(token_rec)
    else:
        token_rec.encrypted_access_token = enc_token
        token_rec.scope = scope or token_rec.scope
        token_rec.updated_at = now

    db.commit()
    db.refresh(user)
    return user


def get_or_create_demo_user(db: Session) -> User:
    """
    Returns or provisions the default demo Lead ML Engineer user.
    """
    user = db.query(User).filter(User.github_id == "demo_persona_001").first()
    if not user:
        now = datetime.now(timezone.utc)
        user = User(
            github_id="demo_persona_001",
            username="demo-user",
            name="Demo User",
            email="demo@devpulse.local",
            avatar_url="",
            bio="Demo persona for product preview - not a real account",
            company="",
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Add demo token
        demo_tok = UserToken(
            user_id=user.id,
            provider="github",
            encrypted_access_token=encrypt_token(""),
            scope="read:user",
            created_at=now,
            updated_at=now,
        )
        db.add(demo_tok)
        db.commit()

    return user


def add_email_password_to_user(db: Session, user: User, email: str, password: str, current_password: Optional[str] = None) -> User:
    """Adds or changes email/password sign-in on the signed-in account.

    The caller is already authenticated, which proves control of this account.
    The email must not belong to a different account: identities are never merged.
    When the account already has a password, the current password must be given
    and correct before anything changes.
    """
    email_norm = (email or "").strip().lower()
    if not email_norm or "@" not in email_norm:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    existing = db.query(User).filter(User.email == email_norm).first()
    if existing and existing.id != user.id:
        raise HTTPException(status_code=409, detail="That email belongs to a different DevPulse account.")
    if user.password_hash:
        if not current_password or not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=403, detail="Your current password is required to change email or password.")
    if user.email != email_norm:
        # A newly set or changed email is unverified until confirmed by email.
        user.email_verified = False
    user.email = email_norm
    user.password_hash = hash_password(password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def create_email_user(db: Session, name: str, email: str, password: str) -> User:
    """Creates an email/password account. GitHub stays disconnected until the user links it."""
    email_norm = (email or "").strip().lower()
    if not email_norm or "@" not in email_norm:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if db.query(User).filter(User.email == email_norm).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists. Log in instead.")
    now = datetime.now(timezone.utc)
    user = User(
        github_id=None,
        username=email_norm,
        email=email_norm,
        name=(name or "").strip() or email_norm.split("@")[0],
        avatar_url="",
        bio="",
        company="",
        password_hash=hash_password(password),
        email_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_email_user(db: Session, email: str, password: str) -> Optional[User]:
    """Returns the user when email + password match, else None."""
    email_norm = (email or "").strip().lower()
    if not email_norm:
        return None
    user = db.query(User).filter(User.email == email_norm).first()
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def link_github_to_user(
    db: Session,
    user: User,
    github_profile: Dict[str, Any],
    access_token: str,
    scope: Optional[str] = None,
) -> User:
    """
    Attaches a GitHub identity to the currently signed-in account.
    Never merges accounts: if this GitHub identity belongs to another DevPulse
    account, the link is refused and the user must choose what to do.
    """
    gh_id = str(github_profile.get("id"))
    other = db.query(User).filter(User.github_id == gh_id, User.id != user.id).first()
    if other:
        raise HTTPException(
            status_code=409,
            detail="This GitHub account is already connected to a different DevPulse account. Log out and continue with GitHub to use that existing account instead.",
        )
    if user.github_id and user.github_id != gh_id:
        raise HTTPException(
            status_code=400,
            detail="A different GitHub account is already connected to this DevPulse account.",
        )

    now = datetime.now(timezone.utc)
    user.github_id = gh_id
    user.avatar_url = github_profile.get("avatar_url") or user.avatar_url
    user.bio = github_profile.get("bio") or user.bio
    user.company = github_profile.get("company") or user.company
    user.updated_at = now

    enc_token = encrypt_token(access_token)
    token_rec = (
        db.query(UserToken)
        .filter(UserToken.user_id == user.id, UserToken.provider == "github")
        .first()
    )
    if not token_rec:
        token_rec = UserToken(
            user_id=user.id,
            provider="github",
            encrypted_access_token=enc_token,
            scope=scope or "read:user,user:email",
            token_type="bearer",
            created_at=now,
            updated_at=now,
        )
        db.add(token_rec)
    else:
        token_rec.encrypted_access_token = enc_token
        token_rec.scope = scope or token_rec.scope
        token_rec.updated_at = now

    db.commit()
    db.refresh(user)
    return user
