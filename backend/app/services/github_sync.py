"""
GitHub API integration and repository synchronization service for DEV_PULSE.
Pulls real repositories, pull requests, reviews, and commits from GitHub,
verifies AI tool usage telemetry, and persists data directly to PostgreSQL/SQLite.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.repository import Repository
from app.models.user_repository import UserRepository
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview
from app.models.commit import Commit
from app.models.user import User

logger = logging.getLogger("app.services.github_sync")

# Telemetry keyword patterns to detect genuine AI code assistance
AI_TELEMETRY_PATTERNS = {
    "copilot": ["copilot", "github copilot", "co-authored-by: copilot"],
    "cursor": ["cursor", "cursor-ai", "cursor tab", "composer"],
    "aider": ["aider", "aided by", "aider.chat"],
    "chatgpt": ["chatgpt", "openai", "gpt-4", "gpt-3.5"],
    "devpulse": ["devpulse", "yuvasree ml", "ai-productivity-suite"],
}


def detect_ai_agent(text_content: Optional[str]) -> Optional[str]:
    """
    Scans commit message, PR body, or branch name for explicit AI tool telemetry.
    Returns agent name if detected, otherwise None (human author).
    Never claim AI usage without verified telemetry!
    """
    if not text_content:
        return None
    lower_text = text_content.lower()
    for agent, patterns in AI_TELEMETRY_PATTERNS.items():
        if any(p in lower_text for p in patterns):
            return agent
    return None


async def get_github_user_repos(access_token: str) -> List[Dict[str, Any]]:
    """
    Fetches the authenticated user's accessible GitHub repositories.
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevPulse-Analytics/2.0",
    }
    repos = []
    page = 1
    async with httpx.AsyncClient(timeout=20.0) as client:
        while page <= 3:  # Fetch up to 300 repositories
            url = f"https://api.github.com/user/repos?per_page=100&page={page}&sort=updated&affiliation=owner,collaborator,organization_member"
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch repositories (status {resp.status_code}): {resp.text}")
                break
            batch = resp.json()
            if not batch or not isinstance(batch, list):
                break
            repos.extend(batch)
            if len(batch) < 100:
                break
            page += 1

    return repos


