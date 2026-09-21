import { useState, useEffect } from 'react';
import { api } from '../api';
import { ExplainResponse, PullRequest } from '../types';
import { Sparkles, Bot, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectedPr?: PullRequest | null;
}

export function AIInsightsModal({ isOpen, onClose, inspectedPr }: AIInsightsModalProps) {
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<string>('holistic overview');
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (focusTopic = focus) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.explainMetrics(
        inspectedPr ? `pull request #${inspectedPr.number}` : focusTopic
      );
      setExplanation(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate explanation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateInsights(focus);
    }
  }, [isOpen, inspectedPr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="ai-insights-modal"
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  Gemini Grounded Explanation Layer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  Strictly Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Observational summaries directly synthesized from verified dataset metrics & ML clusters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focus Selector */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Focus:</span>
            {['holistic overview', 'ai_impact', 'tool_benchmarks', 'developer_workflow'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFocus(f);
                  generateInsights(f);
                }}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                  focus === f
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => generateInsights(focus)}
            disabled={loading}
            className="flex items-center gap-1.5 text-purple-700 font-semibold hover:text-purple-800 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-600">
                Synthesizing dataset telemetry with Gemini...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Grounding Guarantee: Numbers and cluster centroids are derived directly from verified Parquet telemetry.
                </span>
              </div>

              {/* Render explanation markdown */}
              <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-3">
                {explanation?.explanation.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4 key={idx} className="text-sm font-bold text-slate-900 pt-2 border-b border-slate-100 pb-1">
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  return (
                    <div key={idx} className="text-slate-700 whitespace-pre-line">
                      {paragraph}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Engine: {explanation?.source || 'Gemini 2.0 Flash'}</span>
          <span>{explanation?.grounding_status || 'Strictly grounded'}</span>
        </div>
      </div>
    </div>
  );
}
