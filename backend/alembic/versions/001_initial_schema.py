"""initial schema for repositories, pull_requests, and pr_reviews

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-12 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create repositories table
    op.create_table(
        "repositories",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("url", sa.String(length=512), nullable=False),
        sa.Column("license", sa.String(length=128), nullable=True),
        sa.Column("full_name", sa.String(length=256), nullable=False),
        sa.Column("is_forked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("language", sa.String(length=64), nullable=True),
        sa.Column("forks", sa.BigInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column("stars", sa.BigInteger(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repositories_full_name", "repositories", ["full_name"], unique=True)
    op.create_index("ix_repositories_language", "repositories", ["language"], unique=False)
    op.create_index("ix_repositories_lang_stars", "repositories", ["language", "stars"], unique=False)

    # 2. Create pull_requests table
    op.create_table(
        "pull_requests",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("number", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("agent", sa.String(length=64), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("user", sa.String(length=256), nullable=False),
        sa.Column("state", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("merged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("repo_id", sa.BigInteger(), nullable=False),
        sa.Column("repo_url", sa.String(length=512), nullable=True),
        sa.Column("html_url", sa.String(length=512), nullable=True),
        sa.ForeignKeyConstraint(["repo_id"], ["repositories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pull_requests_repo_id", "pull_requests", ["repo_id"], unique=False)
    op.create_index("ix_pull_requests_state", "pull_requests", ["state"], unique=False)
    op.create_index("ix_pull_requests_agent", "pull_requests", ["agent"], unique=False)
    op.create_index("ix_pull_requests_user_id", "pull_requests", ["user_id"], unique=False)
    op.create_index("ix_pull_requests_user", "pull_requests", ["user"], unique=False)
    op.create_index("ix_pull_requests_created_at", "pull_requests", ["created_at"], unique=False)
    op.create_index("ix_pull_requests_merged_at", "pull_requests", ["merged_at"], unique=False)
    op.create_index("ix_pull_requests_repo_state", "pull_requests", ["repo_id", "state"], unique=False)
    op.create_index("ix_pull_requests_agent_created", "pull_requests", ["agent", "created_at"], unique=False)
    op.create_index("ix_pull_requests_user_created", "pull_requests", ["user", "created_at"], unique=False)
    op.create_index("ix_pull_requests_created_merged", "pull_requests", ["created_at", "merged_at"], unique=False)

    # 3. Create pr_reviews table
    op.create_table(
        "pr_reviews",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("pr_id", sa.BigInteger(), nullable=False),
        sa.Column("user", sa.String(length=256), nullable=False),
        sa.Column("user_type", sa.String(length=64), nullable=True),
        sa.Column("state", sa.String(length=64), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["pr_id"], ["pull_requests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pr_reviews_pr_id", "pr_reviews", ["pr_id"], unique=False)
    op.create_index("ix_pr_reviews_user", "pr_reviews", ["user"], unique=False)
    op.create_index("ix_pr_reviews_state", "pr_reviews", ["state"], unique=False)
    op.create_index("ix_pr_reviews_submitted_at", "pr_reviews", ["submitted_at"], unique=False)
    op.create_index("ix_pr_reviews_pr_state", "pr_reviews", ["pr_id", "state"], unique=False)
    op.create_index("ix_pr_reviews_user_submitted", "pr_reviews", ["user", "submitted_at"], unique=False)


def downgrade() -> None:
    op.drop_table("pr_reviews")
    op.drop_table("pull_requests")
    op.drop_table("repositories")
