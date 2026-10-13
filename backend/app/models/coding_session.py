from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class CodingSession(Base):
    """A focused coding interval reported by an editor extension (e.g. VS Code).

    Only metadata is stored: project folder name, primary language, editor
    name, and timing. No file paths, file contents, or keystrokes ever leave
    the user's machine.
    """

    __tablename__ = "coding_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True, doc="Internal session ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, doc="Owning user")
    project = Column(String(256), nullable=False, doc="Workspace folder name (not a full path)")
    language = Column(String(64), nullable=True, index=True, doc="Primary language of the active file")
    editor = Column(String(64), nullable=False, default="vscode", doc="Editor app name, e.g. vscode")
    started_at = Column(DateTime(timezone=True), nullable=False, doc="Session start (UTC)")
    ended_at = Column(DateTime(timezone=True), nullable=False, doc="Session end (UTC)")
    duration_seconds = Column(Integer, nullable=False, doc="Active seconds, idle time excluded")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        doc="Row creation time (UTC)",
    )

    user = relationship("User")

    __table_args__ = (
        Index("ix_coding_sessions_user_started", "user_id", "started_at"),
    )

    def __repr__(self) -> str:
        return f"<CodingSession(id={self.id}, user_id={self.user_id}, project='{self.project}')>"
