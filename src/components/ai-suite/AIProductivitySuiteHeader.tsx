import React from 'react';
import { Sparkles, BrainCircuit, Bot, FileText, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { AIProductivitySuiteTab } from '../../types';

interface AIProductivitySuiteHeaderProps {
  activeTab: AIProductivitySuiteTab;
  onSelectTab: (tab: AIProductivitySuiteTab) => void;
}

export function AIProductivitySuiteHeader({ activeTab, onSelectTab }: AIProductivitySuiteHeaderProps) {
  const tabs = [
    {
      id: 'code-quality' as AIProductivitySuiteTab,
      label: 'Code Quality & Refactor',
      icon: Cpu,
      badge: 'Multi-Agent',
      description: 'AST & cognitive complexity reduction',
    },
    {
      id: 'commit-docs' as AIProductivitySuiteTab,
      label: 'Commit & Docs Generator',
      icon: FileText,
      badge: 'Auto-Doc',
      description: 'Conventional commits & docstrings',
    },
    {
      id: 'pr-reviewer' as AIProductivitySuiteTab,
      label: 'Automated PR Reviewer',
      icon: Bot,
      badge: '4-Agent Swarm',
      description: 'Security & logic defect analyzer',
    },
    {
      id: 'burnout-flow' as AIProductivitySuiteTab,
      label: 'Burnout & Flow Predictor',
      icon: ShieldAlert,
      badge: 'Telemetry ML',
      description: 'Cognitive fatigue & focus forecaster',
    },
  ];

  return (
    <div className="space-y-5 mb-8">
      {/* Attribution & Branding Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-purple-500/20">
        {/* Subtle decorative glowing mesh */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>Next-Gen Multi-Agent Engineering Intelligence</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              AI Productivity Suite
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-purple-600/80 border border-purple-400/40 text-purple-100 tracking-normal uppercase">
                v2.5 ML
              </span>
            </h1>

            <p className="text-sm md:text-base text-purple-100/90 leading-relaxed">
              Autonomous multi-agent workflows designed to accelerate code quality, automate documentation, review PRs, and safeguard developer flow states.
            </p>

            {/* MANDATORY YUVASREE ATTRIBUTION BADGE */}
            <div className="pt-2 flex items-center gap-2.5 text-xs text-purple-200/90 font-medium bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
              <BrainCircuit className="w-4 h-4 text-purple-300 shrink-0" />
              <span>
                Underlying metrics, models, and multi-agent workflows are <strong className="text-white font-bold underline decoration-purple-400 underline-offset-2">powered by Yuvasree's custom ML pipeline and productivity intelligence framework</strong>.
              </span>
            </div>
          </div>

          {/* Quick Metrics / Model Status Pill */}
          <div className="bg-slate-950/40 border border-purple-400/20 rounded-xl p-4 shrink-0 flex flex-col gap-2 min-w-[210px] backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ML Inference Pipeline
              </span>
              <span className="font-mono text-emerald-300 font-semibold">Active</span>
            </div>
            <div className="text-[11px] text-purple-200/80 border-t border-white/10 pt-2 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Model Architecture:</span>
                <span className="font-mono text-white">Multi-Agent K-Means + AST</span>
              </div>
              <div className="flex justify-between">
                <span>Inference Latency:</span>
                <span className="font-mono text-white">~120ms</span>
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
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <h3 className={`text-xs font-bold ${isActive ? 'text-purple-950' : 'text-slate-800'}`}>
                {tab.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
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
