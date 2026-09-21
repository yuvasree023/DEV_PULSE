from sqlalchemy import Column, BigInteger, String, Boolean, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Repository(Base):
    """SQLAlchemy model representing a tracked code repository."""

    __tablename__ = "repositories"

    id = Column(BigInteger, primary_key=True, autoincrement=False, doc="Unique repository identifier")
    url = Column(String(512), nullable=False, doc="Repository HTML or API URL")
    license = Column(String(128), nullable=True, doc="License identifier, e.g. MIT, Apache-2.0")
    full_name = Column(String(256), nullable=False, unique=True, index=True, doc="Full repository name: org/repo")
    is_forked = Column(Boolean, nullable=False, default=False, doc="Whether repository is a fork")
    language = Column(String(64), nullable=True, index=True, doc="Primary programming language")
    forks = Column(BigInteger, nullable=False, default=0, doc="Total number of forks")
    stars = Column(BigInteger, nullable=False, default=0, doc="Total number of stargazers")

    # Relationships
    pull_requests = relationship(
        "PullRequest",
        back_populates="repository",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_repositories_lang_stars", "language", "stars"),
    )

    def __repr__(self) -> str:
        return f"<Repository(id={self.id}, full_name='{self.full_name}', language='{self.language}')>"
