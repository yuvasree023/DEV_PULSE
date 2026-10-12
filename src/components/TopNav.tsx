import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Wrench,
  Sparkles,
  BrainCircuit,
  FolderGit2,
  Database,
  ChevronDown,
  Cpu,
  FileText,
  ShieldAlert,
  Activity,
  Key,
  LogOut,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { authAndIntegrationsService } from '../services/authAndIntegrations';

interface TopNavProps {
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onOpenDatasetModal?: () => void;
  onOpenAiInsights?: () => void;
  totalPrs?: number;
}

export function TopNav({
  activeNav,
  onSelectNav,
  onOpenDatasetModal,
  onOpenAiInsights,
  totalPrs,
}: TopNavProps) {
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState(authAndIntegrationsService.getUser());
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = authAndIntegrationsService.subscribe(() => {
      setUser(authAndIntegrationsService.getUser());
    });
    return unsubscribe;
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAiMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const aiSuiteItems = [
    {
      id: 'ai-suite-burnout',
      label: 'ML-Based Burnout & Flow State Predictor',
      desc: 'Time-series analysis on commit cadence & active hours',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      id: 'ai-suite-quality',
      label: 'ML Code Quality & Refactoring Agent',
      desc: 'AST static health & automated refactoring guidance',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'ai-suite-commit',
      label: 'AI Commit & Documentation Generator',
      desc: 'Conventional commits & JSDoc from git diffs',
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'ai-suite-pr-velocity',
      label: 'PR Velocity & Merge Likelihood Model',
      desc: 'Predictive scoring for review latency & merge probability',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
    },
  ];

  const isAiSuiteActive = activeNav.startsWith('ai-suite');

  return (
    <header
      id="top-navigation-bar"
      className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between shadow-2xs"
    >
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => onSelectNav('dashboard')}
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 block leading-none">
              DevPulse
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-normal block mt-0.5">
              AI-Tool Productivity Analytics
            </span>
          </div>
        </div>

        {/* Dedicated ML/AI Productivity Suite Navigation Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAiSuiteActive
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiSuiteActive ? 'text-amber-300' : 'text-purple-600'}`} />
            <span>AI Productivity Suite</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-800 text-purple-100">
              [ML-Powered]
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAiMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded AI Productivity Suite Dropdown Menu */}
          {isAiMenuOpen && (
            <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* Mandatory Attribution Notice Header */}
              <div className="p-3 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-xl mb-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI Productivity Suite (ML-Powered)</span>
                </div>
                <p className="text-[11px] text-purple-200 mt-1 leading-snug italic font-medium">
                  "Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine"
                </p>
              </div>

              {/* 4 Dedicated ML Tools */}
              <div className="space-y-1">
                {aiSuiteItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectNav(item.id);
                        setIsAiMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-purple-50 text-purple-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          <span className="text-[9px] font-mono text-purple-600 bg-purple-50 px-1 rounded ml-1 shrink-0">
                            [ML]
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal leading-tight line-clamp-1">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 px-2 pb-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-[10px]">Real-Time AST & ML Scoring</span>
                <button
                  onClick={() => {
                    onSelectNav('ai-suite-burnout');
                    setIsAiMenuOpen(false);
                  }}
                  className="text-purple-600 font-bold hover:underline cursor-pointer"
                >
                  Open Suite View →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => onSelectNav('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeNav === 'dashboard' || activeNav === 'realtime-engine'
                ? 'text-purple-700 bg-purple-50 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real-Time Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </nav>
      </div>

      {/* Secondary Actions & Profiles */}
      <div className="flex items-center gap-2.5">
        {/* Onboarding Quick Link */}
        <button
          onClick={() => onSelectNav('onboarding')}
          title="Onboarding Setup & Developer Tool Connectors"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'onboarding'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-purple-600" />
          <span className="hidden sm:inline">Onboarding</span>
        </button>

        {/* Integrations Settings Shortcut */}
        <button
          onClick={() => onSelectNav('integrations')}
          title="Developer Tool Integrations & Credentials"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'integrations'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-purple-600" />
          <span className="hidden sm:inline">Integrations</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>

        {/* Dataset Modal */}
        {onOpenDatasetModal && (
          <button
            id="btn-dataset-modal-header"
            onClick={onOpenDatasetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Dataset</span>
            {totalPrs != null && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-white text-slate-600 font-mono text-[10px] border border-slate-200">
                {totalPrs.toLocaleString()}
              </span>
            )}
          </button>
        )}

        {/* Authenticated User Avatar & Dropdown */}
        <div className="relative pl-1 border-l border-slate-200" ref={profileRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-purple-300 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="hidden md:inline text-xs font-bold text-slate-800">
              {user.name}
            </span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 block">{user.name}</span>
                <span className="text-[11px] text-slate-500 block truncate">{user.email}</span>
                <span className="text-[10px] font-mono text-purple-600 font-semibold mt-0.5 block">
                  {user.role}
                </span>
              </div>

              <button
                onClick={() => {
                  onSelectNav('onboarding');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Onboarding Wizard</span>
              </button>

              <button
                onClick={() => {
                  onSelectNav('integrations');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Integrations & Keys</span>
              </button>

              <button
                onClick={() => {
                  authAndIntegrationsService.logout();
                  setIsProfileMenuOpen(false);
                  onSelectNav('landing');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
