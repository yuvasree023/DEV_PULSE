from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview
from app.models.repository import Repository
from app.schemas.analytics import AIImpactResponse, AgentComparisonItem


def calculate_ai_impact(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    language: Optional[str] = None,
) -> AIImpactResponse:
    """
    Core benchmark comparing AI vs. Human pull requests:
    - Group by agent ('copilot', 'cursor', 'human')
    - Metrics: pr_count, avg_cycle_time_hours, avg_review_turnaround_hours, merge_rate_percent
    - Productivity gain % = ((human_cycle_time - ai_cycle_time) / human_cycle_time) * 100
    """
    query = db.query(PullRequest)

    if language:
        query = query.join(Repository, PullRequest.repo_id == Repository.id).filter(
            Repository.language.ilike(language)
        )
    if start_date:
        query = query.filter(PullRequest.created_at >= start_date)
    if end_date:
        query = query.filter(PullRequest.created_at <= end_date)

    prs = query.all()
    if not prs:
        return AIImpactResponse(comparison=[], productivity_gain_percent=None)

    # First review turnaround map
    pr_ids = [p.id for p in prs]
    first_reviews = (
        db.query(
            PRReview.pr_id,
            func.min(PRReview.submitted_at).label("first_rev"),
        )
        .filter(PRReview.pr_id.in_(pr_ids[:2000]))
        .group_by(PRReview.pr_id)
        .all()
    )
    first_rev_map = {r.pr_id: r.first_rev for r in first_reviews}

    # Group PRs by agent
    groups: Dict[str, List[PullRequest]] = {}
    for p in prs:
        agent_name = p.agent.lower().strip() if p.agent and p.agent.strip() else "human"
        if agent_name not in groups:
            groups[agent_name] = []
        groups[agent_name].append(p)

    comparison_items: List[AgentComparisonItem] = []

    human_cycle_time: Optional[float] = None
    ai_cycle_times: List[float] = []

    for agent_name, agent_prs in groups.items():
        total_count = len(agent_prs)
        merged_prs = [p for p in agent_prs if p.state == "merged" and p.merged_at and p.created_at]
        merged_count = len(merged_prs)
        merge_rate = round((merged_count / total_count) * 100.0, 2) if total_count > 0 else 0.0

        # Cycle time (hours)
        cycle_times = [
            (p.merged_at - p.created_at).total_seconds() / 3600.0
            for p in merged_prs
            if p.merged_at >= p.created_at
        ]
        avg_cycle_hours = round(sum(cycle_times) / len(cycle_times), 2) if cycle_times else None

        if agent_name == "human":
            human_cycle_time = avg_cycle_hours
        else:
            if avg_cycle_hours is not None:
                ai_cycle_times.extend(cycle_times)

        # Review turnaround (hours)
        turnarounds = []
        for p in agent_prs:
            if p.id in first_rev_map and p.created_at:
                rev_time = first_rev_map[p.id]
                if rev_time >= p.created_at:
                    turnarounds.append((rev_time - p.created_at).total_seconds() / 3600.0)

        avg_review_hours = round(sum(turnarounds) / len(turnarounds), 2) if turnarounds else None

        comparison_items.append(
            AgentComparisonItem(
                agent=agent_name,
                pr_count=total_count,
                avg_cycle_time_hours=avg_cycle_hours,
                avg_review_turnaround_hours=avg_review_hours,
                merge_rate_percent=merge_rate,
            )
        )

    # Calculate overall productivity gain percent
    productivity_gain: Optional[float] = None
    if human_cycle_time and human_cycle_time > 0 and ai_cycle_times:
        combined_ai_cycle_time = sum(ai_cycle_times) / len(ai_cycle_times)
        diff = human_cycle_time - combined_ai_cycle_time
        productivity_gain = round((diff / human_cycle_time) * 100.0, 2)

    # Sort so human comes first or sorted alphabetically
    comparison_items.sort(key=lambda x: (x.agent != "human", x.agent))

    return AIImpactResponse(
        comparison=comparison_items,
        productivity_gain_percent=productivity_gain,
    )
