from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct, and_, or_
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview
from app.models.repository import Repository
from app.schemas.analytics import (
    KPISummaryResponse,
    CycleTimeItem,
    ThroughputItem,
    LanguageMetricItem,
    DeveloperMetricItem,
)


def calculate_kpis(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    repo_id: Optional[int] = None,
    agent: Optional[str] = None,
) -> KPISummaryResponse:
    """
    Calculate high-level KPI summary:
    - total PRs, merged PRs
    - average cycle time (hours)
    - average review turnaround (hours from creation to first review)
    - AI assisted percentage
    - throughput per week
    """
    query = db.query(PullRequest)

    if start_date:
        query = query.filter(PullRequest.created_at >= start_date)
    if end_date:
        query = query.filter(PullRequest.created_at <= end_date)
    if repo_id is not None:
        query = query.filter(PullRequest.repo_id == repo_id)
    if agent:
        if agent.lower() == "human":
            query = query.filter(PullRequest.agent.is_(None))
        else:
            query = query.filter(PullRequest.agent == agent.lower())

    prs = query.all()
    total_prs = len(prs)

    if total_prs == 0:
        return KPISummaryResponse(
            total_prs=0,
            merged_prs=0,
            avg_cycle_time_hours=None,
            avg_review_turnaround_hours=None,
            ai_assisted_percentage=0.0,
            throughput_per_week=0.0,
        )

    merged_prs = [p for p in prs if p.state == "merged" and p.merged_at and p.created_at]
    merged_count = len(merged_prs)

    # Average cycle time (hours from created_at to merged_at)
    cycle_times = [
        (p.merged_at - p.created_at).total_seconds() / 3600.0
        for p in merged_prs
        if p.merged_at > p.created_at
    ]
    avg_cycle_time = round(sum(cycle_times) / len(cycle_times), 2) if cycle_times else None

    # AI assisted percentage
    ai_prs_count = sum(1 for p in prs if p.agent is not None and p.agent.strip() != "")
    ai_assisted_percentage = round((ai_prs_count / total_prs) * 100.0, 2)

    # Review turnaround (hours from PR created_at to first review submitted_at)
    pr_ids = [p.id for p in prs]
    first_reviews = (
        db.query(
            PRReview.pr_id,
            func.min(PRReview.submitted_at).label("first_submitted_at"),
        )
        .filter(PRReview.pr_id.in_(pr_ids[:2000]))  # safe batch size
        .group_by(PRReview.pr_id)
        .all()
    )
    first_review_map = {r.pr_id: r.first_submitted_at for r in first_reviews}

    turnarounds = []
    for p in prs:
        if p.id in first_review_map and p.created_at:
            rev_time = first_review_map[p.id]
            if rev_time >= p.created_at:
                turnarounds.append((rev_time - p.created_at).total_seconds() / 3600.0)

    avg_review_turnaround = round(sum(turnarounds) / len(turnarounds), 2) if turnarounds else None

    # Throughput per week
    created_dates = [p.created_at for p in prs if p.created_at]
    if created_dates:
        earliest = min(created_dates)
        latest = max(created_dates)
        total_days = max(1.0, (latest - earliest).total_seconds() / 86400.0)
        weeks = total_days / 7.0
        throughput_per_week = round(merged_count / max(1.0, weeks), 2)
    else:
        throughput_per_week = 0.0

    return KPISummaryResponse(
        total_prs=total_prs,
        merged_prs=merged_count,
        avg_cycle_time_hours=avg_cycle_time,
        avg_review_turnaround_hours=avg_review_turnaround,
        ai_assisted_percentage=ai_assisted_percentage,
        throughput_per_week=throughput_per_week,
    )


def get_cycle_time_series(
    db: Session,
    granularity: str = "week",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    agent: Optional[str] = None,
) -> List[CycleTimeItem]:
    """
    Get aggregated cycle time grouped by period (day, week, or month) and agent.
    """
    query = db.query(PullRequest).filter(
        PullRequest.state == "merged",
        PullRequest.merged_at.is_not_null(),
        PullRequest.created_at.is_not_null(),
    )

    if start_date:
        query = query.filter(PullRequest.created_at >= start_date)
    if end_date:
        query = query.filter(PullRequest.created_at <= end_date)
    if agent:
        if agent.lower() == "human":
            query = query.filter(PullRequest.agent.is_(None))
        else:
            query = query.filter(PullRequest.agent == agent.lower())

    prs = query.all()

    # In-memory grouping for cross-dialect compatibility (PostgreSQL & SQLite)
    buckets: Dict[str, Dict[str, Any]] = {}

    for pr in prs:
        c_at = pr.created_at
        if granularity == "day":
            period_str = c_at.strftime("%Y-%m-%d")
        elif granularity == "month":
            period_str = c_at.strftime("%Y-%m")
        else:  # week
            # Year-Week format
            period_str = f"{c_at.year}-W{c_at.isocalendar()[1]:02d}"

        agent_val = pr.agent if pr.agent else "human"
        key = f"{period_str}_{agent_val}"

        if key not in buckets:
            buckets[key] = {
                "period": period_str,
                "agent": agent_val,
                "durations": [],
            }

        diff_hours = (pr.merged_at - pr.created_at).total_seconds() / 3600.0
        if diff_hours >= 0:
            buckets[key]["durations"].append(diff_hours)

    result = []
    for key, data in sorted(buckets.items()):
        durations = data["durations"]
        avg_dur = round(sum(durations) / len(durations), 2) if durations else None
        result.append(
            CycleTimeItem(
                period=data["period"],
                avg_cycle_time=avg_dur,
                pr_count=len(durations),
                agent=data["agent"],
            )
        )

    return result


