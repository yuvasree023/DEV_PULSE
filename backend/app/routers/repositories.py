from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.schemas.repository import RepositoryWithStats

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get("", response_model=List[RepositoryWithStats])
def list_repositories(db: Session = Depends(get_db)):
    """
    Returns repositories enriched with aggregated productivity stats:
    - pr_count
    - avg_cycle_time_hours
    - ai_adoption_rate
    """
    repos = db.query(Repository).all()
    results = []

    for repo in repos:
        prs = db.query(PullRequest).filter(PullRequest.repo_id == repo.id).all()
        pr_count = len(prs)

        if pr_count > 0:
            ai_prs = sum(1 for p in prs if p.agent is not None and p.agent.strip() != "")
            ai_adoption = round((ai_prs / pr_count) * 100.0, 2)

            merged_prs = [p for p in prs if p.state == "merged" and p.merged_at and p.created_at]
            durations = [
                (p.merged_at - p.created_at).total_seconds() / 3600.0
                for p in merged_prs
                if p.merged_at >= p.created_at
            ]
            avg_cycle = round(sum(durations) / len(durations), 2) if durations else None
        else:
            ai_adoption = 0.0
            avg_cycle = None

        item = RepositoryWithStats(
            id=repo.id,
            url=repo.url,
            license=repo.license,
            full_name=repo.full_name,
            is_forked=repo.is_forked,
            language=repo.language,
            forks=repo.forks,
            stars=repo.stars,
            pr_count=pr_count,
            avg_cycle_time_hours=avg_cycle,
            ai_adoption_rate=ai_adoption,
        )
        results.append(item)

    results.sort(key=lambda x: x.pr_count, reverse=True)
    return results
