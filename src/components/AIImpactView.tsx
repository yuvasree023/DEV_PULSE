import { useState, useEffect } from 'react';
import { api } from '../api';
import { AIImpactMetrics, OverviewMetrics } from '../types';
import { RefreshCw, AlertCircle, Clock, CheckCircle2, TrendingUp, Sparkles, UserCheck, Activity } from 'lucide-react';

export function AIImpactView() {
  const [impactData, setImpactData] = useState<AIImpactMetrics | null>(null);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTrend, setHoveredTrend] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [imp, ov] = await Promise.all([
        api.getAIImpact(),
        api.getOverview()
      ]);
      setImpactData(imp);
      setOverview(ov);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI impact telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Computing AI-assisted vs non-AI impact comparisons...
        </p>
      </div>
    );
  }

  if (error || !impactData || !overview) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error loading AI impact comparison</span>
        </div>
        <p className="text-xs text-red-700">{error || 'No impact data available'}</p>
        <button
          onClick={loadData}
          className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, trend } = impactData;

  // Cycle time diff
  const cycleDiff = summary.non_ai_avg_cycle_time_hours > 0
    ? Math.round(((summary.non_ai_avg_cycle_time_hours - summary.ai_avg_cycle_time_hours) / summary.non_ai_avg_cycle_time_hours) * 100)
    : 0;

  // Merge rate diff
  const mergeRateDiff = Math.round((summary.ai_merge_rate - summary.non_ai_merge_rate) * 10) / 10;

  // Review time diff
  const aiReview = overview.ai_avg_review_time_hours || 0;
  const nonAiReview = overview.non_ai_avg_review_time_hours || 0;
  const reviewDiff = nonAiReview > 0
    ? Math.round(((nonAiReview - aiReview) / nonAiReview) * 100)
    : 0;

  const maxTrendPRs = Math.max(...trend.map((t) => t.total_prs), 10);

  return (
    <div className="space-y-6">
      {/* Header with Mandatory Wording */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Impact: Observed Comparison
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              AI vs Non-AI
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Observed association — not causal evidence
          </p>
        </div>

        <button
          onClick={loadData}
          title="Refresh metrics"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Core Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Cycle Time Comparison */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cycle Time Comparison
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                <span className="text-[11px] font-semibold text-purple-700 block">AI-Assisted</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {summary.ai_avg_cycle_time_hours}h
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Median: {overview.ai_median_cycle_time_hours}h
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-600 block">Non-AI Baseline</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {summary.non_ai_avg_cycle_time_hours > 0 ? `${summary.non_ai_avg_cycle_time_hours}h` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Median: {overview.non_ai_median_cycle_time_hours > 0 ? `${overview.non_ai_median_cycle_time_hours}h` : '—'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
              <span className="text-slate-600">Observed difference: </span>
              <span className="font-bold text-slate-900">
                {summary.non_ai_avg_cycle_time_hours > 0
                  ? `${Math.abs(summary.ai_avg_cycle_time_hours - summary.non_ai_avg_cycle_time_hours).toFixed(1)}h difference (${cycleDiff}% change)`
                  : 'All PRs in current dataset are AI-assisted'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Measured from PR creation to merge timestamp for all merged PRs.
          </p>
        </div>

        {/* 2. Merge Rate Comparison */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Merge Rate Comparison
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                <span className="text-[11px] font-semibold text-purple-700 block">AI-Assisted</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {summary.ai_merge_rate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {summary.ai_prs.toLocaleString()} PRs
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-600 block">Non-AI Baseline</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {summary.non_ai_prs > 0 ? `${summary.non_ai_merge_rate}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {summary.non_ai_prs.toLocaleString()} PRs
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
              <span className="text-slate-600">Observed difference: </span>
              <span className="font-bold text-slate-900">
                {summary.non_ai_prs > 0
                  ? `${mergeRateDiff > 0 ? `+${mergeRateDiff}` : mergeRateDiff}% percentage points`
                  : 'Baseline non-AI cohort not present in current sample'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Ratio of merged pull requests to total submitted pull requests.
          </p>
        </div>

        {/* 3. Review Time Comparison */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              First Review Turnaround
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                <span className="text-[11px] font-semibold text-purple-700 block">AI-Assisted</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {aiReview > 0 ? `${aiReview}h` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Time to 1st review
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-600 block">Non-AI Baseline</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {nonAiReview > 0 ? `${nonAiReview}h` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Time to 1st review
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
              <span className="text-slate-600">Overall median review time: </span>
              <span className="font-bold text-slate-900">{overview.median_review_time_hours}h</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Hours from pull request submission to first reviewer response.
          </p>
        </div>
      </div>

      {/* AI-Assisted PR Trend (Historical Share & Volumes) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              AI-Assisted Pull Request Trend Over Time
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Monthly observation</span>
        </div>

        {/* Trend Bar Visualization */}
        <div className="h-44 flex items-end gap-2 pt-4 border-b border-slate-100 pb-2">
          {trend.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              No historical trend periods available.
            </div>
          ) : (
            trend.map((pt) => {
              const heightPct = Math.max(10, Math.round((pt.total_prs / maxTrendPRs) * 100));
              const isHovered = hoveredTrend?.period === pt.period;

              return (
                <div
                  key={pt.period}
                  className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                  onMouseEnter={() => setHoveredTrend(pt)}
                  onMouseLeave={() => setHoveredTrend(null)}
                >
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isHovered ? 'bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap z-30 space-y-0.5">
                      <div className="font-bold">{pt.period}</div>
                      <div>Total PRs: {pt.total_prs.toLocaleString()}</div>
                      <div className="text-purple-300">AI PRs: {pt.ai_prs.toLocaleString()} ({pt.ai_percentage}%)</div>
                      {pt.avg_cycle_time_hours && <div>Cycle time: {pt.avg_cycle_time_hours}h</div>}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400 truncate max-w-full">
                    {pt.period}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Summary Table for Trend Periods */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-2">Period</th>
                <th className="pb-2 text-right">Total PRs</th>
                <th className="pb-2 text-right">AI-Assisted PRs</th>
                <th className="pb-2 text-right">AI Share %</th>
                <th className="pb-2 text-right">Avg Cycle Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trend.map((pt) => (
                <tr key={pt.period} className="hover:bg-slate-50">
                  <td className="py-2 font-semibold text-slate-800">{pt.period}</td>
                  <td className="py-2 text-right text-slate-600">{pt.total_prs.toLocaleString()}</td>
                  <td className="py-2 text-right font-medium text-purple-700">{pt.ai_prs.toLocaleString()}</td>
                  <td className="py-2 text-right">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px]">
                      {pt.ai_percentage}%
                    </span>
                  </td>
                  <td className="py-2 text-right text-slate-600">
                    {pt.avg_cycle_time_hours != null ? `${pt.avg_cycle_time_hours}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prominent Observational Evidence Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-center space-y-1">
        <p className="text-xs font-bold text-slate-700">
          Observed comparison: AI-assisted vs non-AI pull requests
        </p>
        <p className="text-xs text-slate-500 italic">
          Observed association — not causal evidence. Results reflect telemetry correlations within the monitored repositories and datasets.
        </p>
      </div>
    </div>
  );
}
