# DEV_PULSE

AI Impact & Developer Productivity Telemetry Dashboard with Real Data Analytics, Dynamic Dataset ETL, Scikit-Learn K-Means Clustering, and Grounded Google Gemini Explanations.

---

## ⚡ Overview

**DevPulse** is a full-stack telemetry and analytics dashboard designed to measure and visualize the impact of AI developer tools (GitHub Copilot, Cursor, Google Jules, OpenAI Codex, Devin, Claude Code, etc.) against human developer baselines.

- **Dynamic Dataset ETL**: Loads and normalizes JSON and Parquet datasets (`pull_request.json` / `.parquet`, `pr_reviews.json` / `.parquet`, `repository.json` / `.parquet`).
- **Live Metric Recalculation**: Instant dynamic recalculation of cycle times, merge rates, and weekly throughput when evaluators upload new datasets.
- **Explainable ML Engine**: Scikit-Learn K-Means clustering for developer velocity and blocker segmentation.
- **Strictly Grounded LLM Explanations**: Google Gemini integration for synthesized insights grounded exclusively in telemetry data.
- **Interactive UI**: React 19 + TypeScript + Vite + Tailwind CSS dashboard with KPI metrics, Kanban board, repository explorer, radar impact matrix, and in-app API inspector.

---

## 🏗️ Architecture

```
innovation_ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry & router configuration
│   │   ├── config.py                # Environment configuration
│   │   ├── database.py              # SQLAlchemy database pool
│   │   ├── models/                  # SQLAlchemy ORM models (repositories, PRs, reviews)
│   │   ├── schemas/                 # Pydantic v2 schemas
│   │   ├── routers/                 # API routers (/api/overview, /api/ai-impact, /api/upload-dataset, etc.)
│   │   └── services/                # Core business logic
│   │       ├── data_loader.py       # Dual JSON & Parquet loader & schema validator
│   │       ├── metrics.py           # Cycle time, review turnaround, throughput engines
│   │       ├── ml.py                # Scikit-learn K-Means developer clustering
│   │       └── gemini.py            # Grounded Gemini explanation layer
│   ├── requirements.txt
│   └── README.md
├── src/
│   ├── components/                  # React dashboard components
│   │   ├── CrossToolImpactView.tsx  # Executive overview, KPIs, and radar charts
│   │   ├── ManageAdoptionView.tsx   # Team-level AI tool adoption rollout
│   │   ├── EnableUsersView.tsx      # Developer-level productivity metrics
│   │   ├── MaximizeImpactView.tsx   # ROI & ML workflow insights
│   │   ├── RepositoriesView.tsx     # Repository telemetry & language filtering
│   │   ├── KanbanBoard.tsx          # Live pull request lifecycle board
│   │   ├── APIInspector.tsx         # In-app dataset uploader & API tester
│   │   └── AIInsightsModal.tsx      # Grounded AI insights & PR blocker analyzer
│   ├── api.ts                       # Typed frontend API client
│   ├── types.ts                     # TypeScript interfaces
│   └── App.tsx
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Frontend Setup (React + Vite)

```bash
# In the project root directory
npm install

# Start Vite dev server
npm run dev
```
- Dashboard: `http://localhost:3000`

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service and dataset connection check |
| `GET` | `/api/overview` | Executive summary KPIs & weekly throughput |
| `GET` | `/api/ai-impact` | AI vs. Human productivity comparison |
| `GET` | `/api/ai-tools` | Breakdown by AI tool agent (Copilot, Cursor, etc.) |
| `GET` | `/api/people` | Developer velocity and review metrics |
| `GET` | `/api/projects` | Repository metrics joined with pull requests |
| `GET` | `/api/ml-insights` | Scikit-Learn K-Means developer segmentation |
| `GET` | `/api/pull-requests` | Real pull requests feed |
| `POST` | `/api/upload-dataset` | Evaluator dynamic dataset upload & live recalculation |
| `POST` | `/api/reset-dataset` | Reset back to baseline dataset |
| `POST` | `/api/explain` | Grounded Gemini explanation layer |