async def sync_repository_data(
    user_id: int,
    repo_gh_id: int,
    repo_full_name: str,
    access_token: str,
    db: Session,
) -> Dict[str, Any]:
    """
    Synchronizes real data for a selected repository:
    1. Repository metadata
    2. Pull requests (state=all)
    3. Reviews per PR
    4. Commits (last 100)
    """
    user_repo = (
        db.query(UserRepository)
        .filter(UserRepository.user_id == user_id, UserRepository.repo_id == repo_gh_id)
        .first()
    )
    if not user_repo:
        user_repo = UserRepository(
            user_id=user_id,
            repo_id=repo_gh_id,
            sync_status="syncing",
            sync_progress=f"Connecting to {repo_full_name}...",
        )
        db.add(user_repo)
        db.commit()
    else:
        user_repo.sync_status = "syncing"
        user_repo.sync_progress = f"Connecting to {repo_full_name}..."
        db.commit()

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevPulse-Analytics/2.0",
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            # 1. Fetch Repository Info
            repo_url = f"https://api.github.com/repos/{repo_full_name}"
            repo_resp = await client.get(repo_url, headers=headers)
            if repo_resp.status_code != 200:
                raise Exception(f"Failed to fetch repo metadata: GitHub API {repo_resp.status_code}")
            repo_data = repo_resp.json()

            # Upsert Repository record
            repo = db.query(Repository).filter(Repository.id == repo_gh_id).first()
            if not repo:
                repo = Repository(
                    id=repo_gh_id,
                    url=repo_data.get("html_url", f"https://github.com/{repo_full_name}"),
                    license=repo_data.get("license", {}).get("spdx_id") if repo_data.get("license") else None,
                    full_name=repo_full_name,
                    is_forked=repo_data.get("fork", False),
                    language=repo_data.get("language") or "Code",
                    forks=repo_data.get("forks_count", 0),
                    stars=repo_data.get("stargazers_count", 0),
                )
                db.add(repo)
            else:
                repo.full_name = repo_full_name
                repo.stars = repo_data.get("stargazers_count", repo.stars)
                repo.forks = repo_data.get("forks_count", repo.forks)
                repo.language = repo_data.get("language") or repo.language

            db.commit()

            # 2. Fetch Pull Requests
            user_repo.sync_progress = "Fetching pull requests and cycle times..."
            db.commit()

            prs_url = f"https://api.github.com/repos/{repo_full_name}/pulls?state=all&per_page=100&sort=created&direction=desc"
            prs_resp = await client.get(prs_url, headers=headers)
            prs_data = prs_resp.json() if prs_resp.status_code == 200 else []

            ingested_prs_count = 0
            if isinstance(prs_data, list):
                for pr_item in prs_data:
                    pr_id = pr_item.get("id")
                    pr_number = pr_item.get("number")
                    pr_title = pr_item.get("title") or "Untitled PR"
                    pr_body = pr_item.get("body") or ""
                    pr_user = pr_item.get("user", {})
                    author_username = pr_user.get("login") or "developer"
                    author_id = pr_user.get("id") or 0

                    created_str = pr_item.get("created_at")
                    closed_str = pr_item.get("closed_at")
                    merged_str = pr_item.get("merged_at")

                    created_at = datetime.fromisoformat(created_str.replace("Z", "+00:00")) if created_str else datetime.now(timezone.utc)
                    closed_at = datetime.fromisoformat(closed_str.replace("Z", "+00:00")) if closed_str else None
                    merged_at = datetime.fromisoformat(merged_str.replace("Z", "+00:00")) if merged_str else None

                    state = "merged" if merged_at else (pr_item.get("state") or "open")

                    # Telemetry AI agent detection
                    ai_agent = detect_ai_agent(f"{pr_title} {pr_body}")

                    # Check or upsert PR
                    pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
                    if not pr:
                        pr = PullRequest(
                            id=pr_id,
                            number=pr_number,
                            title=pr_title,
                            body=pr_body,
                            agent=ai_agent,
                            user_id=author_id,
                            user=author_username,
                            state=state,
                            created_at=created_at,
                            closed_at=closed_at,
                            merged_at=merged_at,
                            repo_id=repo_gh_id,
                            repo_url=repo_data.get("html_url"),
                            html_url=pr_item.get("html_url"),
                        )
                        db.add(pr)
                    else:
                        pr.title = pr_title
                        pr.body = pr_body
                        pr.state = state
                        pr.agent = ai_agent or pr.agent
                        pr.merged_at = merged_at
                        pr.closed_at = closed_at

                    ingested_prs_count += 1

                db.commit()

            # 3. Fetch Recent Commits
            user_repo.sync_progress = "Ingesting developer commit activity & flow cadence..."
            db.commit()

            commits_url = f"https://api.github.com/repos/{repo_full_name}/commits?per_page=100"
            commits_resp = await client.get(commits_url, headers=headers)
            commits_data = commits_resp.json() if commits_resp.status_code == 200 else []

            ingested_commits_count = 0
            if isinstance(commits_data, list):
                for c_item in commits_data:
                    sha = c_item.get("sha")
                    commit_info = c_item.get("commit", {})
                    author_info = commit_info.get("author", {})
                    author_name = author_info.get("name")
                    author_email = author_info.get("email")
                    date_str = author_info.get("date")

                    author_gh_user = c_item.get("author", {}).get("login") if c_item.get("author") else author_name
                    committed_at = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else datetime.now(timezone.utc)
                    message = commit_info.get("message") or ""

                    ai_agent = detect_ai_agent(message)

                    existing_commit = db.query(Commit).filter(Commit.repo_id == repo_gh_id, Commit.sha == sha).first()
                    if not existing_commit:
                        new_commit = Commit(
                            repo_id=repo_gh_id,
                            sha=sha,
                            message=message,
                            author_name=author_name,
                            author_email=author_email,
                            author_username=author_gh_user,
                            committed_at=committed_at,
                            url=c_item.get("html_url"),
                            verified_ai_agent=ai_agent,
                        )
                        db.add(new_commit)
                    ingested_commits_count += 1

                db.commit()

            # Finalize sync status
            now = datetime.now(timezone.utc)
            user_repo.sync_status = "completed"
            user_repo.sync_progress = f"Successfully synced {ingested_prs_count} PRs and {ingested_commits_count} commits."
            user_repo.prs_count = ingested_prs_count
            user_repo.commits_count = ingested_commits_count
            user_repo.last_synced_at = now
            user_repo.error_message = None
            db.commit()

            logger.info(f"Repository {repo_full_name} synced: {ingested_prs_count} PRs, {ingested_commits_count} commits.")
            return {
                "success": True,
                "repo_id": repo_gh_id,
                "prs_count": ingested_prs_count,
                "commits_count": ingested_commits_count,
            }

    except Exception as e:
        logger.error(f"Error syncing {repo_full_name}: {e}")
        user_repo.sync_status = "failed"
        user_repo.sync_progress = "Synchronization encountered an error."
        user_repo.error_message = str(e)
        db.commit()
        return {"success": False, "error": str(e)}
