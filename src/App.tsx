import { useState, useEffect } from 'react';
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
import { PullRequest } from './types';
import { SAMPLE_PRS } from './mockData';
import { api } from './api';

export default function App() {
  const [activeNav, setActiveNav] = useState('ai-impact');
  const [currentView, setCurrentView] = useState('cross-tool-impact');
  const [selectedTool, setSelectedTool] = useState('all');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [inspectedPr, setInspectedPr] = useState<PullRequest | null>(null);
  const [prs, setPrs] = useState<PullRequest[]>(SAMPLE_PRS);

  useEffect(() => {
    api.getPullRequests(50)
      .then((data) => {
        if (data.pull_requests && data.pull_requests.length > 0) {
          setPrs(data.pull_requests);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch real PRs for kanban, using fallback:', err);
      });
  }, []);

  const handleInspectBlocker = (pr: PullRequest) => {
    setInspectedPr(pr);
    setIsInsightsOpen(true);
  };

  const handleOpenGeneralInsights = () => {
    setInspectedPr(null);
    setIsInsightsOpen(true);
  };

  const handleSelectNav = (nav: string) => {
    setActiveNav(nav);
    if (nav === 'home' || nav === 'ai-impact') {
      setCurrentView('cross-tool-impact');
    } else if (nav === 'teams') {
      setCurrentView('manage-adoption');
    } else if (nav === 'people') {
      setCurrentView('enable-users');
    } else if (nav === 'delivery') {
      setCurrentView('kanban');
    } else if (nav === 'devfinops') {
      setCurrentView('maximize-impact');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navigation Bar with brand mark */}
      <TopNav
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
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
                      Task Progression & Review Kanban
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Operational task management isolated from historical dataset analytics
                    </p>
                  </div>
                </div>
                <KanbanBoard prs={prs} onInspectBlocker={handleInspectBlocker} />
              </div>
            )}

            {currentView === 'repos' && (
              <div className="space-y-4">
                <RepositoriesView />
              </div>
            )}

            {currentView === 'api-etl' && (
              <div className="space-y-4">
                <APIInspector />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Grounded Gemini Explanation Modal */}
      <AIInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        inspectedPr={inspectedPr}
      />
    </div>
  );
}
