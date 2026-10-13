import React, { useState } from 'react';
import { authAndIntegrationsService } from '../../services/authAndIntegrations';
import {
  Github,
  Code2,
  Cpu,
  Notebook,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
} from 'lucide-react';

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState(authAndIntegrationsService.getIntegrations());
  const [githubToken, setGithubToken] = useState(integrations.github.token);
  const [showGithub, setShowGithub] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubFeedback, setGithubFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleTestGitHub = async () => {
    const token = githubToken.trim();
    setGithubFeedback(null);
    if (!token) {
      setGithubFeedback({ type: 'error', msg: 'Paste a token first, or skip this - sign-in already covers public data.' });
      return;
    }
    setTestingGithub(true);
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        setGithubFeedback({ type: 'error', msg: `GitHub API error (${res.status}): ${err.message || 'invalid token'}` });
      } else {
        const data = await res.json();
        const remaining = res.headers.get('x-ratelimit-remaining');
        authAndIntegrationsService.updateGitHub(token, 'manual');
        setIntegrations(authAndIntegrationsService.getIntegrations());
        setGithubFeedback({
          type: 'success',
          msg: `Verified @${data.login}${remaining ? ` - ${remaining} API requests remaining this hour` : ''}.`,
        });
      }
    } catch {
      setGithubFeedback({ type: 'error', msg: 'Network error reaching api.github.com.' });
    }
    setTestingGithub(false);
  };

  const handleDisconnectGitHub = () => {
    authAndIntegrationsService.disconnectIntegration('github');
    setIntegrations(authAndIntegrationsService.getIntegrations());
    setGithubToken('');
    setGithubFeedback(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 md:p-8 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
          <Lock className="w-3 h-3" />
          <span>Connections</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Connect your tools
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
          DevPulse reads your public GitHub activity and, if you install it, coding-session metadata from the
          companion editor extension. Nothing here posts to GitHub, and private repositories are never touched.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GitHub</h3>
                  <span className="text-[11px] text-slate-400">Public profile, repos & commit activity</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrations.github.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {integrations.github.connected ? 'Connected' : 'Via sign-in'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Signing in with GitHub already gives DevPulse read-only access to your public data
              (scopes <code className="bg-slate-100 px-1 rounded">read:user</code> and{' '}
              <code className="bg-slate-100 px-1 rounded">user:email</code>). A personal access token is optional
              and only raises API rate headroom. If you add one, use a fine-grained token with read-only access
              to public repositories.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Optional: fine-grained access token</label>
              <div className="relative">
                <input
                  type={showGithub ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="github_pat_..."
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
              <p className="text-[11px] text-slate-400">
                Stored only in this browser's local storage and sent only to api.github.com when you test it.
              </p>
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
              onClick={handleDisconnectGitHub}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Remove token
            </button>
            <button
              onClick={handleTestGitHub}
              disabled={testingGithub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingGithub ? 'animate-spin' : ''}`} />
              <span>{testingGithub ? 'Verifying...' : 'Test connection'}</span>
            </button>
          </div>
        </div>

        {/* VS Code extension card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">VS Code extension</h3>
                  <span className="text-[11px] text-slate-400">Coding-session activity tracker</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Source build
              </span>
            </div>

            <p className="text-xs text-slate-500">
              The extension lives in this repository under <code className="bg-slate-100 px-1 rounded">vscode-extension/</code>.
              It is not on the Marketplace yet, so you build and install it locally.
            </p>

            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>In <code className="bg-slate-100 px-1 rounded">vscode-extension/</code>: <code className="bg-slate-100 px-1 rounded">npm install && npm run compile && npx @vscode/vsce package</code></li>
              <li>Install the generated .vsix: <code className="bg-slate-100 px-1 rounded">code --install-extension devpulse-activity-*.vsix</code></li>
              <li>Set <code className="bg-slate-100 px-1 rounded">devpulse.backendUrl</code> to your deployed backend URL and paste a session token (PAT) from the dashboard in VS Code settings.</li>
              <li>Your sessions appear under <span className="font-semibold">My Activity</span> in the sidebar.</li>
            </ol>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Collects only the project folder name, programming language, editor name, and active minutes
                (with idle detection and a pause command). It never reads file contents or full paths.
              </span>
            </div>
          </div>
        </div>

        {/* Antigravity card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-400 text-white flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Antigravity</h3>
                  <span className="text-[11px] text-slate-400">Agent-first IDE</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Not connected - untested
              </span>
            </div>

            <p className="text-xs text-slate-500">
              There is no Antigravity integration in DevPulse today. Whether the Antigravity IDE can run the
              DevPulse VS Code extension is untested, so this connector stays off. If you try the extension
              inside Antigravity and it works, sessions will show up under My Activity exactly like VS Code.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">No credentials are requested or stored for Antigravity.</span>
          </div>
        </div>

        {/* Colab card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Notebook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Colab</h3>
                  <span className="text-[11px] text-slate-400">Optional notebook logger</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Optional
              </span>
            </div>

            <p className="text-xs text-slate-500">
              A short Python snippet can log Colab notebook sessions (runtime type and duration) to your
              dashboard. The snippet and setup steps are in the repository at{' '}
              <code className="bg-slate-100 px-1 rounded">docs/colab-connector.md</code>.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <a
              href="https://github.com/yuvasree023/DEV_PULSE/blob/main/docs/colab-connector.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline font-semibold cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open the Colab snippet</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
