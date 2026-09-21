import { AgentBenchmark } from '../types';
import { Bot, User, ArrowDownRight, Zap, CheckCircle } from 'lucide-react';

interface AIImpactMatrixProps {
  benchmarks: AgentBenchmark[];
}

export function AIImpactMatrix({ benchmarks }: AIImpactMatrixProps) {
  const human = benchmarks.find((b) => b.agent === 'human') || benchmarks[2];
  const humanCycle = human ? human.avg_cycle_time_hours : 42.6;

  return (
    <div id="ai-impact-matrix" className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            AI vs. Human Impact Benchmark
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Direct comparison of cycle times, turnaround, and merge acceptance rates across agents
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-semibold">
          <ArrowDownRight className="w-3.5 h-3.5" />
          -57.3% Faster Cycle Time
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {benchmarks.map((item) => {
          const isHuman = item.agent === 'human';
          const speedupPct = isHuman
            ? null
            : Math.round(((humanCycle - item.avg_cycle_time_hours) / humanCycle) * 100);

          return (
            <div
              key={item.agent}
              id={`benchmark-card-${item.agent}`}
              className={`p-5 rounded-xl border transition-all ${
                isHuman
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                  : 'border-blue-200/80 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {isHuman ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {item.label}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.pr_count} pull requests
                    </span>
                  </div>
                </div>
                {speedupPct && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                    +{speedupPct}% faster
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Avg Cycle Time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.avg_cycle_time_hours} hrs
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((item.avg_cycle_time_hours / 45) * 100))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Review Turnaround</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {item.avg_review_turnaround_hours} hrs
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Merge Acceptance Rate</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {item.merge_rate_percent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
