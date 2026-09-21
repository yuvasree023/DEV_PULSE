import logging
import sys
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, check_db_connection
from app.routers import (
    analytics_router,
    tasks_router,
    ai_insights_router,
    pull_requests_router,
    repositories_router,
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler: run startup checks and cleanup on shutdown."""
    logger.info(f"Starting {settings.APP_NAME} in '{settings.ENVIRONMENT}' environment...")
    # Create tables if not already created
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified.")
    except Exception as exc:
        logger.error(f"Error during schema validation: {exc}")
    yield
    logger.info("Shutting down application...")


# FastAPI application instance
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI Impact & Developer Productivity Dashboard with Gemini 2.0 Flash integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint for Railway/Render/Docker
@app.get("/health", tags=["Health"])
def health_check():
    """Deployment and service health check endpoint."""
    is_connected = check_db_connection()
    return {
        "status": "ok" if is_connected else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "db_connected": is_connected,
        "environment": settings.ENVIRONMENT,
    }


# Register all /api/v1 routers
api_v1_prefix = "/api/v1"
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(tasks_router, prefix=api_v1_prefix)
app.include_router(ai_insights_router, prefix=api_v1_prefix)
app.include_router(pull_requests_router, prefix=api_v1_prefix)
app.include_router(repositories_router, prefix=api_v1_prefix)


@app.get("/", tags=["Root"])
def root_endpoint():
    """Root metadata response."""
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "api_v1": "/api/v1",
        "docs": "/docs",
        "health": "/health",
    }
