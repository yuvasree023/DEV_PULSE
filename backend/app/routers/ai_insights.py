from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview
from app.schemas.analytics import (
    TrendSummaryRequest,
    TrendSummaryResponse,
    ReviewBlockerRequest,
    ReviewBlockerResponse,
)
from app.services.productivity import calculate_kpis
from app.services.ai_impact import calculate_ai_impact
from app.services.llm_service import generate_insights, analyze_blocker

router = APIRouter(prefix="/ai-insights", tags=["AI Insights"])


@router.post("/summarize-trends", response_model=TrendSummaryResponse)
def summarize_trends_endpoint(
    body: TrendSummaryRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Analyzes team productivity and AI impact metrics, constructs an analytical prompt,
    and queries Gemini 2.0 Flash to provide engineering leadership insights & recommendations.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Query latest analytics data
    kpis = calculate_kpis(db=db)
    ai_impact = calculate_ai_impact(db=db)

    analytics_payload = {
        "period": body.period,
        "focus": body.focus,
        "kpis": {
            "total_prs": kpis.total_prs,
            "merged_prs": kpis.merged_prs,
            "avg_cycle_time_hours": kpis.avg_cycle_time_hours,
            "ai_assisted_percentage": kpis.ai_assisted_percentage,
            "throughput_per_week": kpis.throughput_per_week,
        },
        "ai_impact": {
            "productivity_gain_percent": ai_impact.productivity_gain_percent,
            "agents": [c.model_dump() for c in ai_impact.comparison],
        },
    }

    insights = generate_insights(
        analytics_data=analytics_payload,
        focus=body.focus,
        client_id=client_ip,
    )
    return insights


@router.post("/review-blocker", response_model=ReviewBlockerResponse)
def review_blocker_endpoint(
    body: ReviewBlockerRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Fetches CHANGES_REQUESTED reviews for a given PR and queries Gemini 2.0 Flash
    to extract the blocker summary, severity rating, and suggested actionable remediation.
    """
    client_ip = request.client.host if request.client else "unknown"

    pr = db.query(PullRequest).filter(PullRequest.id == body.pr_id).first()
    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pull request #{body.pr_id} not found.",
        )

    # Fetch CHANGES_REQUESTED reviews
    blocker_reviews = (
        db.query(PRReview)
        .filter(
            PRReview.pr_id == body.pr_id,
            PRReview.state == "CHANGES_REQUESTED",
        )
        .order_by(PRReview.submitted_at.desc())
        .all()
    )

    review_bodies = [r.body for r in blocker_reviews if r.body and r.body.strip()]
    if not review_bodies:
        # Fall back to any reviews with comments if none specifically marked CHANGES_REQUESTED
        all_reviews = (
            db.query(PRReview)
            .filter(PRReview.pr_id == body.pr_id)
            .order_by(PRReview.submitted_at.desc())
            .all()
        )
        review_bodies = [r.body for r in all_reviews if r.body and r.body.strip()]

    analysis = analyze_blocker(
        review_bodies=review_bodies,
        pr_id=body.pr_id,
        client_id=client_ip,
    )
    return analysis
