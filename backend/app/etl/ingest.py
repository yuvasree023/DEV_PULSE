import os
import sys
import logging
import argparse
from pathlib import Path
from typing import Dict, Any, List, Type
import polars as pl
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend directory to sys.path to support `python -m app.etl.ingest`
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview
from app.etl.transform import (
    clean_repositories,
    clean_pull_requests,
    clean_pr_reviews,
)

# Configure logging format
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("etl.ingest")


def upsert_records_batch(
    session: Session,
    model: Type[Base],
    records: List[Dict[str, Any]],
    batch_size: int = 500,
) -> int:
    """
    Perform idempotent batch upserts into database (PostgreSQL or SQLite compatible).
    """
    if not records:
        return 0

    dialect_name = session.bind.dialect.name
    total_upserted = 0
    table = model.__table__
    cols_to_update = [c.name for c in table.columns if c.name != "id"]

    for i in range(0, len(records), batch_size):
        chunk = records[i : i + batch_size]
        try:
            if dialect_name == "postgresql":
                from sqlalchemy.dialects.postgresql import insert as pg_insert

                stmt = pg_insert(table).values(chunk)
                stmt = stmt.on_conflict_do_update(
                    index_elements=[table.c.id],
                    set_={col: getattr(stmt.excluded, col) for col in cols_to_update},
                )
                session.execute(stmt)
            elif dialect_name == "sqlite":
                from sqlalchemy.dialects.sqlite import insert as sqlite_insert

                stmt = sqlite_insert(table).values(chunk)
                stmt = stmt.on_conflict_do_update(
                    index_elements=[table.c.id],
                    set_={col: getattr(stmt.excluded, col) for col in cols_to_update},
                )
                session.execute(stmt)
            else:
                # Generic fallback using session.merge
                for record in chunk:
                    obj = model(**record)
                    session.merge(obj)

            session.commit()
            total_upserted += len(chunk)
        except Exception as exc:
            session.rollback()
            logger.error(f"Error upserting batch {i} to {i + len(chunk)} for {model.__tablename__}: {exc}")
            raise exc

    return total_upserted


