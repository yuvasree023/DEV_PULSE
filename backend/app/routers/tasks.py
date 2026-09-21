from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import KanbanBoardResponse, BlockedTaskItem, TaskTimelineResponse
from app.services.task_manager import get_kanban_board, get_blocked_tasks, get_pr_timeline

router = APIRouter(prefix="/tasks", tags=["Tasks & Kanban"])


@router.get("/board", response_model=Dict[str, List[Dict[str, Any]]])
def get_kanban_board_endpoint(
    repo_id: Optional[int] = Query(None, description="Filter board by repository ID"),
    assignee: Optional[str] = Query(None, description="Filter board by PR author username"),
    agent_filter: Optional[str] = Query(None, description="Filter by 'copilot', 'cursor', or 'human'"),
    db: Session = Depends(get_db),
):
    """
    Returns PRs organized into 4 Kanban columns:
    - 'Open - No Review'
    - 'In Review'
    - 'Changes Requested'
    - 'Approved - Ready to Merge'
    """
    return get_kanban_board(
        db=db,
        repo_id=repo_id,
        assignee=assignee,
        agent_filter=agent_filter,
    )


@router.get("/blocked", response_model=List[BlockedTaskItem])
def get_blocked_tasks_endpoint(db: Session = Depends(get_db)):
    """
    Returns blocked PRs (open > 7 days OR changes requested > 3 days ago).
    """
    return get_blocked_tasks(db=db)


@router.get("/{pr_id}/timeline", response_model=TaskTimelineResponse)
def get_task_timeline_endpoint(
    pr_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns the complete chronological event timeline for a given pull request.
    """
    timeline = get_pr_timeline(db=db, pr_id=pr_id)
    if not timeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pull request with ID {pr_id} was not found.",
        )
    return timeline
