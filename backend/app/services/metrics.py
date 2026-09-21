import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
try:
    from app.services.data_loader import data_loader
except ImportError:
    from backend.app.services.data_loader import data_loader

logger = logging.getLogger("app.services.metrics")


class MetricsService:
    def __init__(self):
        pass

    def get_overview_metrics(self) -> Dict[str, Any]:
        """Compute top-level summary metrics across the entire dataset."""
        df_prs, df_reviews, df_repos = data_loader.get_data()

        total_prs = len(df_prs)
        if total_prs == 0:
            return {
                "total_prs": 0,
                "merged_prs": 0,
                "merge_rate": 0.0,
                "ai_assisted_prs": 0,
                "ai_assisted_pct": 0.0,
                "non_ai_prs": 0,
                "non_ai_pct": 0.0,
                "avg_cycle_time_hours": 0.0,
                "median_cycle_time_hours": 0.0,
                "ai_avg_cycle_time_hours": 0.0,
                "non_ai_avg_cycle_time_hours": 0.0,
                "avg_review_time_hours": 0.0,
                "total_reviews": 0,
                "total_repos": 0,
                "total_developers": 0,
                "weekly_throughput": [],
                "disclaimer": "Observed association — not causal evidence"
            }

        merged_prs = int(df_prs["is_merged"].sum())
        merge_rate = round((merged_prs / total_prs) * 100, 2)

        ai_prs_mask = df_prs["is_ai_assisted"]
        ai_assisted_prs = int(ai_prs_mask.sum())
        ai_assisted_pct = round((ai_assisted_prs / total_prs) * 100, 2)
        non_ai_prs = total_prs - ai_assisted_prs
        non_ai_pct = round(100.0 - ai_assisted_pct, 2)

        # Cycle time (merged PRs)
        cycle_times = df_prs.loc[df_prs["is_merged"], "cycle_time_hours"].dropna()
        avg_cycle_time = round(float(cycle_times.mean()), 2) if not cycle_times.empty else 0.0
        median_cycle_time = round(float(cycle_times.median()), 2) if not cycle_times.empty else 0.0

        ai_cycle_times = df_prs.loc[df_prs["is_merged"] & ai_prs_mask, "cycle_time_hours"].dropna()
        ai_avg_cycle = round(float(ai_cycle_times.mean()), 2) if not ai_cycle_times.empty else 0.0
        ai_median_cycle = round(float(ai_cycle_times.median()), 2) if not ai_cycle_times.empty else 0.0

        non_ai_cycle_times = df_prs.loc[df_prs["is_merged"] & (~ai_prs_mask), "cycle_time_hours"].dropna()
        non_ai_avg_cycle = round(float(non_ai_cycle_times.mean()), 2) if not non_ai_cycle_times.empty else 0.0
        non_ai_median_cycle = round(float(non_ai_cycle_times.median()), 2) if not non_ai_cycle_times.empty else 0.0

        # Review time
        review_times = df_prs["review_time_hours"].dropna()
        avg_review_time = round(float(review_times.mean()), 2) if not review_times.empty else 0.0
        median_review_time = round(float(review_times.median()), 2) if not review_times.empty else 0.0

        ai_review_times = df_prs.loc[ai_prs_mask, "review_time_hours"].dropna()
        ai_avg_review = round(float(ai_review_times.mean()), 2) if not ai_review_times.empty else 0.0

        non_ai_review_times = df_prs.loc[~ai_prs_mask, "review_time_hours"].dropna()
        non_ai_avg_review = round(float(non_ai_review_times.mean()), 2) if not non_ai_review_times.empty else 0.0

        # Unique counts
        total_devs = int(df_prs["user"].nunique())
        total_repos = int(df_repos["id"].nunique())
        total_reviews = len(df_reviews)

        # Weekly throughput timeline
        throughput_series = []
        valid_created = df_prs.dropna(subset=["created_dt"]).copy()
        if not valid_created.empty:
            # Convert to tz-naive for to_period
            dt_series = valid_created["created_dt"].dt.tz_convert(None) if valid_created["created_dt"].dt.tz is not None else valid_created["created_dt"]
            valid_created["week"] = dt_series.dt.to_period("W").astype(str)
            weekly_grouped = valid_created.groupby("week").agg(
                total_prs=("id", "count"),
                merged_prs=("is_merged", "sum"),
                ai_prs=("is_ai_assisted", "sum")
            ).reset_index().sort_values("week")

            # Take last 16 weeks or all if fewer
            recent_weeks = weekly_grouped.tail(24)
            for _, row in recent_weeks.iterrows():
                throughput_series.append({
                    "period": row["week"],
                    "total_prs": int(row["total_prs"]),
                    "merged_prs": int(row["merged_prs"]),
                    "ai_prs": int(row["ai_prs"]),
                    "non_ai_prs": int(row["total_prs"] - row["ai_prs"]),
                })

        return {
            "total_prs": total_prs,
            "merged_prs": merged_prs,
            "merge_rate": merge_rate,
            "ai_assisted_prs": ai_assisted_prs,
            "ai_assisted_pct": ai_assisted_pct,
            "non_ai_prs": non_ai_prs,
            "non_ai_pct": non_ai_pct,
            "avg_cycle_time_hours": avg_cycle_time,
            "median_cycle_time_hours": median_cycle_time,
            "ai_avg_cycle_time_hours": ai_avg_cycle,
            "ai_median_cycle_time_hours": ai_median_cycle,
            "non_ai_avg_cycle_time_hours": non_ai_avg_cycle,
            "non_ai_median_cycle_time_hours": non_ai_median_cycle,
            "avg_review_time_hours": avg_review_time,
            "median_review_time_hours": median_review_time,
            "ai_avg_review_time_hours": ai_avg_review,
            "non_ai_avg_review_time_hours": non_ai_avg_review,
            "total_reviews": total_reviews,
            "total_repos": total_repos,
            "total_developers": total_devs,
            "weekly_throughput": throughput_series,
            "disclaimer": "Observed association — not causal evidence"
        }

    def get_ai_impact_metrics(self) -> Dict[str, Any]:
        """Compute detailed AI vs Non-AI comparison."""
        overview = self.get_overview_metrics()
        df_prs, _, _ = data_loader.get_data()

        # Monthly / Weekly trends for AI vs Non-AI
        trend_data = []
        valid_created = df_prs.dropna(subset=["created_dt"]).copy()
        if not valid_created.empty:
            dt_series = valid_created["created_dt"].dt.tz_convert(None) if valid_created["created_dt"].dt.tz is not None else valid_created["created_dt"]
            valid_created["period"] = dt_series.dt.to_period("M").astype(str)
            monthly = valid_created.groupby("period").agg(
                total_prs=("id", "count"),
                ai_prs=("is_ai_assisted", "sum"),
                merged_prs=("is_merged", "sum"),
                avg_cycle=("cycle_time_hours", "mean")
            ).reset_index().sort_values("period")

            for _, r in monthly.iterrows():
                tot = int(r["total_prs"])
                ai_c = int(r["ai_prs"])
                trend_data.append({
                    "period": r["period"],
                    "total_prs": tot,
                    "ai_prs": ai_c,
                    "non_ai_prs": tot - ai_c,
                    "ai_percentage": round((ai_c / tot) * 100, 2) if tot > 0 else 0.0,
                    "avg_cycle_time_hours": round(float(r["avg_cycle"]), 2) if pd.notnull(r["avg_cycle"]) else None
                })

        # Calculate merge rate for AI vs Non-AI
        ai_mask = df_prs["is_ai_assisted"]
        ai_total = int(ai_mask.sum())
        ai_merged = int(df_prs.loc[ai_mask, "is_merged"].sum())
        ai_merge_rate = round((ai_merged / ai_total) * 100, 2) if ai_total > 0 else 0.0

        non_ai_total = len(df_prs) - ai_total
        non_ai_merged = int(df_prs.loc[~ai_mask, "is_merged"].sum())
        non_ai_merge_rate = round((non_ai_merged / non_ai_total) * 100, 2) if non_ai_total > 0 else 0.0

        return {
            "comparison_title": "Observed comparison: AI-assisted vs non-AI PRs",
            "disclaimer": "Observed association — not causal evidence",
            "summary": {
                "ai_prs": ai_total,
                "ai_percentage": overview["ai_assisted_pct"],
                "non_ai_prs": non_ai_total,
                "non_ai_percentage": overview["non_ai_pct"],
                "ai_merge_rate": ai_merge_rate,
                "non_ai_merge_rate": non_ai_merge_rate,
                "ai_avg_cycle_time_hours": overview["ai_avg_cycle_time_hours"],
                "non_ai_avg_cycle_time_hours": overview["non_ai_avg_cycle_time_hours"],
                "ai_median_cycle_time_hours": overview["ai_median_cycle_time_hours"],
                "non_ai_median_cycle_time_hours": overview["non_ai_median_cycle_time_hours"],
                "ai_avg_review_time_hours": overview["ai_avg_review_time_hours"],
                "non_ai_avg_review_time_hours": overview["non_ai_avg_review_time_hours"],
            },
            "trend": trend_data,
        }

    def get_ai_tools_metrics(self) -> Dict[str, Any]:
        """Compute real metrics per AI tool (`agent`)."""
        df_prs, _, _ = data_loader.get_data()
        total_prs = len(df_prs)

        # Filter to rows with non-empty agent (or include Non-AI as a baseline)
        tools_list = []
        
        # Group by agent
        grouped = df_prs.groupby("agent", dropna=False)

        for agent_name, group in grouped:
            name_str = str(agent_name).strip() if pd.notnull(agent_name) and str(agent_name).strip() != "" else "Non-AI"
            count = len(group)
            merged_count = int(group["is_merged"].sum())
            merge_rate = round((merged_count / count) * 100, 2) if count > 0 else 0.0
            
            cycle_times = group.loc[group["is_merged"], "cycle_time_hours"].dropna()
            avg_cycle = round(float(cycle_times.mean()), 2) if not cycle_times.empty else None
            median_cycle = round(float(cycle_times.median()), 2) if not cycle_times.empty else None

            review_times = group["review_time_hours"].dropna()
            avg_review = round(float(review_times.mean()), 2) if not review_times.empty else None

            pr_pct = round((count / total_prs) * 100, 2) if total_prs > 0 else 0.0

            tools_list.append({
                "agent": name_str,
                "pr_count": count,
                "pr_percentage": pr_pct,
                "merged_count": merged_count,
                "merge_rate": merge_rate,
                "avg_cycle_time_hours": avg_cycle,
                "median_cycle_time_hours": median_cycle,
                "avg_review_time_hours": avg_review,
                "is_ai": name_str != "Non-AI"
            })

        # Sort descending by PR count
        tools_list.sort(key=lambda x: x["pr_count"], reverse=True)

        return {
            "total_prs": total_prs,
            "tools": tools_list,
            "disclaimer": "Metrics represent observed dataset records per agent value without ranking or judgment."
        }

    def get_people_metrics(self, limit: int = 100) -> Dict[str, Any]:
        """Compute metrics per developer (`user`)."""
        df_prs, _, _ = data_loader.get_data()

        dev_grouped = df_prs.groupby("user").agg(
            total_prs=("id", "count"),
            merged_prs=("is_merged", "sum"),
            ai_prs=("is_ai_assisted", "sum"),
            avg_cycle_time=("cycle_time_hours", "mean"),
            review_count=("review_count", "sum"),
            avg_review_time=("review_time_hours", "mean")
        ).reset_index()

        dev_grouped["merge_rate"] = np.where(
            dev_grouped["total_prs"] > 0,
            np.round((dev_grouped["merged_prs"] / dev_grouped["total_prs"]) * 100, 2),
            0.0
        )
        dev_grouped["ai_assisted_pct"] = np.where(
            dev_grouped["total_prs"] > 0,
            np.round((dev_grouped["ai_prs"] / dev_grouped["total_prs"]) * 100, 2),
            0.0
        )
        dev_grouped["avg_cycle_time_hours"] = dev_grouped["avg_cycle_time"].round(2)
        dev_grouped["avg_review_time_hours"] = dev_grouped["avg_review_time"].round(2)

        # Sort by total PRs descending
        dev_grouped = dev_grouped.sort_values("total_prs", ascending=False)
        
        top_devs = dev_grouped.head(limit)

        developers = []
        for _, row in top_devs.iterrows():
            developers.append({
                "user": str(row["user"]),
                "pr_count": int(row["total_prs"]),
                "merged_prs": int(row["merged_prs"]),
                "merge_rate": float(row["merge_rate"]),
                "ai_assisted_pct": float(row["ai_assisted_pct"]),
                "avg_cycle_time_hours": float(row["avg_cycle_time_hours"]) if pd.notnull(row["avg_cycle_time_hours"]) else None,
                "review_count": int(row["review_count"]),
                "avg_review_time_hours": float(row["avg_review_time_hours"]) if pd.notnull(row["avg_review_time_hours"]) else None,
            })

        return {
            "total_developers": int(len(dev_grouped)),
            "developers": developers,
            "disclaimer": "Neutral developer statistics aggregated directly from PR activity."
        }

    def get_projects_metrics(self, limit: int = 100) -> Dict[str, Any]:
        """Compute metrics per repository by joining pull_request.repo_id -> repository.id."""
        df_prs, _, df_repos = data_loader.get_data()

        # Group PRs by repo_id
        pr_by_repo = df_prs.groupby("repo_id").agg(
            pr_count=("id", "count"),
            merged_prs=("is_merged", "sum"),
            ai_prs=("is_ai_assisted", "sum"),
            avg_cycle_time=("cycle_time_hours", "mean")
        ).reset_index()

        pr_by_repo["merge_rate"] = np.where(
            pr_by_repo["pr_count"] > 0,
            np.round((pr_by_repo["merged_prs"] / pr_by_repo["pr_count"]) * 100, 2),
            0.0
        )
        pr_by_repo["ai_assisted_pct"] = np.where(
            pr_by_repo["pr_count"] > 0,
            np.round((pr_by_repo["ai_prs"] / pr_by_repo["pr_count"]) * 100, 2),
            0.0
        )
        pr_by_repo["avg_cycle_time_hours"] = pr_by_repo["avg_cycle_time"].round(2)

        # Merge with repository info
        merged_repos = df_repos.merge(pr_by_repo, left_on="id", right_on="repo_id", how="left")
        merged_repos["pr_count"] = merged_repos["pr_count"].fillna(0).astype(int)
        merged_repos["merge_rate"] = merged_repos["merge_rate"].fillna(0.0)
        merged_repos["ai_assisted_pct"] = merged_repos["ai_assisted_pct"].fillna(0.0)

        # Sort by pr_count descending, then stars
        merged_repos = merged_repos.sort_values(by=["pr_count", "stars"], ascending=[False, False])
        
        top_repos = merged_repos.head(limit)

        projects = []
        for _, row in top_repos.iterrows():
            projects.append({
                "id": int(row["id"]),
                "repository": str(row["full_name"]),
                "url": str(row["url"]),
                "language": str(row["language"]),
                "pr_count": int(row["pr_count"]),
                "merge_rate": float(row["merge_rate"]),
                "avg_cycle_time_hours": float(row["avg_cycle_time_hours"]) if pd.notnull(row["avg_cycle_time_hours"]) else None,
                "ai_assisted_pct": float(row["ai_assisted_pct"]),
                "stars": int(row["stars"]),
                "forks": int(row["forks"]),
                "is_forked": bool(row["is_forked"]),
                "license": str(row["license"]) if pd.notnull(row["license"]) else None
            })

        # Language distribution summary
        lang_dist = merged_repos.groupby("language").agg(
            repo_count=("id", "count"),
            pr_count=("pr_count", "sum"),
            ai_prs=("ai_prs", "sum")
        ).reset_index().sort_values("pr_count", ascending=False).head(10)

        languages = []
        for _, row in lang_dist.iterrows():
            tot_p = int(row["pr_count"])
            ai_p = int(row["ai_prs"])
            languages.append({
                "language": str(row["language"]),
                "repo_count": int(row["repo_count"]),
                "pr_count": tot_p,
                "ai_assisted_pct": round((ai_p / tot_p) * 100, 2) if tot_p > 0 else 0.0
            })

        return {
            "total_repositories": int(len(df_repos)),
            "projects": projects,
            "languages": languages,
            "disclaimer": "Repository metrics grounded in repository and pull request datasets."
        }

    def get_pull_requests(self, limit: int = 100, state: Optional[str] = None) -> Dict[str, Any]:
        """Return real pull requests directly from the parquet dataset."""
        df_prs, _, _ = data_loader.get_data()
        prs_sub = df_prs
        if state:
            prs_sub = prs_sub[prs_sub["state"] == state.lower()]

        # Sort by created_dt descending
        prs_sub = prs_sub.sort_values(by="created_dt", ascending=False).head(limit)

        prs = []
        for _, row in prs_sub.iterrows():
            prs.append({
                "id": int(row["id"]),
                "number": int(row["number"]),
                "title": str(row["title"]),
                "body": str(row["body"]) if pd.notnull(row["body"]) else None,
                "agent": str(row["agent"]) if (pd.notnull(row["agent"]) and row["agent"]) else None,
                "user_id": int(row["user_id"]),
                "user": str(row["user"]),
                "state": str(row["state"]),
                "created_at": str(row["created_at"]),
                "closed_at": str(row["closed_at"]) if pd.notnull(row["closed_at"]) else None,
                "merged_at": str(row["merged_at"]) if pd.notnull(row["merged_at"]) else None,
                "repo_id": int(row["repo_id"]),
                "repo_url": str(row["repo_url"]),
                "html_url": str(row["html_url"]),
                "cycle_time_hours": float(row["cycle_time_hours"]) if pd.notnull(row["cycle_time_hours"]) else None,
                "review_time_hours": float(row["review_time_hours"]) if pd.notnull(row["review_time_hours"]) else None,
                "is_ai_assisted": bool(row["is_ai_assisted"]),
                "latest_review_state": str(row["latest_review_state"]) if "latest_review_state" in row and pd.notnull(row["latest_review_state"]) else None
            })
        return {"pull_requests": prs, "total": len(prs)}


metrics_service = MetricsService()
