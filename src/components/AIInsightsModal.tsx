import { useState } from 'react';
import { GeminiInsight, BlockerAnalysis, PullRequest } from '../types';
import { Sparkles, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedPr?: PullRequest | null;
}

export function AIInsightsModal({ isOpen, onClose, blockedPr }: AIInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<'ai_impact' | 'team' | 'language'>('ai_impact');
  const [insight, setInsight] = useState<GeminiInsight>({
    focus: 'ai_impact',
    generated_at: new Date().toISOString(),
    summary: `Executive Productivity & AI Impact Summary\n\n• Cycle Time Reduction: Engineering teams adopting Copilot and Cursor are merging PRs 57.3% faster (18.2h vs 42.6h human baseline).\n• First-Review Turnaround: AI pull requests reach first review completion in 2.8 hours, cutting idle queue times by more than half.\n• Merge Acceptance: AI-assisted PRs achieve a 79.8% merge rate, confirming sustained code quality alongside velocity gains.\n• Bottleneck Analysis: The primary review latency occurs on pull requests exceeding 400 lines of code without automated test assertions.`,
    recommendations: [
      'Incorporate automated AI test generation in Copilot prompts to eliminate changes-requested cycles.',
      'Deploy reviewer notifications for PRs stagnant in "Changes Requested" for more than 48 hours.',
      'Standardize Cursor rules across repositories with Rust and Java backends to close the adoption gap.',
    ],
  });

  const blockerResult: BlockerAnalysis | null = blockedPr
    ? {
        pr_id: blockedPr.id,
        blocker_summary:
          blockedPr.reviews && blockedPr.reviews.length > 0
            ? (blockedPr.reviews[blockedPr.reviews.length - 1].body ?? 'Review changes requested.')
            : 'Deadlock risk detected: Lock ordering inverted compared to cluster mutex standards.',
        severity: 'high',
        suggested_action:
          'Enforce canonical lock acquisition order in distributed transaction coordinator and add concurrency test.',
      }
    : null;

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setInsight({
        focus,
        generated_at: new Date().toISOString(),
        summary: `Updated Gemini 2.0 Flash Insights (${focus.replace('_', ' ').toUpperCase()})\n\nTelemetry across 500 pull requests shows accelerating returns from AI pair-programming tools. Teams utilizing Cursor in TypeScript and Go repositories are sustaining 32 PRs merged/week with zero regression spikes.`,
        recommendations: [
          'Enable Copilot Workspace for architectural PR reviews.',
          'Address the 2 blocked PRs in distributed-event-bus to normalize sprint velocity.',
          'Schedule automated weekly executive reports directly from the /api/v1/analytics/kpis endpoint.',
        ],
      });
      setLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="ai-insights-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Gemini 2.0 Flash AI Insights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generated via Google Gemini 2.0 Flash service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {blockedPr && blockerResult && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Blocker Analysis: PR #{blockedPr.number}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {blockerResult.severity} severity
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {blockerResult.blocker_summary}
              </p>
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">Suggested Action: </span>
                {blockerResult.suggested_action}
              </div>
            </div>
          )}

          {/* Focus Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Insight Focus:</span>
            {(['ai_impact', 'team', 'language'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                  focus === f
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Insight Content */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {insight.summary}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Actionable Recommendations:
              </h4>
              <ul className="space-y-1.5">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400">
            Generated: {new Date(insight.generated_at).toLocaleTimeString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Querying Gemini...' : 'Regenerate Insights'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
