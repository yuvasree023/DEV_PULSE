"""Coding-activity ingestion and summaries for editor extensions.

Extensions (VS Code and compatible editors) report focused coding intervals
here. Ingestion is per-user and token-authenticated; a user can only ever
write or read their own sessions.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.coding_session import CodingSession
from app.models.user import User
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/activity", tags=["activity"])

MAX_DURATION_SECONDS = 24 * 60 * 60
MAX_BATCH = 100


class CodingSessionIn(BaseModel):
    project: str = Field(..., min_length=1, max_length=256, description="Workspace folder name only, never a path.")
    language: Optional[str] = Field(None, max_length=64)
    editor: str = Field("vscode", max_length=64)
    started_at: datetime
    ended_at: datetime
    duration_seconds: int = Field(..., ge=0, le=MAX_DURATION_SECONDS)


class CodingSessionBatch(BaseModel):
    sessions: List[CodingSessionIn] = Field(..., max_length=MAX_BATCH)


@router.post("/sessions", summary="Report coding sessions from an editor extension")
def report_sessions(batch: CodingSessionBatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accepted = 0
    for s in batch.sessions:
        started = s.started_at
        ended = s.ended_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        if ended.tzinfo is None:
            ended = ended.replace(tzinfo=timezone.utc)
        if ended < started:
            continue
        # Folder names only: strip any path separators defensively.
        project = s.project.replace("\\", "/").rsplit("/", 1)[-1].strip() or "unknown"
        db.add(
            CodingSession(
                user_id=user.id,
                project=project,
                language=(s.language or None),
                editor=s.editor,
                started_at=started,
                ended_at=ended,
                duration_seconds=s.duration_seconds,
            )
        )
        accepted += 1
    db.commit()
    return {"accepted": accepted, "received": len(batch.sessions)}


@router.get("/sessions", summary="List your own recent coding sessions")
def list_sessions(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    limit = max(1, min(limit, 200))
    rows = (
        db.query(CodingSession)
        .filter(CodingSession.user_id == user.id)
        .order_by(CodingSession.started_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "project": r.project,
            "language": r.language,
            "editor": r.editor,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "ended_at": r.ended_at.isoformat() if r.ended_at else None,
            "duration_seconds": r.duration_seconds,
        }
        for r in rows
    ]


@router.get("/summary", summary="Aggregated coding-time summary for your dashboard")
def activity_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total = (
        db.query(func.coalesce(func.sum(CodingSession.duration_seconds), 0))
        .filter(CodingSession.user_id == user.id)
        .scalar()
    )
    by_language = (
        db.query(CodingSession.language, func.sum(CodingSession.duration_seconds))
        .filter(CodingSession.user_id == user.id)
        .group_by(CodingSession.language)
        .order_by(func.sum(CodingSession.duration_seconds).desc())
        .limit(10)
        .all()
    )
    by_project = (
        db.query(CodingSession.project, func.sum(CodingSession.duration_seconds))
        .filter(CodingSession.user_id == user.id)
        .group_by(CodingSession.project)
        .order_by(func.sum(CodingSession.duration_seconds).desc())
        .limit(10)
        .all()
    )
    return {
        "total_seconds": int(total or 0),
        "by_language": [{"language": lang or "unknown", "seconds": int(sec)} for lang, sec in by_language],
        "by_project": [{"project": proj, "seconds": int(sec)} for proj, sec in by_project],
    }
