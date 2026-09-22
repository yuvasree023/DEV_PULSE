import { useState } from 'react';
import { RADAR_DATA } from '../mockData';
import { CopilotIcon, CursorIcon, GeminiIcon, SourcegraphIcon } from './ToolIcons';

interface ToolConfig {
  key: 'copilot' | 'cursor' | 'gemini' | 'sourcegraph';
  label: string;
  color: string;
  fill: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolConfig[] = [
  {
    key: 'copilot',
    label: 'GitHub Copilot',
    color: '#8b5cf6', // purple
    fill: 'rgba(139, 92, 246, 0.18)',
    icon: CopilotIcon,
  },
  {
    key: 'cursor',
    label: 'Cursor',
    color: '#ea580c', // brown/orange
    fill: 'rgba(234, 88, 12, 0.18)',
    icon: CursorIcon,
  },
  {
    key: 'gemini',
    label: 'Gemini',
    color: '#3b82f6', // blue
    fill: 'rgba(59, 130, 246, 0.18)',
    icon: GeminiIcon,
  },
  {
    key: 'sourcegraph',
    label: 'Sourcegraph',
    color: '#eab308', // yellow/gold
    fill: 'rgba(234, 179, 8, 0.18)',
    icon: SourcegraphIcon,
  },
];

interface ImpactVsNoToolCardProps {
  onToggleView?: () => void;
  activeView?: 'radar' | 'throughput';
}

export function ImpactVsNoToolCard({ onToggleView, activeView = 'radar' }: ImpactVsNoToolCardProps) {
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>({
    copilot: true,
    cursor: true,
    gemini: true,
    sourcegraph: true,
  });

  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  const toggleTool = (key: string) => {
    setActiveTools((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const cx = 175;
  const cy = 155;
  const maxRadius = 100;
  const totalAxes = RADAR_DATA.length; // 9 axes

  // Calculate coordinates for a point on a given axis index with a 0-100 percentage
  const getCoordinates = (axisIndex: number, valuePct: number) => {
    // Start at -PI/2 (top at 12 o'clock for 'Investment') and rotate clockwise
    const angle = (axisIndex * (2 * Math.PI)) / totalAxes - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, valuePct)) / 100) * maxRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon background levels (20%, 40%, 60%, 80%, 100%)
  const levels = [20, 40, 60, 80, 100];
  const gridRings = levels.map((lvl) => {
    return RADAR_DATA.map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x},${y}`;
    }).join(' ');
  });

  // Calculate Polygon points for a specific tool
  const getPolygonPoints = (toolKey: 'copilot' | 'cursor' | 'gemini' | 'sourcegraph') => {
    return RADAR_DATA.map((d, i) => {
      const val = d[toolKey];
      const { x, y } = getCoordinates(i, val);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div
      id="impact-vs-no-tool-card"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
    >
      {/* Header with Title and Optional Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Impact vs. No Tool
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Multi-dimension engineering impact vs baseline
          </p>
        </div>

        {onToggleView && (
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
            <button
              onClick={() => activeView !== 'radar' && onToggleView()}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                activeView === 'radar'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Radar Profile
            </button>
            <button
              onClick={() => activeView !== 'throughput' && onToggleView()}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                activeView === 'throughput'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Throughput
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: Radar SVG on left, Clean Legend on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 my-auto">
        {/* Radar Graphic */}
        <div className="md:col-span-8 flex items-center justify-center relative py-2">
          <svg
            viewBox="0 0 350 310"
            className="w-full max-w-[340px] sm:max-w-[370px] h-auto overflow-visible select-none"
          >
            {/* Concentric Grid Rings */}
            {gridRings.map((points, idx) => (
              <polygon
                key={idx}
                points={points}
                fill={idx % 2 === 0 ? 'rgba(248, 250, 252, 0.6)' : 'none'}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={idx === levels.length - 1 ? 'none' : '2,2'}
              />
            ))}

            {/* Radial Spokes & Axis Labels */}
            {RADAR_DATA.map((d, i) => {
              const spokeEnd = getCoordinates(i, 100);
              const labelPos = getCoordinates(i, 120);
              const isHovered = hoveredAxis === d.axis;

              return (
                <g key={d.axis} className="transition-all">
                  <line
                    x1={cx}
                    y1={cy}
                    x2={spokeEnd.x}
                    y2={spokeEnd.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    onMouseEnter={() => setHoveredAxis(d.axis)}
                    onMouseLeave={() => setHoveredAxis(null)}
                    className={`text-[10px] transition-colors cursor-pointer ${
                      isHovered
                        ? 'fill-purple-700 font-bold text-[11px]'
                        : 'fill-slate-500 font-medium'
                    }`}
                  >
                    {d.axis}
                  </text>
                </g>
              );
            })}

            {/* Shaded Tool Polygons */}
            {TOOLS.map((tool) => {
              if (!activeTools[tool.key]) return null;

              const isHighlighted = hoveredTool === tool.key;
              const hasHover = hoveredTool !== null;
              const points = getPolygonPoints(tool.key);

              return (
                <polygon
                  key={tool.key}
                  points={points}
                  fill={tool.fill}
                  stroke={tool.color}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                  style={{
                    opacity: hasHover ? (isHighlighted ? 1 : 0.25) : 0.9,
                  }}
                />
              );
            })}

            {/* Vertex Dots on Highlighting */}
            {TOOLS.map((tool) => {
              if (!activeTools[tool.key]) return null;
              if (hoveredTool !== null && hoveredTool !== tool.key) return null;

              return RADAR_DATA.map((d, i) => {
                const val = d[tool.key];
                const pt = getCoordinates(i, val);
                const isAxisHovered = hoveredAxis === d.axis;

                return (
                  <circle
                    key={`${tool.key}-${d.axis}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isAxisHovered ? 4 : 2.5}
                    fill={tool.color}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className="transition-all"
                  />
                );
              });
            })}
          </svg>

          {/* Active Axis Scores Tooltip when hovering an axis label */}
          {hoveredAxis && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-20 flex items-center gap-3 border border-slate-700">
              <span className="font-bold text-slate-200">{hoveredAxis}:</span>
              {TOOLS.map((tool) => {
                const row = RADAR_DATA.find((r) => r.axis === hoveredAxis);
                const score = row ? row[tool.key] : 0;
                return (
                  <div key={tool.key} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tool.color }}
                    />
                    <span className="text-slate-300">{tool.label.split(' ')[0]}:</span>
                    <span className="font-bold">{score}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend Exactly as Displayed in Attached Image */}
        <div className="md:col-span-4 flex flex-col justify-center space-y-3.5 pl-2">
          {TOOLS.map((tool) => {
            const IconComponent = tool.icon;
            const isEnabled = activeTools[tool.key];
            const isHovered = hoveredTool === tool.key;

            return (
              <div
                key={tool.key}
                onClick={() => toggleTool(tool.key)}
                onMouseEnter={() => setHoveredTool(tool.key)}
                onMouseLeave={() => setHoveredTool(null)}
                className={`flex items-center gap-3 p-1.5 rounded-xl transition-all cursor-pointer select-none ${
                  isHovered ? 'bg-slate-50 shadow-2xs' : 'hover:bg-slate-50/70'
                } ${!isEnabled ? 'opacity-40 line-through' : ''}`}
              >
                {/* Horizontal Colored Dash Line (matching attached image) */}
                <div
                  className="w-5 h-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: tool.color }}
                />

                {/* Rounded Icon Box */}
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs shrink-0">
                  <IconComponent className="w-full h-full" />
                </div>

                {/* Tool Name */}
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {tool.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
