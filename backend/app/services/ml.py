import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
try:
    from app.services.data_loader import data_loader
except ImportError:
    from backend.app.services.data_loader import data_loader

logger = logging.getLogger("app.services.ml")


class MLInsightsService:
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def clear_cache(self):
        """Clear cached ML clustering results."""
        self._cache.clear()
        logger.info("MLInsightsService cache cleared.")

    def run_developer_segmentation(self, n_clusters: int = 4) -> Dict[str, Any]:
        """
        Run explainable K-Means clustering on developer workflow profiles.
        Features used:
        - PR count
        - AI-assisted %
        - average cycle time (hours)
        - merge rate (%)
        - review count
        """
        cache_key = f"segmentation_{n_clusters}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        df_prs, _, _ = data_loader.get_data()
        
        if df_prs is None or len(df_prs) == 0:
            return {
                "clusters": [],
                "feature_names": [],
                "total_profiles": 0,
                "disclaimer": "Insufficient data to perform ML segmentation."
            }

        # Aggregate metrics per developer
        dev_stats = df_prs.groupby("user").agg(
            pr_count=("id", "count"),
            merged_prs=("is_merged", "sum"),
            ai_prs=("is_ai_assisted", "sum"),
            avg_cycle_time=("cycle_time_hours", "mean"),
            review_count=("review_count", "sum")
        ).reset_index()

        if len(dev_stats) < n_clusters:
            n_clusters = max(1, len(dev_stats))

        # Calculate percentages
        dev_stats["merge_rate"] = np.where(
            dev_stats["pr_count"] > 0,
            (dev_stats["merged_prs"] / dev_stats["pr_count"]) * 100.0,
            0.0
        )
        dev_stats["ai_assisted_pct"] = np.where(
            dev_stats["pr_count"] > 0,
            (dev_stats["ai_prs"] / dev_stats["pr_count"]) * 100.0,
            0.0
        )
        
        # Fill missing cycle times with median or 0
        median_cycle = float(dev_stats["avg_cycle_time"].dropna().median()) if not dev_stats["avg_cycle_time"].dropna().empty else 0.0
        dev_stats["avg_cycle_time_hours"] = dev_stats["avg_cycle_time"].fillna(median_cycle)

        feature_cols = [
            "pr_count",
            "ai_assisted_pct",
            "avg_cycle_time_hours",
            "merge_rate",
            "review_count"
        ]

        X = dev_stats[feature_cols].values

        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Run K-Means
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        dev_stats["cluster"] = labels

        # Optional 2D PCA for visual representation on the frontend
        pca = PCA(n_components=2, random_state=42)
        X_pca = pca.fit_transform(X_scaled)
        dev_stats["pca_x"] = np.round(X_pca[:, 0], 3)
        dev_stats["pca_y"] = np.round(X_pca[:, 1], 3)

        # Analyze clusters and compute neutral centroids & descriptive labels
        clusters_summary = []
        cluster_palette = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"]

        for c_id in range(n_clusters):
            c_devs = dev_stats[dev_stats["cluster"] == c_id]
            size = len(c_devs)
            size_pct = round((size / len(dev_stats)) * 100, 1)

            mean_pr_count = round(float(c_devs["pr_count"].mean()), 1)
            mean_ai_pct = round(float(c_devs["ai_assisted_pct"].mean()), 1)
            mean_cycle = round(float(c_devs["avg_cycle_time_hours"].mean()), 1)
            mean_merge = round(float(c_devs["merge_rate"].mean()), 1)
            mean_reviews = round(float(c_devs["review_count"].mean()), 1)

            # Generate descriptive, neutral label based on objective centroid characteristics
            characteristics = []
            if mean_pr_count > dev_stats["pr_count"].mean():
                characteristics.append("High PR Volume")
            else:
                characteristics.append("Standard Volume")

            if mean_cycle < dev_stats["avg_cycle_time_hours"].mean():
                characteristics.append("Shorter Cycle Times")
            else:
                characteristics.append("Extended Cycle Times")

            if mean_ai_pct > 80:
                characteristics.append("High AI Assistance")
            elif mean_ai_pct > 30:
                characteristics.append("Moderate AI Assistance")
            else:
                characteristics.append("Low/No AI Assistance")

            label_name = f"Segment {chr(65 + c_id)}: {' • '.join(characteristics[:2])}"

            # Representative sample profiles
            sample_profiles = []
            for _, dev_row in c_devs.head(5).iterrows():
                sample_profiles.append({
                    "user": str(dev_row["user"]),
                    "pr_count": int(dev_row["pr_count"]),
                    "ai_assisted_pct": round(float(dev_row["ai_assisted_pct"]), 1),
                    "avg_cycle_time_hours": round(float(dev_row["avg_cycle_time_hours"]), 1),
                    "merge_rate": round(float(dev_row["merge_rate"]), 1),
                    "review_count": int(dev_row["review_count"]),
                    "pca_x": float(dev_row["pca_x"]),
                    "pca_y": float(dev_row["pca_y"]),
                })

            clusters_summary.append({
                "cluster_id": c_id,
                "name": label_name,
                "color": cluster_palette[c_id % len(cluster_palette)],
                "developer_count": size,
                "percentage_of_total": size_pct,
                "centroids": {
                    "avg_pr_count": mean_pr_count,
                    "avg_ai_assisted_pct": mean_ai_pct,
                    "avg_cycle_time_hours": mean_cycle,
                    "avg_merge_rate_pct": mean_merge,
                    "avg_review_count": mean_reviews,
                },
                "samples": sample_profiles
            })

        # Feature variance explained by PCA
        explained_var = [round(float(v) * 100, 1) for v in pca.explained_variance_ratio_]

        res = {
            "model": "K-Means Clustering (scikit-learn)",
            "total_developers": int(len(dev_stats)),
            "n_clusters": n_clusters,
            "feature_names": [
                "PR count",
                "AI-assisted %",
                "Average cycle time (hours)",
                "Merge rate (%)",
                "Review count"
            ],
            "pca_variance_explained": explained_var,
            "clusters": clusters_summary,
            "disclaimer": "Unsupervised segmentation groups developers by statistical workflow patterns without ranking or value judgments."
        }
        self._cache[cache_key] = res
        return res


ml_service = MLInsightsService()
