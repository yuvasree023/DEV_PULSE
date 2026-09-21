import logging
from typing import Dict, Any, Tuple
import polars as pl

logger = logging.getLogger(__name__)


def parse_datetime_expr(col_name: str) -> pl.Expr:
    """
    Robust datetime parsing expression for Polars.
    Handles ISO 8601, standard formats, empty strings, and trailing 'Z' / offsets.
    """
    return (
        pl.when(
            pl.col(col_name).is_null()
            | (pl.col(col_name).cast(pl.Utf8).str.strip_chars() == "")
            | (pl.col(col_name).cast(pl.Utf8).str.to_lowercase() == "null")
            | (pl.col(col_name).cast(pl.Utf8).str.to_lowercase() == "none")
        )
        .then(pl.lit(None, dtype=pl.Datetime("us", "UTC")))
        .otherwise(
            pl.coalesce([
                # Format 1: ISO 8601 with T and Z (e.g. 2024-01-15T12:30:00Z)
                pl.col(col_name).cast(pl.Utf8).str.to_datetime(format="%Y-%m-%dT%H:%M:%SZ", strict=False, time_zone="UTC"),
                # Format 2: ISO with microseconds and Z
                pl.col(col_name).cast(pl.Utf8).str.to_datetime(format="%Y-%m-%dT%H:%M:%S.%fZ", strict=False, time_zone="UTC"),
                # Format 3: Space separator with Z/offset
                pl.col(col_name).cast(pl.Utf8).str.to_datetime(format="%Y-%m-%d %H:%M:%S%z", strict=False),
                # Format 4: Standard ISO (generic auto parse)
                pl.col(col_name).cast(pl.Utf8).str.to_datetime(strict=False, time_zone="UTC"),
                # Format 5: Date only
                pl.col(col_name).cast(pl.Utf8).str.to_datetime(format="%Y-%m-%d", strict=False, time_zone="UTC"),
            ])
        )
    )


