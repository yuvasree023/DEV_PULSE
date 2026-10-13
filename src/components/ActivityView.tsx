import { useEffect, useState } from 'react';
import { api } from '../api';
import { authAndIntegrationsService } from '../services/authAndIntegrations';
import { Activity, Clock, Code2, FolderGit2, RefreshCw, Monitor } from 'lucide-react';

interface ActivitySummary {
  total_seconds: number;
  by_language: { language: string; seconds: number }[];
  by_project: { project: string; seconds: number }[];
}

interface SessionRow {
  project: string;
  language: string | null;
  editor: string;
  started_at: string | null;
  duration_seconds: number;
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ActivityView() {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthed = authAndIntegrationsService.getUser().isAuthenticated;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, rows] = await Promise.all([api.getActivitySummary(), api.getActivitySessions(20)]);
      setSummary(s);
      setSessions(rows);
    } catch (err: any) {
      setError(err?.message || 'Could not load coding activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      load();
    } else {
      setLoading(false);
    }
  }, [isAuthed]);

  if (!isAuthed) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center space-y-3">
        <Activity className="w-10 h-10 text-purple-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">My Coding Activity</h2>
        <p className="text-sm text-slate-600">Sign in with GitHub to see your coding activity here.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading your coding activity...</p>
      </div>
    );
  }

  const hasData = summary && summary.total_seconds > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Coding Activity</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracked by the DevPulse editor extension. Only project folder names, languages, and focused
            durations are stored - never file paths, contents, or keystrokes.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">{error}</div>
      )}

      {!hasData && !error && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl text-center space-y-3">
          <Monitor className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-800">No coding sessions yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Install the DevPulse extension from <code className="text-purple-700">vscode-extension/</code> in this
            repository, set your backend URL, and sign in. Your focused coding time will appear here.
          </p>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
                <Clock className="w-4 h-4" /> Total focused time
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{fmtDuration(summary!.total_seconds)}</div>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
                <Code2 className="w-4 h-4" /> Languages
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{summary!.by_language.length}</div>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
                <FolderGit2 className="w-4 h-4" /> Projects
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{summary!.by_project.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-xl">
              <h3 className="font-semibold text-slate-800 mb-3">By language</h3>
              <ul className="space-y-2">
                {summary!.by_language.map((l) => (
                  <li key={l.language} className="flex justify-between text-sm">
                    <span className="text-slate-700">{l.language}</span>
                    <span className="font-semibold text-slate-900">{fmtDuration(l.seconds)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-xl">
              <h3 className="font-semibold text-slate-800 mb-3">By project</h3>
              <ul className="space-y-2">
                {summary!.by_project.map((p) => (
                  <li key={p.project} className="flex justify-between text-sm">
                    <span className="text-slate-700 truncate mr-3">{p.project}</span>
                    <span className="font-semibold text-slate-900">{fmtDuration(p.seconds)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-3">Recent sessions</h3>
            <ul className="divide-y divide-slate-100">
              {sessions.map((s, i) => (
                <li key={i} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {s.project}
                    {s.language ? <span className="text-slate-400"> · {s.language}</span> : null}
                    <span className="text-slate-400"> · {s.editor}</span>
                  </span>
                  <span className="text-slate-500">
                    {s.started_at ? new Date(s.started_at).toLocaleString() : ''} · {fmtDuration(s.duration_seconds)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
