import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { CrossToolImpactView } from './components/CrossToolImpactView';
import { ManageAdoptionView } from './components/ManageAdoptionView';
import { EnableUsersView } from './components/EnableUsersView';
import { MaximizeImpactView } from './components/MaximizeImpactView';
import { KanbanBoard } from './components/KanbanBoard';
import { RepositoriesView } from './components/RepositoriesView';
import { APIInspector } from './components/APIInspector';
import { AIInsightsModal } from './components/AIInsightsModal';
import { INITIAL_REPOSITORIES, SAMPLE_PRS } from './mockData';
import { PullRequest } from './types';

export default function App() {
  const [activeNav, setActiveNav] = useState('ai-impact');
  const [currentView, setCurrentView] = useState('cross-tool-impact');
  const [selectedTool, setSelectedTool] = useState('copilot');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [inspectedPr, setInspectedPr] = useState<PullRequest | null>(null);
  const [repositories] = useState(INITIAL_REPOSITORIES);
  const [prs] = useState<PullRequest[]>(SAMPLE_PRS);

  const handleInspectBlocker = (pr: PullRequest) => {
    setInspectedPr(pr);
    setIsInsightsOpen(true);
  };

  const handleOpenGeneralInsights = () => {
    setInspectedPr(null);
    setIsInsightsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navigation Bar with exact aesthetic from reference image */}
      <TopNav
        activeNav={activeNav}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'ai-impact') {
            setCurrentView('cross-tool-impact');
          }
        }}
        onOpenAiInsights={handleOpenGeneralInsights}
      />

      {/* Main Workspace: Left Sidebar + Main Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view)}
          selectedTool={selectedTool}
          onSelectTool={(tool) => {
            setSelectedTool(tool);
            setCurrentView('cross-tool-impact');
          }}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            {currentView === 'cross-tool-impact' && (
              <CrossToolImpactView
                selectedTool={selectedTool}
                onSelectTool={(tool) => setSelectedTool(tool)}
                onOpenAiInsights={handleOpenGeneralInsights}
              />
            )}

            {currentView === 'manage-adoption' && <ManageAdoptionView />}

            {currentView === 'enable-users' && <EnableUsersView />}

            {currentView === 'maximize-impact' && (
              <MaximizeImpactView
                onInspectPr={handleInspectBlocker}
                onOpenAiInsights={handleOpenGeneralInsights}
              />
            )}

            {currentView === 'kanban' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      PR Cycle & Code Review Kanban
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time pull request progression across human and AI-assisted workflows
                    </p>
                  </div>
                </div>
                <KanbanBoard prs={prs} onInspectBlocker={handleInspectBlocker} />
              </div>
            )}

            {currentView === 'repos' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Monitored Repositories
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Repository-level telemetry and AI assistance penetration
                  </p>
                </div>
                <RepositoriesView repositories={repositories} />
              </div>
            )}

            {currentView === 'api-etl' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Backend & Polars ETL Pipeline
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    FastAPI / Express service endpoints and Apache Parquet data warehouse schemas
                  </p>
                </div>
                <APIInspector />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Gemini AI Insights & Blocker Diagnostics Modal */}
      <AIInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        inspectedPr={inspectedPr}
      />
    </div>
  );
}
