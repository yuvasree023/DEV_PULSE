import { ShieldCheck, Github, MonitorSmartphone, Database, Trash2 } from 'lucide-react';

export function PrivacyView() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy &amp; Your Data</h1>
        <p className="text-sm text-slate-500 mt-1">
          Exactly what DevPulse reads, what it stores, and how to disconnect.
        </p>
      </div>

      <section className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-slate-700" />
          <h2 className="font-semibold text-slate-800">GitHub sign-in (read-only, public data)</h2>
        </div>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>DevPulse requests only <code>read:user</code> and <code>user:email</code>: your public profile and email.</li>
          <li>Your dashboard shows your <strong>public repositories</strong> and their public activity (commits, PRs).</li>
          <li>Private repositories are <strong>never</strong> requested or shown with GitHub sign-in.</li>
          <li>If you sign in with a token instead, public repos need no scopes. For private repos, use a fine-grained token with read-only access to only the repositories you choose.</li>
          <li>DevPulse never writes to your GitHub account.</li>
        </ul>
      </section>

      <section className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="w-5 h-5 text-slate-700" />
          <h2 className="font-semibold text-slate-800">Editor extension (VS Code and compatible editors)</h2>
        </div>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Tracks focused coding intervals locally: workspace folder name, file language, editor name, start/end time.</li>
          <li>Idle time is excluded automatically; you can pause tracking anytime from the status bar.</li>
          <li>Sends only those session summaries to your own DevPulse backend. It never sends file paths, file contents, keystrokes, or anything you type.</li>
          <li>Your GitHub token is exchanged for a DevPulse session and is never stored by the extension; the session token lives in VS Code SecretStorage.</li>
        </ul>
      </section>

      <section className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-slate-700" />
          <h2 className="font-semibold text-slate-800">Where data lives</h2>
        </div>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Your account, synced repository list, and coding sessions are stored in the project's own Postgres database.</li>
          <li>Only you can read or write your coding sessions; the API enforces per-user access on every request.</li>
        </ul>
      </section>

      <section className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-slate-700" />
          <h2 className="font-semibold text-slate-800">Disconnect</h2>
        </div>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Sign out of DevPulse to clear your local session.</li>
          <li>Revoke the DevPulse OAuth app anytime at GitHub &rarr; Settings &rarr; Applications.</li>
          <li>In the editor, run "DevPulse: Sign Out" to stop tracking and clear the stored session.</li>
        </ul>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Questions about stored data: open an issue on the DEV_PULSE repository.
        </p>
      </section>
    </div>
  );
}
