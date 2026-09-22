import os
import unittest
import pandas as pd
from app.services.data_loader import DataLoader, REQUIRED_SCHEMAS, LOW_MEMORY_MODE, drop_heavy_columns


def test_low_memory_mode_default():
    assert LOW_MEMORY_MODE is True


def test_required_schemas_exclude_heavy_columns():
    """Verify that heavy string columns like body, title, html_url, repo_url are not in REQUIRED_SCHEMAS."""
    heavy_cols = {"body", "title", "html_url", "repo_url"}
    for schema_name, required_cols in REQUIRED_SCHEMAS.items():
        for col in heavy_cols:
            assert col not in required_cols, f"{col} should not be strictly required in {schema_name}"


def test_drop_heavy_columns():
    df = pd.DataFrame({
        "id": [1, 2],
        "title": ["Feature 1", "Bugfix 2"],
        "body": ["Detailed description 1", "Detailed description 2"],
        "repo_url": ["https://github.com/repo1", "https://github.com/repo2"],
        "html_url": ["https://github.com/repo1/pull/1", "https://github.com/repo2/pull/2"],
        "number": [101, 102],
        "state": ["open", "closed"],
    })
    cleaned = drop_heavy_columns(df)
    assert "body" not in cleaned.columns
    assert "title" not in cleaned.columns
    assert "repo_url" not in cleaned.columns
    assert "html_url" not in cleaned.columns
    assert "id" in cleaned.columns
    assert "number" in cleaned.columns


def test_validate_schema_passes_without_heavy_columns():
    loader = DataLoader()
    df_pr = pd.DataFrame({
        "id": [1],
        "number": [10],
        "agent": [""],
        "user_id": [100],
        "user": ["dev1"],
        "state": ["closed"],
        "created_at": ["2025-01-01T00:00:00Z"],
        "closed_at": ["2025-01-01T05:00:00Z"],
        "merged_at": ["2025-01-01T05:00:00Z"],
        "repo_id": [50],
    })
    valid, missing = loader.validate_schema(df_pr, "pull_request")
    assert valid is True
    assert missing == []


def test_load_dataset_low_memory_sampling():
    loader = DataLoader()
    os.environ["LOW_MEMORY_MODE"] = "true"
    meta = loader.load_dataset()

    assert meta["low_memory_mode"] is True
    df_prs, df_reviews, df_repos = loader.get_data()

    # Verify PR count is sampled to <= 200
    assert len(df_prs) <= 200
    assert len(df_prs) > 0

    # Verify reviews and repos are filtered to match sampled PRs
    sampled_pr_ids = set(df_prs["id"].dropna().unique())
    sampled_repo_ids = set(df_prs["repo_id"].dropna().unique())

    if len(df_reviews) > 0:
        assert set(df_reviews["pr_id"].dropna().unique()).issubset(sampled_pr_ids)

    if len(df_repos) > 0:
        assert set(df_repos["id"].dropna().unique()).issubset(sampled_repo_ids)
