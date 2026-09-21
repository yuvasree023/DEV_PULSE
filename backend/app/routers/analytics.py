from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import (
    KPISummaryResponse,
    CycleTimeItem,
    AIImpactResponse,
    ThroughputItem,
    LanguageMetricItem,
    DeveloperMetricItem,
)
from app.services.productivity import (
    calculate_kpis,
    get_cycle_time_series,
    get_throughput_series,
    get_language_metrics,
    get_developer_metrics,
)
from app.services.ai_impact import calculate_ai_impact

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis", response_model=KPISummaryResponse)
def get_kpis_endpoint(
    start_date: Optional[datetime] = Query(None, description="Filter PRs created on or after this ISO date"),
    end_date: Optional[datetime] = Query(None, description="Filter PRs created on or before this ISO date"),
    repo_id: Optional[int] = Query(None, description="Filter by repository ID"),
    agent: Optional[str] = Query(None, description="Filter by agent: 'copilot', 'cursor', or 'human'"),
    db: Session = Depends(get_db),
):
    """
    Returns executive KPI metrics:
    - total_prs
    - merged_prs
    - avg_cycle_time_hours
    - avg_review_turnaround_hours
    - ai_assisted_percentage
    - throughput_per_week
    """
    return calculate_kpis(
        db=db,
        start_date=start_date,
        end_date=end_date,
        repo_id=repo_id,
        agent=agent,
    )


@router.get("/cycle-time", response_model=List[CycleTimeItem])
def get_cycle_time_endpoint(
    granularity: str = Query("week", pattern="^(day|week|month)$", description="Aggregation bucket"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    agent: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns time-series cycle time trends grouped by period and agent.
    """
    return get_cycle_time_series(
        db=db,
        granularity=granularity,
        start_date=start_date,
        end_date=end_date,
        agent=agent,
    )


@router.get("/ai-impact", response_model=AIImpactResponse)
def get_ai_impact_endpoint(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    language: Optional[str] = Query(None, description="Filter by repository programming language"),
    db: Session = Depends(get_db),
):
    """
    CORE ENDPOINT: Compares productivity metrics between AI agents (Copilot, Cursor) and Human authors.
    Calculates overall productivity gain percentage.
    """
    return calculate_ai_impact(
        db=db,
        start_date=start_date,
        end_date=end_date,
        language=language,
    )


@router.get("/throughput", response_model=List[ThroughputItem])
def get_throughput_endpoint(
    granularity: str = Query("week", pattern="^(day|week|month)$"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Returns throughput activity (merged, opened, closed PR counts) over time.
    """
    return get_throughput_series(
        db=db,
        granularity=granularity,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/by-language", response_model=List[LanguageMetricItem])
def get_by_language_endpoint(db: Session = Depends(get_db)):
    """
    Returns PR metrics and AI adoption rates broken down by programming language.
    """
    return get_language_metrics(db=db)


@router.get("/by-developer", response_model=List[DeveloperMetricItem])
def get_by_developer_endpoint(
    min_prs: int = Query(5, ge=1, description="Minimum PRs authored by developer to be included"),
    db: Session = Depends(get_db),
):
    """
    Returns developer-level productivity metrics including AI adoption rate and review count.
    """
    return get_developer_metrics(db=db, min_prs=min_prs)
