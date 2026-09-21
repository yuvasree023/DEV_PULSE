from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PRReviewBase(BaseModel):
    id: int
    pr_id: int
    user: str
    user_type: Optional[str] = "User"
    state: str
    submitted_at: datetime
    body: Optional[str] = None


class PRReviewCreate(PRReviewBase):
    pass


class PRReviewResponse(PRReviewBase):
    model_config = ConfigDict(from_attributes=True)
