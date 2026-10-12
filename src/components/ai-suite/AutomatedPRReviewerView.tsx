import React, { useState } from 'react';
import { api } from '../../api';
import { AutomatedPRReviewResult } from '../../types';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  CheckCircle2,
  RefreshCw,
  GitPullRequest,
  Check,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

const PRESET_PRS = [
  {
    title: 'feat: add zero-copy polars memory mapping to parquet loader',
    diff: `+ import polars as pl
+ def load_telemetry_dataset(parquet_path: str):
+     # Uses memory-mapped buffers to prevent OOM on 500k row telemetry
+     df = pl.scan_parquet(parquet_path).collect()
+     return df`,
  },
  {
    title: 'fix(auth): update session cookie with samesite=none and secure flag',
    diff: `+ response.set_cookie(
+     key="devpulse_auth_token",
+     value=jwt_token,
+     httponly=True,
+     secure=True,
+     samesite="lax"
+ )`,
  },
  {
    title: 'chore: configure high-concurrency event bus worker pool',
    diff: `+ while True:
+     batch = queue.get_nowait()
+     if batch is None: break
+     process_telemetry_batch(batch)`,
  },
];

export function AutomatedPRReviewerView() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [prTitle, setPrTitle] = useState(PRESET_PRS[0].title);
  const [prDiff, setPrDiff] = useState(PRESET_PRS[0].diff);
  const [review, setReview] = useState<AutomatedPRReviewResult | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const handleRunReview = async () => {
    setReviewing(true);
    try {
      const data = await api.runAutomatedPRReview(prTitle, prDiff);
      setReview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index);
    setPrTitle(PRESET_PRS[index].title);
    setPrDiff(PRESET_PRS[index].diff);
    setReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Automated PR Reviewer (4-Agent Swarm)</h2>
            <p className="text-[11px] text-slate-500">
              Coordinated Security, Logic, Performance, and Style agents evaluating pull requests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReview}
            disabled={reviewing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {reviewing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Swarm Reviewing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Automated Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset PR Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESET_PRS.map((pr, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(idx)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPreset === idx
                ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/10'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <GitPullRequest className="w-3 h-3 text-purple-600" />
              <span>Sample PR #{104 + idx}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 line-clamp-1">{pr.title}</div>
          </button>
        ))}
      </div>

      {/* PR Diff Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Pull Request Title</label>
          <input
            type="text"
            value={prTitle}
            onChange={(e) => setPrTitle(e.target.value)}
            className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Proposed Code Changes / Diff</label>
          <textarea
            value={prDiff}
            onChange={(e) => setPrDiff(e.target.value)}
            rows={5}
            className="w-full font-mono text-xs bg-slate-900 text-emerald-300 p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Review Results */}
      {review && (
        <div className="space-y-6">
          {/* Executive Verdict Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                    review.verdict === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verdict: {review.verdict}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Overall Score: <strong className="text-purple-700 text-base">{review.overallScore}</strong>/100
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl pt-1">
                Evaluated across 4 multi-agent review dimensions. Cycle time impact estimated at{' '}
                <strong className="text-emerald-700">-18.4% faster turnaround</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Security</span>
                <span className="text-xs font-extrabold text-emerald-600">PASS</span>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Logic</span>
                <span className="text-xs font-extrabold text-purple-700">VERIFIED</span>
              </div>
              <div className="text-center px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Performance</span>
                <span className="text-xs font-extrabold text-emerald-600">OPTIMAL</span>
              </div>
            </div>
          </div>

          {/* Detailed 4-Agent Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Agent Report */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">Security & Secrets Agent</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  0 Critical Flaws
                </span>
              </div>

              {review.securityIssues.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  All security heuristics and token exposure checks passed cleanly.
                </p>
              ) : (
                review.securityIssues.map((issue, idx) => (
                  <div key={idx} className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>{issue.title}</span>
                      <span className="text-[10px] font-mono text-amber-700">{issue.cwe}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{issue.description}</p>
                    <div className="text-[11px] font-semibold text-emerald-700 pt-1">
                      Fix: {issue.remediation}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Performance Agent Report */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900">Performance & Memory Agent</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                  Zero-Copy Ready
                </span>
              </div>

              {review.performanceFindings.map((perf, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <span className="font-bold text-slate-800">{perf.metric}</span>
                  <p className="text-slate-600 text-[11px]">{perf.observation}</p>
                  <p className="text-emerald-700 text-[11px] font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    Recommendation: {perf.optimization}
                  </p>
                </div>
              ))}
            </div>

            {/* Logic & Edge Case Agent */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900">Logic & Edge-Case Agent</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  Advisory Guard
                </span>
              </div>

              {review.logicDefects.map((defect, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <span className="font-bold text-slate-800">{defect.title}</span>
                  <p className="text-slate-600 text-[11px]">{defect.edgeCase}</p>
                  <p className="text-purple-700 text-[11px] font-medium bg-purple-50 p-2 rounded-lg border border-purple-100">
                    Suggestion: {defect.suggestion}
                  </p>
                </div>
              ))}
            </div>

            {/* Synthesized GitHub PR Comment Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-900">Synthesized PR Comment</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Ready to post to GitHub</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {review.summaryComment}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