def clean_repositories(df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
    """
    Clean and cast repositories dataframe.
    Returns the cleaned DataFrame and an audit metadata summary dictionary.
    """
    initial_count = df.height
    logger.info(f"Cleaning repositories dataset. Total initial rows: {initial_count}")

    # Standardize column names
    cleaned = df.rename({c: c.strip().lower() for c in df.columns})

    # Cast types and clean values
    cleaned = cleaned.with_columns([
        pl.col("id").cast(pl.Int64),
        pl.col("url").cast(pl.Utf8).str.strip_chars(),
        pl.when(
            pl.col("license").is_null()
            | (pl.col("license").cast(pl.Utf8).str.strip_chars() == "")
            | (pl.col("license").cast(pl.Utf8).str.to_lowercase() == "null")
        )
        .then(None)
        .otherwise(pl.col("license").cast(pl.Utf8).str.strip_chars())
        .alias("license"),
        pl.col("full_name").cast(pl.Utf8).str.strip_chars(),
        pl.col("is_forked").cast(pl.Boolean).fill_null(False),
        pl.when(
            pl.col("language").is_null()
            | (pl.col("language").cast(pl.Utf8).str.strip_chars() == "")
            | (pl.col("language").cast(pl.Utf8).str.to_lowercase() == "null")
        )
        .then(None)
        .otherwise(pl.col("language").cast(pl.Utf8).str.strip_chars())
        .alias("language"),
        pl.col("forks").cast(pl.Int64).fill_null(0),
        pl.col("stars").cast(pl.Int64).fill_null(0),
    ])

    # Deduplicate by primary key keeping the latest
    cleaned = cleaned.unique(subset=["id"], keep="last")

    null_summary = {
        col: int(cleaned[col].null_count())
        for col in ["license", "language"]
        if col in cleaned.columns
    }

    stats = {
        "initial_rows": initial_count,
        "cleaned_rows": cleaned.height,
        "null_counts": null_summary,
        "languages": [l for l in cleaned["language"].unique().to_list() if l is not None],
    }
    logger.info(f"Repositories cleaned: {cleaned.height} unique rows. Nulls: {null_summary}")
    return cleaned, stats


def clean_pull_requests(df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
    """
    Clean, cast, and normalize pull_requests dataframe.
    - agent normalized to lowercase & stripped; empty/'null' -> None
    - VARCHAR timestamp columns converted to UTC Datetime
    - state normalized to lowercase ('open', 'closed', 'merged')
    """
    initial_count = df.height
    logger.info(f"Cleaning pull_requests dataset. Total initial rows: {initial_count}")

    cleaned = df.rename({c: c.strip().lower() for c in df.columns})

    # Normalize agent: lowercase, strip whitespace, handle 'null'/'none' strings
    agent_expr = (
        pl.when(
            pl.col("agent").is_null()
            | (pl.col("agent").cast(pl.Utf8).str.strip_chars() == "")
            | (pl.col("agent").cast(pl.Utf8).str.to_lowercase() == "null")
            | (pl.col("agent").cast(pl.Utf8).str.to_lowercase() == "none")
            | (pl.col("agent").cast(pl.Utf8).str.to_lowercase() == "human")
        )
        .then(None)
        .otherwise(pl.col("agent").cast(pl.Utf8).str.to_lowercase().str.strip_chars())
        .alias("agent")
    )

    # State normalization
    state_expr = (
        pl.col("state")
        .cast(pl.Utf8)
        .str.to_lowercase()
        .str.strip_chars()
        .alias("state")
    )

    cleaned = cleaned.with_columns([
        pl.col("id").cast(pl.Int64),
        pl.col("number").cast(pl.Int64),
        pl.col("title").cast(pl.Utf8).str.strip_chars(),
        pl.when(
            pl.col("body").is_null()
            | (pl.col("body").cast(pl.Utf8).str.strip_chars() == "")
            | (pl.col("body").cast(pl.Utf8).str.to_lowercase() == "null")
        )
        .then(None)
        .otherwise(pl.col("body").cast(pl.Utf8))
        .alias("body"),
        agent_expr,
        pl.col("user_id").cast(pl.Int64),
        pl.col("user").cast(pl.Utf8).str.strip_chars(),
        state_expr,
        parse_datetime_expr("created_at").alias("created_at"),
        parse_datetime_expr("closed_at").alias("closed_at"),
        parse_datetime_expr("merged_at").alias("merged_at"),
        pl.col("repo_id").cast(pl.Int64),
        pl.col("repo_url").cast(pl.Utf8).str.strip_chars() if "repo_url" in cleaned.columns else pl.lit(None, dtype=pl.Utf8).alias("repo_url"),
        pl.col("html_url").cast(pl.Utf8).str.strip_chars() if "html_url" in cleaned.columns else pl.lit(None, dtype=pl.Utf8).alias("html_url"),
    ])

    # Filter out any corrupt record without an ID or created_at
    valid_mask = cleaned["id"].is_not_null() & cleaned["created_at"].is_not_null()
    invalid_rows = initial_count - int(valid_mask.sum())
    if invalid_rows > 0:
        logger.warning(f"Found {invalid_rows} rows missing id or created_at. Filtering out.")
    cleaned = cleaned.filter(valid_mask)

    # Deduplicate by primary key
    cleaned = cleaned.unique(subset=["id"], keep="last")

    # Metrics summary
    min_date = cleaned["created_at"].min()
    max_date = cleaned["created_at"].max()
    agent_distribution = cleaned["agent"].fill_null("human").value_counts().to_dicts()

    stats = {
        "initial_rows": initial_count,
        "cleaned_rows": cleaned.height,
        "date_range": {
            "min_created_at": str(min_date) if min_date else None,
            "max_created_at": str(max_date) if max_date else None,
        },
        "agent_distribution": {d["agent"]: d["count"] for d in agent_distribution},
        "null_counts": {
            "agent": int(cleaned["agent"].null_count()),
            "closed_at": int(cleaned["closed_at"].null_count()),
            "merged_at": int(cleaned["merged_at"].null_count()),
            "body": int(cleaned["body"].null_count()),
        },
    }
    logger.info(f"Pull requests cleaned: {cleaned.height} rows. Date range: {min_date} -> {max_date}")
    return cleaned, stats


def clean_pr_reviews(df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
    """
    Clean and cast pr_reviews dataframe.
    - state normalized to uppercase ('APPROVED', 'CHANGES_REQUESTED', 'COMMENTED')
    - submitted_at cast to proper Datetime
    """
    initial_count = df.height
    logger.info(f"Cleaning pr_reviews dataset. Total initial rows: {initial_count}")

    cleaned = df.rename({c: c.strip().lower() for c in df.columns})

    # Normalize review state to uppercase
    state_expr = (
        pl.col("state")
        .cast(pl.Utf8)
        .str.to_uppercase()
        .str.strip_chars()
        .alias("state")
    )

    cleaned = cleaned.with_columns([
        pl.col("id").cast(pl.Int64),
        pl.col("pr_id").cast(pl.Int64),
        pl.col("user").cast(pl.Utf8).str.strip_chars(),
        pl.col("user_type").cast(pl.Utf8).str.strip_chars() if "user_type" in cleaned.columns else pl.lit("User").alias("user_type"),
        state_expr,
        parse_datetime_expr("submitted_at").alias("submitted_at"),
        pl.when(
            pl.col("body").is_null()
            | (pl.col("body").cast(pl.Utf8).str.strip_chars() == "")
            | (pl.col("body").cast(pl.Utf8).str.to_lowercase() == "null")
        )
        .then(None)
        .otherwise(pl.col("body").cast(pl.Utf8))
        .alias("body"),
    ])

    valid_mask = cleaned["id"].is_not_null() & cleaned["pr_id"].is_not_null() & cleaned["submitted_at"].is_not_null()
    cleaned = cleaned.filter(valid_mask).unique(subset=["id"], keep="last")

    min_date = cleaned["submitted_at"].min()
    max_date = cleaned["submitted_at"].max()
    state_counts = cleaned["state"].value_counts().to_dicts()

    stats = {
        "initial_rows": initial_count,
        "cleaned_rows": cleaned.height,
        "date_range": {
            "min_submitted_at": str(min_date) if min_date else None,
            "max_submitted_at": str(max_date) if max_date else None,
        },
        "review_state_counts": {d["state"]: d["count"] for d in state_counts},
        "null_counts": {
            "body": int(cleaned["body"].null_count()),
        },
    }
    logger.info(f"PR Reviews cleaned: {cleaned.height} rows. States: {stats['review_state_counts']}")
    return cleaned, stats
