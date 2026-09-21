import { useState } from 'react';
import { Repository } from '../types';
import { GitFork, Star, GitPullRequest, Search, ExternalLink } from 'lucide-react';

interface RepositoriesViewProps {
  repositories: Repository[];
}

export function RepositoriesView({ repositories }: RepositoriesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');

  const languages = ['all', ...Array.from(new Set(repositories.map((r) => r.language)))];

  const filtered = repositories.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.language.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLang === 'all' || r.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div id="repositories-view" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Monitored Repositories & AI Adoption
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Performance analytics, cycle times, and AI coding velocity across active codebases
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search repos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((repo) => (
          <div
            key={repo.id}
            id={`repo-card-${repo.id}`}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {repo.language}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {repo.license || 'Proprietary'}
                </span>
              </div>

              <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">
                {repo.full_name}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>AI Adoption Rate</span>
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {repo.ai_adoption_rate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-violet-600 h-full rounded-full transition-all"
                  style={{ width: `${repo.ai_adoption_rate}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  {repo.stars.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" />
                  {repo.forks}
                </span>
                <span className="flex items-center gap-1">
                  <GitPullRequest className="w-3.5 h-3.5 text-blue-500" />
                  {repo.pr_count} PRs
                </span>
              </div>

              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
