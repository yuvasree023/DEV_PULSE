import json
from functools import lru_cache
from pathlib import Path
from typing import Any


PRECOMPUTED_PATH = Path(__file__).resolve().parents[1] / "data" / "precomputed.json"


@lru_cache(maxsize=1)
def load_precomputed() -> dict[str, Any]:
    if not PRECOMPUTED_PATH.exists():
        raise FileNotFoundError(
            f"Precomputed data is enabled but {PRECOMPUTED_PATH} does not exist. "
            "Run backend/scripts/precompute.py first."
        )
    with PRECOMPUTED_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)