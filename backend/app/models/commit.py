from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Commit(Base):
    """SQLAlchemy model representing a Git commit in a tracked repository."""

    __tablename__ = "commits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repo_id = Column(
        BigInteger,
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sha = Column(String(64), nullable=False, index=True)
    message = Column(Text, nullable=False)
    author_name = Column(String(256), nullable=True)
    author_email = Column(String(256), nullable=True)
    author_username = Column(String(256), nullable=True, index=True)
    committed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    url = Column(String(512), nullable=True)
    verified_ai_agent = Column(
        String(64),
        nullable=True,
        index=True,
        doc="'copilot', 'cursor', 'aider', 'chatgpt', or None",
    )

    # Relationships
    repository = relationship("Repository")

    __table_args__ = (
        UniqueConstraint("repo_id", "sha", name="uq_repo_sha"),
        Index("ix_commits_repo_time", "repo_id", "committed_at"),
        Index("ix_commits_user_time", "author_username", "committed_at"),
    )

    def __repr__(self) -> str:
        return f"<Commit(sha='{self.sha[:7]}', author='{self.author_username}', repo_id={self.repo_id})>"
