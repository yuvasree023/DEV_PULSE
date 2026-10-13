import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  Sparkles,
  BrainCircuit,
  FolderGit2,
  Database,
  Activity,
  Cpu,
  FileText,
  Bot,
  ShieldAlert,
  Key,
  TrendingUp,
  Compass,
  Clock,
} from 'lucide-react';

interface LeftSidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenDatasetModal?: () => void;
  totalPrs?: number;
}

export function LeftSidebar({
  currentView,
  onSelectView,
  onOpenDatasetModal,
  totalPrs,
}: LeftSidebarProps) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Demo: Live Simulator', icon: Activity },
    { id: 'overview', label: 'Team Overview', icon: LayoutDashboard },
    { id: 'ai-tools', label: 'AI Tools', icon: Wrench },
    { id: 'ai-impact', label: 'AI Impact', icon: Sparkles },
    { id: 'ml-insights', label: 'ML Insights', icon: BrainCircuit },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    { id: 'activity', label: 'My Activity', icon: Clock },
    { id: 'privacy', label: 'Privacy', icon: ShieldAlert },
  ];

  const aiSuiteItems = [
    {
      id: 'ai-suite-burnout',
      label: 'Burnout & Flow Predictor',
      icon: ShieldAlert,
      tag: 'Sample demo',
    },
    {
      id: 'ai-suite-quality',
      label: 'Code Quality & Refactor',
      icon: Cpu,
      tag: 'Sample demo',
    },
    {
      id: 'ai-suite-commit',
      label: 'Commit & Docs Generator',
      icon: FileText,
      tag: 'Sample demo',
    },
    {
      id: 'ai-suite-pr-velocity',
      label: 'PR Velocity & Merge Likelihood',
      icon: TrendingUp,
      tag: 'Sample demo',
    },
  ];

  return (
    <aside
      id="left-sidebar-navigation"
      className="w-64 bg-white border-r border-slate-200/90 shrink-0 p-4 flex flex-col justify-between hidden md:flex overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Section 1: Core Analytics & Dashboard */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Real-Time Analytics
          </div>

          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === 'realtime-engine');

              return (
                <button
                  key={item.id}
                  id={`sidebar-${item.id}`}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: DEDICATED AI PRODUCTIVITY SUITE (ML-POWERED) */}
        <div className="space-y-2">
          <div className="px-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              AI Productivity Suite (Sample ML Demo)
            </span>
          </div>

          <nav className="space-y-1">
            {aiSuiteItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-${item.id}`}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono shrink-0 px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-purple-800 text-purple-100'
                        : 'bg-purple-100/70 text-purple-700 font-bold'
                    }`}
                  >
                    [{item.tag}]
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Secondary Bottom Section: Integrations & Setup */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Settings & Tool Connectors
        </div>

        {/* Onboarding Flow Link */}
        <button
          id="sidebar-onboarding"
          onClick={() => onSelectView('onboarding')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors border cursor-pointer ${
            currentView === 'onboarding'
              ? 'bg-purple-50 text-purple-700 font-bold border-purple-200'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-purple-600" />
            <span>Onboarding Setup</span>
          </div>
          <span className="text-[9px] font-mono text-purple-600 bg-purple-100 px-1 rounded">
            Step 2
          </span>
        </button>

        {/* Developer Tool Credentials Portal */}
        <button
          id="sidebar-integrations"
          onClick={() => onSelectView('integrations')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors border cursor-pointer ${
            currentView === 'integrations'
              ? 'bg-purple-50 text-purple-700 font-bold border-purple-200'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-purple-600" />
            <span>Integrations / Keys</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
        </button>

        {/* Dataset Modal */}
        <button
          id="sidebar-dataset-settings"
          onClick={onOpenDatasetModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Dataset / Drop</span>
          </div>
          {totalPrs != null && (
            <span className="text-[10px] font-mono text-slate-500">
              {totalPrs.toLocaleString()} PRs
            </span>
          )}
        </button>

        <div className="px-2 py-1 text-[10px] text-purple-700 font-medium leading-tight">
          Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine
        </div>
      </div>
    </aside>
  );
}
