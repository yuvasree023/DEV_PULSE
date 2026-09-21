import { useState } from 'react';
import { ADOPTION_DISTRIBUTION } from '../mockData';

export function AdoptionCard() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Calculate SVG pie slices
  const total = ADOPTION_DISTRIBUTION.reduce((acc, curr) => acc + curr.percentage, 0);
  let cumulativeAngle = 0;

  const radius = 64;
  const innerRadius = 26; // donut hole
  const cx = 80;
  const cy = 80;

  const slices = ADOPTION_DISTRIBUTION.map((item) => {
    const sliceAngle = (item.percentage / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Convert angles to radians (offset by -90 deg so it starts from 12 o'clock)
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
      <h2 className="text-base font-bold text-slate-800 tracking-tight mb-4">
        Adoption
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
        {/* Left: Big Metric */}
        <div className="space-y-1 pl-1">
          <div className="text-5xl font-extrabold text-slate-900 tracking-tight">
            70%
          </div>
          <p className="text-xs font-medium text-slate-500 max-w-[180px] leading-relaxed">
            of developers are actively using at least 1 AI tool
          </p>
        </div>

        {/* Right: Donut Chart + Legend */}
        <div className="flex items-center justify-between sm:justify-end gap-5">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
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
          <div className="space-y-2 text-xs font-medium">
            {ADOPTION_DISTRIBUTION.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900"
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <span
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className={hoveredCategory === item.category ? 'font-bold text-slate-900' : ''}>
                  {item.category}
                </span>
                {hoveredCategory === item.category && (
                  <span className="text-purple-600 font-bold ml-auto pl-1">
                    {item.percentage}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
