import React, { useState } from 'react';
import { Github, ShieldCheck, ArrowRight, FolderGit2 } from 'lucide-react';

interface AuthViewProps {
  busy: boolean;
  error: string;
  notice: string;
  onSubmit: (values: { name?: string; email: string; password: string }) => void;
  onSwitch: (view: 'login' | 'signup') => void;
  onGithub: () => void;
  onForgot: (email: string) => void;
}

export function LoginView({ busy, error, notice, onSubmit, onSwitch, onGithub, onForgot }: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgot, setForgot] = useState(false);
  return (
    <div className="dp-auth-card">
      <h1>Welcome back</h1>
      <p className="dp-auth-sub">Log in with your DevPulse email and password.</p>
      {error && <p role="alert" className="dp-error">{error}</p>}
      {notice && <p role="status" className="dp-auth-notice">{notice}</p>}
      {forgot ? (
        <form onSubmit={(e) => { e.preventDefault(); onForgot(email); }}>
          <label htmlFor="dp-reset-email">EMAIL</label>
          <input id="dp-reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button className="dp-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          <button type="button" className="dp-text-link" onClick={() => setForgot(false)}>Back to log in</button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ email, password }); }}>
          <label htmlFor="dp-login-email">EMAIL</label>
          <input id="dp-login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label htmlFor="dp-login-password">PASSWORD</label>
          <input id="dp-login-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
          <button className="dp-primary" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}<ArrowRight size={18} /></button>
          <button type="button" className="dp-text-link" onClick={() => setForgot(true)}>Forgot password?</button>
        </form>
      )}
      <p className="dp-auth-switch">New to DevPulse? <button type="button" onClick={() => onSwitch('signup')}>Create an account</button></p>
      <button type="button" className="dp-secondary dp-auth-github" onClick={onGithub} disabled={busy}><Github size={17} />Continue with GitHub</button>
      <p className="dp-auth-fine"><ShieldCheck size={14} /> Your GitHub stays optional - connect it after logging in.</p>
    </div>
  );
}

export function SignupView({ busy, error, notice, onSubmit, onSwitch, onGithub }: AuthViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="dp-auth-card">
      <h1>Create your account</h1>
      <p className="dp-auth-sub">One account for your developer workspace. Free, no card.</p>
      {error && <p role="alert" className="dp-error">{error}</p>}
      {notice && <p role="status" className="dp-auth-notice">{notice}</p>}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, password }); }}>
        <label htmlFor="dp-signup-name">NAME</label>
        <input id="dp-signup-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <label htmlFor="dp-signup-email">EMAIL</label>
        <input id="dp-signup-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label htmlFor="dp-signup-password">PASSWORD</label>
        <input id="dp-signup-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        <button className="dp-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}<ArrowRight size={18} /></button>
      </form>
      <p className="dp-auth-switch">Already have an account? <button type="button" onClick={() => onSwitch('login')}>Log in</button></p>
      <button type="button" className="dp-secondary dp-auth-github" onClick={onGithub} disabled={busy}><Github size={17} />Continue with GitHub</button>
      <p className="dp-auth-fine"><ShieldCheck size={14} /> Passwords are stored hashed - never readable, never shared.</p>
    </div>
  );
}

interface ConnectViewProps {
  busy: boolean;
  error: string;
  notice: string;
  onConnect: () => void;
  onSkip: () => void;
}

