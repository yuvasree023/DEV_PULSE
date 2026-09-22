import gc
import os
import sys
import tracemalloc
from pathlib import Path

import psutil


BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(ROOT_DIR))

from app.services.data_loader import data_loader
from app.services.metrics import metrics_service
from app.services.ml import ml_service


process = psutil.Process(os.getpid())
tracemalloc.start()
peak_rss = process.memory_info().rss


def mark(stage: str) -> None:
    global peak_rss
    rss = process.memory_info().rss
    peak_rss = max(peak_rss, rss)
    current, peak_python = tracemalloc.get_traced_memory()
    print(f"{stage}: rss_mb={rss / 1024 ** 2:.2f} python_peak_mb={peak_python / 1024 ** 2:.2f}")


mark("process_start")
data_loader.load_dataset()
mark("datasets_loaded")
metrics_service.get_overview_metrics()
mark("overview_metrics")
metrics_service.get_ai_impact_metrics()
mark("ai_impact_metrics")
ml_service.run_developer_segmentation(n_clusters=4)
mark("kmeans")
gc.collect()
mark("after_gc")
print(f"PEAK_RSS_MB={peak_rss / 1024 ** 2:.2f}")
print(f"PEAK_TRACEMALLOC_MB={tracemalloc.get_traced_memory()[1] / 1024 ** 2:.2f}")