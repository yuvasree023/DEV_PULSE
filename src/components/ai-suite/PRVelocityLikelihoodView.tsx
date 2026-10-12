import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { PRVelocityLikelihoodResult } from '../../types';
import {
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Sliders,
  RefreshCw,
  GitPullRequest,
  BarChart3,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

const PRESET_PRS = [
  {
    name: 'Micro-Patch (Quick Fix)',
    size: 45,
    additions: 35,
    deletions: 10,
    files: 2,
    reviewers: 1,
    authorExp: 35,
    ciPass: true,
    descLen: 90,
  },
  {
    name: 'Standard Feature PR',
    size: 240,
    additions: 180,
    deletions: 60,
    files: 5,
    reviewers: 2,
    authorExp: 25,
    ciPass: true,
    descLen: 140,
  },
  {
    name: 'Monolithic Refactor (High Friction)',
    size: 890,
    additions: 680,
    deletions: 210,
    files: 28,
    reviewers: 1,
    authorExp: 8,
    ciPass: false,
    descLen: 30,
  },
];

export function PRVelocityLikelihoodView() {
  const [prSize, setPrSize] = useState(240);
  const [additions, setAdditions] = useState(180);
  const [deletions, setDeletions] = useState(60);
  const [filesChanged, setFilesChanged] = useState(5);
  const [reviewerCount, setReviewerCount] = useState(2);
  const [authorExp, setAuthorExp] = useState(25);
  const [ciPass, setCiPass] = useState(true);
  const [descLength, setDescLength] = useState(120);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PRVelocityLikelihoodResult | null>(null);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const res = await api.predictPRVelocityLikelihood({
        pr_size_lines: prSize,
        additions,
        deletions,
        files_changed: filesChanged,
        reviewer_count: reviewerCount,
        author_experience_prs: authorExp,
        has_ci_checks: ciPass,
        description_length: descLength,
      });
      setPrediction(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, [prSize, additions, deletions, filesChanged, reviewerCount, authorExp, ciPass, descLength]);

  const loadPreset = (preset: typeof PRESET_PRS[0]) => {
    setPrSize(preset.size);
    setAdditions(preset.additions);
    setDeletions(preset.deletions);
    setFilesChanged(preset.files);
    setReviewerCount(preset.reviewers);
    setAuthorExp(preset.authorExp);
    setCiPass(preset.ciPass);
    setDescLength(preset.descLen);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Preset Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                PR Velocity & Merge Likelihood Model
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                [ML-Powered]
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Predictive ML scoring estimating review latency (hours) and merge probability from code diff attributes
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Load Sample:</span>
          {PRESET_PRS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(preset)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Parameters vs ML Predictive Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Feature Inputs */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Input PR Features</span>
            </h3>
            <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
              Feature Vector (X)
            </span>
          </div>

          {/* Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Total Lines Changed</span>
              <span className="font-mono text-purple-700 font-bold">{prSize} lines</span>
            </div>
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={prSize}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setPrSize(val);
                setAdditions(Math.round(val * 0.75));
                setDeletions(Math.round(val * 0.25));
              }}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10 (Patch)</span>
              <span>500 (Moderate)</span>
              <span>1,500 (Bulk)</span>
            </div>
          </div>

          {/* Files Changed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Files Changed</span>
              <span className="font-mono text-slate-900 font-bold">{filesChanged} files</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={filesChanged}
              onChange={(e) => setFilesChanged(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Reviewers Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Assigned Reviewers</span>
              <span className="font-mono text-slate-900 font-bold">{reviewerCount} reviewers</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={reviewerCount}
              onChange={(e) => setReviewerCount(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Author Experience */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Author Historical Merged PRs</span>
              <span className="font-mono text-slate-900 font-bold">{authorExp} PRs</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={authorExp}
              onChange={(e) => setAuthorExp(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Boolean Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Automated CI Passing</span>
              <button
                type="button"
                onClick={() => setCiPass(!ciPass)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ciPass
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {ciPass ? 'Passing (All Green)' : 'Failing / Incomplete'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Description Length</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDescLength(30)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                    descLength < 50 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Brief
                </button>
                <button
                  type="button"
                  onClick={() => setDescLength(140)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                    descLength >= 50 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Predictive Scoring & SHAP Explanations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Scoring KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* KPI 1: Predicted Review Latency */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                <span>Predicted Review Latency</span>
                <Clock className="w-4 h-4 text-purple-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {prediction?.predictedReviewLatencyHours ?? '4.8'}
                </span>
                <span className="text-sm font-semibold text-purple-200">hours to merge</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-purple-200/80 flex items-center justify-between">
                <span>Benchmark: 14.2h median</span>
                <span className="text-emerald-300 font-bold">
                  {prediction && prediction.predictedReviewLatencyHours < 10 ? 'Accelerated' : 'High Turnaround'}
                </span>
              </div>
            </div>

            {/* KPI 2: Merge Likelihood Probability */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Merge Likelihood Probability</span>
                <GitPullRequest className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                  {prediction?.mergeProbabilityPct ?? '92.4'}%
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    prediction?.riskCategory === 'Low Risk'
                      ? 'bg-emerald-50 text-emerald-700'
                      : prediction?.riskCategory === 'Moderate Risk'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {prediction?.riskCategory ?? 'Low Risk'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Model Confidence: {prediction?.mergeProbabilityConfidence ?? 93.4}%</span>
                <span className="font-mono text-purple-600 font-semibold">Yuvasree ML</span>
              </div>
            </div>
          </div>

          {/* Explainable SHAP Feature Attributions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Feature Importance & Latency Impact (SHAP)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Additive impact on turnaround</span>
            </div>

            <div className="space-y-3">
              {prediction?.shapFactors.map((factor, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{factor.feature}</span>
                    <span
                      className={`font-mono font-bold ${
                        factor.direction === 'positive' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {factor.impact > 0 ? `+${factor.impact}%` : `${factor.impact}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        factor.direction === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(factor.impact) * 2.5)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptive Recommendations */}
          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Prescriptive ML Recommendations</span>
            </h4>
            <div className="space-y-2">
              {prediction?.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-purple-900 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
