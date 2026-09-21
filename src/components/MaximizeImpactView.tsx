import { useState, useEffect } from 'react';
import { api } from '../api';
import { MLInsightsResponse, MLCluster } from '../types';
import { BrainCircuit, RefreshCw, AlertCircle, Sparkles, Layers, Sliders, CheckCircle } from 'lucide-react';

interface MaximizeImpactViewProps {
  onInspectPr?: (pr: any) => void;
  onOpenAiInsights?: () => void;
}

export function MaximizeImpactView({ onOpenAiInsights }: MaximizeImpactViewProps) {
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
      if (data.clusters.length > 0) {
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Running Scikit-learn K-Means workflow clustering on developer profiles...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error running ML clustering</span>
        </div>
        <p className="text-xs text-red-700">{error}</p>
        <button
          onClick={() => loadData(numClusters)}
          className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const clusters = mlData?.clusters || [];
  const selectedCluster = clusters.find((c) => c.cluster_id === selectedClusterId) || clusters[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Machine Learning Workflow Insights
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Scikit-Learn K-Means ($k={numClusters}$)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Explainable clustering across developer activity profiles (PR count, AI %, cycle time, merge rate, reviews)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Clusters:</span>
            <select
              value={numClusters}
              onChange={(e) => setNumClusters(Number(e.target.value))}
              className="font-bold text-purple-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={3}>3 Clusters</option>
              <option value={4}>4 Clusters</option>
              <option value={5}>5 Clusters</option>
              <option value={6}>6 Clusters</option>
            </select>
          </div>

          <button
            onClick={onOpenAiInsights}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>Explain ML Patterns with Gemini</span>
          </button>
        </div>
      </div>

      {/* Cluster summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clusters.map((c) => {
          const isSelected = selectedCluster?.cluster_id === c.cluster_id;

          return (
            <div
              key={c.cluster_id}
              onClick={() => setSelectedClusterId(c.cluster_id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-300'
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
                  {c.developer_count.toLocaleString()} developer profiles
                </p>
              </div>

              {/* Centroid Key Stats */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg PRs</span>
                  <span className="font-bold text-slate-800">{c.centroids.avg_pr_count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Merge Rate</span>
                  <span className="font-bold text-emerald-700">{c.centroids.avg_merge_rate_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Cycle</span>
                  <span className="font-bold text-slate-800">{c.centroids.avg_cycle_time_hours}h</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">AI-Assisted</span>
                  <span className="font-bold text-purple-700">{c.centroids.avg_ai_assisted_pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive into Selected Segment */}
      {selectedCluster && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Centroid metrics breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {selectedCluster.name} Centroid Profile
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Developer Cohort Size</span>
                <span className="font-bold text-slate-900">
                  {selectedCluster.developer_count.toLocaleString()} ({selectedCluster.percentage_of_total}%)
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Mean Pull Request Count</span>
                <span className="font-bold text-slate-900">
                  {selectedCluster.centroids.avg_pr_count} PRs
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Mean Merge Acceptance Rate</span>
                <span className="font-bold text-emerald-700">
                  {selectedCluster.centroids.avg_merge_rate_pct}%
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Mean PR Cycle Time</span>
                <span className="font-bold text-slate-900">
                  {selectedCluster.centroids.avg_cycle_time_hours} hours
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Mean AI-Assisted Percentage</span>
                <span className="font-bold text-purple-700">
                  {selectedCluster.centroids.avg_ai_assisted_pct}%
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Mean Review Count per Dev</span>
                <span className="font-bold text-slate-900">
                  {selectedCluster.centroids.avg_review_count} reviews
                </span>
              </div>
            </div>
          </div>

          {/* Sample Developer Profiles in Segment */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Sample Developer Profiles in {selectedCluster.name}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5 pl-1">Developer</th>
                    <th className="pb-2.5 px-3">PRs</th>
                    <th className="pb-2.5 px-3">AI %</th>
                    <th className="pb-2.5 px-3">Merge Rate</th>
                    <th className="pb-2.5 px-3">Avg Cycle</th>
                    <th className="pb-2.5 px-3">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCluster.samples.map((sample) => (
                    <tr key={sample.user} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pl-1 font-mono font-semibold text-slate-800">
                        {sample.user}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {sample.pr_count}
                      </td>
                      <td className="py-2.5 px-3 text-purple-700 font-medium">
                        {sample.ai_assisted_pct}%
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">
                        {sample.merge_rate}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {sample.avg_cycle_time_hours}h
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {sample.review_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
