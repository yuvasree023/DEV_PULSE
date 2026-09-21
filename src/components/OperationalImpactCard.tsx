import { AIToolMetric } from '../types';
import { ToolIconRenderer } from './ToolIcons';
import { Bot, GitPullRequest, CheckCircle2 } from 'lucide-react';

interface OperationalImpactCardProps {
  tools: AIToolMetric[];
  selectedToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function OperationalImpactCard({
  tools,
  selectedToolId,
  onSelectTool,
}: OperationalImpactCardProps) {
  const displayTools = tools.filter((t) => t.agent !== 'Non-AI').slice(0, 4);

  return (
    <div
      id="operational-impact-section"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            AI Tool Distribution & Observed Penetration
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Observed PR counts from dataset
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayTools.map((tool) => {
          const isSelected = selectedToolId?.toLowerCase() === tool.agent.toLowerCase();

          return (
            <div
              key={tool.agent}
              id={`op-card-${tool.agent.toLowerCase()}`}
              onClick={() => onSelectTool && onSelectTool(tool.agent)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/40 ring-1 ring-purple-300'
                  : 'border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <ToolIconRenderer id={tool.agent.toLowerCase()} className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 leading-tight">
                    {tool.agent.replace('_', ' ')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-0.5 font-medium">
                      <GitPullRequest className="w-3 h-3 text-slate-400" />
                      {tool.pr_count.toLocaleString()} PRs
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-bold text-purple-700">
                  {tool.pr_percentage}%
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-end gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {tool.merge_rate}% merged
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
