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
import { LandingAuthPage } from './components/auth/LandingAuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AIProductivitySuiteHeader } from './components/ai-suite/AIProductivitySuiteHeader';
import { BurnoutFlowPredictorView } from './components/ai-suite/BurnoutFlowPredictorView';
import { CodeQualityRefactorView } from './components/ai-suite/CodeQualityRefactorView';
import { CommitDocsGeneratorView } from './components/ai-suite/CommitDocsGeneratorView';
import { PRVelocityLikelihoodView } from './components/ai-suite/PRVelocityLikelihoodView';
import { AutomatedPRReviewerView } from './components/ai-suite/AutomatedPRReviewerView';
import { api, API_BASE } from './api';
import { OverviewMetrics, AIProductivitySuiteTab, UserProfile } from './types';
import { authAndIntegrationsService } from './services/authAndIntegrations';
import { RefreshCw, Zap } from 'lucide-react';

export type AppView =
  | 'landing'
  | 'onboarding'
  | 'dashboard'
  | 'overview'
  | 'realtime-engine'
  | 'ai-tools'
  | 'ai-impact'
  | 'ml-insights'
  | 'repositories'
  | 'ai-suite-burnout'
  | 'ai-suite-quality'
  | 'ai-suite-commit'
  | 'ai-suite-pr-velocity'
  | 'ai-suite-pr'
  | 'integrations';

