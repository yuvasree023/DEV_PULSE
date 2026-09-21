import logging
import sys
import os

# Ensure backend and root paths are in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from app.config import settings
    from app.database import engine, Base, check_db_connection
    from app.services.data_loader import data_loader
    from app.routers import (
        analytics_router,
        tasks_router,
        ai_insights_router,
        pull_requests_router,
        repositories_router,
    )
    from app.routers.dashboard import router as dashboard_router
except ImportError:
    from backend.app.config import settings
    from backend.app.database import engine, Base, check_db_connection
    from backend.app.services.data_loader import data_loader
    from backend.app.routers import (
        analytics_router,
        tasks_router,
        ai_insights_router,
        pull_requests_router,
        repositories_router,
    )
    from backend.app.routers.dashboard import router as dashboard_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler: run startup checks and dataset loading."""
    logger.info(f"Starting {settings.APP_NAME} in '{settings.ENVIRONMENT}' environment...")
    
    # Initialize Parquet dataset
    try:
        data_loader.load_dataset()
        logger.info("Parquet dataset successfully loaded and validated.")
    except Exception as exc:
        logger.warning(f"Could not preload default parquet dataset at startup: {exc}")

    # Create DB tables if not already created
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
    description="Real Data-Backed AI Impact & Developer Productivity Analytics Backend",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS middleware
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
if "*" not in cors_origins:
    for default_origin in ["https://dev-pulse-lhnv-nine.vercel.app", "http://localhost:5173", "http://localhost:3000"]:
        if default_origin not in cors_origins:
            cors_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    """Deployment and service health check endpoint."""
    is_connected = check_db_connection()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "db_connected": is_connected,
        "environment": settings.ENVIRONMENT,
        "dataset_loaded": data_loader.df_prs is not None and len(data_loader.df_prs) > 0
    }


# Register all /api core endpoints
app.include_router(dashboard_router, prefix="/api")
# Also register dashboard routes directly at root to handle stripped prefixes on Vercel
app.include_router(dashboard_router)

# Register /api/v1 legacy routers & aliases
api_v1_prefix = "/api/v1"
app.include_router(dashboard_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(tasks_router, prefix=api_v1_prefix)
app.include_router(ai_insights_router, prefix=api_v1_prefix)
app.include_router(pull_requests_router, prefix=api_v1_prefix)
app.include_router(repositories_router, prefix=api_v1_prefix)

# Explicit top-level aliases for AI impact to prevent any possible 404
@app.get("/api/ai-impact", tags=["Real Data Analytics & ML Dashboard"], include_in_schema=False)
@app.get("/ai-impact", tags=["Real Data Analytics & ML Dashboard"], include_in_schema=False)
@app.get("/api/v1/analytics/ai-impact", tags=["Real Data Analytics & ML Dashboard"], include_in_schema=False)
def ai_impact_direct_route():
    try:
        from app.services.metrics import metrics_service
    except ImportError:
        from backend.app.services.metrics import metrics_service
    return metrics_service.get_ai_impact_metrics()


@app.get("/", tags=["Root"])
def root_endpoint():
    """Root metadata response."""
    return {
        "service": settings.APP_NAME,
        "version": "2.0.0",
        "api": "/api",
        "docs": "/docs",
        "health": "/health",
    }
