import { useState } from 'react';
import { AIToolMetric } from '../types';

interface AdoptionCardProps {
  tools?: AIToolMetric[];
  aiPercentage?: number;
}

export function AdoptionCard({ tools = [], aiPercentage = 100 }: AdoptionCardProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#94a3b8'];

  // Construct slices from real tools
  const dataItems = tools.length > 0
    ? tools.slice(0, 5).map((t, idx) => ({
        category: t.agent,
        percentage: t.pr_percentage,
        color: colors[idx % colors.length],
      }))
    : [
        { category: 'AI-Assisted', percentage: aiPercentage, color: '#8b5cf6' },
        { category: 'Non-AI', percentage: Math.max(0, 100 - aiPercentage), color: '#e2e8f0' },
      ];

  const total = dataItems.reduce((acc, curr) => acc + curr.percentage, 0) || 1;
  let cumulativeAngle = 0;

  const radius = 64;
  const innerRadius = 26; // donut hole
  const cx = 80;
  const cy = 80;

  const slices = dataItems.map((item) => {
    const sliceAngle = (item.percentage / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Convert angles to radians (offset by -90 deg)
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      pathData,
      isHovered: hoveredCategory === item.category,
    };
  });

  return (
    <div
      id="adoption-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          AI Tool PR Share
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Observed %</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
        {/* Left: Big Metric */}
        <div className="space-y-1 pl-1">
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {aiPercentage}%
          </div>
          <p className="text-xs font-medium text-slate-500 max-w-[200px] leading-relaxed">
            of pull requests in the dataset are authored with AI agent metadata
          </p>
        </div>

        {/* Right: Donut Chart + Legend */}
        <div className="flex items-center justify-between sm:justify-end gap-5">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-45 drop-shadow-xs">
              {slices.map((slice) => (
                <path
                  key={slice.category}
                  d={slice.pathData}
                  fill={slice.color}
                  className="transition-all duration-200 cursor-pointer hover:opacity-90 hover:scale-[1.03] origin-center"
                  onMouseEnter={() => setHoveredCategory(slice.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs font-medium max-w-[140px] truncate">
            {dataItems.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900"
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.category}</span>
                <span className="text-slate-400 text-[11px] ml-auto">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
