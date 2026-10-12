from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """SQLAlchemy model representing an authenticated developer."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, doc="Internal user ID")
    github_id = Column(String(64), unique=True, nullable=False, index=True, doc="GitHub user ID")
    username = Column(String(256), nullable=False, index=True, doc="GitHub login/username")
    email = Column(String(256), nullable=True, index=True, doc="User email address")
    name = Column(String(256), nullable=True, doc="User full display name")
    avatar_url = Column(String(512), nullable=True, doc="Avatar image URL")
    bio = Column(Text, nullable=True, doc="GitHub bio")
    company = Column(String(256), nullable=True, doc="Company or organization")
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        doc="Account creation timestamp",
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    tokens = relationship(
        "UserToken",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    tracked_repositories = relationship(
        "UserRepository",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', github_id='{self.github_id}')>"


class UserToken(Base):
    """SQLAlchemy model storing encrypted OAuth tokens and credentials per user."""

    __tablename__ = "user_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Owner user ID",
    )
    provider = Column(String(32), default="github", nullable=False, doc="OAuth provider, e.g. github")
    encrypted_access_token = Column(String(1024), nullable=False, doc="Symmetrically encrypted token")
    token_type = Column(String(64), default="bearer", nullable=True)
    scope = Column(String(256), nullable=True, doc="OAuth scopes granted")
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
    user = relationship("User", back_populates="tokens")

    def __repr__(self) -> str:
        return f"<UserToken(id={self.id}, user_id={self.user_id}, provider='{self.provider}')>"
