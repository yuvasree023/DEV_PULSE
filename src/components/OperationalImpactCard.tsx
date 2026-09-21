import { ToolOperationalImpact } from '../types';
import { ToolIconRenderer } from './ToolIcons';
import { Rocket, ArrowUp } from 'lucide-react';

interface OperationalImpactCardProps {
  tools: ToolOperationalImpact[];
  selectedToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function OperationalImpactCard({
  tools,
  selectedToolId,
  onSelectTool,
}: OperationalImpactCardProps) {
  return (
    <div
      id="operational-impact-section"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
          <Rocket className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Operational Impact
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const isSelected = selectedToolId === tool.id;

          return (
            <div
              key={tool.id}
              id={`op-card-${tool.id}`}
              onClick={() => onSelectTool && onSelectTool(tool.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/30 ring-1 ring-purple-300'
                  : 'border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <ToolIconRenderer id={tool.id} className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 leading-tight">
                    {tool.name}
                  </h3>
                  {/* Subtle placeholder bar / subtext as seen in screenshot */}
                  <div className="mt-1 h-2 w-16 bg-slate-200/80 rounded-full" />
                </div>
              </div>

              <div className="flex items-center gap-0.5 text-emerald-600 font-bold text-xl tracking-tight">
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                <span>{tool.impactPercent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
