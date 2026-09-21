import os
import shutil
import tempfile
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel

try:
    from app.services.data_loader import data_loader
    from app.services.metrics import metrics_service
    from app.services.ml import ml_service
    from app.services.gemini import gemini_service
except ImportError:
    from backend.app.services.data_loader import data_loader
    from backend.app.services.metrics import metrics_service
    from backend.app.services.ml import ml_service
    from backend.app.services.gemini import gemini_service

logger = logging.getLogger("app.routers.dashboard")

router = APIRouter(tags=["Real Data Analytics & ML Dashboard"])


class ExplainRequest(BaseModel):
    focus: Optional[str] = "holistic overview"
    custom_query: Optional[str] = None


@router.get("/overview", summary="Get top-level real KPI metrics and weekly throughput")
def get_overview():
    try:
        return metrics_service.get_overview_metrics()
    except Exception as exc:
        logger.error(f"Error computing overview metrics: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ai-impact", summary="Get AI vs Non-AI cycle times, merge rates, and trends")
def get_ai_impact():
    try:
        return metrics_service.get_ai_impact_metrics()
    except Exception as exc:
        logger.error(f"Error computing AI impact metrics: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ai-tools", summary="Get real metrics per AI tool agent")
def get_ai_tools():
    try:
        return metrics_service.get_ai_tools_metrics()
    except Exception as exc:
        logger.error(f"Error computing AI tools metrics: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/people", summary="Get real per-developer metrics")
def get_people(limit: int = Query(100, ge=1, le=1000)):
    try:
        return metrics_service.get_people_metrics(limit=limit)
    except Exception as exc:
        logger.error(f"Error computing people metrics: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/projects", summary="Get real repository analytics joined with pull requests")
def get_projects(limit: int = Query(100, ge=1, le=1000)):
    try:
        return metrics_service.get_projects_metrics(limit=limit)
    except Exception as exc:
        logger.error(f"Error computing project metrics: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ml-insights", summary="Get explainable Scikit-learn K-Means workflow clusters")
def get_ml_insights(clusters: int = Query(4, ge=2, le=8)):
    try:
        return ml_service.run_developer_segmentation(n_clusters=clusters)
    except Exception as exc:
        logger.error(f"Error computing ML insights: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/pull-requests", summary="Get real pull requests from active dataset")
def get_pull_requests(
    limit: int = Query(100, ge=1, le=500),
    state: Optional[str] = Query(None)
):
    try:
        return metrics_service.get_pull_requests(limit=limit, state=state)
    except Exception as exc:
        logger.error(f"Error retrieving pull requests: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/explain", summary="Generate grounded explanation from Gemini without calculating or hallucinating numbers")
async def generate_explanation(req: Optional[ExplainRequest] = None):
    try:
        focus = req.focus if req else "holistic overview"
        # Compile structured context
        overview = metrics_service.get_overview_metrics()
        ai_impact = metrics_service.get_ai_impact_metrics()
        ai_tools = metrics_service.get_ai_tools_metrics()
        ml_insights = ml_service.run_developer_segmentation(n_clusters=4)

        context = {
            "overview": overview,
            "ai_impact": ai_impact,
            "ai_tools": ai_tools,
            "ml_insights": ml_insights
        }

        explanation = await gemini_service.generate_explanation(context_data=context, prompt_focus=focus)
        return explanation
    except Exception as exc:
        logger.error(f"Error generating Gemini explanation: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-dataset", summary="Upload fresh JSON or Parquet files to dynamically refresh dashboard")
async def upload_dataset(
    pull_request_file: Optional[UploadFile] = File(None),
    pr_reviews_file: Optional[UploadFile] = File(None),
    repository_file: Optional[UploadFile] = File(None)
):
    try:
        # Determine upload directory
        upload_dir = os.path.join(data_loader.data_dir, "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        saved_files = {}

        if pull_request_file and pull_request_file.filename:
            ext = os.path.splitext(pull_request_file.filename)[1].lower() or ".json"
            pr_dest = os.path.join(upload_dir, f"pull_request{ext}")
            with open(pr_dest, "wb") as buffer:
                shutil.copyfileobj(pull_request_file.file, buffer)
            saved_files["pull_request"] = pr_dest

        if pr_reviews_file and pr_reviews_file.filename:
            ext = os.path.splitext(pr_reviews_file.filename)[1].lower() or ".json"
            rev_dest = os.path.join(upload_dir, f"pr_reviews{ext}")
            with open(rev_dest, "wb") as buffer:
                shutil.copyfileobj(pr_reviews_file.file, buffer)
            saved_files["pr_reviews"] = rev_dest

        if repository_file and repository_file.filename:
            ext = os.path.splitext(repository_file.filename)[1].lower() or ".json"
            repo_dest = os.path.join(upload_dir, f"repository{ext}")
            with open(repo_dest, "wb") as buffer:
                shutil.copyfileobj(repository_file.file, buffer)
            saved_files["repository"] = repo_dest

        if not saved_files:
            raise HTTPException(status_code=400, detail="No dataset files were uploaded.")

        # Reload data loader with the updated files or defaults
        pr_path = saved_files.get("pull_request")
        rev_path = saved_files.get("pr_reviews")
        repo_path = saved_files.get("repository")

        meta = data_loader.load_dataset(pr_path=pr_path, reviews_path=rev_path, repo_path=repo_path)

        return {
            "status": "success",
            "message": "Datasets uploaded and validated successfully.",
            "meta": meta
        }

    except ValueError as val_err:
        logger.error(f"Schema validation error on upload: {val_err}")
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as exc:
        logger.error(f"Error handling dataset upload: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/reset-dataset", summary="Reset back to base dataset")
def reset_dataset():
    try:
        meta = data_loader.load_dataset()
        return {
            "status": "success",
            "message": "Dataset reset to default files.",
            "meta": meta
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/dataset-info", summary="Get dataset schemas and validation metadata")
def get_dataset_info():
    return {
        "meta": data_loader.dataset_meta or (data_loader.load_dataset() if data_loader.df_prs is None else {}),
        "validation_errors": data_loader.schema_validation_errors,
        "is_valid": len(data_loader.schema_validation_errors) == 0
    }
