import { useState, useEffect } from 'react';
import { KPICards } from './KPICards';
import { OperationalImpactCard } from './OperationalImpactCard';
import { AdoptionCard } from './AdoptionCard';
import { CombinedThroughputCard } from './CombinedThroughputCard';
import { ToolComparisonTable } from './ToolComparisonTable';
import { ImpactRadarChart } from './ImpactRadarChart';
import { Sparkles, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { ToolIconRenderer } from './ToolIcons';
import { api } from '../api';
import { OverviewMetrics, AIImpactMetrics, AIToolsResponse } from '../types';

interface CrossToolImpactViewProps {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  onOpenAiInsights: () => void;
}

export function CrossToolImpactView({
  selectedTool,
  onSelectTool,
  onOpenAiInsights,
}: CrossToolImpactViewProps) {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [aiImpact, setAiImpact] = useState<AIImpactMetrics | null>(null);
  const [aiTools, setAiTools] = useState<AIToolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, impData, toolsData] = await Promise.all([
        api.getOverview(),
        api.getAIImpact(),
        api.getAITools(),
      ]);
      setOverview(ovData);
      setAiImpact(impData);
      setAiTools(toolsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedToolObj = aiTools?.tools.find(
    (t) => t.agent.toLowerCase() === selectedTool.toLowerCase()
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Computing telemetry and AI impact metrics from Parquet dataset...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error loading metrics</span>
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

  return (
    <div className="space-y-6">
      {/* Header with Title, Observational Notice, and AI Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Impact & Velocity Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Live Parquet Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Observed comparison across AI-assisted vs non-AI pull requests • Association, not causal evidence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAiInsights}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>Generate Executive Gemini Brief</span>
          </button>
        </div>
      </div>

      {/* Real Top KPI Cards */}
      {overview && <KPICards kpis={overview} />}

      {/* Row 1: Operational Impact (Real Tools) */}
      <OperationalImpactCard
        tools={aiTools?.tools || []}
        selectedToolId={selectedTool}
        onSelectTool={(id) => onSelectTool(id)}
      />

      {/* Row 2: Adoption + Combined Throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdoptionCard
          tools={aiTools?.tools || []}
          aiPercentage={overview?.ai_assisted_pct ?? 100}
        />
        <CombinedThroughputCard
          weeklyThroughput={overview?.weekly_throughput || []}
          tools={aiTools?.tools || []}
        />
      </div>

      {/* Row 3: Tool Comparison Table + Multi-Axis Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolComparisonTable
          tools={aiTools?.tools || []}
          selectedToolId={selectedTool}
          onSelectTool={(id) => onSelectTool(id)}
        />
        <ImpactRadarChart tools={aiTools?.tools || []} />
      </div>

      {/* Contextual Tool Drilldown Pill/Card if a specific tool is selected */}
      {selectedToolObj && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 to-indigo-50/60 border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ToolIconRenderer id={selectedToolObj.agent.toLowerCase()} className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedToolObj.agent.replace('_', ' ')} Observed Summary
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                  {selectedToolObj.pr_count.toLocaleString()} PRs ({selectedToolObj.pr_percentage}%)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  {selectedToolObj.merge_rate}% Merge Rate
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Avg cycle time: {selectedToolObj.avg_cycle_time_hours ?? '—'}h • First review turnaround: {selectedToolObj.avg_review_time_hours ?? '—'}h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onOpenAiInsights}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Explain with Gemini</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
