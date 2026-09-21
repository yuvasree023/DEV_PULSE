import os
import sys
import random
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict, Any
import polars as pl

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.pr_review import PRReview

SAMPLE_REPOS = [
    {
        "id": 101,
        "url": "https://github.com/acme-corp/api-gateway",
        "license": "MIT",
        "full_name": "acme-corp/api-gateway",
        "is_forked": False,
        "language": "TypeScript",
        "forks": 142,
        "stars": 1280,
    },
    {
        "id": 102,
        "url": "https://github.com/acme-corp/ml-inference-pipeline",
        "license": "Apache-2.0",
        "full_name": "acme-corp/ml-inference-pipeline",
        "is_forked": False,
        "language": "Python",
        "forks": 89,
        "stars": 950,
    },
    {
        "id": 103,
        "url": "https://github.com/acme-corp/data-lakehouse-engine",
        "license": "Apache-2.0",
        "full_name": "acme-corp/data-lakehouse-engine",
        "is_forked": False,
        "language": "Rust",
        "forks": 210,
        "stars": 3410,
    },
    {
        "id": 104,
        "url": "https://github.com/acme-corp/distributed-event-bus",
        "license": "BSD-3-Clause",
        "full_name": "acme-corp/distributed-event-bus",
        "is_forked": False,
        "language": "Go",
        "forks": 75,
        "stars": 820,
    },
    {
        "id": 105,
        "url": "https://github.com/acme-corp/payment-ledger-service",
        "license": "Proprietary",
        "full_name": "acme-corp/payment-ledger-service",
        "is_forked": False,
        "language": "Java",
        "forks": 34,
        "stars": 410,
    },
]

USERS = [
    (1001, "sarah_chen"),
    (1002, "alex_novak"),
    (1003, "priya_sharma"),
    (1004, "marcus_vance"),
    (1005, "elena_rostova"),
    (1006, "david_kim"),
    (1007, "liam_obrien"),
    (1008, "fatima_almansoori"),
    (1009, "carlos_mendoza"),
    (1010, "anya_petrov"),
]

REVIEWERS = [
    ("tech_lead_rachel", "User"),
    ("architect_ben", "User"),
    ("security_bot", "Bot"),
    ("qa_tester_sam", "User"),
    ("senior_dev_hugo", "User"),
    ("codeql_analyzer", "Bot"),
]

TITLE_TEMPLATES = [
    "feat: implement {topic} in {component}",
    "fix: resolve race condition in {component}",
    "perf: optimize {topic} throughput by 35%",
    "refactor: modularize {component} error handling",
    "chore: upgrade {component} dependencies to latest",
    "feat: add telemetry metrics and traces to {component}",
    "fix: handle nil pointer dereference during {topic}",
    "test: add integration test suite for {component}",
    "feat: support stream processing in {component}",
    "fix: memory leak during high-concurrency {topic}",
]

TOPICS = [
    "JWT auth middleware",
    "PostgreSQL connection pool",
    "Redis caching layer",
    "batch parquet serialization",
    "Gemini embedding generator",
    "deadlock prevention",
    "HTTP/2 multiplexing",
    "distributed lock acquisition",
    "vector indexing",
    "rate limiting pipeline",
]

COMPONENTS = [
    "auth-service",
    "query-router",
    "event-consumer",
    "ingestion-worker",
    "session-manager",
    "metrics-exporter",
    "webhook-dispatcher",
    "cache-coordinator",
]

BLOCKER_COMMENTS = [
    "Missing regression test for edge case when connection times out.",
    "Potential memory leak in loop allocating buffer without reset.",
    "Breaking change in API contract schema without backward compatibility layer.",
    "High security risk: unescaped parameter in query string.",
    "Deadlock risk: acquire lock A then B, reversing standard lock order.",
    "Cycle time regression detected during benchmark run.",
]

APPROVAL_COMMENTS = [
    "LGTM! Clean implementation and test coverage looks solid.",
    "Approved. Excellent performance optimization on the parquet reader.",
    "Looks great. Thanks for addressing all previous review comments.",
    "Approved! Well documented and cleanly separated.",
]


