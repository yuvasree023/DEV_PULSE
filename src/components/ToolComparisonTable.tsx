import { TOOL_COMPARISONS } from '../mockData';
import { ToolIconRenderer } from './ToolIcons';

interface ToolComparisonTableProps {
  onSelectTool?: (toolId: string) => void;
  selectedToolId?: string;
}

export function ToolComparisonTable({
  onSelectTool,
  selectedToolId,
}: ToolComparisonTableProps) {
  // Styles corresponding to the heatmap tiles in the screenshot
  const getUsageStyle = (val: number) => {
    if (val >= 75) return 'bg-[#38b2ac] text-white';
    if (val >= 55) return 'bg-[#81e6d9] text-slate-900';
    if (val >= 35) return 'bg-[#b2f5ea] text-slate-800';
    return 'bg-[#feebc8] text-slate-800'; // light peach
  };

  const getVelocityStyle = (val: number) => {
    // Negative velocity = faster cycle times
    if (val <= -12) return 'bg-[#319795] text-white font-semibold';
    if (val <= -8) return 'bg-[#4fd1c5] text-slate-900';
    if (val <= -4) return 'bg-[#81e6d9] text-slate-900';
    return 'bg-slate-100 text-slate-600';
  };

  const getCapacityStyle = (val: number) => {
    if (val >= 10) return 'bg-[#38b2ac] text-white font-semibold';
    if (val >= 6) return 'bg-[#81e6d9] text-slate-900';
    if (val >= 3) return 'bg-[#b2f5ea] text-slate-800';
    return 'bg-slate-100 text-slate-600';
  };

  const getSentimentStyle = (val: number) => {
    if (val >= 80) return 'bg-[#38b2ac] text-white font-semibold';
    if (val >= 50) return 'bg-slate-200 text-slate-700';
    return 'bg-[#fed7d7] text-red-800'; // low sentiment soft red/coral
  };

  return (
    <div
      id="tool-comparison-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <h2 className="text-base font-bold text-slate-800 tracking-tight mb-4">
        Tool Comparison
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-slate-500">
              <th className="text-left font-medium pb-3 pl-1 w-44"></th>
              <th className="pb-3 px-2 font-medium">Usage</th>
              <th className="pb-3 px-2 font-medium">Velocity</th>
              <th className="pb-3 px-2 font-medium">Capacity</th>
              <th className="pb-3 px-2 font-medium">Sentiment</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {TOOL_COMPARISONS.map((row) => {
              const isSelected = selectedToolId === row.id;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectTool && onSelectTool(row.id)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected ? 'bg-purple-50/50' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-2 pl-1 text-left">
                    <div className="flex items-center gap-2.5">
                      <ToolIconRenderer id={row.id} className="w-6 h-6 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Usage cell */}
                  <td className="py-1.5 px-2">
                    <div
                      className={`h-11 w-14 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-transform group-hover:scale-105 ${getUsageStyle(
                        row.usage
                      )}`}
                    >
                      {row.usage}%
                    </div>
                  </td>

                  {/* Velocity cell */}
                  <td className="py-1.5 px-2">
                    <div
                      className={`h-11 w-14 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-transform group-hover:scale-105 ${getVelocityStyle(
                        row.velocity
                      )}`}
                    >
                      {row.velocity > 0 ? `+${row.velocity}%` : `${row.velocity}%`}
                    </div>
                  </td>

                  {/* Capacity cell */}
                  <td className="py-1.5 px-2">
                    <div
                      className={`h-11 w-14 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-transform group-hover:scale-105 ${getCapacityStyle(
                        row.capacity
                      )}`}
                    >
                      {row.capacity > 0 ? `+${row.capacity}%` : `${row.capacity}%`}
                    </div>
                  </td>

                  {/* Sentiment cell */}
                  <td className="py-1.5 px-2">
                    <div
                      className={`h-11 w-14 mx-auto rounded-lg flex items-center justify-center text-xs font-medium transition-transform group-hover:scale-105 ${getSentimentStyle(
                        row.sentiment
                      )}`}
                    >
                      {row.sentiment}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
