import { useState } from 'react';
import { THROUGHPUT_BENCHMARKS } from '../mockData';
import { ToolIconRenderer } from './ToolIcons';
import { ArrowUp } from 'lucide-react';

export function CombinedThroughputCard() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  // Axis ranges from -10% to +30% (total span = 40%)
  const minVal = -10;
  const maxVal = 30;
  const range = maxVal - minVal;

  const getPositionPercent = (val: number) => {
    return ((val - minVal) / range) * 100;
  };

  const zeroPos = getPositionPercent(0);

  return (
    <div
      id="combined-throughput-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <h2 className="text-base font-bold text-slate-800 tracking-tight mb-4">
        Combined Throughput
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-6">
        {/* Left: Metric Callout */}
        <div className="sm:col-span-4 space-y-1 pl-1">
          <div className="flex items-center text-4xl font-extrabold text-emerald-600 tracking-tight">
            <ArrowUp className="w-8 h-8 stroke-[3] -ml-1" />
            <span>15%</span>
          </div>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            increase in avg PRs per user
          </p>
        </div>

        {/* Right: Axis Dot Plot */}
        <div className="sm:col-span-8 flex flex-col justify-center px-4 py-2">
          {/* Chart area */}
          <div className="relative w-full h-20 flex items-center">
            {/* Main horizontal axis line */}
            <div className="absolute left-0 right-0 h-0.5 bg-slate-300 top-1/2 -translate-y-1/2" />

            {/* Zero vertical baseline */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
              style={{ left: `${zeroPos}%` }}
            />

            {/* Plotted tool nodes */}
            {THROUGHPUT_BENCHMARKS.map((item) => {
              const leftPos = getPositionPercent(item.percentChange);
              const isHovered = hoveredTool === item.id;

              return (
                <div
                  key={item.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-all duration-200"
                  style={{ left: `${leftPos}%` }}
                  onMouseEnter={() => setHoveredTool(item.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <div
                    className={`p-1 rounded-lg bg-white border-2 shadow-sm transition-transform ${
                      isHovered
                        ? 'scale-125 ring-2 ring-purple-400 border-purple-600 z-20'
                        : 'border-slate-300 hover:border-slate-500 z-10'
                    }`}
                  >
                    <ToolIconRenderer id={item.id} className="w-4 h-4" />
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-md whitespace-nowrap z-30">
                      {item.name}: {item.percentChange > 0 ? `+${item.percentChange}%` : `${item.percentChange}%`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tick Labels */}
          <div className="relative w-full flex justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>-10%</span>
            <span style={{ position: 'absolute', left: `${zeroPos}%`, transform: 'translateX(-50%)' }}>
              0%
            </span>
            <span style={{ position: 'absolute', left: `${getPositionPercent(10)}%`, transform: 'translateX(-50%)' }}>
              10%
            </span>
            <span style={{ position: 'absolute', left: `${getPositionPercent(20)}%`, transform: 'translateX(-50%)' }}>
              20%
            </span>
            <span>30%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
