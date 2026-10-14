import { useState } from 'react';
import { ShieldCheck, Github, MonitorSmartphone, Database, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../api';

export function PrivacyView() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.deleteActivitySessions();
      setResult(res.deleted === 0 ? 'No stored activity to delete.' : `Deleted ${res.deleted} recorded coding session${res.deleted === 1 ? '' : 's'}.`);
      setConfirming(false);
    } catch {
      setError('Could not delete right now. Make sure you are signed in, then try again.');
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy &amp; Your Data</h1>
        <p className="text-sm text-slate-500 mt-1">
          Exactly what DevPulse reads, what it stores, and how to disconnect or delete.
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
          <li>No GitHub PAT is needed in this workspace. Private repository access is not offered.</li>
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
          <li>Copy your current DevPulse session from Connections into the extension. It lives in VS Code SecretStorage, not settings. Reconnect when it expires.</li>
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
          <h2 className="font-semibold text-slate-800">Disconnect &amp; delete</h2>
        </div>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Sign out of DevPulse to clear your local session.</li>
          <li>Revoke the DevPulse OAuth app anytime at GitHub &rarr; Settings &rarr; Applications.</li>
          <li>In the editor, run "DevPulse: Sign Out" to stop tracking and clear the stored session.</li>
        </ul>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <p className="text-sm text-slate-600">
            Delete all recorded coding sessions from the database. This cannot be undone.
          </p>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
            >
              Delete my activity data
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-xs text-rose-800 font-semibold">Really delete every recorded session?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="ml-auto px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
          {result && <p className="text-xs text-emerald-700 font-semibold">{result}</p>}
          {error && <p className="text-xs text-rose-700 font-semibold">{error}</p>}
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Questions about stored data: open an issue on the DEV_PULSE repository.
        </p>
      </section>
    </div>
  );
}
