"""
GitHub repository discovery, selection, and synchronization router for DEV_PULSE.
Allows users to choose repositories from GitHub and sync real commits, PRs, and reviews.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.models.user_repository import UserRepository
from app.services.auth import get_current_user, get_user_github_token
from app.services.github_sync import get_github_user_repos, sync_repository_data

logger = logging.getLogger("app.routers.github_integration")

router = APIRouter(prefix="/github", tags=["GitHub Repositories & Real-Time Sync"])


class SelectReposRequest(BaseModel):
    selected_repo_ids: List[int] = Field(..., description="List of GitHub repository IDs to track")


class SyncRepoRequest(BaseModel):
    repo_ids: Optional[List[int]] = Field(None, description="Optional subset of repo IDs to sync")


@router.get("/repos", summary="Fetch accessible repositories from user's GitHub account")
async def list_github_repositories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists repositories available on user's GitHub account, marking which are already selected.
    """
    token = get_user_github_token(user, db)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub token not found. Please connect your GitHub account via OAuth or PAT in Onboarding/Settings.",
        )

    # Fetch live from GitHub API
    try:
        raw_repos = await get_github_user_repos(token, user.username)
        user_tracked = {
            ur.repo_id: ur.is_selected
            for ur in db.query(UserRepository).filter(UserRepository.user_id == user.id).all()
        }

        sanitized_repos = []
        for r in raw_repos:
            sanitized_repos.append({
                "id": r.get("id"),
                "name": r.get("name"),
                "full_name": r.get("full_name"),
                "html_url": r.get("html_url"),
                "description": r.get("description"),
                "language": r.get("language") or "Other",
                "stargazers_count": r.get("stargazers_count", 0),
                "forks_count": r.get("forks_count", 0),
                "private": r.get("private", False),
                "default_branch": r.get("default_branch", "main"),
                "is_selected": user_tracked.get(r.get("id"), False),
            })

        return {"repositories": sanitized_repos, "total": len(sanitized_repos)}
    except Exception as e:
        logger.error(f"Error listing repos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories from GitHub: {str(e)}",
        )


@router.get("/tracked", summary="Get user's tracked repositories and sync statuses")
def get_tracked_repositories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of repositories selected by the authenticated user.
    """
    tracked = (
        db.query(UserRepository, Repository)
        .outerjoin(Repository, UserRepository.repo_id == Repository.id)
        .filter(UserRepository.user_id == user.id)
        .all()
    )

    results = []
    for ur, repo in tracked:
        results.append({
            "repo_id": ur.repo_id,
            "full_name": repo.full_name if repo else f"Repo #{ur.repo_id}",
            "language": repo.language if repo else None,
            "stars": repo.stars if repo else 0,
            "forks": repo.forks if repo else 0,
            "url": repo.url if repo else None,
            "is_selected": ur.is_selected,
            "sync_status": ur.sync_status,
            "sync_progress": ur.sync_progress,
            "prs_count": ur.prs_count,
            "commits_count": ur.commits_count,
            "last_synced_at": ur.last_synced_at.isoformat() if ur.last_synced_at else None,
            "error": ur.error_message,
        })

    return {"tracked_repositories": results}


@router.post("/select", summary="Select or deselect repositories to track")
async def select_repositories(
    req: SelectReposRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates which repositories are selected for telemetry tracking.
    """
    selected_set = set(req.selected_repo_ids)
    token = get_user_github_token(user, db)
    if not token:
        raise HTTPException(status_code=400, detail="GitHub sign-in is required")
    try:
        public = {r["id"]: r for r in await get_github_user_repos(token, user.username)}
    except Exception:
        raise HTTPException(status_code=502, detail="Could not validate public repositories with GitHub")
    if not selected_set.issubset(public):
        raise HTTPException(status_code=400, detail="Only your current public repositories can be selected")
    # Persist the actual selected repo identity before creating tracking rows.
    for repo_id in selected_set:
        r = public[repo_id]
        repo = db.query(Repository).filter(Repository.id == repo_id).first()
        if not repo:
            repo = Repository(id=repo_id, url=r["html_url"], full_name=r["full_name"],
                language=r.get("language"), stars=r.get("stargazers_count", 0),
                forks=r.get("forks_count", 0), is_forked=r.get("fork", False))
            db.add(repo)
    db.flush()

    # Update existing
    existing = db.query(UserRepository).filter(UserRepository.user_id == user.id).all()
    existing_ids = set()
    for ur in existing:
        existing_ids.add(ur.repo_id)
        ur.is_selected = ur.repo_id in selected_set

    # Insert newly selected
    for repo_id in selected_set:
        if repo_id not in existing_ids:
            new_ur = UserRepository(
                user_id=user.id,
                repo_id=repo_id,
                is_selected=True,
                sync_status="pending",
                sync_progress="Selected for tracking. Ready to sync.",
            )
            db.add(new_ur)

    db.commit()
    return {"success": True, "selected_count": len(selected_set)}


