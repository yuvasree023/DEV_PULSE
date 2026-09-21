from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.repository import RepositoryResponse
from app.schemas.pr_review import PRReviewResponse


class PullRequestBase(BaseModel):
    id: int
    number: int
    title: str
    body: Optional[str] = None
    agent: Optional[str] = None
    user_id: int
    user: str
    state: str
    created_at: datetime
    closed_at: Optional[datetime] = None
    merged_at: Optional[datetime] = None
    repo_id: int
    repo_url: Optional[str] = None
    html_url: Optional[str] = None


class PullRequestCreate(PullRequestBase):
    pass


class PullRequestResponse(PullRequestBase):
    cycle_time_hours: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


class PullRequestDetailResponse(PullRequestResponse):
    repository: Optional[RepositoryResponse] = None
    reviews: List[PRReviewResponse] = []
    latest_review_state: Optional[str] = None


class PaginatedPullRequestsResponse(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int
    items: List[PullRequestResponse]
