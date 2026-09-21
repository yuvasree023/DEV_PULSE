import { useState } from 'react';
import { WeeklyThroughputPoint, AIToolMetric } from '../types';
import { ToolIconRenderer } from './ToolIcons';
import { GitPullRequest, Activity } from 'lucide-react';

interface CombinedThroughputCardProps {
  weeklyThroughput?: WeeklyThroughputPoint[];
  tools?: AIToolMetric[];
}

export function CombinedThroughputCard({
  weeklyThroughput = [],
  tools = [],
}: CombinedThroughputCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<WeeklyThroughputPoint | null>(null);

  const recentWeeks = weeklyThroughput.slice(-12);
  const maxPRs = Math.max(...recentWeeks.map((w) => w.total_prs), 100);

  return (
    <div
      id="combined-throughput-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            PR Throughput Over Time
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Weekly trend</span>
      </div>

      <div className="space-y-4">
        {/* Weekly Bar Chart */}
        <div className="h-28 flex items-end gap-1.5 pt-2 border-b border-slate-100 pb-2">
          {recentWeeks.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              No historical weekly throughput data available.
            </div>
          ) : (
            recentWeeks.map((week) => {
              const heightPct = Math.max(8, Math.round((week.total_prs / maxPRs) * 100));
              const isHovered = hoveredPoint?.period === week.period;

              return (
                <div
                  key={week.period}
                  className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(week)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isHovered
                        ? 'bg-purple-700'
                        : 'bg-purple-400/80 hover:bg-purple-600'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md whitespace-nowrap z-30">
                      <div>{week.period}: {week.total_prs.toLocaleString()} PRs</div>
                      <div className="text-emerald-400">{week.merged_prs.toLocaleString()} merged</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Tool Cycle Time Comparison Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {tools.slice(0, 4).map((tool) => (
            <div
              key={tool.agent}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700"
            >
              <ToolIconRenderer id={tool.agent.toLowerCase()} className="w-3.5 h-3.5" />
              <span className="font-semibold">{tool.agent.replace('_', ' ')}:</span>
              <span className="text-purple-700 font-bold">{tool.avg_cycle_time_hours ?? '—'}h</span>
              <span className="text-slate-400 text-[10px]">avg cycle</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
