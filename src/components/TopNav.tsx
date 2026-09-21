import {
  Home,
  Users,
  GitFork,
  Truck,
  Coins,
  Sparkles,
  Smile,
  ExternalLink,
  Bot,
} from 'lucide-react';

interface TopNavProps {
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onOpenAiInsights: () => void;
}

export function TopNav({ activeNav, onSelectNav, onOpenAiInsights }: TopNavProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'people', label: 'People', icon: GitFork },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'devfinops', label: 'DevFinOps', icon: Coins },
    { id: 'ai-impact', label: 'AI Impact', icon: Sparkles, isActiveHighlight: true },
    { id: 'devex', label: 'DevEx', icon: Smile, isExternal: true },
  ];

  return (
    <header
      id="top-navigation-bar"
      className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-6 py-2 flex items-center justify-between shadow-2xs"
    >
      <div className="flex items-center gap-8">
        {/* Brand Logo - Purple icon matching reference image */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectNav('ai-impact')}>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            {/* Custom rounded mark */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.8 1.8 3.7A9.002 9.002 0 0 0 3 19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1 9.002 9.002 0 0 0-5.8-8.3A5.002 5.002 0 0 0 17 7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 hidden md:inline">
            DevPulse <span className="text-purple-600 font-medium text-xs ml-1 px-1.5 py-0.5 bg-purple-50 rounded-md border border-purple-100">AI</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id || (item.isActiveHighlight && activeNav === 'ai-impact');

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectNav(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-purple-700 bg-purple-50/70 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.isExternal && (
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <button
          id="btn-ai-insights-header"
          onClick={onOpenAiInsights}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Gemini AI Insights</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
          AC
        </div>
      </div>
    </header>
  );
}
