import { useState } from 'react';
import { Database, Server, CheckCircle2, Copy, Check } from 'lucide-react';

export function APIInspector() {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'etl' | 'deployment'>('endpoints');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/analytics/kpis',
      desc: 'High-level KPI executive summary (cycle time, throughput, AI %)',
      curl: 'curl -X GET "http://localhost:8000/api/v1/analytics/kpis"',
      response: {
        total_prs: 500,
        merged_prs: 356,
        avg_cycle_time_hours: 21.8,
        avg_review_turnaround_hours: 3.4,
        ai_assisted_percentage: 63.8,
        throughput_per_week: 29.7,
      },
    },
    {
      method: 'GET',
      path: '/api/v1/analytics/ai-impact',
      desc: 'CORE: AI vs. Human productivity comparison matrix & % gain',
      curl: 'curl -X GET "http://localhost:8000/api/v1/analytics/ai-impact"',
      response: {
        productivity_gain_percent: 57.3,
        comparison: [
          { agent: 'cursor', pr_count: 147, avg_cycle_time_hours: 16.9, merge_rate_percent: 81.6 },
          { agent: 'copilot', pr_count: 172, avg_cycle_time_hours: 19.4, merge_rate_percent: 78.5 },
          { agent: 'human', pr_count: 181, avg_cycle_time_hours: 42.6, merge_rate_percent: 69.1 },
        ],
      },
    },
    {
      method: 'GET',
      path: '/api/v1/tasks/board',
      desc: 'Returns PRs grouped into 4 Kanban columns based on lifecycle & reviews',
      curl: 'curl -X GET "http://localhost:8000/api/v1/tasks/board"',
      response: {
        'Open - No Review': [{ id: 10104, number: 104, title: 'chore: upgrade connection pool' }],
        'In Review': [{ id: 10103, number: 103, title: 'feat: implement JWT auth' }],
        'Changes Requested': [{ id: 10102, number: 102, title: 'fix: resolve race condition' }],
        'Approved - Ready to Merge': [{ id: 10101, number: 101, title: 'perf: optimize parquet' }],
      },
    },
    {
      method: 'POST',
      path: '/api/v1/ai-insights/summarize-trends',
      desc: 'Gemini 2.0 Flash prompt chaining for executive trend summaries',
      curl: 'curl -X POST "http://localhost:8000/api/v1/ai-insights/summarize-trends" -H "Content-Type: application/json" -d \'{"period":"last_30_days","focus":"ai_impact"}\'',
      response: {
        summary: 'AI-assisted PRs merge 57.3% faster with 79.8% merge rate.',
        recommendations: ['Expand Copilot to frontend workflows', 'Set up automated alerts for 3-day blockers'],
        generated_at: '2026-09-12T00:00:00Z',
      },
    },
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="backend-architecture-section" className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            Backend Services, Data Pipeline & Architecture
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            FastAPI + Polars ETL + PostgreSQL 16 + Gemini 2.0 Flash
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Backend Configured
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'endpoints'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          API Endpoints (/api/v1/*)
        </button>
        <button
          onClick={() => setActiveTab('etl')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'etl'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Polars ETL Pipeline & Schemas
        </button>
        <button
          onClick={() => setActiveTab('deployment')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'deployment'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Deployment & Cloud Configurations
        </button>
      </div>

      {/* Tab 1: Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {endpoints.map((ep, idx) => (
            <div
              key={ep.path}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {ep.path}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(ep.curl, idx)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">{ep.desc}</p>

              <pre className="p-2.5 rounded bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(ep.response, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: ETL */}
      {activeTab === 'etl' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-500" />
              pull_requests.parquet
            </h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <li>id: BigInteger (PK)</li>
              <li>number: BigInteger</li>
              <li>title: String(512)</li>
              <li>agent: 'copilot'|'cursor'|null</li>
              <li>created_at: DateTime UTC</li>
              <li>merged_at: DateTime UTC</li>
              <li>repo_id: FK(repositories.id)</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-500" />
              pr_reviews.parquet
            </h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <li>id: BigInteger (PK)</li>
              <li>pr_id: FK(pull_requests.id)</li>
              <li>user: String(256)</li>
              <li>state: APPROVED|CHANGES_REQUESTED</li>
              <li>submitted_at: DateTime UTC</li>
              <li>body: Text</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-500" />
              repositories.parquet
            </h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <li>id: BigInteger (PK)</li>
              <li>full_name: String(256) (Unique)</li>
              <li>language: String(64)</li>
              <li>stars: BigInteger</li>
              <li>forks: BigInteger</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Deployment */}
      {activeTab === 'deployment' && (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">🚀 Production Deployment Configuration</h4>
            <p>
              Pre-configured <code>Dockerfile</code> with Python 3.11-slim, <code>railway.json</code> with healthcheck, and <code>render.yaml</code> specs are generated in the backend directory.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">backend/Dockerfile</span>
              <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">backend/railway.json</span>
              <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">backend/render.yaml</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
