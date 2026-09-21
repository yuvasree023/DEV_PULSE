from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class RepositoryBase(BaseModel):
    id: int
    url: str
    license: Optional[str] = None
    full_name: str
    is_forked: bool = False
    language: Optional[str] = None
    forks: int = 0
    stars: int = 0


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryResponse(RepositoryBase):
    model_config = ConfigDict(from_attributes=True)


class RepositoryWithStats(RepositoryResponse):
    pr_count: int = 0
    avg_cycle_time_hours: Optional[float] = None
    ai_adoption_rate: float = 0.0
