import {
  LayoutDashboard,
  Wrench,
  Sparkles,
  BrainCircuit,
  FolderGit2,
  Database,
  HelpCircle
} from 'lucide-react';

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
  totalPrs
}: TopNavProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'ai-tools', label: 'AI Tools', icon: Wrench },
    { id: 'ai-impact', label: 'AI Impact', icon: Sparkles },
    { id: 'ml-insights', label: 'ML Insights', icon: BrainCircuit },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
  ];

  return (
    <header
      id="top-navigation-bar"
      className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between shadow-2xs"
    >
      <div className="flex items-center gap-8">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => onSelectNav('overview')}
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-2xs">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.8 1.8 3.7A9.002 9.002 0 0 0 3 19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1 9.002 9.002 0 0 0-5.8-8.3A5.002 5.002 0 0 0 17 7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z" />
            </svg>
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

        {/* Mobile-only Navigation Tabs (desktop uses LeftSidebar exclusively to eliminate duplicate nav) */}
        <nav className="flex md:hidden items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                id={`mobile-nav-item-${item.id}`}
                onClick={() => onSelectNav(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-purple-700 bg-purple-50 font-bold border border-purple-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary Actions (Dataset / Data & Grounded Explanation) */}
      <div className="flex items-center gap-2.5">
        {/* Grounded Explanation Action */}
        {onOpenAiInsights && (
          <button
            id="btn-explain-telemetry-header"
            onClick={onOpenAiInsights}
            title="Explain observed metrics with Gemini"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Explain Telemetry</span>
          </button>
        )}

        {/* Secondary Evaluator Dataset Management */}
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
      </div>
    </header>
  );
}
