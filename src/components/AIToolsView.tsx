import { useState, useEffect } from 'react';
import { api } from '../api';
import { AIToolsResponse, AIToolMetric } from '../types';
import { ToolComparisonTable } from './ToolComparisonTable';
import { ToolIconRenderer } from './ToolIcons';
import { RefreshCw, AlertCircle, Bot, GitPullRequest, Clock, CheckCircle2, Search } from 'lucide-react';

export function AIToolsView() {
  const [toolsData, setToolsData] = useState<AIToolsResponse | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAITools();
      setToolsData(data);
      if (data?.tools?.length > 0 && !selectedTool) {
        setSelectedTool(data.tools[0].agent);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI tools telemetry.');
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
          Loading AI tools productivity metrics...
        </p>
      </div>
    );
  }

  if (error || !toolsData) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error loading AI tool telemetry</span>
        </div>
        <p className="text-xs text-red-700">{error || 'No tools data available'}</p>
        <button
          onClick={loadData}
          className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const allTools = toolsData.tools || [];
  const filteredTools = allTools.filter((t) =>
    t.agent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedToolObj = allTools.find(
    (t) => t.agent.toLowerCase() === selectedTool?.toLowerCase()
  ) || allTools[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Tools Productivity & Adoption
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed breakdown across code-generation and assistance agents detected in pull requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tool..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 w-40 sm:w-48"
            />
          </div>

          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tool Distribution Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allTools.slice(0, 4).map((tool) => {
          const isSelected = selectedTool?.toLowerCase() === tool.agent.toLowerCase();

          return (
            <div
              key={tool.agent}
              onClick={() => setSelectedTool(tool.agent)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/50 shadow-2xs ring-1 ring-purple-300'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <ToolIconRenderer id={tool.agent.toLowerCase()} className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">
                    {tool.agent.replace('_', ' ')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-0.5">
                      <GitPullRequest className="w-3 h-3 text-slate-400" />
                      {tool.pr_count.toLocaleString()} PRs
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-bold text-purple-700">
                  {tool.pr_percentage}%
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {tool.merge_rate}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tool Detail Card */}
      {selectedToolObj && (
        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <ToolIconRenderer id={selectedToolObj.agent.toLowerCase()} className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedToolObj.agent.replace('_', ' ')}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {selectedToolObj.pr_percentage}% of total PRs
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedToolObj.merge_rate}% merge rate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Observed telemetry metrics based on {selectedToolObj.pr_count.toLocaleString()} pull requests.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-right">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Avg Cycle Time</span>
              <span className="text-sm font-bold text-slate-800">
                {selectedToolObj.avg_cycle_time_hours != null ? `${selectedToolObj.avg_cycle_time_hours}h` : '—'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block">Avg Review Turnaround</span>
              <span className="text-sm font-bold text-slate-800">
                {selectedToolObj.avg_review_time_hours != null ? `${selectedToolObj.avg_review_time_hours}h` : '—'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-slate-400 block">Total PRs</span>
              <span className="text-sm font-bold text-purple-700">
                {selectedToolObj.pr_count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Core Tool Comparison Table */}
      <ToolComparisonTable
        tools={filteredTools}
        selectedToolId={selectedTool || undefined}
        onSelectTool={(agent) => setSelectedTool(agent)}
      />
    </div>
  );
}
