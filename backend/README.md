# AI Impact & Developer Productivity Dashboard — Backend & Data Pipeline

Production-ready backend API, high-throughput Parquet ETL pipeline, and Gemini 2.0 Flash integration for tracking AI code assistance impact (GitHub Copilot, Cursor, etc.) versus human developer baselines.

---

## 🏗 Architecture & Tech Stack

- **Framework**: FastAPI (Python 3.11+) with Uvicorn ASGI server
- **Validation**: Pydantic v2 & `pydantic-settings`
- **Database & ORM**: PostgreSQL 16 (via Supabase or Railway) with SQLAlchemy 2.0 & Alembic
- **ETL Engine**: Polars & DuckDB (vectorized Parquet processing, type casting, and batch upsert)
- **AI / LLM**: Google Gemini 2.0 Flash via `google-generativeai` with 1-hour in-memory cache and 10 req/min rate limiting
- **Deployment**: Docker, Railway, and Render configurations included

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI entry, CORS, health checks, routers
│   ├── config.py                # Pydantic-settings configuration (.env)
│   ├── database.py              # SQLAlchemy 2.0 connection pool & SessionLocal
│   ├── models/                  # SQLAlchemy ORM Models
│   │   ├── repository.py        # repositories table
│   │   ├── pull_request.py      # pull_requests table
│   │   └── pr_review.py         # pr_reviews table
│   ├── schemas/                 # Pydantic v2 Request/Response Schemas
│   │   ├── repository.py
│   │   ├── pull_request.py
│   │   ├── pr_review.py
│   │   └── analytics.py
│   ├── routers/                 # API Endpoints (/api/v1/*)
│   │   ├── analytics.py         # KPIs, cycle-time, throughput, AI impact
│   │   ├── tasks.py             # Kanban board, blocked PRs, lifecycle timeline
│   │   ├── ai_insights.py       # Gemini 2.0 Flash trend summaries & blocker review
│   │   ├── pull_requests.py     # Filtered, paginated PR search & details
│   │   └── repositories.py      # Repositories with productivity metrics
│   ├── services/                # Core Business Logic & Algorithms
│   │   ├── productivity.py      # Cycle time, review turnaround, throughput
│   │   ├── ai_impact.py         # AI vs Human benchmark & % gain calculations
│   │   ├── task_manager.py      # PR lifecycle state machine & Kanban grouping
│   │   └── llm_service.py       # Gemini Flash client, caching, rate limiting
│   └── etl/                     # Data Ingestion
│       ├── transform.py         # Polars datetime parsing & schema normalization
│       └── ingest.py            # Idempotent batch upsert into PostgreSQL
├── data/                        # Parquet files directory
│   ├── pull_requests.parquet
│   ├── pr_reviews.parquet
│   └── repositories.parquet
├── alembic/                     # Database migrations
│   └── versions/001_initial_schema.py
├── scripts/
│   └── seed.py                  # Generates 500 realistic PRs for testing
├── Dockerfile                   # Python 3.11-slim container definition
├── railway.json                 # Railway production deployment spec
├── render.yaml                  # Render deployment configuration
├── requirements.txt             # Pinned production dependencies
├── .env.example                 # Environment variables blueprint
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 16 (or Supabase account)

### 2. Setup Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
cp .env.example .env
```
Edit `.env` to configure your PostgreSQL credentials and Gemini API key:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devpulse
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-frontend.vercel.app
ENVIRONMENT=development
```

### 4. Run Migrations
```bash
alembic upgrade head
```

### 5. Ingest Parquet Datasets
Place your three Parquet files in `backend/data/` (`repositories.parquet`, `pull_requests.parquet`, `pr_reviews.parquet`), or generate synthetic data:
```bash
# Optional: generate 500 test records in data/
python -m scripts.seed --count 500

# Ingest Parquet files into PostgreSQL
python -m app.etl.ingest
```

### 6. Run the API Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🌐 Cloud Deployment Guide

### Option A: Railway (Recommended)
1. Log in to [Railway.app](https://railway.app) and create a **New Project**.
2. Select **Provision PostgreSQL** — Railway automatically creates the database and populates the `DATABASE_URL` environment variable.
3. Select **Deploy from GitHub repo** and connect your repository pointing to the `backend/` directory.
4. In Railway Settings -> Variables, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `CORS_ORIGINS`: Comma-separated list of your frontend URLs (e.g. `https://my-frontend.vercel.app`)
   - `ENVIRONMENT`: `production`
5. Railway automatically builds the image using `Dockerfile` and runs `uvicorn app.main:app --host 0.0.0.0 --port $PORT` based on `railway.json`.
6. Run the initial migration and ETL once via Railway CLI or Railway web shell:
   ```bash
   alembic upgrade head
   python -m app.etl.ingest
   ```

### Option B: Supabase + Render
1. Create a free PostgreSQL database on [Supabase.com](https://supabase.com).
2. Under Project Settings -> Database -> Connection String, copy the URI (choose Transaction Pooler or Direct).
3. Connect your repository on [Render.com](https://render.com) using `render.yaml`.
4. Provide `DATABASE_URL` and `GEMINI_API_KEY` in the Render environment settings.

---

## 📡 API Reference Overview

| Router | Method | Path | Description |
|---|---|---|---|
| **Health** | `GET` | `/health` | Service and DB connection check |
| **Analytics** | `GET` | `/api/v1/analytics/kpis` | Executive summary (cycle time, throughput, AI %) |
| **Analytics** | `GET` | `/api/v1/analytics/cycle-time` | Aggregated cycle times by period and agent |
| **Analytics** | `GET` | `/api/v1/analytics/ai-impact` | **Core**: AI vs. Human productivity comparison |
| **Analytics** | `GET` | `/api/v1/analytics/throughput` | Open, merged, and closed PR counts over time |
| **Analytics** | `GET` | `/api/v1/analytics/by-language` | Metrics and AI adoption per language |
| **Analytics** | `GET` | `/api/v1/analytics/by-developer` | Developer breakdown (PR count, AI usage, reviews) |
| **Tasks** | `GET` | `/api/v1/tasks/board` | 4-column Kanban board based on PR lifecycle |
| **Tasks** | `GET` | `/api/v1/tasks/blocked` | PRs open > 7 days or changes requested > 3 days |
| **Tasks** | `GET` | `/api/v1/tasks/{pr_id}/timeline` | Chronological event history for a PR |
| **AI Insights** | `POST` | `/api/v1/ai-insights/summarize-trends`| Gemini 2.0 Flash executive trend summary |
| **AI Insights** | `POST` | `/api/v1/ai-insights/review-blocker` | Gemini 2.0 Flash blocker analysis & suggested action |
| **Pull Requests** | `GET` | `/api/v1/pull-requests` | Filtered, sorted, paginated PR search |
| **Pull Requests** | `GET` | `/api/v1/pull-requests/{pr_id}` | Joined PR details with reviews and repository |
| **Repositories** | `GET` | `/api/v1/repositories` | Repositories with aggregated PR metrics |
