import { useState, useEffect } from 'react';
import { OverviewMetrics, AIToolsResponse } from '../types';
import { api } from '../api';
import { GitPullRequest, Clock, CheckCircle2, Sparkles, TrendingUp, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { ErrorCard } from './ErrorCard';
import { ToolIconRenderer } from './ToolIcons';

interface OverviewViewProps {
  onNavigateToTools?: () => void;
  onNavigateToImpact?: () => void;
  onOpenAiInsights?: () => void;
}

export function OverviewView({ onNavigateToTools, onNavigateToImpact, onOpenAiInsights }: OverviewViewProps) {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [aiTools, setAiTools] = useState<AIToolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, toolsData] = await Promise.all([
        api.getOverview(),
        api.getAITools()
      ]);
      setOverview(ovData);
      setAiTools(toolsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview telemetry.');
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
          Loading developer productivity and AI telemetry...
        </p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <ErrorCard
        title="Error loading overview metrics"
        error={error || 'No overview data available'}
        onRetry={loadData}
        isRetrying={loading}
      />
    );
  }

  const recentWeeks = overview.weekly_throughput?.slice(-12) || [];
  const maxPRs = Math.max(...recentWeeks.map((w) => w.total_prs), 1);

  const kpis = [
    {
      id: 'kpi-total-prs',
      title: 'Total PRs',
      value: overview.total_prs.toLocaleString(),
      subtext: `${overview.merged_prs.toLocaleString()} merged (${overview.merge_rate}%)`,
      icon: GitPullRequest,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'kpi-ai-prs',
      title: 'AI-Assisted PRs',
      value: overview.ai_assisted_prs.toLocaleString(),
      subtext: `From verified AI tool commits`,
      icon: Sparkles,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'kpi-ai-pct',
      title: 'AI-Assisted %',
      value: `${overview.ai_assisted_pct}%`,
      subtext: `Share of all dataset PRs`,
      icon: TrendingUp,
      iconBg: 'bg-violet-50 text-violet-600',
    },
    {
      id: 'kpi-cycle-time',
      title: 'Average Cycle Time',
      value: `${overview.avg_cycle_time_hours}h`,
      subtext: `Median: ${overview.median_cycle_time_hours}h`,
      icon: Clock,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'kpi-merge-rate',
      title: 'Merge Rate',
      value: `${overview.merge_rate}%`,
      subtext: `Merged to main/master`,
      icon: CheckCircle2,
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Developer Productivity Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real data telemetry tracking AI-tool assisted versus non-AI pull requests across repositories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onOpenAiInsights && (
            <button
              onClick={onOpenAiInsights}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Explain Telemetry</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 truncate pr-1">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg ${card.iconBg} shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Row: AI Tool Usage Trend + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Throughput & AI Usage Trend (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                AI Tool Usage Trend & Weekly Throughput
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Weekly activity</span>
          </div>

          <div className="space-y-4">
            <div className="h-44 flex items-end gap-2 pt-4 border-b border-slate-100 pb-2">
              {recentWeeks.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  No historical throughput data available in dataset.
                </div>
              ) : (
                recentWeeks.map((week) => {
                  const totalHeightPct = Math.max(12, Math.round((week.total_prs / maxPRs) * 100));
                  const isHovered = hoveredPoint?.period === week.period;
                  const label = week.period.split('/')[0]?.slice(5) || week.period;

                  return (
                    <div
                      key={week.period}
                      className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(week)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Bar Value on Hover */}
                      <span className={`text-[10px] font-bold mb-1 transition-opacity ${isHovered ? 'text-purple-700 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                        {week.total_prs}
                      </span>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-200 ${
                          isHovered ? 'bg-purple-700 shadow-md ring-2 ring-purple-300' : 'bg-gradient-to-t from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600'
                        }`}
                        style={{ height: `${totalHeightPct}%`, minHeight: '8px' }}
                      />

                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-30 space-y-0.5 border border-slate-700 pointer-events-none">
                          <div className="font-bold text-slate-200">{week.period}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            <span>Total PRs: {week.total_prs.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Merged: {week.merged_prs.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {/* X-axis week label */}
                      <span className="text-[9px] text-slate-400 font-mono mt-1.5 truncate max-w-full select-none">
                        {label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Past 12 weeks activity</span>
              <span className="font-semibold text-purple-700">{overview.total_prs.toLocaleString()} total observed PRs</span>
            </div>
          </div>
        </div>

        {/* AI Tool Distribution Breakdown (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Top AI Tool Agents
            </h2>
            {onNavigateToTools && (
              <button
                onClick={onNavigateToTools}
                className="text-[11px] text-purple-700 font-semibold hover:underline cursor-pointer"
              >
                View all tools →
              </button>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px]">
            {(aiTools?.tools || []).slice(0, 5).map((tool) => (
              <div
                key={tool.agent}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ToolIconRenderer id={tool.agent.toLowerCase()} className="w-5 h-5 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 block truncate">
                      {tool.agent.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tool.pr_count.toLocaleString()} PRs
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-purple-700 block">
                    {tool.pr_percentage}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {tool.merge_rate}% merged
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Tools: {aiTools?.tools?.length || 0}</span>
            {onNavigateToImpact && (
              <button
                onClick={onNavigateToImpact}
                className="text-purple-700 font-semibold hover:underline cursor-pointer"
              >
                Compare AI vs Non-AI →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Observational Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500 italic">
        * {overview.disclaimer || 'Observed association — not causal evidence'}
      </div>
    </div>
  );
}
