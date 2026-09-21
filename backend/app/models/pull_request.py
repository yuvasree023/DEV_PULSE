from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class PullRequest(Base):
    """SQLAlchemy model representing a pull request."""

    __tablename__ = "pull_requests"

    id = Column(BigInteger, primary_key=True, autoincrement=False, doc="Unique pull request ID")
    number = Column(BigInteger, nullable=False, doc="Pull request issue number in repository")
    title = Column(String(512), nullable=False, doc="Pull request title")
    body = Column(Text, nullable=True, doc="Pull request markdown description")
    agent = Column(
        String(64),
        nullable=True,
        index=True,
        doc="AI tool agent identifier: 'copilot', 'cursor', or null for human author",
    )
    user_id = Column(BigInteger, nullable=False, index=True, doc="Author user identifier")
    user = Column(String(256), nullable=False, index=True, doc="Author GitHub username")
    state = Column(
        String(32),
        nullable=False,
        index=True,
        doc="Pull request state: 'open', 'closed', or 'merged'",
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        doc="Timestamp when PR was opened",
    )
    closed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when PR was closed without merge",
    )
    merged_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        doc="Timestamp when PR was merged",
    )
    repo_id = Column(
        BigInteger,
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key referencing repositories.id",
    )
    repo_url = Column(String(512), nullable=True, doc="URL to the repository")
    html_url = Column(String(512), nullable=True, doc="Direct web link to pull request")

    # Relationships
    repository = relationship("Repository", back_populates="pull_requests")
    reviews = relationship(
        "PRReview",
        back_populates="pull_request",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PRReview.submitted_at.asc()",
    )

    __table_args__ = (
        Index("ix_pull_requests_repo_state", "repo_id", "state"),
        Index("ix_pull_requests_agent_created", "agent", "created_at"),
        Index("ix_pull_requests_user_created", "user", "created_at"),
        Index("ix_pull_requests_created_merged", "created_at", "merged_at"),
    )

    def __repr__(self) -> str:
        return f"<PullRequest(id={self.id}, number={self.number}, agent='{self.agent}', state='{self.state}')>"
