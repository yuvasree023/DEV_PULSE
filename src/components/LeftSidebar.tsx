import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Gauge,
  Users,
  BrainCircuit,
  GitPullRequest,
  FolderGit2,
  Database,
  Check,
  Bot
} from 'lucide-react';
import { ToolIconRenderer } from './ToolIcons';
import { api } from '../api';
import { AIToolMetric } from '../types';

interface LeftSidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  selectedTool: string;
  onSelectTool: (tool: string) => void;
}

export function LeftSidebar({
  currentView,
  onSelectView,
  selectedTool,
  onSelectTool,
}: LeftSidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tools, setTools] = useState<AIToolMetric[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAITools()
      .then((res) => {
        if (res?.tools) setTools(res.tools.filter((t) => t.agent !== 'Non-AI'));
      })
      .catch((err) => console.error(err));
  }, []);

  const defaultTools = [
    { agent: 'OpenAI_Codex' },
    { agent: 'Copilot' },
    { agent: 'Devin' },
    { agent: 'Cursor' },
    { agent: 'Claude_Code' },
    { agent: 'Google_Jules' },
  ];

  const displayList = tools.length > 0 ? tools : defaultTools;

  const currentToolName =
    selectedTool === 'all'
      ? 'All AI Agents (Combined)'
      : selectedTool.replace('_', ' ');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside
      id="left-sidebar-navigation"
      className="w-64 bg-white border-r border-slate-200/90 shrink-0 p-4 flex flex-col justify-between"
    >
      <div className="space-y-6">
        {/* Top Active Category: AI Impact Overview */}
        <div>
          <button
            id="sidebar-cross-tool-impact"
            onClick={() => onSelectView('cross-tool-impact')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentView === 'cross-tool-impact'
                ? 'bg-purple-50 text-purple-700 shadow-2xs border border-purple-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3.5 bg-purple-600 rounded-xs" />
              <span className="w-1.5 h-4.5 bg-purple-400 rounded-xs" />
              <span className="w-1.5 h-2.5 bg-purple-300 rounded-xs" />
            </div>
            <span className="text-sm">AI Impact Overview</span>
          </button>
        </div>

        {/* Section: AI Tools & Agents */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
            AI Tool Filter
          </div>

          {/* Tool Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="tool-selector-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-2xs text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <ToolIconRenderer id={selectedTool.toLowerCase()} className="w-4 h-4 shrink-0" />
                <span className="truncate">{currentToolName}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 overflow-hidden max-h-56 overflow-y-auto">
                <button
                  onClick={() => {
                    onSelectTool('all');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    selectedTool === 'all'
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>All AI Agents (Combined)</span>
                  </div>
                  {selectedTool === 'all' && (
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                  )}
                </button>

                {displayList.map((t) => (
                  <button
                    key={t.agent}
                    onClick={() => {
                      onSelectTool(t.agent);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      selectedTool.toLowerCase() === t.agent.toLowerCase()
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ToolIconRenderer id={t.agent.toLowerCase()} className="w-4 h-4" />
                      <span>{t.agent.replace('_', ' ')}</span>
                    </div>
                    {selectedTool.toLowerCase() === t.agent.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sub Navigation Items */}
          <div className="pt-2 space-y-1">
            <button
              id="sidebar-manage-adoption"
              onClick={() => onSelectView('manage-adoption')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'manage-adoption'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Gauge className="w-4 h-4 text-slate-400" />
              <span>AI Tools Telemetry</span>
            </button>

            <button
              id="sidebar-enable-users"
              onClick={() => onSelectView('enable-users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'enable-users'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>People Analytics</span>
            </button>

            <button
              id="sidebar-maximize-impact"
              onClick={() => onSelectView('maximize-impact')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                currentView === 'maximize-impact'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-slate-400" />
              <span>ML Workflow Insights</span>
            </button>
          </div>
        </div>

        {/* Section: Repositories & Pipeline */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
            Projects & Operations
          </div>

          <button
            id="sidebar-repositories"
            onClick={() => onSelectView('repos')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'repos'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-slate-400" />
            <span>Projects & Repos</span>
          </button>

          <button
            id="sidebar-kanban-pipeline"
            onClick={() => onSelectView('kanban')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'kanban'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GitPullRequest className="w-4 h-4 text-slate-400" />
            <span>Tasks & Kanban</span>
          </button>

          <button
            id="sidebar-api-etl"
            onClick={() => onSelectView('api-etl')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'api-etl'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>Dataset & Ingestion</span>
          </button>
        </div>
      </div>

      {/* Bottom Status Banner */}
      <div className="p-3 bg-purple-50/70 border border-purple-100/90 rounded-xl space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-purple-900">DevPulse Telemetry</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-purple-700/80 leading-tight">
          Live Parquet pipeline active • Grounded Gemini explanation engine.
        </p>
      </div>
    </aside>
  );
}
