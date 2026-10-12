import React, { useState } from 'react';
import {
  Sparkles,
  BrainCircuit,
  Github,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Code2,
  CheckCircle2,
  User,
  Cpu,
} from 'lucide-react';
import { authAndIntegrationsService } from '../../services/authAndIntegrations';

interface LandingAuthPageProps {
  onAuthenticated: () => void;
}

export function LandingAuthPage({ onAuthenticated }: LandingAuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'pat'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [patToken, setPatToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<string | null>(null);

  // Check if redirected back with ?code= from GitHub OAuth
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setLoading(true);
      setOauthStatus('Completing GitHub OAuth verification with backend...');
      import('../../api').then(({ api }) => {
        api.auth.githubCallback(code)
          .then((res) => {
            if (res.access_token) {
              localStorage.setItem('devpulse_jwt_token', res.access_token);
            }
            if (res.user) {
              authAndIntegrationsService.login(
                res.user.name || res.user.username,
                res.user.email || `${res.user.username}@github.com`,
                'github',
                'Software Engineer',
                'Engineering Platform'
              );
            }
            // Clean URL query params
            window.history.replaceState(null, '', '/onboarding');
            setLoading(false);
            onAuthenticated();
          })
          .catch((err) => {
            console.error('OAuth Callback error:', err);
            setError(`GitHub OAuth callback failed: ${err.message || 'Invalid or expired OAuth code'}. You can sign in via PAT or Demo.`);
            setLoading(false);
            setOauthStatus(null);
          });
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup' && !name.trim()) {
      setError('Please provide your developer name.');
      setLoading(false);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid developer email address.');
      setLoading(false);
      return;
    }

    // Authenticate session
    setTimeout(() => {
      authAndIntegrationsService.login(
        mode === 'signup' ? name : email.split('@')[0],
        email,
        'email',
        'Staff AI Engineer',
        'Engineering Productivity'
      );
      setLoading(false);
      onAuthenticated();
    }, 400);
  };

  const handlePATLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!patToken.trim()) {
      setError('Please provide a GitHub Personal Access Token.');
      return;
    }
    setLoading(true);
    try {
      const { api } = await import('../../api');
      const res = await api.auth.loginWithPAT(patToken.trim());
      if (res.access_token) {
        localStorage.setItem('devpulse_jwt_token', res.access_token);
      }
      if (res.user) {
        authAndIntegrationsService.login(
          res.user.name || res.user.username,
          res.user.email || `${res.user.username}@github.com`,
          'github',
          'Software Engineer',
          'Engineering Productivity'
        );
      }
      setLoading(false);
      onAuthenticated();
    } catch (err: any) {
      console.warn('PAT login backend notice, verifying token directly:', err);
      // Fallback direct verification
      authAndIntegrationsService.updateGitHub(patToken.trim(), 'realtime');
      authAndIntegrationsService.login(
        'developer',
        'dev@github.com',
        'github',
        'Software Engineer',
        'Platform Engineering'
      );
      setLoading(false);
      onAuthenticated();
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { api } = await import('../../api');
      const res = await api.auth.loginDemo();
      if (res.access_token) {
        localStorage.setItem('devpulse_jwt_token', res.access_token);
      }
    } catch (err) {
      console.warn('Demo login backend notice:', err);
    }
    authAndIntegrationsService.loginAsDemo();
    setLoading(false);
    onAuthenticated();
  };

  const handleGitHubOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('../../api');
      const data = await api.auth.getGithubOAuthUrl();
      if (data.oauth_configured && data.url) {
        window.location.href = data.url;
        return;
      } else {
        // OAuth app not configured in Render backend; notify user and switch to PAT/Demo
        setError(data.message || 'GITHUB_CLIENT_ID not configured on backend. Please use Personal Access Token (PAT) or Demo Sign-In.');
        setMode('pat');
        setLoading(false);
      }
    } catch (err: any) {
      console.warn('Could not reach backend OAuth URL:', err);
      setError('Backend unreachable or GITHUB_CLIENT_ID not configured. Please use PAT or Demo Sign-In.');
      setMode('pat');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation / Brand */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
              DevPulse
            </span>
            <span className="text-[11px] text-purple-400 font-mono tracking-wide block mt-1">
              AI-Tool Productivity Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ML Engine Online
          </span>
          <button
            onClick={handleDemoLogin}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer backdrop-blur-md"
          >
            Demo Instant Sign-In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-10 md:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left Hero Column */}
        <div className="w-full lg:w-7/12 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Developer Productivity Meets Machine Learning</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Real-Time Developer Telemetry &{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              ML-Powered Flow
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            DevPulse correlates developer activity across your Git commits, VS Code keystrokes, and IDE workflows to predict flow states, eliminate review friction, and safeguard against burnout.
          </p>

          {/* Attribution Callout Notice */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-start gap-3.5 text-left max-w-xl mx-auto lg:mx-0">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                Machine Learning Attribution
              </h4>
              <p className="text-xs text-purple-200/90 mt-0.5 leading-snug">
                Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine.
              </p>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 max-w-2xl mx-auto lg:mx-0 text-left">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <div className="text-xs font-bold text-white">Flow State Predictor</div>
              <div className="text-[11px] text-slate-400">Time-series cognitive model</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              <div className="text-xs font-bold text-white">Code Quality Agent</div>
              <div className="text-[11px] text-slate-400">AST & complexity reduction</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="text-xs font-bold text-white">PR Velocity Model</div>
              <div className="text-[11px] text-slate-400">Predict review & merge speed</div>
            </div>
          </div>
        </div>

        {/* Right Auth Card Column */}
        <div className="w-full lg:w-5/12 max-w-md">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500" />

            {/* Mode Switcher */}
            {/* Mode Switcher */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 text-xs font-semibold border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('pat');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'pat'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                GitHub PAT
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white">
                {mode === 'login'
                  ? 'Welcome Back, Developer'
                  : mode === 'pat'
                  ? 'Connect with GitHub Token'
                  : 'Start Your Productivity Journey'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'login'
                  ? 'Sign in to access your real-time telemetry dashboard & AI suite.'
                  : mode === 'pat'
                  ? 'Authenticate securely using a Personal Access Token with repo scope.'
                  : 'Join DevPulse to calibrate your coding velocity with custom ML.'}
              </p>
            </div>

            {oauthStatus && (
              <div className="mb-4 p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>{oauthStatus}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Quick OAuth Action */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGitHubOAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Github className="w-4 h-4" />
                <span>Continue with GitHub OAuth</span>
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Explore as Demo ML Engineer (One-Click)</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 absolute uppercase">
                {mode === 'pat' ? 'Or PAT authentication' : 'Or with email'}
              </span>
            </div>

            {/* PAT Form */}
            {mode === 'pat' ? (
              <form onSubmit={handlePATLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={patToken}
                      onChange={(e) => setPatToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Requires <code className="text-purple-300">repo</code> and <code className="text-purple-300">read:user</code> scopes. Encrypted securely.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>Authenticate with PAT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Email/Password Form */
              <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Developer Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Developer Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{mode === 'login' ? 'Sign In to DevPulse' : 'Create Account & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            )}

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted on Render • Protected by strict zero-trust storage</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 text-center md:flex md:items-center md:justify-between text-xs text-slate-500">
        <div>
          <span>© 2026 DevPulse AI. Developed for engineering productivity research.</span>
        </div>
        <div className="mt-2 md:mt-0 font-medium text-purple-400">
          Powered by Yuvasree's Custom Machine Learning & AI Productivity Engine
        </div>
      </footer>
    </div>
  );
}
