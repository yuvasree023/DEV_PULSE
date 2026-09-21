import { useState, useEffect } from 'react';
import { api } from '../api';
import { AIToolsResponse, AIImpactMetrics } from '../types';
import { ToolIconRenderer } from './ToolIcons';
import { Bot, RefreshCw, AlertCircle, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export function ManageAdoptionView() {
  const [aiTools, setAiTools] = useState<AIToolsResponse | null>(null);
  const [aiImpact, setAiImpact] = useState<AIImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [toolsData, impactData] = await Promise.all([
        api.getAITools(),
        api.getAIImpact(),
      ]);
      setAiTools(toolsData);
      setAiImpact(impactData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI Tools metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Loading AI Tool metrics from Parquet dataset...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error loading AI Tools data</span>
        </div>
        <p className="text-xs text-red-700">{error}</p>
        <button
          onClick={loadData}
          className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const tools = aiTools?.tools || [];
  const totalPRs = aiTools?.total_prs || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Tools Telemetry & Penetration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real metrics computed per AI tool (`agent`) without artificial rankings
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start sm:self-auto p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top summary cards from real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Monitored PRs
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {totalPRs.toLocaleString()}
          </div>
          <div className="text-xs text-purple-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {tools.filter((t) => t.is_ai).length} distinct AI agents identified
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            AI vs Non-AI Merge Rate
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {aiImpact?.summary.ai_merge_rate ?? 0}%
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Non-AI merge rate: {aiImpact?.summary.non_ai_merge_rate ?? 0}%
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Avg AI Cycle vs Review Time
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {aiImpact?.summary.ai_avg_cycle_time_hours ?? 0}h
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Avg review turnaround: {aiImpact?.summary.ai_avg_review_time_hours ?? 0}h
          </div>
        </div>
      </div>

      {/* Real AI Tools Table: Tool | PR count | PR % | Avg cycle time | Merge rate | Review time */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Observed AI Agent Breakdown
          </h3>
          <span className="text-[11px] text-slate-400">
            * Observed association — not causal evidence
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                <th className="pb-3 pl-1">Tool (`agent`)</th>
                <th className="pb-3 px-3">PR Count</th>
                <th className="pb-3 px-3">PR %</th>
                <th className="pb-3 px-3">Avg Cycle Time</th>
                <th className="pb-3 px-3">Merge Rate</th>
                <th className="pb-3 px-3">Avg Review Time</th>
                <th className="pb-3 px-3">Volume Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {tools.map((t) => (
                <tr key={t.agent} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 pl-1 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <ToolIconRenderer id={t.agent.toLowerCase()} className="w-5 h-5 shrink-0" />
                      <span>{t.agent.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-900 font-semibold">
                    {t.pr_count.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px]">
                      {t.pr_percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">
                    {t.avg_cycle_time_hours != null ? `${t.avg_cycle_time_hours} hours` : '—'}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      {t.merge_rate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">
                    {t.avg_review_time_hours != null ? `${t.avg_review_time_hours} hours` : '—'}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, t.pr_percentage * 1.5)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-600">{t.pr_percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
