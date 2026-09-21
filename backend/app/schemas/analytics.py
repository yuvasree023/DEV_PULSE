from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# --- Analytics schemas ---

class KPISummaryResponse(BaseModel):
    total_prs: int
    merged_prs: int
    avg_cycle_time_hours: Optional[float] = None
    avg_review_turnaround_hours: Optional[float] = None
    ai_assisted_percentage: float
    throughput_per_week: float


class CycleTimeItem(BaseModel):
    period: str
    avg_cycle_time: Optional[float] = None
    pr_count: int
    agent: Optional[str] = None


class AgentComparisonItem(BaseModel):
    agent: str
    pr_count: int
    avg_cycle_time_hours: Optional[float] = None
    avg_review_turnaround_hours: Optional[float] = None
    merge_rate_percent: float


class AIImpactResponse(BaseModel):
    comparison: List[AgentComparisonItem]
    productivity_gain_percent: Optional[float] = None


class ThroughputItem(BaseModel):
    period: str
    merged_count: int
    opened_count: int
    closed_count: int


class LanguageMetricItem(BaseModel):
    language: str
    pr_count: int
    avg_cycle_time: Optional[float] = None
    ai_adoption_rate: float


class DeveloperMetricItem(BaseModel):
    user: str
    pr_count: int
    avg_cycle_time: Optional[float] = None
    ai_usage_rate: float
    review_count: int


# --- Task / Kanban schemas ---

class KanbanBoardResponse(BaseModel):
    open_no_review: List[Dict[str, Any]] = Field(..., alias="Open - No Review")
    in_review: List[Dict[str, Any]] = Field(..., alias="In Review")
    changes_requested: List[Dict[str, Any]] = Field(..., alias="Changes Requested")
    approved_ready_to_merge: List[Dict[str, Any]] = Field(..., alias="Approved - Ready to Merge")

    class Config:
        populate_by_name = True


class BlockedTaskItem(BaseModel):
    pr_id: int
    title: str
    user: str
    repo_name: str
    reason: str
    days_blocked: float
    agent: Optional[str] = None
    created_at: datetime
    latest_review_date: Optional[datetime] = None


class TimelineEvent(BaseModel):
    event_type: str  # "pr_opened", "review_submitted", "changes_requested", "approved", "merged", "closed"
    timestamp: datetime
    user: str
    details: Optional[str] = None
    state: Optional[str] = None


class TaskTimelineResponse(BaseModel):
    pr_id: int
    title: str
    current_state: str
    events: List[TimelineEvent]


# --- AI Insights schemas ---

class TrendSummaryRequest(BaseModel):
    period: str = "last_30_days"
    focus: str = "ai_impact"  # "ai_impact" | "team" | "language"


class TrendSummaryResponse(BaseModel):
    summary: str
    recommendations: List[str]
    generated_at: datetime


class ReviewBlockerRequest(BaseModel):
    pr_id: int


class ReviewBlockerResponse(BaseModel):
    pr_id: int
    blocker_summary: str
    severity: str
    suggested_action: str