export function ConnectGitHubView({ busy, error, notice, onConnect, onSkip }: ConnectViewProps) {
  return (
    <div className="dp-auth-card">
      <span className="dp-auth-step">STEP 2 OF 2</span>
      <h1>Connect your GitHub</h1>
      <p className="dp-auth-sub">Link GitHub to pull your repositories and activity into your workspace.</p>
      {error && <p role="alert" className="dp-error">{error}</p>}
      {notice && <p role="status" className="dp-auth-notice">{notice}</p>}
      <div className="dp-auth-tool">
        <div className="dp-auth-tool-ico"><FolderGit2 size={20} /></div>
        <div><strong>GitHub</strong><p>Read-only access to your profile and public repositories. You choose what syncs. Disconnect anytime.</p></div>
      </div>
      <button className="dp-primary" onClick={onConnect} disabled={busy}><Github size={18} />{busy ? 'Connecting…' : 'Connect GitHub'}</button>
      <button type="button" className="dp-text-link" onClick={onSkip}>Skip for now - you can connect later from Connections</button>
      <p className="dp-auth-fine"><ShieldCheck size={14} /> Only the scopes you approve on GitHub's own screen are used.</p>
    </div>
  );
}

interface ResetViewProps {
  busy: boolean;
  error: string;
  notice: string;
  onSubmit: (values: { password: string }) => void;
  onDone: () => void;
}

export function ResetPasswordView({ busy, error, notice, onSubmit, onDone }: ResetViewProps) {
  const [password, setPassword] = useState('');
  return (
    <div className="dp-auth-card">
      <h1>Choose a new password</h1>
      <p className="dp-auth-sub">Set a new password for your DevPulse account.</p>
      {error && <p role="alert" className="dp-error">{error}</p>}
      {notice && <p role="status" className="dp-auth-notice">{notice}</p>}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ password }); }}>
        <label htmlFor="dp-reset-password">NEW PASSWORD</label>
        <input id="dp-reset-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        <button className="dp-primary" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}<ArrowRight size={18} /></button>
      </form>
      <button type="button" className="dp-text-link" onClick={onDone}>Back to log in</button>
    </div>
  );
}

interface EmailPasswordPanelProps {
  email: string;
  hasPassword: boolean;
  busy: boolean;
  error: string;
  notice: string;
  onSubmit: (values: { email: string; password: string; currentPassword?: string }) => void;
}

export function EmailPasswordPanel({ email, hasPassword, busy, error, notice, onSubmit }: EmailPasswordPanelProps) {
  const [e, setE] = useState(email);
  const [p, setP] = useState('');
  const [cur, setCur] = useState('');
  return (
    <section className="dp-panel dp-account-panel">
      <div className="dp-panel-title">
        <div>
          <span className="dp-eyebrow">SIGN IN YOUR WAY</span>
          <h2>Email &amp; password</h2>
        </div>
        <span className="dp-badge">{hasPassword ? 'Set up' : 'Not set up'}</span>
      </div>
      <p className="dp-account-text">
        {hasPassword
          ? 'Your account already has email sign-in. Change the email or password here.'
          : 'Add an email and password to this account so you can also log in without GitHub. Your GitHub login and all your data stay exactly as they are.'}
      </p>
      {error && <p role="alert" className="dp-error">{error}</p>}
      {notice && <p role="status" className="dp-copy-notice">{notice}</p>}
      <form className="dp-account-form" onSubmit={(ev) => { ev.preventDefault(); onSubmit({ email: e, password: p, currentPassword: cur || undefined }); }}>
        <label htmlFor="dp-acct-email">EMAIL</label>
        <input id="dp-acct-email" type="email" required autoComplete="email" value={e} onChange={(ev) => setE(ev.target.value)} placeholder="you@example.com" />
        <label htmlFor="dp-acct-pass">{hasPassword ? 'NEW PASSWORD' : 'PASSWORD'}</label>
        <input id="dp-acct-pass" type="password" required minLength={8} autoComplete="new-password" value={p} onChange={(ev) => setP(ev.target.value)} placeholder="At least 8 characters" />
        {hasPassword && (
          <>
            <label htmlFor="dp-acct-cur">CURRENT PASSWORD</label>
            <input id="dp-acct-cur" type="password" required autoComplete="current-password" value={cur} onChange={(ev) => setCur(ev.target.value)} placeholder="Your current password" />
          </>
        )}
        <button className="dp-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : hasPassword ? 'Update email sign-in' : 'Add email sign-in'}</button>
      </form>
    </section>
  );
}