def generate_seed_data(num_prs: int = 500) -> Dict[str, List[Dict[str, Any]]]:
    """Generates realistic synthetic GitHub activity data."""
    random.seed(42)
    now = datetime.now(timezone.utc)
    base_date = now - timedelta(days=90)

    repositories = SAMPLE_REPOS.copy()
    pull_requests = []
    pr_reviews = []

    review_id_counter = 50000

    for pr_id in range(10001, 10001 + num_prs):
        repo = random.choice(repositories)
        user_id, username = random.choice(USERS)

        # Agent distribution: 32% copilot, 28% cursor, 40% human (None)
        agent_rand = random.random()
        if agent_rand < 0.32:
            agent = "copilot"
        elif agent_rand < 0.60:
            agent = "cursor"
        else:
            agent = None

        created_offset_days = random.uniform(0, 88)
        created_at = base_date + timedelta(days=created_offset_days, hours=random.uniform(0, 23))

        # Status distribution: 70% merged, 18% open, 12% closed
        state_rand = random.random()
        if state_rand < 0.70:
            state = "merged"
        elif state_rand < 0.88:
            state = "open"
        else:
            state = "closed"

        # AI PRs have shorter cycle time on average (12 - 36h vs 28 - 72h)
        if agent is not None:
            cycle_hours = random.gauss(mu=18.5, sigma=7.0)
            cycle_hours = max(2.0, min(cycle_hours, 65.0))
        else:
            cycle_hours = random.gauss(mu=42.0, sigma=14.0)
            cycle_hours = max(6.0, min(cycle_hours, 120.0))

        closed_at = None
        merged_at = None
        if state == "merged":
            merged_at = created_at + timedelta(hours=cycle_hours)
            if merged_at > now:
                merged_at = now - timedelta(hours=1)
        elif state == "closed":
            closed_at = created_at + timedelta(hours=cycle_hours * 0.8)
            if closed_at > now:
                closed_at = now - timedelta(hours=2)

        topic = random.choice(TOPICS)
        component = random.choice(COMPONENTS)
        title = random.choice(TITLE_TEMPLATES).format(topic=topic, component=component)
        body = f"This PR addresses {topic} across `{component}`.\n\nKey changes:\n- Optimized performance\n- Added automated unit tests\n- Validated backward compatibility."

        pr_dict = {
            "id": pr_id,
            "number": pr_id - 10000,
            "title": title,
            "body": body,
            "agent": agent,
            "user_id": user_id,
            "user": username,
            "state": state,
            "created_at": created_at.isoformat(),
            "closed_at": closed_at.isoformat() if closed_at else None,
            "merged_at": merged_at.isoformat() if merged_at else None,
            "repo_id": repo["id"],
            "repo_url": repo["url"],
            "html_url": f"{repo['url']}/pull/{pr_id - 10000}",
        }
        pull_requests.append(pr_dict)

        # Generate reviews for this PR
        num_reviews = random.randint(1, 4)
        has_approved = state == "merged"
        current_time = created_at + timedelta(hours=random.uniform(0.5, 4.0))

        for r_idx in range(num_reviews):
            review_id_counter += 1
            reviewer_name, reviewer_type = random.choice(REVIEWERS)

            # Assign review state
            if r_idx == num_reviews - 1 and has_approved:
                review_state = "APPROVED"
                comment_body = random.choice(APPROVAL_COMMENTS)
            else:
                rand_s = random.random()
                if rand_s < 0.35:
                    review_state = "CHANGES_REQUESTED"
                    comment_body = random.choice(BLOCKER_COMMENTS)
                elif rand_s < 0.70:
                    review_state = "COMMENTED"
                    comment_body = f"Could you verify how this affects {random.choice(TOPICS)} under high load?"
                else:
                    review_state = "APPROVED"
                    comment_body = random.choice(APPROVAL_COMMENTS)

            review_dict = {
                "id": review_id_counter,
                "pr_id": pr_id,
                "user": reviewer_name,
                "user_type": reviewer_type,
                "state": review_state,
                "submitted_at": current_time.isoformat(),
                "body": comment_body,
            }
            pr_reviews.append(review_dict)
            current_time += timedelta(hours=random.uniform(2.0, 12.0))
            if current_time > now:
                break

    return {
        "repositories": repositories,
        "pull_requests": pull_requests,
        "pr_reviews": pr_reviews,
    }


def save_to_parquet(data: Dict[str, List[Dict[str, Any]]], output_dir: Path):
    """Saves the generated datasets to Parquet files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    repo_path = output_dir / "repositories.parquet"
    pr_path = output_dir / "pull_requests.parquet"
    reviews_path = output_dir / "pr_reviews.parquet"

    pl.DataFrame(data["repositories"]).write_parquet(repo_path)
    pl.DataFrame(data["pull_requests"]).write_parquet(pr_path)
    pl.DataFrame(data["pr_reviews"]).write_parquet(reviews_path)

    print(f"✓ Saved {len(data['repositories'])} repositories -> {repo_path}")
    print(f"✓ Saved {len(data['pull_requests'])} pull requests -> {pr_path}")
    print(f"✓ Saved {len(data['pr_reviews'])} reviews       -> {reviews_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic GitHub Parquet datasets and seed DB.")
    parser.add_argument("--count", type=int, default=500, help="Number of PRs to generate (default: 500)")
    parser.add_argument("--out-dir", type=str, default="data", help="Output directory for parquet files")
    parser.add_argument("--db", action="store_true", help="Also run ETL ingestion into database")
    args = parser.parse_args()

    target_dir = backend_dir / args.out_dir
    print(f"Generating {args.count} synthetic PR records...")
    data = generate_seed_data(num_prs=args.count)
    save_to_parquet(data, target_dir)

    if args.db:
        print("\nIngesting generated Parquet data into database...")
        from app.etl.ingest import run_ingest
        run_ingest(data_dir=str(target_dir))


if __name__ == "__main__":
    main()
