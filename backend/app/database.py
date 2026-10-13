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

db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

is_postgres = db_url.startswith("postgresql")
is_local_postgres = "localhost:5432" in db_url or "127.0.0.1:5432" in db_url
is_production = settings.ENVIRONMENT.lower() == "production" or bool(os.getenv("RENDER")) or bool(os.getenv("RAILWAY_ENVIRONMENT"))

if not db_url or (is_local_postgres and is_production):
    logger.info("No remote PostgreSQL configured in production; falling back to SQLite.")
    db_url = "sqlite:///./devpulse.db"
    is_postgres = False

connect_args = {}
engine_kwargs = {"echo": settings.DEBUG}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    connect_args["connect_timeout"] = 3
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 5,
        "pool_recycle": 1800,
    })

try:
    engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
    if is_postgres:
        with engine.connect() as probe:
            probe.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL.")
except Exception as exc:
    logger.warning(f"Failed to connect to configured DB ({db_url}): {exc}. Defaulting to SQLite.")
    db_url = "sqlite:///./devpulse.db"
    engine = create_engine("sqlite:///./devpulse.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error(f"Database connection check failed: {exc}")
        return False
