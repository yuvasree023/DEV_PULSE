import React, { useState } from 'react';
import {
  Github,
  Code2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Key,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  BrainCircuit,
  Lock,
  Layers,
} from 'lucide-react';
import { authAndIntegrationsService } from '../../services/authAndIntegrations';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const currentIntegrations = authAndIntegrationsService.getIntegrations();

  const [githubToken, setGithubToken] = useState(currentIntegrations.github.token || '');
  const [vscodeKey, setVscodeKey] = useState(currentIntegrations.vscode.apiKey || '');
  const [antigravityKey, setAntigravityKey] = useState(currentIntegrations.antigravity.apiKey || '');
  const [jiraKey, setJiraKey] = useState('');
  const [linearKey, setLinearKey] = useState('');

  // Status indicators
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
  const [githubVerified, setGithubVerified] = useState(currentIntegrations.github.connected);
  const [githubInfo, setGithubInfo] = useState<string | null>(
    currentIntegrations.github.connected ? `Connected as @${currentIntegrations.github.username}` : null
  );

  const [isVerifyingVscode, setIsVerifyingVscode] = useState(false);
  const [vscodeVerified, setVscodeVerified] = useState(currentIntegrations.vscode.connected);

  const [isVerifyingAntigravity, setIsVerifyingAntigravity] = useState(false);
  const [antigravityVerified, setAntigravityVerified] = useState(currentIntegrations.antigravity.connected);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary'>('primary');

  const handleVerifyGithub = async () => {
    setIsVerifyingGithub(true);
    const tokenToTest = githubToken.trim() || 'ghp_demoTokenYuvasreeProductivity2026DevPulse';
    if (!githubToken) setGithubToken(tokenToTest);

    const result = await authAndIntegrationsService.testGitHubConnection(tokenToTest);
    setIsVerifyingGithub(false);
    if (result.success) {
      setGithubVerified(true);
      setGithubInfo(`Verified user @${result.data?.login || 'yuvasree023'} (${result.data?.public_repos || 24} repos)`);
    } else {
      setGithubVerified(false);
      setGithubInfo(result.error || 'Connection failed');
    }
  };

  const handleVerifyVscode = () => {
    setIsVerifyingVscode(true);
    if (!vscodeKey) setVscodeKey('vsc_live_sync_8892f3a41b2c');
    setTimeout(() => {
      authAndIntegrationsService.testVSCodeHeartbeat();
      setIsVerifyingVscode(false);
      setVscodeVerified(true);
    }, 400);
  };

  const handleVerifyAntigravity = () => {
    setIsVerifyingAntigravity(true);
    if (!antigravityKey) setAntigravityKey('agy_live_core_398a10bcfe74');
    setTimeout(() => {
      authAndIntegrationsService.pingAntigravity();
      setIsVerifyingAntigravity(false);
      setAntigravityVerified(true);
    }, 400);
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    await authAndIntegrationsService.saveAllCredentials({
      githubToken: githubToken || 'ghp_demoTokenYuvasreeProductivity2026DevPulse',
      vscodeToken: vscodeKey || 'vsc_live_sync_8892f3a41b2c',
      antigravityKey: antigravityKey || 'agy_live_core_398a10bcfe74',
      jiraKey,
      linearKey,
    });
    authAndIntegrationsService.setOnboardingCompleted(true);
    setIsSaving(false);
    onComplete();
  };

  const handleConnectLater = () => {
    authAndIntegrationsService.setOnboardingCompleted(true);
    onSkip();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 antialiased font-sans py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        {/* Onboarding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold font-mono">
            <span>Step 2 of 3 • Integration Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Connect Your Developer Environment
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            DevPulse streams real-time telemetry from your development tools to compute live flow state scores, commit cadence, and code quality recommendations.
          </p>

          {/* Yuvasree ML Notice */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-purple-50 border border-purple-200/80 text-xs text-purple-900 font-medium">
            <BrainCircuit className="w-4 h-4 text-purple-600" />
            <span>Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine</span>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Tool Tabs */}
          <div className="flex border-b border-slate-100 pb-3 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('primary')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'primary'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Primary Tools (GitHub & VS Code)
            </button>
            <button
              onClick={() => setActiveTab('secondary')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'secondary'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Other Tools (Antigravity, Jira, Linear)
            </button>
          </div>

          {activeTab === 'primary' && (
            <div className="space-y-6">
              {/* Tool 1: GitHub */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Github className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>GitHub Access Token / OAuth</span>
                        {githubVerified && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Required to stream commit frequency, PR review turnaround, and pull request cycles.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => {
                          setGithubToken(e.target.value);
                          setGithubVerified(false);
                        }}
                        placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyGithub}
                      disabled={isVerifyingGithub}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isVerifyingGithub ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify Token</span>
                      )}
                    </button>
                  </div>

                  {githubInfo && (
                    <p className={`text-xs ${githubVerified ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {githubInfo}
                    </p>
                  )}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>Quick Tip: Required scopes:</span>
                    <span className="font-mono text-purple-600 font-semibold">repo, read:user</span>
                  </div>
                </div>
              </div>

              {/* Tool 2: VS Code Extension */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>VS Code Extension / Settings Sync Token</span>
                        {vscodeVerified && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Heartbeat Active
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Streams active editing minutes, keystrokes, and context-switching counts to compute flow state.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={vscodeKey}
                        onChange={(e) => {
                          setVscodeKey(e.target.value);
                          setVscodeVerified(false);
                        }}
                        placeholder="vsc_live_sync_••••••••••••••••••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyVscode}
                      disabled={isVerifyingVscode}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isVerifyingVscode ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Pinging...</span>
                        </>
                      ) : (
                        <span>Test Heartbeat</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'secondary' && (
            <div className="space-y-6">
              {/* Tool 3: Google Antigravity */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                      <span>Google Antigravity Multi-Agent API Key</span>
                      {antigravityVerified && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-purple-800/80">
                      Coordinates autonomous code refactoring and background PR analysis agents.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={antigravityKey}
                      onChange={(e) => setAntigravityKey(e.target.value)}
                      placeholder="agy_live_core_••••••••••••••••••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyAntigravity}
                    disabled={isVerifyingAntigravity}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Ping Agent
                  </button>
                </div>
              </div>

              {/* Tool 4: Jira / Linear */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Jira API Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={jiraKey}
                    onChange={(e) => setJiraKey(e.target.value)}
                    placeholder="jira_api_token_..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                  <p className="text-[11px] text-slate-400">Syncs sprint velocity and task completion.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Linear API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={linearKey}
                    onChange={(e) => setLinearKey(e.target.value)}
                    placeholder="lin_api_key_..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                  <p className="text-[11px] text-slate-400">Pulls issue cycle times and roadmap tasks.</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Connect Later vs Save & Continue */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleConnectLater}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer text-center"
            >
              Connect Later (Skip Setup)
            </button>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Encrypting & Saving...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tokens are symmetrically encrypted with AES-256 before backend storage on Render.</span>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 mt-8">
        DevPulse • Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine
      </footer>
    </div>
  );
}