async def _run_sync_task(user_id: int, repo_ids: List[int], token: str):
    """Background worker for repository sync."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return

        tracked_entries = (
            db.query(UserRepository, Repository)
            .outerjoin(Repository, UserRepository.repo_id == Repository.id)
            .filter(UserRepository.user_id == user_id, UserRepository.repo_id.in_(repo_ids))
            .all()
        )

        for ur, repo in tracked_entries:
            if not repo:
                ur.sync_status = "error"
                ur.error_message = "Repository identity is missing. Select the repository again."
                db.commit()
                continue
            repo_name = repo.full_name
            await sync_repository_data(user_id, ur.repo_id, repo_name, token, db)

    except Exception as e:
        logger.error(f"Background sync task failed: {e}")
    finally:
        db.close()


@router.post("/sync", summary="Trigger manual or background synchronization of selected repositories")
async def trigger_repository_sync(
    background_tasks: BackgroundTasks,
    req: Optional[SyncRepoRequest] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initiates asynchronous GitHub synchronization for user's selected repositories.
    """
    token = get_user_github_token(user, db)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub token not found. Please connect in Onboarding/Settings.",
        )

    # Determine which repos to sync
    query = db.query(UserRepository).filter(UserRepository.user_id == user.id, UserRepository.is_selected == True)
    if req and req.repo_ids:
        query = query.filter(UserRepository.repo_id.in_(req.repo_ids))

    selected_repos = query.all()
    if not selected_repos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No repositories selected for synchronization. Please select repositories first.",
        )

    repo_ids = [ur.repo_id for ur in selected_repos]

    # Mark as pending/syncing
    for ur in selected_repos:
        ur.sync_status = "syncing"
        ur.sync_progress = "Synchronization queued..."
    db.commit()

    background_tasks.add_task(_run_sync_task, user.id, repo_ids, token)

    return {
        "success": True,
        "message": f"Queued synchronization for {len(repo_ids)} repositories.",
        "repo_ids": repo_ids,
    }


@router.get("/sync-status", summary="Poll synchronization status of all repositories")
def get_sync_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns real-time sync progress for live UI updates.
    """
    tracked = (
        db.query(UserRepository, Repository)
        .outerjoin(Repository, UserRepository.repo_id == Repository.id)
        .filter(UserRepository.user_id == user.id)
        .all()
    )

    is_any_syncing = any(ur.sync_status == "syncing" for ur, _ in tracked)
    items = []
    for ur, repo in tracked:
        items.append({
            "repo_id": ur.repo_id,
            "full_name": repo.full_name if repo else f"Repo #{ur.repo_id}",
            "status": ur.sync_status,
            "progress": ur.sync_progress,
            "prs_count": ur.prs_count,
            "commits_count": ur.commits_count,
            "last_synced_at": ur.last_synced_at.isoformat() if ur.last_synced_at else None,
            "error": ur.error_message,
        })

    return {
        "is_syncing": is_any_syncing,
        "repositories": items,
    }
