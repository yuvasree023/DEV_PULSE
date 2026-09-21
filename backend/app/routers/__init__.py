from app.routers.analytics import router as analytics_router
from app.routers.tasks import router as tasks_router
from app.routers.ai_insights import router as ai_insights_router
from app.routers.pull_requests import router as pull_requests_router
from app.routers.repositories import router as repositories_router

__all__ = [
    "analytics_router",
    "tasks_router",
    "ai_insights_router",
    "pull_requests_router",
    "repositories_router",
]
