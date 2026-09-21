import { useState } from 'react';
import { PullRequest } from '../types';
import { AlertTriangle, Bot, User, Clock, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  prs: PullRequest[];
  onInspectBlocker: (pr: PullRequest) => void;
}

export function KanbanBoard({ prs, onInspectBlocker }: KanbanBoardProps) {
  const [filterAgent, setFilterAgent] = useState<'all' | 'copilot' | 'cursor' | 'human'>('all');

  const filteredPrs = prs.filter((p) => {
    if (filterAgent === 'all') return true;
    if (filterAgent === 'human') return !p.agent;
    return p.agent === filterAgent;
  });

  const columns = [
    {
      id: 'open-no-review',
      title: 'Open - No Review',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      items: filteredPrs.filter((p) => p.state === 'open' && (!p.reviews || p.reviews.length === 0)),
    },
    {
      id: 'in-review',
      title: 'In Review',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      items: filteredPrs.filter(
        (p) =>
          p.state === 'open' &&
          p.reviews &&
          p.reviews.length > 0 &&
          p.reviews[p.reviews.length - 1].state === 'COMMENTED'
      ),
    },
    {
      id: 'changes-requested',
      title: 'Changes Requested',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      items: filteredPrs.filter(
        (p) =>
          p.state === 'open' &&
          p.reviews &&
          p.reviews.length > 0 &&
          p.reviews[p.reviews.length - 1].state === 'CHANGES_REQUESTED'
      ),
    },
    {
      id: 'approved-ready-to-merge',
      title: 'Approved - Ready to Merge',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      items: filteredPrs.filter(
        (p) =>
          (p.state === 'open' &&
            p.reviews &&
            p.reviews.length > 0 &&
            p.reviews[p.reviews.length - 1].state === 'APPROVED') ||
          p.state === 'merged'
      ),
    },
  ];

  return (
    <div id="kanban-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            PR Lifecycle & Kanban Task Board
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time pipeline tracking based on PR state and latest reviewer feedback
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-medium">
          {(['all', 'copilot', 'cursor', 'human'] as const).map((agent) => (
            <button
              key={agent}
              id={`filter-agent-${agent}`}
              onClick={() => setFilterAgent(agent)}
              className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                filterAgent === agent
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {agent === 'all' ? 'All Authors' : agent}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            id={`kanban-col-${col.id}`}
            className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4"
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-semibold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300">
                {col.title}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeClass}`}>
                {col.items.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {col.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No active pull requests in this stage
                </div>
              ) : (
                col.items.map((pr) => {
                  const latestReview = pr.reviews && pr.reviews.length > 0 ? pr.reviews[pr.reviews.length - 1] : null;
                  const isBlocked = latestReview?.state === 'CHANGES_REQUESTED';

                  return (
                    <div
                      key={pr.id}
                      id={`pr-card-${pr.id}`}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono font-medium text-slate-400">
                          #{pr.number}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {pr.agent ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                              <Bot className="w-3 h-3" />
                              {pr.agent}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <User className="w-3 h-3" />
                              human
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {pr.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="truncate max-w-[120px]">@{pr.user}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {isBlocked && (
                        <div className="mt-2 pt-2 border-t border-amber-100 dark:border-amber-950 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Changes Requested
                          </span>
                          <button
                            onClick={() => onInspectBlocker(pr)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            Analyze Blocker
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
