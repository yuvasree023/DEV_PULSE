import { AIToolMetric } from '../types';
import { ToolIconRenderer } from './ToolIcons';

interface ToolComparisonTableProps {
  tools?: AIToolMetric[];
  onSelectTool?: (toolId: string) => void;
  selectedToolId?: string;
}

export function ToolComparisonTable({
  tools = [],
  onSelectTool,
  selectedToolId,
}: ToolComparisonTableProps) {
  return (
    <div
      id="tool-comparison-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          AI Tool Telemetry Comparison
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">
          Observed Dataset Metrics
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-slate-500 border-b border-slate-100">
              <th className="text-left font-semibold pb-2.5 pl-1">Tool (`agent`)</th>
              <th className="pb-2.5 px-2 font-semibold">PR Count</th>
              <th className="pb-2.5 px-2 font-semibold">PR %</th>
              <th className="pb-2.5 px-2 font-semibold">Avg Cycle Time</th>
              <th className="pb-2.5 px-2 font-semibold">Merge Rate</th>
              <th className="pb-2.5 px-2 font-semibold">Review Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {tools.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-slate-400 text-center">
                  No tool data available in dataset.
                </td>
              </tr>
            ) : (
              tools.map((row) => {
                const isSelected = selectedToolId?.toLowerCase() === row.agent.toLowerCase();

                return (
                  <tr
                    key={row.agent}
                    onClick={() => onSelectTool && onSelectTool(row.agent)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50/70 font-semibold' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3 pl-1 text-left">
                      <div className="flex items-center gap-2">
                        <ToolIconRenderer id={row.agent.toLowerCase()} className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800">
                          {row.agent.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    {/* PR count */}
                    <td className="py-3 px-2 text-slate-700 font-medium">
                      {row.pr_count.toLocaleString()}
                    </td>

                    {/* PR % */}
                    <td className="py-3 px-2">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px]">
                        {row.pr_percentage}%
                      </span>
                    </td>

                    {/* Avg Cycle time */}
                    <td className="py-3 px-2 text-slate-700">
                      {row.avg_cycle_time_hours != null ? `${row.avg_cycle_time_hours}h` : '—'}
                    </td>

                    {/* Merge rate */}
                    <td className="py-3 px-2">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        {row.merge_rate}%
                      </span>
                    </td>

                    {/* Review time */}
                    <td className="py-3 px-2 text-slate-600">
                      {row.avg_review_time_hours != null ? `${row.avg_review_time_hours}h` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="pt-3 text-[10px] text-slate-400 italic text-right">
        * Observed comparison across AI agents — not causal evidence
      </div>
    </div>
  );
}
