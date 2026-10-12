from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class UserRepository(Base):
    """SQLAlchemy model tracking which repositories a user has selected and sync status."""

    __tablename__ = "user_repositories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    repo_id = Column(
        BigInteger,
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_selected = Column(Boolean, default=True, nullable=False, doc="Whether user selected this repo")
    sync_status = Column(
        String(32),
        default="pending",
        nullable=False,
        index=True,
        doc="'pending', 'syncing', 'completed', 'failed'",
    )
    sync_progress = Column(String(256), default="", nullable=False, doc="Live progress description")
    prs_count = Column(Integer, default=0, nullable=False)
    commits_count = Column(Integer, default=0, nullable=False)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="tracked_repositories")
    repository = relationship("Repository")

    __table_args__ = (
        UniqueConstraint("user_id", "repo_id", name="uq_user_repo"),
        Index("ix_user_repo_status", "user_id", "sync_status"),
    )

    def __repr__(self) -> str:
        return f"<UserRepository(user_id={self.user_id}, repo_id={self.repo_id}, status='{self.sync_status}')>"
