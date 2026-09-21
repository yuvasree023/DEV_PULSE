import { useState } from 'react';
import { OperationalImpactCard } from './OperationalImpactCard';
import { AdoptionCard } from './AdoptionCard';
import { CombinedThroughputCard } from './CombinedThroughputCard';
import { ToolComparisonTable } from './ToolComparisonTable';
import { ImpactRadarChart } from './ImpactRadarChart';
import { OPERATIONAL_IMPACTS } from '../mockData';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ToolIconRenderer } from './ToolIcons';

interface CrossToolImpactViewProps {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  onOpenAiInsights: () => void;
}

export function CrossToolImpactView({
  selectedTool,
  onSelectTool,
  onOpenAiInsights,
}: CrossToolImpactViewProps) {
  const [activeDrilldown, setActiveDrilldown] = useState<string | null>(null);

  const selectedToolObj = OPERATIONAL_IMPACTS.find((t) => t.id === selectedTool);

  return (
    <div className="space-y-6">
      {/* Header with Title and AI Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cross-Tool Impact
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic velocity, adoption, and capacity ROI across enterprise developer AI assistants
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiInsights}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100/80 border border-purple-200/80 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Generate Executive AI Brief</span>
          </button>
        </div>
      </div>

      {/* Row 1: Operational Impact (4 Cards) */}
      <OperationalImpactCard
        tools={OPERATIONAL_IMPACTS}
        selectedToolId={selectedTool}
        onSelectTool={(id) => {
          onSelectTool(id);
          setActiveDrilldown(id);
        }}
      />

      {/* Row 2: Adoption + Combined Throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdoptionCard />
        <CombinedThroughputCard />
      </div>

      {/* Row 3: Tool Comparison (Heatmap Table) + Impact vs. No Tool (Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToolComparisonTable
          selectedToolId={selectedTool}
          onSelectTool={(id) => {
            onSelectTool(id);
            setActiveDrilldown(id);
          }}
        />
        <ImpactRadarChart />
      </div>

      {/* Optional Contextual Tool Drilldown Pill/Card if a specific tool is selected */}
      {selectedToolObj && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 to-indigo-50/60 border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ToolIconRenderer id={selectedToolObj.id} className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedToolObj.name} AI Impact Focus
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  +{selectedToolObj.impactPercent}% Cycle Acceleration
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedToolObj.subtext} • High test-coverage generation & automated code review triage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onOpenAiInsights}
              className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Diagnose Bottlenecks with Gemini</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
