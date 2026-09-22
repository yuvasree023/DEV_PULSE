import os
import sys
import asyncio
import tracemalloc
from pathlib import Path

# Force USE_PRECOMPUTED=true
os.environ["USE_PRECOMPUTED"] = "true"

import psutil

process = psutil.Process(os.getpid())
tracemalloc.start()
peak_rss = process.memory_info().rss


def mark(stage: str) -> None:
    global peak_rss
    rss = process.memory_info().rss
    peak_rss = max(peak_rss, rss)
    current, peak_python = tracemalloc.get_traced_memory()
    print(f"{stage}: rss_mb={rss / (1024 ** 2):.2f} python_peak_mb={peak_python / (1024 ** 2):.2f}")


mark("process_start")

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(ROOT_DIR))

# Import application
mark("before_app_import")
from app.main import app, lifespan
mark("after_app_import")

# Execute lifespan startup
async def run_startup():
    mark("before_lifespan_startup")
    async with lifespan(app):
        mark("application_startup_complete")

asyncio.run(run_startup())
mark("after_startup")

peak_rss_mb = peak_rss / (1024 ** 2)
peak_tracemalloc_mb = tracemalloc.get_traced_memory()[1] / (1024 ** 2)

print("\n" + "=" * 40)
print(f"FINAL PEAK RSS: {peak_rss_mb:.2f} MB")
print(f"FINAL PEAK PYTHON TRACEMALLOC: {peak_tracemalloc_mb:.2f} MB")
print("=" * 40)
