import {
  LayoutDashboard,
  Wrench,
  Sparkles,
  BrainCircuit,
  FolderGit2,
  Database
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
  totalPrs
}: LeftSidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'ai-tools', label: 'AI Tools', icon: Wrench },
    { id: 'ai-impact', label: 'AI Impact', icon: Sparkles },
    { id: 'ml-insights', label: 'ML Insights', icon: BrainCircuit },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
  ];

  return (
    <aside
      id="left-sidebar-navigation"
      className="w-60 bg-white border-r border-slate-200/90 shrink-0 p-4 flex flex-col justify-between hidden md:flex"
    >
      <div className="space-y-4">
        {/* Navigation Section Header */}
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Analytics Product
        </div>

        {/* 5 Main Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary Bottom Section: Dataset & Settings for Evaluators */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Evaluator Data
        </div>

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

        <div className="px-2 py-1 text-[10px] text-slate-400 italic">
          Observed telemetry pipeline
        </div>
      </div>
    </aside>
  );
}
