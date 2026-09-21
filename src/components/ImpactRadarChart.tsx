import { useState } from 'react';
import { AIToolMetric } from '../types';
import { ToolIconRenderer } from './ToolIcons';

interface ImpactRadarChartProps {
  tools?: AIToolMetric[];
}

export function ImpactRadarChart({ tools = [] }: ImpactRadarChartProps) {
  const activeTools = tools.filter((t) => t.agent !== 'Non-AI').slice(0, 4);

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  const [activeSeries, setActiveSeries] = useState<{ [key: string]: boolean }>({});

  const isToolActive = (agent: string) => {
    return activeSeries[agent] !== false; // default true
  };

  const toggleTool = (agent: string) => {
    setActiveSeries((prev) => ({
      ...prev,
      [agent]: prev[agent] === false ? true : false,
    }));
  };

  const axes = [
    { label: 'Merge Acceptance', key: 'merge_rate', max: 100 },
    { label: 'Volume Share', key: 'pr_percentage', max: 60 },
    { label: 'Cycle Efficiency', key: 'cycle_eff', max: 100 },
    { label: 'Review Speed', key: 'review_eff', max: 100 },
  ];

  const cx = 140;
  const cy = 130;
  const maxRadius = 85;
  const totalAxes = axes.length;

  const getCoordinates = (axisIndex: number, valuePct: number) => {
    const angle = (axisIndex * (2 * Math.PI)) / totalAxes - Math.PI / 2;
    const r = (Math.min(100, Math.max(10, valuePct)) / 100) * maxRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  const levels = [25, 50, 75, 100];
  const gridPolygons = levels.map((lvl) => {
    return axes
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x},${y}`;
      })
      .join(' ');
  });

  const getNormalizedValue = (tool: AIToolMetric, axisIdx: number) => {
    if (axisIdx === 0) return tool.merge_rate; // 0 - 100
    if (axisIdx === 1) return (tool.pr_percentage / 60) * 100; // normalized
    if (axisIdx === 2) {
      // Faster cycle = higher score
      const cycle = tool.avg_cycle_time_hours ?? 50;
      return Math.max(10, 100 - (cycle / 100) * 100);
    }
    if (axisIdx === 3) {
      const rev = tool.avg_review_time_hours ?? 40;
      return Math.max(10, 100 - (rev / 60) * 100);
    }
    return 50;
  };

  return (
    <div
      id="impact-radar-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          AI Tool Dimension Profile
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Multi-axis comparison</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
        {/* Radar SVG */}
        <div className="sm:col-span-7 flex justify-center">
          <svg viewBox="0 0 280 260" className="w-full max-w-[260px] h-auto overflow-visible">
            {/* Grid */}
            {gridPolygons.map((points, idx) => (
              <polygon
                key={idx}
                points={points}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

            {/* Axes */}
            {axes.map((axis, i) => {
              const { x, y } = getCoordinates(i, 100);
              const labelCoord = getCoordinates(i, 120);
              return (
                <g key={axis.label}>
                  <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                  <text
                    x={labelCoord.x}
                    y={labelCoord.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] fill-slate-500 font-semibold"
                  >
                    {axis.label}
                  </text>
                </g>
              );
            })}

            {/* Polygons */}
            {activeTools.map((tool, idx) => {
              if (!isToolActive(tool.agent)) return null;
              const color = colors[idx % colors.length];
              const points = axes
                .map((_, aIdx) => {
                  const val = getNormalizedValue(tool, aIdx);
                  const { x, y } = getCoordinates(aIdx, val);
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <polygon
                  key={tool.agent}
                  points={points}
                  fill={color}
                  fillOpacity="0.18"
                  stroke={color}
                  strokeWidth="2"
                  className="transition-all"
                />
              );
            })}
          </svg>
        </div>

        {/* Legend / Toggles */}
        <div className="sm:col-span-5 space-y-2">
          {activeTools.map((tool, idx) => {
            const active = isToolActive(tool.agent);
            const color = colors[idx % colors.length];

            return (
              <button
                key={tool.agent}
                onClick={() => toggleTool(tool.agent)}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-50/80 border-slate-200 text-slate-800'
                    : 'bg-white border-dashed border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <ToolIconRenderer id={tool.agent.toLowerCase()} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tool.agent.replace('_', ' ')}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono ml-1">
                  {tool.merge_rate}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
