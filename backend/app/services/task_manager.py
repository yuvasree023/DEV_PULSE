from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview
from app.models.repository import Repository
from app.schemas.analytics import KanbanBoardResponse, BlockedTaskItem, TimelineEvent, TaskTimelineResponse


def get_kanban_board(
    db: Session,
    repo_id: Optional[int] = None,
    assignee: Optional[str] = None,
    agent_filter: Optional[str] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Groups open/active pull requests into 4 Kanban columns based on lifecycle & latest review:
    1. "Open - No Review": state=open and 0 reviews
    2. "In Review": latest review = COMMENTED
    3. "Changes Requested": latest review = CHANGES_REQUESTED
    4. "Approved - Ready to Merge": latest review = APPROVED
    """
    query = db.query(PullRequest).filter(PullRequest.state == "open")

    if repo_id is not None:
        query = query.filter(PullRequest.repo_id == repo_id)
    if assignee:
        query = query.filter(PullRequest.user == assignee)
    if agent_filter:
        if agent_filter.lower() == "human":
            query = query.filter(PullRequest.agent.is_(None))
        else:
            query = query.filter(PullRequest.agent == agent_filter.lower())

    open_prs = query.all()

    # Pre-fetch all reviews for these PRs
    pr_ids = [p.id for p in open_prs]
    reviews = (
        db.query(PRReview)
        .filter(PRReview.pr_id.in_(pr_ids[:2000]))
        .order_by(PRReview.submitted_at.asc())
        .all()
    )

    # Map PR ID to latest review
    latest_review_map: Dict[int, PRReview] = {}
    review_counts_map: Dict[int, int] = {}
    for r in reviews:
        latest_review_map[r.pr_id] = r
        review_counts_map[r.pr_id] = review_counts_map.get(r.pr_id, 0) + 1

    columns: Dict[str, List[Dict[str, Any]]] = {
        "Open - No Review": [],
        "In Review": [],
        "Changes Requested": [],
        "Approved - Ready to Merge": [],
    }

    now = datetime.now(timezone.utc)

    for pr in open_prs:
        latest = latest_review_map.get(pr.id)
        rev_count = review_counts_map.get(pr.id, 0)

        pr_created = pr.created_at
        if pr_created.tzinfo is None:
            pr_created = pr_created.replace(tzinfo=timezone.utc)

        age_days = round((now - pr_created).total_seconds() / 86400.0, 1)

        card = {
            "id": pr.id,
            "number": pr.number,
            "title": pr.title,
            "user": pr.user,
            "agent": pr.agent or "human",
            "repo_id": pr.repo_id,
            "repo_url": pr.repo_url,
            "html_url": pr.html_url,
            "created_at": pr.created_at.isoformat() if pr.created_at else None,
            "age_days": age_days,
            "review_count": rev_count,
            "latest_review_state": latest.state if latest else None,
            "latest_reviewer": latest.user if latest else None,
        }

        if not latest or rev_count == 0:
            columns["Open - No Review"].append(card)
        elif latest.state == "APPROVED":
            columns["Approved - Ready to Merge"].append(card)
        elif latest.state == "CHANGES_REQUESTED":
            columns["Changes Requested"].append(card)
        else:  # COMMENTED or other
            columns["In Review"].append(card)

    return columns


def get_blocked_tasks(db: Session) -> List[BlockedTaskItem]:
    """
    Identifies blocked tasks:
    - PRs open > 7 days OR
    - Latest review = CHANGES_REQUESTED and last submitted > 3 days ago
    """
    now = datetime.now(timezone.utc)
    open_prs = (
        db.query(PullRequest, Repository.full_name)
        .outerjoin(Repository, PullRequest.repo_id == Repository.id)
        .filter(PullRequest.state == "open")
        .all()
    )

    pr_ids = [p[0].id for p in open_prs]
    reviews = (
        db.query(PRReview)
        .filter(PRReview.pr_id.in_(pr_ids[:2000]))
        .order_by(PRReview.submitted_at.asc())
        .all()
    )

    latest_review_map: Dict[int, PRReview] = {}
    for r in reviews:
        latest_review_map[r.pr_id] = r

    blocked_items: List[BlockedTaskItem] = []

    for pr, repo_name in open_prs:
        pr_created = pr.created_at
        if pr_created.tzinfo is None:
            pr_created = pr_created.replace(tzinfo=timezone.utc)

        age_days = (now - pr_created).total_seconds() / 86400.0
        latest_rev = latest_review_map.get(pr.id)

        is_blocked = False
        reason = ""
        days_blocked = 0.0
        latest_date = None

        if latest_rev and latest_rev.state == "CHANGES_REQUESTED":
            rev_time = latest_rev.submitted_at
            if rev_time.tzinfo is None:
                rev_time = rev_time.replace(tzinfo=timezone.utc)
            rev_age_days = (now - rev_time).total_seconds() / 86400.0
            latest_date = latest_rev.submitted_at

            if rev_age_days >= 3.0:
                is_blocked = True
                reason = f"Changes requested > 3 days ago ({round(rev_age_days, 1)} days)"
                days_blocked = round(rev_age_days, 1)

        if not is_blocked and age_days >= 7.0:
            is_blocked = True
            reason = f"PR open for > 7 days without resolution ({round(age_days, 1)} days)"
            days_blocked = round(age_days, 1)

        if is_blocked:
            blocked_items.append(
                BlockedTaskItem(
                    pr_id=pr.id,
                    title=pr.title,
                    user=pr.user,
                    repo_name=repo_name or f"repo-{pr.repo_id}",
                    reason=reason,
                    days_blocked=days_blocked,
                    agent=pr.agent,
                    created_at=pr.created_at,
                    latest_review_date=latest_date,
                )
            )

    blocked_items.sort(key=lambda x: x.days_blocked, reverse=True)
    return blocked_items


def get_pr_timeline(db: Session, pr_id: int) -> Optional[TaskTimelineResponse]:
    """
    Returns full lifecycle event history for a PR:
    - Creation event
    - Review submission events
    - Merge / Close event
    """
    pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
    if not pr:
        return None

    events: List[TimelineEvent] = []

    # 1. Created event
    events.append(
        TimelineEvent(
            event_type="pr_opened",
            timestamp=pr.created_at,
            user=pr.user,
            details=f"Pull request opened with {pr.agent or 'human'} assistance",
            state="open",
        )
    )

    # 2. Review events
    reviews = (
        db.query(PRReview)
        .filter(PRReview.pr_id == pr_id)
        .order_by(PRReview.submitted_at.asc())
        .all()
    )
    for rev in reviews:
        event_name = "review_submitted"
        if rev.state == "APPROVED":
            event_name = "approved"
        elif rev.state == "CHANGES_REQUESTED":
            event_name = "changes_requested"

        events.append(
            TimelineEvent(
                event_type=event_name,
                timestamp=rev.submitted_at,
                user=rev.user,
                details=rev.body[:150] if rev.body else None,
                state=rev.state,
            )
        )

    # 3. Merged or Closed event
    if pr.state == "merged" and pr.merged_at:
        events.append(
            TimelineEvent(
                event_type="merged",
                timestamp=pr.merged_at,
                user=pr.user,
                details="Pull request successfully merged",
                state="merged",
            )
        )
    elif pr.state == "closed" and pr.closed_at:
        events.append(
            TimelineEvent(
                event_type="closed",
                timestamp=pr.closed_at,
                user=pr.user,
                details="Pull request closed without merging",
                state="closed",
            )
        )

    events.sort(key=lambda x: x.timestamp)

    return TaskTimelineResponse(
        pr_id=pr.id,
        title=pr.title,
        current_state=pr.state,
        events=events,
    )
