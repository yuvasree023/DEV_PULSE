import os
import logging
from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger("app.services.data_loader")

# Expected schemas according to requirements
REQUIRED_SCHEMAS = {
    "pull_request": [
        "id", "number", "title", "body", "agent", "user_id", "user",
        "state", "created_at", "closed_at", "merged_at", "repo_id",
        "repo_url", "html_url"
    ],
    "pr_reviews": [
        "id", "pr_id", "user", "user_type", "state", "submitted_at", "body"
    ],
    "repository": [
        "id", "url", "license", "full_name", "is_forked", "language", "forks", "stars"
    ]
}


class DataLoader:
    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            # Default to workspace root or backend data directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(os.path.dirname(current_dir))
            workspace_dir = os.path.dirname(backend_dir)
            self.data_dir = workspace_dir
        else:
            self.data_dir = data_dir

        self.df_prs: Optional[pd.DataFrame] = None
        self.df_reviews: Optional[pd.DataFrame] = None
        self.df_repos: Optional[pd.DataFrame] = None
        self.schema_validation_errors: Dict[str, list] = {}
        self.dataset_meta: Dict[str, Any] = {}

    def _resolve_file(self, base_name: str, explicit_path: Optional[str] = None) -> str:
        """Find the dataset file in data_dir in .json.gz, .json, or .parquet format."""
        if explicit_path and os.path.exists(explicit_path):
            return explicit_path

        # Candidate paths prioritized by compression and availability
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(os.path.dirname(current_dir))
        candidates = [
            os.path.join(self.data_dir, "backend", "data", f"{base_name}.json.gz"),
            os.path.join(self.data_dir, "backend", "data", f"{base_name}.json"),
            os.path.join(backend_dir, "data", f"{base_name}.json.gz"),
            os.path.join(backend_dir, "data", f"{base_name}.json"),
            os.path.join(self.data_dir, f"{base_name}.json.gz"),
            os.path.join(self.data_dir, f"{base_name}.json"),
            os.path.join(self.data_dir, f"{base_name}.parquet"),
            os.path.join(self.data_dir, "backend", "data", f"{base_name}.parquet"),
            os.path.join(backend_dir, "data", f"{base_name}.parquet"),
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return os.path.join(self.data_dir, f"{base_name}.json")

    def _read_file(self, filepath: str) -> pd.DataFrame:
        """Read a dataset from JSON, Gzipped JSON, or Parquet."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Dataset file not found at {filepath}")
        
        if filepath.endswith(".json") or filepath.endswith(".json.gz"):
            return pd.read_json(filepath)
        elif filepath.endswith(".parquet"):
            try:
                return pd.read_parquet(filepath)
            except (ImportError, ModuleNotFoundError) as exc:
                logger.error("Parquet engine (pyarrow) not installed in runtime.")
                raise RuntimeError(
                    "Parquet processing is disabled on the serverless deployment to optimize bundle size. "
                    "Please upload dataset files in .json format."
                ) from exc
        else:
            # Try json first, then parquet
            try:
                return pd.read_json(filepath)
            except Exception:
                try:
                    return pd.read_parquet(filepath)
                except (ImportError, ModuleNotFoundError) as exc:
                    raise RuntimeError("Parquet support requires pyarrow. Please use JSON datasets.") from exc

    def validate_schema(self, df: pd.DataFrame, schema_name: str) -> Tuple[bool, list]:
        """Validate that the dataframe contains all required columns."""
        expected = REQUIRED_SCHEMAS.get(schema_name, [])
        missing = [col for col in expected if col not in df.columns]
        if missing:
            return False, missing
        return True, []

    def load_dataset(
        self,
        pr_path: Optional[str] = None,
        reviews_path: Optional[str] = None,
        repo_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dynamically load and clean the JSON/Parquet datasets."""
        pr_file = self._resolve_file("pull_request", pr_path)
        reviews_file = self._resolve_file("pr_reviews", reviews_path)
        repo_file = self._resolve_file("repository", repo_path)

        self.schema_validation_errors = {}

        # 1. Load Pull Requests
        df_prs_raw = self._read_file(pr_file)
        valid_pr, missing_pr = self.validate_schema(df_prs_raw, "pull_request")
        if not valid_pr:
            self.schema_validation_errors["pull_request"] = missing_pr
            raise ValueError(f"{os.path.basename(pr_file)} is missing required columns: {missing_pr}")

        # 2. Load PR Reviews
        df_reviews_raw = self._read_file(reviews_file)
        valid_rev, missing_rev = self.validate_schema(df_reviews_raw, "pr_reviews")
        if not valid_rev:
            self.schema_validation_errors["pr_reviews"] = missing_rev
            raise ValueError(f"{os.path.basename(reviews_file)} is missing required columns: {missing_rev}")

        # 3. Load Repositories
        df_repos_raw = self._read_file(repo_file)
        valid_repo, missing_repo = self.validate_schema(df_repos_raw, "repository")
        if not valid_repo:
            self.schema_validation_errors["repository"] = missing_repo
            raise ValueError(f"{os.path.basename(repo_file)} is missing required columns: {missing_repo}")

        # --- Data Cleaning & Preparation ---
        
        # Deduplication on primary keys
        df_prs = df_prs_raw.drop_duplicates(subset=["id"]).copy()
        df_reviews = df_reviews_raw.drop_duplicates(subset=["id"]).copy()
        df_repos = df_repos_raw.drop_duplicates(subset=["id"]).copy()

        # Clean string/null fields
        df_prs["title"] = df_prs["title"].fillna("Untitled PR").astype(str)
        df_prs["body"] = df_prs["body"].fillna("").astype(str)
        df_prs["user"] = df_prs["user"].fillna("unknown_user").astype(str)
        df_prs["user_id"] = pd.to_numeric(df_prs["user_id"], errors="coerce").fillna(0).astype(int)
        df_prs["repo_id"] = pd.to_numeric(df_prs["repo_id"], errors="coerce").fillna(0).astype(int)
        df_prs["state"] = df_prs["state"].fillna("closed").astype(str).str.lower()

        # Handle agent column: None, NaN, empty string, or lowercase string
        df_prs["agent"] = df_prs["agent"].fillna("").astype(str).str.strip()
        # Normalise empty-like strings
        df_prs.loc[df_prs["agent"].str.lower().isin(["none", "nan", "null", ""]), "agent"] = ""
        # is_ai_assisted: non-empty agent
        df_prs["is_ai_assisted"] = df_prs["agent"].str.len() > 0

        # Parse Timestamps safely
        df_prs["created_dt"] = pd.to_datetime(df_prs["created_at"], errors="coerce", utc=True)
        df_prs["closed_dt"] = pd.to_datetime(df_prs["closed_at"], errors="coerce", utc=True)
        df_prs["merged_dt"] = pd.to_datetime(df_prs["merged_at"], errors="coerce", utc=True)

        # Compute Cycle Time (hours) = merged_at - created_at for merged PRs
        # Only valid where merged_dt >= created_dt
        df_prs["is_merged"] = df_prs["merged_dt"].notnull()
        df_prs["cycle_time_hours"] = np.nan
        merged_mask = df_prs["is_merged"] & (df_prs["merged_dt"] >= df_prs["created_dt"])
        df_prs.loc[merged_mask, "cycle_time_hours"] = (
            (df_prs.loc[merged_mask, "merged_dt"] - df_prs.loc[merged_mask, "created_dt"]).dt.total_seconds() / 3600.0
        )

        # Reviews Data Cleaning
        df_reviews["user"] = df_reviews["user"].fillna("anonymous").astype(str)
        df_reviews["pr_id"] = pd.to_numeric(df_reviews["pr_id"], errors="coerce").fillna(0).astype(int)
        df_reviews["state"] = df_reviews["state"].fillna("COMMENTED").astype(str)
        df_reviews["submitted_dt"] = pd.to_datetime(df_reviews["submitted_at"], errors="coerce", utc=True)

        # Compute First Review Time per PR:
        # First review submitted_at - PR created_at
        # Merge first review submitted_dt onto PRs
        valid_reviews = df_reviews.dropna(subset=["submitted_dt"]).sort_values("submitted_dt")
        first_reviews = valid_reviews.groupby("pr_id").agg(
            first_review_dt=("submitted_dt", "first"),
            review_count=("id", "count"),
            latest_review_state=("state", "last")
        ).reset_index()

        df_prs = df_prs.merge(first_reviews, left_on="id", right_on="pr_id", how="left")
        if "pr_id" in df_prs.columns:
            df_prs = df_prs.drop(columns=["pr_id"])

        df_prs["review_count"] = df_prs["review_count"].fillna(0).astype(int)
        df_prs["review_time_hours"] = np.nan
        has_review_mask = df_prs["first_review_dt"].notnull() & (df_prs["first_review_dt"] >= df_prs["created_dt"])
        df_prs.loc[has_review_mask, "review_time_hours"] = (
            (df_prs.loc[has_review_mask, "first_review_dt"] - df_prs.loc[has_review_mask, "created_dt"]).dt.total_seconds() / 3600.0
        )

        # Repositories Data Cleaning
        df_repos["full_name"] = df_repos["full_name"].fillna("Unknown Repo").astype(str)
        df_repos["language"] = df_repos["language"].fillna("Unknown").astype(str)
        df_repos["stars"] = pd.to_numeric(df_repos["stars"], errors="coerce").fillna(0).astype(int)
        df_repos["forks"] = pd.to_numeric(df_repos["forks"], errors="coerce").fillna(0).astype(int)
        df_repos["license"] = df_repos["license"].fillna("None").astype(str)

        self.df_prs = df_prs
        self.df_reviews = df_reviews
        self.df_repos = df_repos

        self.dataset_meta = {
            "total_prs": int(len(df_prs)),
            "total_reviews": int(len(df_reviews)),
            "total_repos": int(len(df_repos)),
            "pr_columns": list(df_prs_raw.columns),
            "review_columns": list(df_reviews_raw.columns),
            "repo_columns": list(df_repos_raw.columns),
            "pr_file": os.path.basename(pr_file),
            "reviews_file": os.path.basename(reviews_file),
            "repo_file": os.path.basename(repo_file),
        }

        logger.info(
            f"Successfully loaded {len(df_prs)} PRs, {len(df_reviews)} reviews, {len(df_repos)} repos."
        )
        return self.dataset_meta

    def get_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Return the cleaned dataframes. Loads if not already cached."""
        if self.df_prs is None or self.df_reviews is None or self.df_repos is None:
            try:
                self.load_dataset()
            except Exception as exc:
                logger.warning(f"Could not load dataset into memory: {exc}")
                if self.df_prs is None:
                    self.df_prs = pd.DataFrame(columns=[
                        "id", "number", "title", "body", "agent", "user_id", "user",
                        "state", "created_at", "closed_at", "merged_at", "repo_id",
                        "repo_url", "html_url", "is_ai_assisted", "is_merged",
                        "cycle_time_hours", "review_count", "review_time_hours"
                    ])
                if self.df_reviews is None:
                    self.df_reviews = pd.DataFrame(columns=REQUIRED_SCHEMAS["pr_reviews"])
                if self.df_repos is None:
                    self.df_repos = pd.DataFrame(columns=REQUIRED_SCHEMAS["repository"])
        return self.df_prs, self.df_reviews, self.df_repos


# Global singleton instance
data_loader = DataLoader()