def get_throughput_series(
    db: Session,
    granularity: str = "week",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> List[ThroughputItem]:
    """
    Get throughput counts (opened, merged, closed) grouped by period.
    """
    query = db.query(PullRequest)
    if start_date:
        query = query.filter(PullRequest.created_at >= start_date)
    if end_date:
        query = query.filter(PullRequest.created_at <= end_date)

    prs = query.all()

    buckets: Dict[str, Dict[str, int]] = {}

    for pr in prs:
        c_at = pr.created_at
        if granularity == "day":
            period_str = c_at.strftime("%Y-%m-%d")
        elif granularity == "month":
            period_str = c_at.strftime("%Y-%m")
        else:  # week
            period_str = f"{c_at.year}-W{c_at.isocalendar()[1]:02d}"

        if period_str not in buckets:
            buckets[period_str] = {"opened": 0, "merged": 0, "closed": 0}

        buckets[period_str]["opened"] += 1
        if pr.state == "merged":
            buckets[period_str]["merged"] += 1
        elif pr.state == "closed":
            buckets[period_str]["closed"] += 1

    result = []
    for period, counts in sorted(buckets.items()):
        result.append(
            ThroughputItem(
                period=period,
                opened_count=counts["opened"],
                merged_count=counts["merged"],
                closed_count=counts["closed"],
            )
        )
    return result


def get_language_metrics(db: Session) -> List[LanguageMetricItem]:
    """
    Get aggregated PR statistics grouped by repository language.
    """
    prs_with_lang = (
        db.query(
            PullRequest.id,
            PullRequest.state,
            PullRequest.agent,
            PullRequest.created_at,
            PullRequest.merged_at,
            Repository.language,
        )
        .join(Repository, PullRequest.repo_id == Repository.id)
        .all()
    )

    lang_groups: Dict[str, List[Any]] = {}
    for p in prs_with_lang:
        lang = p.language or "Unknown"
        if lang not in lang_groups:
            lang_groups[lang] = []
        lang_groups[lang].append(p)

    results = []
    for lang, pr_list in lang_groups.items():
        total = len(pr_list)
        ai_count = sum(1 for p in pr_list if p.agent is not None and p.agent.strip() != "")
        ai_adoption = round((ai_count / total) * 100.0, 2) if total > 0 else 0.0

        merged_prs = [p for p in pr_list if p.state == "merged" and p.merged_at and p.created_at]
        durations = [
            (p.merged_at - p.created_at).total_seconds() / 3600.0
            for p in merged_prs
            if p.merged_at >= p.created_at
        ]
        avg_dur = round(sum(durations) / len(durations), 2) if durations else None

        results.append(
            LanguageMetricItem(
                language=lang,
                pr_count=total,
                avg_cycle_time=avg_dur,
                ai_adoption_rate=ai_adoption,
            )
        )

    results.sort(key=lambda x: x.pr_count, reverse=True)
    return results


def get_developer_metrics(db: Session, min_prs: int = 5) -> List[DeveloperMetricItem]:
    """
    Get developer productivity and AI usage metrics for users with at least min_prs.
    """
    prs = db.query(PullRequest).all()

    # Pre-fetch review counts by user
    review_counts = (
        db.query(PRReview.user, func.count(PRReview.id).label("cnt"))
        .group_by(PRReview.user)
        .all()
    )
    user_review_map = {r.user: r.cnt for r in review_counts}

    user_groups: Dict[str, List[PullRequest]] = {}
    for p in prs:
        if p.user not in user_groups:
            user_groups[p.user] = []
        user_groups[p.user].append(p)

    results = []
    for user, user_prs in user_groups.items():
        if len(user_prs) < min_prs:
            continue

        total = len(user_prs)
        ai_count = sum(1 for p in user_prs if p.agent is not None and p.agent.strip() != "")
        ai_rate = round((ai_count / total) * 100.0, 2) if total > 0 else 0.0

        merged = [p for p in user_prs if p.state == "merged" and p.merged_at and p.created_at]
        durations = [
            (p.merged_at - p.created_at).total_seconds() / 3600.0
            for p in merged
            if p.merged_at >= p.created_at
        ]
        avg_cycle = round(sum(durations) / len(durations), 2) if durations else None

        results.append(
            DeveloperMetricItem(
                user=user,
                pr_count=total,
                avg_cycle_time=avg_cycle,
                ai_usage_rate=ai_rate,
                review_count=user_review_map.get(user, 0),
            )
        )

    results.sort(key=lambda x: x.pr_count, reverse=True)
    return results
