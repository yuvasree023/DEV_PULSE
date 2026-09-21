import { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { OverviewView } from './components/OverviewView';
import { AIToolsView } from './components/AIToolsView';
import { AIImpactView } from './components/AIImpactView';
import { MLInsightsView } from './components/MLInsightsView';
import { RepositoriesView } from './components/RepositoriesView';
import { DatasetModal } from './components/DatasetModal';
import { AIInsightsModal } from './components/AIInsightsModal';
import { api } from './api';
import { OverviewMetrics } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'overview' | 'ai-tools' | 'ai-impact' | 'ml-insights' | 'repositories'>('overview');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchGlobalMetrics = () => {
    api.getOverview()
      .then((data) => setOverview(data))
      .catch((err) => console.warn('Could not fetch overview metrics:', err));
  };

  useEffect(() => {
    fetchGlobalMetrics();
  }, [refreshKey]);

  const handleDatasetUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navigation Bar with brand and primary 5 tabs */}
      <TopNav
        activeNav={currentView}
        onSelectNav={(view) => setCurrentView(view as any)}
        onOpenDatasetModal={() => setIsDatasetOpen(true)}
        onOpenAiInsights={() => setIsInsightsOpen(true)}
        totalPrs={overview?.total_prs}
      />

      {/* Main Workspace: Left Sidebar + Main Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view as any)}
          onOpenDatasetModal={() => setIsDatasetOpen(true)}
          totalPrs={overview?.total_prs}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto" key={refreshKey}>
            {currentView === 'overview' && (
              <OverviewView
                onNavigateToTools={() => setCurrentView('ai-tools')}
                onNavigateToImpact={() => setCurrentView('ai-impact')}
                onOpenAiInsights={() => setIsInsightsOpen(true)}
              />
            )}

            {currentView === 'ai-tools' && (
              <AIToolsView />
            )}

            {currentView === 'ai-impact' && (
              <AIImpactView />
            )}

            {currentView === 'ml-insights' && (
              <MLInsightsView onOpenAiInsights={() => setIsInsightsOpen(true)} />
            )}

            {currentView === 'repositories' && (
              <RepositoriesView />
            )}
          </div>
        </main>
      </div>

      {/* Secondary Dataset Evaluator Modal */}
      <DatasetModal
        isOpen={isDatasetOpen}
        onClose={() => setIsDatasetOpen(false)}
        onDatasetUpdated={handleDatasetUpdated}
      />

      {/* Secondary Grounded Gemini Explanation Modal */}
      <AIInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
      />
    </div>
  );
}
