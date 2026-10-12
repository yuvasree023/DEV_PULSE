import React from 'react';
import {
  Sparkles,
  BrainCircuit,
  Bot,
  FileText,
  ShieldAlert,
  Cpu,
  TrendingUp,
} from 'lucide-react';
import { AIProductivitySuiteTab } from '../../types';

interface AIProductivitySuiteHeaderProps {
  activeTab: AIProductivitySuiteTab;
  onSelectTab: (tab: AIProductivitySuiteTab) => void;
}

export function AIProductivitySuiteHeader({ activeTab, onSelectTab }: AIProductivitySuiteHeaderProps) {
  const tabs = [
    {
      id: 'burnout-flow' as AIProductivitySuiteTab,
      label: 'ML-Based Burnout & Flow State Predictor',
      icon: ShieldAlert,
      badge: 'ML-Powered',
      description: 'Time-series ML analysis on commit timings & active hours to predict fatigue risk',
    },
    {
      id: 'code-quality' as AIProductivitySuiteTab,
      label: 'ML Code Quality & Refactoring Agent',
      icon: Cpu,
      badge: 'ML-Powered',
      description: 'ML-driven analysis for static code health and refactoring recommendations',
    },
    {
      id: 'commit-docs' as AIProductivitySuiteTab,
      label: 'AI Commit & Documentation Generator',
      icon: FileText,
      badge: 'ML-Powered',
      description: 'Automated summaries generated from code diffs and PR metadata',
    },
    {
      id: 'pr-velocity' as AIProductivitySuiteTab,
      label: 'PR Velocity & Merge Likelihood Model',
      icon: TrendingUp,
      badge: 'ML-Powered',
      description: 'Predictive ML scoring on PRs to estimate review latency & merge probability',
    },
  ];

  return (
    <div className="space-y-5 mb-8">
      {/* Attribution & Branding Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white p-6 md:p-8 shadow-2xl border border-purple-500/30">
        {/* Subtle decorative glowing mesh */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Next-Gen Machine Learning Engineering Intelligence</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              AI Productivity Suite (ML-Powered)
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-400/40 text-purple-100 uppercase">
                [ML-Powered]
              </span>
            </h1>

            <p className="text-sm md:text-base text-purple-100/90 leading-relaxed">
              Autonomous machine learning workflows designed to analyze code quality, generate documentation, predict review turnaround, and safeguard developer flow states.
            </p>

            {/* MANDATORY EXPLICIT ATTRIBUTION BADGE */}
            <div className="pt-2 flex items-center gap-3 text-xs md:text-sm text-purple-100 font-semibold bg-white/10 border border-purple-300/30 rounded-2xl px-4 py-3 backdrop-blur-md shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <span className="text-amber-300 block text-[10px] uppercase tracking-wider font-mono font-bold">
                  Official Engine Attribution
                </span>
                <span className="text-white font-extrabold italic tracking-tight">
                  "Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine"
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics / Model Status Pill */}
          <div className="bg-slate-950/60 border border-purple-400/30 rounded-2xl p-4 shrink-0 flex flex-col gap-2 min-w-[220px] backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ML Inference Pipeline
              </span>
              <span className="font-mono text-emerald-300 font-semibold">Active</span>
            </div>
            <div className="text-[11px] text-purple-200/80 border-t border-white/10 pt-2 flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>Model Engine:</span>
                <span className="font-mono text-white font-semibold">Yuvasree ML v2.5</span>
              </div>
              <div className="flex justify-between">
                <span>Time-Series Predictor:</span>
                <span className="font-mono text-white">Commit Cadence & Flow</span>
              </div>
              <div className="flex justify-between">
                <span>Inference Latency:</span>
                <span className="font-mono text-emerald-300">~120ms</span>
              </div>
              <div className="flex justify-between">
                <span>Telemetry Ingestion:</span>
                <span className="font-mono text-white">GitHub • VS Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern 4-Tab Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  [{tab.badge}]
                </span>
              </div>
              <h3 className={`text-xs font-bold leading-tight ${isActive ? 'text-purple-950' : 'text-slate-800'}`}>
                {tab.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {tab.description}
              </p>
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
