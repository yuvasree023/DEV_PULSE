import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { OverviewView } from './components/OverviewView';
import { AIToolsView } from './components/AIToolsView';
import { AIImpactView } from './components/AIImpactView';
import { MLInsightsView } from './components/MLInsightsView';
import { RepositoriesView } from './components/RepositoriesView';
import { DatasetModal } from './components/DatasetModal';
import { AIInsightsModal } from './components/AIInsightsModal';
import { ErrorCard } from './components/ErrorCard';
import { RealTimeDashboardView } from './components/productivity/RealTimeDashboardView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { AIProductivitySuiteHeader } from './components/ai-suite/AIProductivitySuiteHeader';
import { CodeQualityRefactorView } from './components/ai-suite/CodeQualityRefactorView';
import { CommitDocsGeneratorView } from './components/ai-suite/CommitDocsGeneratorView';
import { AutomatedPRReviewerView } from './components/ai-suite/AutomatedPRReviewerView';
import { BurnoutFlowPredictorView } from './components/ai-suite/BurnoutFlowPredictorView';
import { api, API_BASE } from './api';
import { OverviewMetrics, AIProductivitySuiteTab } from './types';
import { RefreshCw, Zap } from 'lucide-react';

export type AppView =
  | 'overview'
  | 'realtime-engine'
  | 'ai-tools'
  | 'ai-impact'
  | 'ml-insights'
  | 'repositories'
  | 'ai-suite-quality'
  | 'ai-suite-commit'
  | 'ai-suite-pr'
  | 'ai-suite-burnout'
  | 'integrations';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('overview');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cold start state for Render/Railway free tier wake-up
  const [serverState, setServerState] = useState<'checking' | 'waking' | 'ready' | 'error'>('checking');
  const [wakeStatus, setWakeStatus] = useState<string>('Connecting to DevPulse backend...');
  const [serverError, setServerError] = useState<string | null>(null);

  const initServerConnection = async () => {
    setServerState('checking');
    setServerError(null);

    // Initial check
    try {
      await api.checkHealth();
      setServerState('ready');
      fetchGlobalMetrics();
      return;
    } catch {
      // Server is likely sleeping, initiate retry with backoff
      setServerState('waking');
      setWakeStatus('Server appears sleeping (Render free tier). Waking up server...');
    }

    const isAwake = await api.checkServerHealthWithRetry((elapsedSec, msg) => {
      setWakeStatus(msg);
    }, 60000);

    if (isAwake) {
      setServerState('ready');
      fetchGlobalMetrics();
    } else {
      setServerState('error');
      setServerError(`Backend server at ${API_BASE || 'current origin'} did not respond within 60s. Please verify your Render/Railway service is active and VITE_API_URL is configured.`);
    }
  };

  useEffect(() => {
    initServerConnection();
  }, []);

  const fetchGlobalMetrics = () => {
    api.getOverview()
      .then((data) => setOverview(data))
      .catch((err) => console.warn('Could not fetch overview metrics:', err));
  };

  useEffect(() => {
    if (serverState === 'ready') {
      fetchGlobalMetrics();
    }
  }, [refreshKey, serverState]);

  const handleDatasetUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  const getAiTabFromView = (view: AppView): AIProductivitySuiteTab => {
    if (view === 'ai-suite-commit') return 'commit-docs';
    if (view === 'ai-suite-pr') return 'pr-reviewer';
    if (view === 'ai-suite-burnout') return 'burnout-flow';
    return 'code-quality';
  };

  const handleSelectAiTab = (tab: AIProductivitySuiteTab) => {
    if (tab === 'code-quality') setCurrentView('ai-suite-quality');
    else if (tab === 'commit-docs') setCurrentView('ai-suite-commit');
    else if (tab === 'pr-reviewer') setCurrentView('ai-suite-pr');
    else if (tab === 'burnout-flow') setCurrentView('ai-suite-burnout');
  };

  const isAiSuite = currentView.startsWith('ai-suite');

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navigation Bar with brand, AI Suite dropdown, Live engine and user auth */}
      <TopNav
        activeNav={currentView}
        onSelectNav={(view) => setCurrentView(view as AppView)}
        onOpenDatasetModal={() => setIsDatasetOpen(true)}
        onOpenAiInsights={() => setIsInsightsOpen(true)}
        totalPrs={overview?.total_prs}
      />

      {/* Main Workspace: Left Sidebar + Main Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar with AI Productivity Suite section & Integrations */}
        <LeftSidebar
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view as AppView)}
          onOpenDatasetModal={() => setIsDatasetOpen(true)}
          totalPrs={overview?.total_prs}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto" key={refreshKey}>
            {/* Cold start waking state banner */}
            {serverState === 'waking' && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 text-purple-900 flex items-center justify-between shadow-xs animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Waking up the backend server...
                    </h4>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      {wakeStatus}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-purple-600 bg-purple-100/80 px-2.5 py-1 rounded-lg">
                  Render Free Tier Cold Start
                </div>
              </div>
            )}

            {/* Error state if server failed to wake within 60s */}
            {serverState === 'error' && (
              <ErrorCard
                title="Backend Server Unreachable"
                error={serverError}
                onRetry={initServerConnection}
                isRetrying={serverState === 'checking' || serverState === 'waking'}
              />
            )}

            {/* Standard Views */}
            {currentView === 'overview' && (
              <OverviewView
                onNavigateToTools={() => setCurrentView('ai-tools')}
                onNavigateToImpact={() => setCurrentView('ai-impact')}
                onOpenAiInsights={() => setIsInsightsOpen(true)}
              />
            )}

            {currentView === 'realtime-engine' && (
              <RealTimeDashboardView />
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

            {currentView === 'integrations' && (
              <IntegrationsView />
            )}

            {/* Dedicated AI Productivity Suite Views with Yuvasree ML Attribution */}
            {isAiSuite && (
              <div>
                <AIProductivitySuiteHeader
                  activeTab={getAiTabFromView(currentView)}
                  onSelectTab={handleSelectAiTab}
                />

                {currentView === 'ai-suite-quality' && (
                  <CodeQualityRefactorView />
                )}

                {currentView === 'ai-suite-commit' && (
                  <CommitDocsGeneratorView />
                )}

                {currentView === 'ai-suite-pr' && (
                  <AutomatedPRReviewerView />
                )}

                {currentView === 'ai-suite-burnout' && (
                  <BurnoutFlowPredictorView />
                )}
              </div>
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
