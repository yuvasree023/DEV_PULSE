import logging
import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

try:
    from app.config import settings
except ImportError:
    from backend.app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Fallback to SQLite if psycopg2 is missing or Postgres is default local
if not db_url.startswith("sqlite"):
    try:
        import psycopg2
    except ImportError:
        logger.warning("psycopg2 not installed; falling back to SQLite database for task storage.")
        db_url = "sqlite:///./devpulse.db"

connect_args = {}
engine_kwargs = {
    "echo": settings.DEBUG,
}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    })

try:
    engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
except Exception as exc:
    logger.warning(f"Failed to create engine with {db_url}: {exc}. Defaulting to SQLite.")
    engine = create_engine("sqlite:///./devpulse.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for creating a transactional database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Check if the database is reachable."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error(f"Database connection check failed: {exc}")
        return False
