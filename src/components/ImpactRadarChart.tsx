import { useState } from 'react';
import { RADAR_DATA } from '../mockData';
import { ToolIconRenderer } from './ToolIcons';

export function ImpactRadarChart() {
  const [activeSeries, setActiveSeries] = useState<{ [key: string]: boolean }>({
    copilot: true,
    cursor: true,
    gemini: true,
    sourcegraph: true,
  });

  const tools = [
    { id: 'copilot', name: 'GitHub Copilot', color: '#8b5cf6', stroke: '#8b5cf6' },
    { id: 'cursor', name: 'Cursor', color: '#f97316', stroke: '#f97316' },
    { id: 'gemini', name: 'Gemini', color: '#3b82f6', stroke: '#3b82f6' },
    { id: 'sourcegraph', name: 'Sourcegraph', color: '#eab308', stroke: '#eab308' },
  ];

  const toggleTool = (id: string) => {
    setActiveSeries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Dimensions
  const cx = 150;
  const cy = 135;
  const maxRadius = 100;
  const totalAxes = RADAR_DATA.length; // 9

  // Helper to get (x, y) for an axis index and value (0 - 100)
  const getCoordinates = (axisIndex: number, value: number) => {
    const angle = (axisIndex * (2 * Math.PI)) / totalAxes - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric web circles / polygons for 20, 40, 60, 80, 100
  const levels = [25, 50, 75, 100];
  const gridPolygons = levels.map((lvl) => {
    const points = RADAR_DATA.map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x},${y}`;
    }).join(' ');
    return points;
  });

  // Calculate polygon points for each tool
  const getToolPolygonPoints = (toolId: 'copilot' | 'cursor' | 'gemini' | 'sourcegraph') => {
    return RADAR_DATA.map((item, i) => {
      const val = item[toolId];
      const { x, y } = getCoordinates(i, val);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div
      id="impact-radar-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      <h2 className="text-base font-bold text-slate-800 tracking-tight mb-2">
        Impact vs. No Tool
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
        {/* Radar SVG */}
        <div className="sm:col-span-8 flex justify-center">
          <svg viewBox="0 0 300 280" className="w-full max-w-[280px] h-auto overflow-visible">
            {/* Concentric grid lines */}
            {gridPolygons.map((points, idx) => (
              <polygon
                key={idx}
                points={points}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

            {/* Axis radii */}
            {RADAR_DATA.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axis labels */}
            {RADAR_DATA.map((item, i) => {
              const { x, y } = getCoordinates(i, 118);
              return (
                <text
                  key={item.axis}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-400 text-[9px] font-medium select-none"
                >
                  {item.axis}
                </text>
              );
            })}

            {/* Polygons for each active tool */}
            {tools.map((t) => {
              if (!activeSeries[t.id]) return null;
              const points = getToolPolygonPoints(
                t.id as 'copilot' | 'cursor' | 'gemini' | 'sourcegraph'
              );

              return (
                <g key={t.id} className="transition-all duration-300">
                  <polygon
                    points={points}
                    fill={t.color}
                    fillOpacity="0.22"
                    stroke={t.stroke}
                    strokeWidth="1.75"
                  />
                  {RADAR_DATA.map((item, i) => {
                    const val = item[t.id as 'copilot' | 'cursor' | 'gemini' | 'sourcegraph'];
                    const { x, y } = getCoordinates(i, val);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill={t.stroke}
                        className="transition-all"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend on the right */}
        <div className="sm:col-span-4 space-y-2.5 text-xs">
          {tools.map((tool) => {
            const isActive = activeSeries[tool.id];

            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`w-full flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-slate-200/90 bg-slate-50/50 text-slate-800 font-semibold'
                    : 'border-transparent text-slate-400 opacity-50 hover:opacity-80'
                }`}
              >
                <div className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: tool.stroke }} />
                <ToolIconRenderer id={tool.id} className="w-4 h-4 shrink-0" />
                <span className="truncate">{tool.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
