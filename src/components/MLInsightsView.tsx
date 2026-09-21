import { useState, useEffect } from 'react';
import { api } from '../api';
import { MLInsightsResponse, MLCluster } from '../types';
import { BrainCircuit, RefreshCw, AlertCircle, Sliders, Layers, User, Sparkles } from 'lucide-react';

interface MLInsightsViewProps {
  onOpenAiInsights?: () => void;
}

export function MLInsightsView({ onOpenAiInsights }: MLInsightsViewProps) {
  const [mlData, setMlData] = useState<MLInsightsResponse | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [numClusters, setNumClusters] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (clusters = numClusters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMLInsights(clusters);
      setMlData(data);
      if (data?.clusters?.length > 0) {
        setSelectedClusterId(data.clusters[0].cluster_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to compute ML insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(numClusters);
  }, [numClusters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Running Scikit-learn K-Means workflow clustering on developer profiles...
        </p>
      </div>
    );
  }

  if (error || !mlData) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error running ML clustering</span>
        </div>
        <p className="text-xs text-red-700">{error || 'ML data unavailable'}</p>
        <button
          onClick={() => loadData(numClusters)}
          className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const clusters = mlData.clusters || [];
  const selectedCluster = clusters.find((c) => c.cluster_id === selectedClusterId) || clusters[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ML Developer Workflow Segmentation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Scikit-Learn K-Means ($k={clusters.length}$)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unsupervised clustering grouping developer profiles by PR volume, AI tool usage, cycle time, merge rate, and review turnaround
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Clusters (k):</span>
            <select
              value={numClusters}
              onChange={(e) => setNumClusters(Number(e.target.value))}
              className="font-bold text-purple-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={2}>2 Clusters</option>
              <option value={3}>3 Clusters</option>
              <option value={4}>4 Clusters</option>
              <option value={5}>5 Clusters</option>
              <option value={6}>6 Clusters</option>
            </select>
          </div>

          <button
            onClick={() => loadData(numClusters)}
            title="Recalculate clustering"
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
              <span>Explain Clusters</span>
            </button>
          )}
        </div>
      </div>

      {/* Cluster Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clusters.map((c) => {
          const isSelected = selectedCluster?.cluster_id === c.cluster_id;

          return (
            <div
              key={c.cluster_id}
              onClick={() => setSelectedClusterId(c.cluster_id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-300'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    {c.percentage_of_total}% of devs
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {c.developer_count.toLocaleString()} developers
                </p>
              </div>

              {/* Centroid Key Metrics */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">PR Activity</span>
                  <span className="font-bold text-slate-800">{c.centroids.avg_pr_count} avg PRs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">AI-Assisted %</span>
                  <span className="font-bold text-purple-700">{c.centroids.avg_ai_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cycle Time</span>
                  <span className="font-bold text-slate-800">{c.centroids.avg_cycle_time_hours}h</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Merge Rate</span>
                  <span className="font-bold text-emerald-700">{c.centroids.avg_merge_rate}%</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Review Activity</span>
                  <span className="font-bold text-slate-800">{c.centroids.avg_reviews} avg reviews</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Cluster Deep-Dive Table */}
      {selectedCluster && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedCluster.color }}
                />
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCluster.name}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  ({selectedCluster.developer_count.toLocaleString()} developers • {selectedCluster.percentage_of_total}% of dataset)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Centroid profile: {selectedCluster.centroids.avg_pr_count} avg PRs • {selectedCluster.centroids.avg_ai_pct}% AI-assisted • {selectedCluster.centroids.avg_cycle_time_hours}h cycle time • {selectedCluster.centroids.avg_merge_rate}% merge rate • {selectedCluster.centroids.avg_reviews} avg reviews
              </p>
            </div>
          </div>

          {/* Representative Developer Profiles in Cluster */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2.5">
              Sample Developer Profiles in this Cluster:
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2">Developer (`user`)</th>
                    <th className="pb-2 text-right">PR Activity</th>
                    <th className="pb-2 text-right">AI-Assisted %</th>
                    <th className="pb-2 text-right">Cycle Time</th>
                    <th className="pb-2 text-right">Merge Rate</th>
                    <th className="pb-2 text-right">Review Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCluster.sample_developers?.map((dev, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dev.user}</span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-700">
                        {dev.pr_count.toLocaleString()} PRs
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px]">
                          {dev.ai_assisted_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {dev.avg_cycle_time_hours > 0 ? `${dev.avg_cycle_time_hours}h` : '—'}
                      </td>
                      <td className="py-2.5 text-right text-emerald-700 font-semibold">
                        {dev.merge_rate}%
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {dev.review_count} reviews
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Model Technical Footnote */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500 italic">
        * {mlData.disclaimer || 'Unsupervised segmentation identifies mathematical clustering tendencies in historical telemetry without assigning normative or productivity rankings.'}
      </div>
    </div>
  );
}
