from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class PRReview(Base):
    """SQLAlchemy model representing a pull request review or review comment."""

    __tablename__ = "pr_reviews"

    id = Column(BigInteger, primary_key=True, autoincrement=False, doc="Unique review identifier")
    pr_id = Column(
        BigInteger,
        ForeignKey("pull_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key referencing pull_requests.id",
    )
    user = Column(String(256), nullable=False, index=True, doc="Reviewer username")
    user_type = Column(String(64), nullable=True, doc="Type of user: 'User' or 'Bot'")
    state = Column(
        String(64),
        nullable=False,
        index=True,
        doc="Review state: 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'",
    )
    submitted_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        doc="Timestamp when review was submitted",
    )
    body = Column(Text, nullable=True, doc="Review comment body or feedback")

    # Relationships
    pull_request = relationship("PullRequest", back_populates="reviews")

    __table_args__ = (
        Index("ix_pr_reviews_pr_state", "pr_id", "state"),
        Index("ix_pr_reviews_user_submitted", "user", "submitted_at"),
    )

    def __repr__(self) -> str:
        return f"<PRReview(id={self.id}, pr_id={self.pr_id}, state='{self.state}', user='{self.user}')>"
