import React, { useState, useEffect } from 'react';
import { authAndIntegrationsService } from '../../services/authAndIntegrations';
import {
  UserProfile,
  IntegrationsState,
  TelemetryEvent,
} from '../../types';
import {
  Key,
  Lock,
  ShieldCheck,
  Github,
  Code2,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  LogOut,
  LogIn,
  Sliders,
  History,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export function IntegrationsView() {
  const [user, setUser] = useState<UserProfile>(authAndIntegrationsService.getUser());
  const [integrations, setIntegrations] = useState<IntegrationsState>(authAndIntegrationsService.getIntegrations());
  const [events, setEvents] = useState<TelemetryEvent[]>(authAndIntegrationsService.getEvents());

  // Input states
  const [githubToken, setGithubToken] = useState(integrations.github.token);
  const [githubSyncFreq, setGithubSyncFreq] = useState(integrations.github.syncFrequency);
  const [vscodeKey, setVscodeKey] = useState(integrations.vscode.apiKey);
  const [vscodeSyncActive, setVscodeSyncActive] = useState(integrations.vscode.settingsSyncActive);
  const [antigravityKey, setAntigravityKey] = useState(integrations.antigravity.apiKey);
  const [antigravityMode, setAntigravityMode] = useState(integrations.antigravity.agentMode);

  // Masking toggles
  const [showGithub, setShowGithub] = useState(false);
  const [showVscode, setShowVscode] = useState(false);
  const [showAntigravity, setShowAntigravity] = useState(false);

  // Action status indicators
  const [testingGithub, setTestingGithub] = useState(false);
  const [testingVscode, setTestingVscode] = useState(false);
  const [testingAntigravity, setTestingAntigravity] = useState(false);
  const [githubFeedback, setGithubFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copiedHook, setCopiedHook] = useState(false);

  // Login modal / edit user state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');

  useEffect(() => {
    const unsubscribe = authAndIntegrationsService.subscribe(() => {
      setUser(authAndIntegrationsService.getUser());
      const updated = authAndIntegrationsService.getIntegrations();
      setIntegrations(updated);
      setEvents(authAndIntegrationsService.getEvents());
      setGithubToken(updated.github.token);
      setVscodeKey(updated.vscode.apiKey);
      setAntigravityKey(updated.antigravity.apiKey);
    });
    return unsubscribe;
  }, []);

  const handleTestGitHub = async () => {
    setTestingGithub(true);
    setGithubFeedback(null);
    authAndIntegrationsService.updateGitHub(githubToken, githubSyncFreq);
    const res = await authAndIntegrationsService.testGitHubConnection(githubToken);
    setTestingGithub(false);
    if (res.success) {
      setGithubFeedback({
        type: 'success',
        msg: `Verified @${res.data?.login || 'yuvasree023'} with ${res.data?.rate_limit || 4980} API requests remaining.`,
      });
    } else {
      setGithubFeedback({ type: 'error', msg: res.error || 'Connection failed' });
    }
  };

  const handleTestVSCode = () => {
    setTestingVscode(true);
    authAndIntegrationsService.updateVSCode(vscodeKey, vscodeSyncActive);
    setTimeout(() => {
      authAndIntegrationsService.testVSCodeHeartbeat();
      setTestingVscode(false);
    }, 600);
  };

  const handleTestAntigravity = () => {
    setTestingAntigravity(true);
    authAndIntegrationsService.updateAntigravity(antigravityKey, antigravityMode);
    setTimeout(() => {
      authAndIntegrationsService.pingAntigravity();
      setTestingAntigravity(false);
    }, 600);
  };

  const handleCopyWebhook = () => {
    if (!integrations.vscode.webhookUrl) return;
    navigator.clipboard.writeText(integrations.vscode.webhookUrl);
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 2000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    authAndIntegrationsService.login(loginName || 'Developer', loginEmail, 'email');
    setIsLoginModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
            <Lock className="w-3 h-3" />
            <span>Developer Tool Credentials & Telemetry Vault</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Integrations & Access Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Securely configure developer credentials for GitHub activity streams, VS Code extension telemetry, and Google Antigravity multi-agent workspace connectors.
          </p>
        </div>

        {/* User Authentication Pill Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shrink-0 flex items-center justify-between gap-4 min-w-[280px]">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full border border-purple-300 object-cover"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{user.name}</span>
                {user.isAuthenticated && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Authenticated" />
                )}
              </div>
              <span className="text-[11px] text-slate-500 block">{user.email}</span>
              <span className="text-[10px] font-mono text-purple-600 font-semibold">{user.role}</span>
            </div>
          </div>

          <div>
            {user.isAuthenticated ? (
              <button
                onClick={() => authAndIntegrationsService.logout()}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 text-purple-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold">Encrypted Token Storage & Privacy Guarantee</h4>
            <p className="text-purple-700 text-[11px] mt-0.5">
              Personal Access Tokens are encrypted client-side using WebCrypto AES-GCM and masked in all telemetry logs. Tokens can also be supplied via backend environment variables (<code className="bg-white/60 px-1 rounded">GITHUB_TOKEN</code>).
            </p>
          </div>
        </div>
        <button
          onClick={() => authAndIntegrationsService.resetToDefaults()}
          className="text-[11px] text-purple-700 font-semibold underline underline-offset-2 shrink-0 cursor-pointer hover:text-purple-950"
        >
          Reset to Demo Baseline
        </button>
      </div>

      {/* Integration Credentials Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. GitHub Integration Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GitHub Connector</h3>
                  <span className="text-[11px] text-slate-400">PRs, Commits, & Cycle Times</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrations.github.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {integrations.github.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Personal Access Token (PAT)</span>
                <span className="text-[10px] text-purple-600 font-mono">repo, read:user</span>
              </label>
              <div className="relative">
                <input
                  type={showGithub ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_••••••••••••••••••••••••••••••••"
                  className="w-full text-xs font-mono px-3 py-2 pr-9 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGithub(!showGithub)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Polling Frequency</label>
              <select
                value={githubSyncFreq}
                onChange={(e) => setGithubSyncFreq(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="realtime">Real-Time Polling (Every 5s)</option>
                <option value="5min">Normal Cadence (5 min)</option>
                <option value="15min">Background (15 min)</option>
                <option value="manual">Manual Trigger Only</option>
              </select>
            </div>

            {githubFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 ${
                  githubFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {githubFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>{githubFeedback.msg}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => authAndIntegrationsService.disconnectIntegration('github')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Disconnect
            </button>
            <button
              onClick={handleTestGitHub}
              disabled={testingGithub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingGithub ? 'animate-spin' : ''}`} />
              <span>{testingGithub ? 'Verifying...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* 2. VS Code Extension Integration Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">VS Code Extension</h3>
                  <span className="text-[11px] text-slate-400">Companion Telemetry & Buffer Stream</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrations.vscode.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {integrations.vscode.connected ? 'Active Hook' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Telemetry Sync API Key</label>
              <div className="relative">
                <input
                  type={showVscode ? 'text' : 'password'}
                  value={vscodeKey}
                  onChange={(e) => setVscodeKey(e.target.value)}
                  placeholder="vsc_••••••••••••••••••••••••••••••••"
                  className="w-full text-xs font-mono px-3 py-2 pr-9 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowVscode(!showVscode)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showVscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Webhook Ingestion URL</span>
                <button
                  onClick={handleCopyWebhook}
                  className="text-[10px] text-purple-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {copiedHook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHook ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 overflow-x-auto whitespace-nowrap">
                {integrations.vscode.webhookUrl}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>Today's active coding:</span>
              <span className="font-mono font-bold text-slate-900">
                {integrations.vscode.todayActiveMinutes} mins ({(integrations.vscode.todayActiveMinutes! / 60).toFixed(1)} hrs)
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => authAndIntegrationsService.disconnectIntegration('vscode')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Disconnect
            </button>
            <button
              onClick={handleTestVSCode}
              disabled={testingVscode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingVscode ? 'animate-spin' : ''}`} />
              <span>{testingVscode ? 'Pinging...' : 'Send Heartbeat'}</span>
            </button>
          </div>
        </div>

        {/* 3. Antigravity & External AI Tools Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Antigravity</h3>
                  <span className="text-[11px] text-slate-400">Autonomous Multi-Agent Workspace</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrations.antigravity.connected
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {integrations.antigravity.connected ? 'Swarm Ready' : 'Standby'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Antigravity API Secret Key</label>
              <div className="relative">
                <input
                  type={showAntigravity ? 'text' : 'password'}
                  value={antigravityKey}
                  onChange={(e) => setAntigravityKey(e.target.value)}
                  placeholder="agy_••••••••••••••••••••••••••••••••"
                  className="w-full text-xs font-mono px-3 py-2 pr-9 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAntigravity(!showAntigravity)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAntigravity ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Agent Multi-Agent Mode</label>
              <select
                value={antigravityMode}
                onChange={(e) => setAntigravityMode(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="autonomous">Autonomous Multi-Agent (Full Pipeline)</option>
                <option value="pair-programmer">Pair-Programmer (Interactive Mode)</option>
                <option value="evaluator">Evaluator (Benchmark & Grounding Only)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>Active Agent Pipelines:</span>
              <span className="font-mono font-bold text-purple-700">
                {integrations.antigravity.activePipelinesCount} Swarm Pipelines
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => authAndIntegrationsService.disconnectIntegration('antigravity')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Disconnect
            </button>
            <button
              onClick={handleTestAntigravity}
              disabled={testingAntigravity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingAntigravity ? 'animate-spin' : ''}`} />
              <span>{testingAntigravity ? 'Connecting...' : 'Ping Environment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Ingestion & Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-900">Live Ingested Telemetry Stream (Audit Trail)</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {events.length} events logged in session
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    evt.source === 'github'
                      ? 'bg-slate-900'
                      : evt.source === 'vscode'
                      ? 'bg-blue-600'
                      : 'bg-purple-600'
                  }`}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{evt.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">
                      {evt.source}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{evt.details}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Sign In Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-purple-600" />
                Developer Authentication
              </h3>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Developer Name</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="e.g. Yuvasree"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Work Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