def run_ingest(data_dir: str = None) -> Dict[str, Any]:
    """
    Main ETL ingestion pipeline:
    1. Reads Parquet files using Polars
    2. Casts, cleans, and normalizes schema
    3. Upserts into database in topological order (Repositories -> PRs -> Reviews)
    4. Logs detailed audit summary
    """
    target_data_dir = Path(data_dir or settings.DATA_DIR)
    if not target_data_dir.is_absolute():
        target_data_dir = backend_dir / target_data_dir

    logger.info("=" * 70)
    logger.info("STARTING DATA INGESTION PIPELINE")
    logger.info(f"Target data directory: {target_data_dir}")
    logger.info(f"Database dialect: {engine.dialect.name}")
    logger.info("=" * 70)

    # Ensure tables exist (safety net if migrations haven't run yet)
    Base.metadata.create_all(bind=engine)

    repo_file = target_data_dir / "repositories.parquet"
    pr_file = target_data_dir / "pull_requests.parquet"
    review_file = target_data_dir / "pr_reviews.parquet"

    missing_files = []
    for f in [repo_file, pr_file, review_file]:
        if not f.exists():
            missing_files.append(str(f))

    if missing_files:
        err_msg = f"Missing required Parquet file(s): {', '.join(missing_files)}"
        logger.error(err_msg)
        raise FileNotFoundError(err_msg)

    pipeline_summary = {
        "repositories": {},
        "pull_requests": {},
        "pr_reviews": {},
        "status": "in_progress",
    }

    session = SessionLocal()
    try:
        # -------------------------------------------------------------
        # STEP 1: Ingest Repositories
        # -------------------------------------------------------------
        logger.info(f"Reading {repo_file} with Polars...")
        raw_repos = pl.read_parquet(repo_file)
        clean_repos_df, repo_stats = clean_repositories(raw_repos)

        repo_records = clean_repos_df.to_dicts()
        upserted_repos = upsert_records_batch(session, Repository, repo_records)
        repo_stats["rows_upserted"] = upserted_repos
        pipeline_summary["repositories"] = repo_stats
        logger.info(f"✓ Repositories: {upserted_repos} rows successfully upserted.")

        # -------------------------------------------------------------
        # STEP 2: Ingest Pull Requests
        # -------------------------------------------------------------
        logger.info(f"Reading {pr_file} with Polars...")
        raw_prs = pl.read_parquet(pr_file)
        clean_prs_df, pr_stats = clean_pull_requests(raw_prs)

        # Ensure foreign key integrity against existing repositories
        existing_repo_ids = set(session.query(Repository.id).all())
        existing_repo_ids = {r[0] for r in existing_repo_ids}
        
        # Filter PRs that link to valid repositories
        valid_prs_df = clean_prs_df.filter(pl.col("repo_id").is_in(list(existing_repo_ids)))
        filtered_out = clean_prs_df.height - valid_prs_df.height
        if filtered_out > 0:
            logger.warning(f"Filtered out {filtered_out} PRs referencing unknown repository IDs.")

        pr_records = valid_prs_df.to_dicts()
        upserted_prs = upsert_records_batch(session, PullRequest, pr_records)
        pr_stats["rows_upserted"] = upserted_prs
        pipeline_summary["pull_requests"] = pr_stats
        logger.info(f"✓ Pull Requests: {upserted_prs} rows successfully upserted.")

        # -------------------------------------------------------------
        # STEP 3: Ingest PR Reviews
        # -------------------------------------------------------------
        logger.info(f"Reading {review_file} with Polars...")
        raw_reviews = pl.read_parquet(review_file)
        clean_reviews_df, review_stats = clean_pr_reviews(raw_reviews)

        # Ensure foreign key integrity against existing pull requests
        existing_pr_ids = set(session.query(PullRequest.id).all())
        existing_pr_ids = {p[0] for p in existing_pr_ids}

        valid_reviews_df = clean_reviews_df.filter(pl.col("pr_id").is_in(list(existing_pr_ids)))
        filtered_reviews = clean_reviews_df.height - valid_reviews_df.height
        if filtered_reviews > 0:
            logger.warning(f"Filtered out {filtered_reviews} reviews referencing unknown PR IDs.")

        review_records = valid_reviews_df.to_dicts()
        upserted_reviews = upsert_records_batch(session, PRReview, review_records)
        review_stats["rows_upserted"] = upserted_reviews
        pipeline_summary["pr_reviews"] = review_stats
        logger.info(f"✓ PR Reviews: {upserted_reviews} rows successfully upserted.")

        pipeline_summary["status"] = "success"
        logger.info("=" * 70)
        logger.info("ETL PIPELINE COMPLETED SUCCESSFULLY")
        logger.info("=" * 70)
        return pipeline_summary

    except Exception as exc:
        session.rollback()
        pipeline_summary["status"] = "failed"
        pipeline_summary["error"] = str(exc)
        logger.error(f"ETL pipeline encountered a fatal error: {exc}", exc_info=True)
        raise exc
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(description="Run ETL ingestion from Parquet files into PostgreSQL.")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=settings.DATA_DIR,
        help="Path to folder containing repositories.parquet, pull_requests.parquet, pr_reviews.parquet",
    )
    args = parser.parse_args()

    try:
        summary = run_ingest(data_dir=args.data_dir)
        print("\n--- INGESTION SUMMARY ---")
        for table, stats in summary.items():
            if isinstance(stats, dict):
                print(f"Table: {table}")
                for k, v in stats.items():
                    print(f"  - {k}: {v}")
    except Exception as e:
        sys.exit(1)


if __name__ == "__main__":
    main()
