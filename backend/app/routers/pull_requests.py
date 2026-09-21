from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database import get_db
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.schemas.pull_request import (
    PullRequestResponse,
    PullRequestDetailResponse,
    PaginatedPullRequestsResponse,
)
from app.schemas.repository import RepositoryResponse
from app.schemas.pr_review import PRReviewResponse

router = APIRouter(prefix="/pull-requests", tags=["Pull Requests"])


@router.get("", response_model=PaginatedPullRequestsResponse)
def list_pull_requests(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    state: Optional[str] = Query(None, pattern="^(open|closed|merged)$"),
    agent: Optional[str] = Query(None),
    user: Optional[str] = Query(None),
    repo_id: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    created_after: Optional[datetime] = Query(None),
    created_before: Optional[datetime] = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|merged_at|closed_at|id|number)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """
    Paginated and filtered pull requests query.
    Supports filtering by state, agent, user, repository, language, and date range.
    """
    query = db.query(PullRequest)

    if language:
        query = query.join(Repository, PullRequest.repo_id == Repository.id).filter(
            Repository.language.ilike(language)
        )
    if state:
        query = query.filter(PullRequest.state == state.lower())
    if agent:
        if agent.lower() == "human":
            query = query.filter(PullRequest.agent.is_(None))
        else:
            query = query.filter(PullRequest.agent == agent.lower())
    if user:
        query = query.filter(PullRequest.user == user)
    if repo_id is not None:
        query = query.filter(PullRequest.repo_id == repo_id)
    if created_after:
        query = query.filter(PullRequest.created_at >= created_after)
    if created_before:
        query = query.filter(PullRequest.created_at <= created_before)

    # Sort
    col = getattr(PullRequest, sort_by, PullRequest.created_at)
    if sort_order == "asc":
        query = query.order_by(asc(col))
    else:
        query = query.order_by(desc(col))

    total = query.count()
    total_pages = (total + per_page - 1) // per_page

    items = query.offset((page - 1) * per_page).limit(per_page).all()

    # Calculate cycle time hours for items
    response_items = []
    for pr in items:
        cycle_time = None
        if pr.state == "merged" and pr.merged_at and pr.created_at and pr.merged_at >= pr.created_at:
            cycle_time = round((pr.merged_at - pr.created_at).total_seconds() / 3600.0, 2)
        pr_dict = {
            "id": pr.id,
            "number": pr.number,
            "title": pr.title,
            "body": pr.body,
            "agent": pr.agent,
            "user_id": pr.user_id,
            "user": pr.user,
            "state": pr.state,
            "created_at": pr.created_at,
            "closed_at": pr.closed_at,
            "merged_at": pr.merged_at,
            "repo_id": pr.repo_id,
            "repo_url": pr.repo_url,
            "html_url": pr.html_url,
            "cycle_time_hours": cycle_time,
        }
        response_items.append(PullRequestResponse(**pr_dict))

    return PaginatedPullRequestsResponse(
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        items=response_items,
    )


@router.get("/{pr_id}", response_model=PullRequestDetailResponse)
def get_pull_request_detail(
    pr_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns single PR with associated reviews and linked repository.
    """
    pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pull request #{pr_id} not found",
        )

    cycle_time = None
    if pr.state == "merged" and pr.merged_at and pr.created_at and pr.merged_at >= pr.created_at:
        cycle_time = round((pr.merged_at - pr.created_at).total_seconds() / 3600.0, 2)

    latest_review_state = pr.reviews[-1].state if pr.reviews else None

    repo_schema = RepositoryResponse.model_validate(pr.repository) if pr.repository else None
    reviews_schema = [PRReviewResponse.model_validate(r) for r in pr.reviews]

    return PullRequestDetailResponse(
        id=pr.id,
        number=pr.number,
        title=pr.title,
        body=pr.body,
        agent=pr.agent,
        user_id=pr.user_id,
        user=pr.user,
        state=pr.state,
        created_at=pr.created_at,
        closed_at=pr.closed_at,
        merged_at=pr.merged_at,
        repo_id=pr.repo_id,
        repo_url=pr.repo_url,
        html_url=pr.html_url,
        cycle_time_hours=cycle_time,
        repository=repo_schema,
        reviews=reviews_schema,
        latest_review_state=latest_review_state,
    )
