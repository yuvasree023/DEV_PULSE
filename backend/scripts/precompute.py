import json
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# When running precompute, we can load the full or sampled dataset
from app.services.data_loader import data_loader
from app.services.metrics import metrics_service
from app.services.ml import ml_service


def main() -> None:
    print("Loading dataset for precomputation...")
    data_loader.load_dataset()
    print("Computing metrics and ML insights...")
    payload = {
        "overview": metrics_service.get_overview_metrics(),
        "ai_impact": metrics_service.get_ai_impact_metrics(),
        "ai_tools": metrics_service.get_ai_tools_metrics(),
        "people": metrics_service.get_people_metrics(limit=500),
        "projects": metrics_service.get_projects_metrics(limit=500),
        "ml_insights": ml_service.run_developer_segmentation(n_clusters=4),
        "pull_requests": metrics_service.get_pull_requests(limit=500),
        "dataset_info": {"meta": data_loader.dataset_meta},
    }
    output_path = BACKEND_DIR / "app" / "data" / "precomputed.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    size_bytes = output_path.stat().st_size
    print(f"SUCCESS: Wrote {output_path} ({size_bytes} bytes / {size_bytes / 1024:.2f} KB)")


if __name__ == "__main__":
    main()