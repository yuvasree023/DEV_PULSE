import { useState, useEffect } from 'react';
import { api } from '../api';
import { ProjectsMetrics, ProjectMetric } from '../types';
import { GitFork, Star, GitPullRequest, Search, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface RepositoriesViewProps {
  repositories?: any[];
}

export function RepositoriesView({ }: RepositoriesViewProps) {
  const [projectsData, setProjectsData] = useState<ProjectsMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects(250);
      setProjectsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch project & repository metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const projects = projectsData?.projects || (projectsData as any)?.repositories || [];
  const languages = ['all', ...(projectsData?.languages?.map((l) => l.language) || [])];

  const filtered = projects.filter((r) => {
    const matchesSearch =
      r.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.language.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLang === 'all' || r.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Loading repository and PR telemetry from Parquet datasets...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Error loading project repositories</span>
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
    <div id="repositories-view" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Projects & Repository Telemetry
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
              {(projectsData?.total_repositories ?? projects.length).toLocaleString()} Repositories
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Joined telemetry: pull_request.repo_id → repository.id
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs w-52"
            />
          </div>

          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 pl-1">Repository</th>
                <th className="pb-3 px-3">Language</th>
                <th className="pb-3 px-3">PR Count</th>
                <th className="pb-3 px-3">Merge Rate</th>
                <th className="pb-3 px-3">Avg Cycle Time</th>
                <th className="pb-3 px-3">AI-Assisted %</th>
                <th className="pb-3 px-3">Stars</th>
                <th className="pb-3 px-3">Forks</th>
                <th className="pb-3 px-2 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No repositories match the search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((repo) => (
                  <tr key={repo.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pl-1 font-semibold text-slate-900">
                      <div>
                        <span>{repo.repository}</span>
                        {repo.license && (
                          <span className="ml-2 text-[10px] text-slate-400 font-mono">
                            ({repo.license})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
                        {repo.language}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {repo.pr_count.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        {repo.merge_rate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {repo.avg_cycle_time_hours != null ? `${repo.avg_cycle_time_hours}h` : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-purple-700">{repo.ai_assisted_pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {repo.stars.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <GitFork className="w-3.5 h-3.5 text-slate-400" />
                        {repo.forks.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {repo.url && (
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block p-1 text-slate-400 hover:text-purple-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
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
