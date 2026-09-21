import { useState, useEffect } from 'react';
import { api } from '../api';
import { PeopleMetrics, DeveloperMetric } from '../types';
import { Users, Search, RefreshCw, AlertCircle, GitPullRequest, CheckCircle2, Clock } from 'lucide-react';

export function EnableUsersView() {
  const [peopleData, setPeopleData] = useState<PeopleMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPeople(200);
      setPeopleData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch developer analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const developers = peopleData?.developers || [];

  const filtered = developers.filter((dev) =>
    dev.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Loading developer telemetry from Parquet dataset...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error loading people analytics</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Developer Workflow & Activity Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
              {peopleData?.total_developers.toLocaleString()} Total Authors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective activity distribution without ranking or judgment labels
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search developer username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs w-60"
            />
          </div>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Developer Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Developer Pull Request & Review Statistics
          </h3>
          <span className="text-[11px] text-slate-400">
            Showing top {filtered.length} active contributors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                <th className="pb-3 pl-1">Developer</th>
                <th className="pb-3 px-3">PR Count</th>
                <th className="pb-3 px-3">Merged PRs</th>
                <th className="pb-3 px-3">Merge Rate</th>
                <th className="pb-3 px-3">AI-Assisted %</th>
                <th className="pb-3 px-3">Avg Cycle Time</th>
                <th className="pb-3 px-3">Review Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No developers match the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((dev) => (
                  <tr key={dev.user} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-1 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                          {dev.user.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-mono text-slate-900">{dev.user}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {dev.pr_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {dev.merged_prs.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        {dev.merge_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px]">
                        {dev.ai_assisted_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {dev.avg_cycle_time_hours != null ? `${dev.avg_cycle_time_hours}h` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {dev.review_count > 0 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                          {dev.review_count} reviews
                        </span>
                      ) : (
                        <span className="text-slate-400">0 reviews</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
