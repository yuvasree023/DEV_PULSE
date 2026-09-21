import { Zap, Clock, TrendingUp, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { SAMPLE_PRS } from '../mockData';
import { PullRequest } from '../types';

interface MaximizeImpactViewProps {
  onInspectPr: (pr: PullRequest) => void;
  onOpenAiInsights: () => void;
}

export function MaximizeImpactView({ onInspectPr, onOpenAiInsights }: MaximizeImpactViewProps) {
  const blockedPrs = SAMPLE_PRS.filter(
    (pr) => pr.latest_review_state === 'CHANGES_REQUESTED' || (pr.cycle_time_hours || 0) > 40
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Maximize Delivery Impact
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pinpoint cycle time latency, eliminate code review bottlenecks, and automate triage with Gemini AI
          </p>
        </div>

        <button
          onClick={onOpenAiInsights}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:from-purple-700 hover:to-indigo-700 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Run Gemini Impact Analysis</span>
        </button>
      </div>

      {/* Impact Multipliers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-purple-600" /> Cycle Time Accelerated
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">18.2 hrs</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            57.3% faster than human baseline (42.6h)
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-500" /> Review Turnaround
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">3.4 hrs</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Reduced by 6.1 hrs via automated summaries
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Merge Acceptance Rate
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">91.4%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Zero degradation in production rollbacks
          </div>
        </div>
      </div>

      {/* Latency / Blocker Alert List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              PRs Requiring AI Intervention & Review Unblocking
            </h3>
          </div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
            {blockedPrs.length} High-Latency Items
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {blockedPrs.map((pr) => (
            <div
              key={pr.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-700">#{pr.number}</span>
                  <h4 className="text-xs font-semibold text-slate-900">{pr.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                    {pr.agent ? `${pr.agent} assisted` : 'human'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Author: <strong className="text-slate-700">{pr.user}</strong> • Cycle latency: <span className="text-amber-600 font-semibold">{pr.cycle_time_hours}h</span> • State: {pr.latest_review_state || 'Review Pending'}
                </p>
              </div>

              <button
                onClick={() => onInspectPr(pr)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/80 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Diagnose with Gemini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