export default function App() {
  const [user, setUser] = useState<UserProfile>(authAndIntegrationsService.getUser());
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cold start state for Render/Railway backend
  const [serverState, setServerState] = useState<'checking' | 'waking' | 'ready' | 'error'>('checking');
  const [wakeStatus, setWakeStatus] = useState<string>('Connecting to DevPulse backend...');
  const [serverError, setServerError] = useState<string | null>(null);

  // Subscribe to auth state updates
  useEffect(() => {
    const unsubscribe = authAndIntegrationsService.subscribe(() => {
      const u = authAndIntegrationsService.getUser();
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // Map browser URL pathname to view & enforce route guards
  const syncRouteFromUrl = () => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.toLowerCase();
    const isAuth = authAndIntegrationsService.getUser().isAuthenticated;
    const isOnboardingDone = authAndIntegrationsService.isOnboardingCompleted();

    // Step 1: Unauthenticated visitors must only see landing page
    if (!isAuth) {
      setCurrentView('landing');
      if (path !== '/' && path !== '/login' && path !== '/signup') {
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    // Step 2: Authenticated but hasn't completed onboarding
    if (!isOnboardingDone) {
      if (path === '/' || path === '/login' || path === '/onboarding') {
        setCurrentView('onboarding');
        window.history.replaceState(null, '', '/onboarding');
        return;
      }
    }

    // Step 3: Route mapping for authenticated users
    if (path === '/' || path === '/login' || path === '/dashboard') {
      setCurrentView('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    } else if (path === '/onboarding') {
      setCurrentView('onboarding');
    } else if (path === '/overview') {
      setCurrentView('overview');
    } else if (path === '/settings/integrations' || path === '/integrations') {
      setCurrentView('integrations');
    } else if (path.includes('burnout')) {
      setCurrentView('ai-suite-burnout');
    } else if (path.includes('quality')) {
      setCurrentView('ai-suite-quality');
    } else if (path.includes('commit')) {
      setCurrentView('ai-suite-commit');
    } else if (path.includes('pr-velocity') || path.includes('velocity')) {
      setCurrentView('ai-suite-pr-velocity');
    } else if (path.includes('ai-suite')) {
      setCurrentView('ai-suite-burnout');
    } else if (path === '/ai-tools') {
      setCurrentView('ai-tools');
    } else if (path === '/ai-impact') {
      setCurrentView('ai-impact');
    } else if (path === '/ml-insights') {
      setCurrentView('ml-insights');
    } else if (path === '/repositories') {
      setCurrentView('repositories');
    } else {
      setCurrentView('dashboard');
    }
  };

  useEffect(() => {
    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, [user.isAuthenticated]);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    if (typeof window === 'undefined') return;

    // Update browser URL
    let newPath = '/dashboard';
    if (view === 'landing') newPath = '/login';
    else if (view === 'onboarding') newPath = '/onboarding';
    else if (view === 'dashboard' || view === 'realtime-engine') newPath = '/dashboard';
    else if (view === 'overview') newPath = '/overview';
    else if (view === 'integrations') newPath = '/settings/integrations';
    else if (view === 'ai-suite-burnout') newPath = '/ai-suite/burnout';
    else if (view === 'ai-suite-quality') newPath = '/ai-suite/quality';
    else if (view === 'ai-suite-commit') newPath = '/ai-suite/commit';
    else if (view === 'ai-suite-pr-velocity') newPath = '/ai-suite/pr-velocity';
    else if (view === 'ai-suite-pr') newPath = '/ai-suite/pr-review';
    else if (view === 'ai-tools') newPath = '/ai-tools';
    else if (view === 'ai-impact') newPath = '/ai-impact';
    else if (view === 'ml-insights') newPath = '/ml-insights';
    else if (view === 'repositories') newPath = '/repositories';

    window.history.pushState(null, '', newPath);
  };

  const handleAuthenticated = () => {
    const isOnboardingDone = authAndIntegrationsService.isOnboardingCompleted();
    if (!isOnboardingDone) {
      navigateTo('onboarding');
    } else {
      navigateTo('dashboard');
    }
  };

  const initServerConnection = async () => {
    setServerState('checking');
    setServerError(null);

    try {
      await api.checkHealth();
      setServerState('ready');
      fetchGlobalMetrics();
      return;
    } catch {
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
      setServerError(`Backend server at ${API_BASE || 'current origin'} did not respond within 60s.`);
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
    if (view === 'ai-suite-burnout') return 'burnout-flow';
    if (view === 'ai-suite-quality') return 'code-quality';
    if (view === 'ai-suite-commit') return 'commit-docs';
    if (view === 'ai-suite-pr-velocity') return 'pr-velocity';
    if (view === 'ai-suite-pr') return 'pr-reviewer';
    return 'burnout-flow';
  };

  const handleSelectAiTab = (tab: AIProductivitySuiteTab) => {
    if (tab === 'burnout-flow') navigateTo('ai-suite-burnout');
    else if (tab === 'code-quality') navigateTo('ai-suite-quality');
    else if (tab === 'commit-docs') navigateTo('ai-suite-commit');
    else if (tab === 'pr-velocity') navigateTo('ai-suite-pr-velocity');
    else if (tab === 'pr-reviewer') navigateTo('ai-suite-pr');
  };

  const isAiSuite = currentView.startsWith('ai-suite');

  // STEP 1: PUBLIC LANDING PAGE (Unauthenticated visitors)
  if (!user.isAuthenticated || currentView === 'landing') {
    return <LandingAuthPage onAuthenticated={handleAuthenticated} />;
  }

  // STEP 2: ONBOARDING & INTEGRATION SETUP SCREEN
  if (currentView === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={() => navigateTo('dashboard')}
        onSkip={() => navigateTo('dashboard')}
      />
    );
  }

  // STEP 3: MAIN APP (Authenticated & Onboarded)
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navigation Bar with brand, AI Suite dropdown, Live engine and user profile */}
      <TopNav
        activeNav={currentView}
        onSelectNav={(view) => navigateTo(view as AppView)}
        onOpenDatasetModal={() => setIsDatasetOpen(true)}
        onOpenAiInsights={() => setIsInsightsOpen(true)}
        totalPrs={overview?.total_prs}
      />

      {/* Main Workspace: Left Sidebar + Main Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar with AI Productivity Suite (ML-Powered) & Integrations */}
        <LeftSidebar
          currentView={currentView}
          onSelectView={(view) => navigateTo(view as AppView)}
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

            {/* Step 3: Real-Time Productivity Dashboard */}
            {(currentView === 'dashboard' || currentView === 'realtime-engine') && (
              <RealTimeDashboardView />
            )}

            {currentView === 'overview' && (
              <OverviewView
                onNavigateToTools={() => navigateTo('ai-tools')}
                onNavigateToImpact={() => navigateTo('ai-impact')}
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

                {currentView === 'ai-suite-burnout' && (
                  <BurnoutFlowPredictorView />
                )}

                {currentView === 'ai-suite-quality' && (
                  <CodeQualityRefactorView />
                )}

                {currentView === 'ai-suite-commit' && (
                  <CommitDocsGeneratorView />
                )}

                {currentView === 'ai-suite-pr-velocity' && (
                  <PRVelocityLikelihoodView />
                )}

                {currentView === 'ai-suite-pr' && (
                  <AutomatedPRReviewerView />
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
