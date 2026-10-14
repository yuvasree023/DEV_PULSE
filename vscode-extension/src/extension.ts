import * as vscode from 'vscode';

const TOKEN_KEY = 'devpulse.sessionToken';
const QUEUE_KEY = 'devpulse.sessionQueue';
const IDLE_SECONDS = 120;
const TICK_SECONDS = 30;
const FLUSH_EVERY_TICKS = 10; // ~5 minutes
const FLUSH_AT_QUEUE = 10;

interface SessionRecord {
  project: string;
  language: string | null;
  editor: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

interface Kpis {
  total_commits?: number;
  total_prs?: number;
  total_repositories?: number;
  ai_adoption_rate?: number;
  [key: string]: unknown;
}

function backendUrl(): string {
  return (vscode.workspace.getConfiguration('devpulse').get<string>('backendUrl') || '').replace(/\/+$/, '');
}

async function apiFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  const base = backendUrl();
  if (!base) {
    throw new Error('Set devpulse.backendUrl in Settings first (your DevPulse backend URL).');
  }
  return fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.headers || {}) },
  });
}

/**
 * Tracks focused coding intervals. Only folder name, language id, editor app
 * name, and timing are recorded - never file paths, contents, or keystrokes.
 */
class ActivityTracker {
  private segmentStart: number | null = null;
  private lastActivity = 0;
  private project: string | null = null;
  private language: string | null = null;
  private paused = true;
  private tickCount = 0;
  private statusBar: vscode.StatusBarItem;

  constructor(private context: vscode.ExtensionContext) {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBar.command = 'devpulse.pause';
    this.statusBar.show();
    this.updateStatus();

    const onActivity = () => this.noteActivity();
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(onActivity),
      vscode.window.onDidChangeTextEditorSelection(onActivity),
      vscode.workspace.onDidChangeTextDocument(onActivity),
      vscode.window.onDidChangeWindowState(onActivity),
      vscode.window.onDidChangeTextEditorVisibleRanges(onActivity),
      this.statusBar,
    );

    const timer = setInterval(() => this.onTick(), TICK_SECONDS * 1000);
    context.subscriptions.push({ dispose: () => clearInterval(timer) });
  }

  private noteActivity() {
    if (this.paused || !vscode.window.state.focused) {
      return;
    }
    const folder = vscode.workspace.workspaceFolders?.[0]?.name ?? null;
    const lang = vscode.window.activeTextEditor?.document.languageId ?? null;
    const now = Date.now();
    if (this.segmentStart === null) {
      this.segmentStart = now;
      this.project = folder;
      this.language = lang;
    } else if (folder !== this.project || lang !== this.language) {
      // Context switched: close the current segment and open a new one.
      this.closeSegment(now);
      this.segmentStart = now;
      this.project = folder;
      this.language = lang;
    }
    this.lastActivity = now;
    this.updateStatus();
  }

  private closeSegment(endMs: number) {
    if (this.segmentStart === null || endMs <= this.segmentStart) {
      this.segmentStart = null;
      return;
    }
    const activeMs = Math.max(0, this.lastActivity - this.segmentStart);
    if (activeMs >= 10 * 1000 && this.project) {
      const record: SessionRecord = {
        project: this.project,
        language: this.language,
        editor: vscode.env.appName,
        started_at: new Date(this.segmentStart).toISOString(),
        ended_at: new Date(endMs).toISOString(),
        duration_seconds: Math.round(activeMs / 1000),
      };
      const queue = this.context.globalState.get<SessionRecord[]>(QUEUE_KEY, []);
      queue.push(record);
      void this.context.globalState.update(QUEUE_KEY, queue);
    }
    this.segmentStart = null;
  }

  private async onTick() {
    const now = Date.now();
    if (this.segmentStart !== null && now - this.lastActivity > IDLE_SECONDS * 1000) {
      // Idle: close the segment at the last active moment, not now.
      this.closeSegment(this.lastActivity);
      this.updateStatus();
    }
    this.tickCount += 1;
    const queue = this.context.globalState.get<SessionRecord[]>(QUEUE_KEY, []);
    if (queue.length > 0 && (this.tickCount % FLUSH_EVERY_TICKS === 0 || queue.length >= FLUSH_AT_QUEUE)) {
      await this.flush();
    }
  }

  async sendNow(): Promise<void> {
    this.closeSegment(this.lastActivity);
    await this.flush();
  }

  async flush(): Promise<void> {
    const token = await this.context.secrets.get(TOKEN_KEY);
    const queue = this.context.globalState.get<SessionRecord[]>(QUEUE_KEY, []);
    if (!token || queue.length === 0) {
      return;
    }
    try {
      const res = await apiFetch('/api/activity/sessions', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: queue.slice(0, 100) }),
      });
      if (res.status === 401) {
        await this.context.secrets.delete(TOKEN_KEY);
        return;
      }
      if (res.ok) {
        await this.context.globalState.update(QUEUE_KEY, queue.slice(100));
      }
    } catch {
      // Offline or backend down: sessions stay queued locally.
    }
  }

  resume() { this.paused = false; this.noteActivity(); this.updateStatus(); }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.closeSegment(Date.now());
    } else {
      this.noteActivity();
    }
    this.updateStatus();
    vscode.window.showInformationMessage(this.paused ? 'DevPulse: tracking paused.' : 'DevPulse: tracking resumed.');
  }

  private updateStatus() {
    const tracking = !this.paused && this.segmentStart !== null;
    this.statusBar.text = this.paused ? '$(debug-pause) DevPulse' : tracking ? '$(pulse) DevPulse' : '$(circle-slash) DevPulse';
    this.statusBar.tooltip = this.paused ? 'DevPulse tracking paused - click to resume' : 'DevPulse - click to pause tracking';
    this.statusBar.command = 'devpulse.pause';
  }

  async dispose() {
    this.paused = true;
    this.closeSegment(this.lastActivity);
    await this.flush();
    this.updateStatus();
  }
}

class StatsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private items: vscode.TreeItem[] = [];

  setStats(kpis: Kpis, codingSeconds: number | null, username: string) {
    const mk = (label: string, value: unknown) => {
      const item = new vscode.TreeItem(`${label}: ${value ?? 'n/a'}`);
      item.iconPath = new vscode.ThemeIcon('graph');
      return item;
    };
    const head = new vscode.TreeItem(`Signed in as ${username}`);
    head.iconPath = new vscode.ThemeIcon('account');
    this.items = [head];
    if (codingSeconds !== null) {
      const hours = Math.floor(codingSeconds / 3600);
      const mins = Math.round((codingSeconds % 3600) / 60);
      this.items.push(mk('Coding time (tracked)', hours > 0 ? `${hours}h ${mins}m` : `${mins}m`));
    }
    this.items.push(
      mk('Commits', kpis.total_commits),
      mk('Pull requests', kpis.total_prs),
      mk('Repositories', kpis.total_repositories),
      mk('AI adoption', kpis.ai_adoption_rate != null ? `${kpis.ai_adoption_rate}%` : 'n/a'),
    );
    this._onDidChangeTreeData.fire();
  }

  setMessage(text: string) {
    const item = new vscode.TreeItem(text);
    item.iconPath = new vscode.ThemeIcon('info');
    this.items = [item];
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }
  getChildren(): vscode.TreeItem[] {
    return this.items;
  }
}

async function refresh(provider: StatsProvider, context: vscode.ExtensionContext) {
  const token = await context.secrets.get(TOKEN_KEY);
  if (!token) {
    provider.setMessage('Run "DevPulse: Connect Dashboard Session" to connect.');
    return;
  }
  try {
    const [meRes, kpiRes, actRes] = await Promise.all([
      apiFetch('/api/auth/me', token),
      apiFetch('/api/analytics/kpis', token),
      apiFetch('/api/activity/summary', token),
    ]);
    if (meRes.status === 401) {
      await context.secrets.delete(TOKEN_KEY);
      provider.setMessage('Session expired. Sign in again.');
      return;
    }
    if (!meRes.ok) {
      provider.setMessage(`Backend returned ${meRes.status}.`);
      return;
    }
    const me = (await meRes.json()) as { username?: string };
    const kpis = kpiRes.ok ? ((await kpiRes.json()) as Kpis) : {};
    const codingSeconds = actRes.ok ? (((await actRes.json()) as { total_seconds?: number }).total_seconds ?? null) : null;
    provider.setStats(kpis, codingSeconds, me.username || 'unknown');
  } catch (err) {
    provider.setMessage(err instanceof Error ? err.message : String(err));
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new StatsProvider();
  const tracker = new ActivityTracker(context);
  vscode.window.registerTreeDataProvider('devpulse.stats', provider);

  context.subscriptions.push(
    vscode.commands.registerCommand('devpulse.signIn', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Paste your DevPulse dashboard session (Connections > Copy my dashboard session). Not a GitHub token.',
        password: true,
        ignoreFocusOut: true,
      });
      if (!token) return;
      try {
        const res = await apiFetch('/api/auth/me', token.trim());
        if (!res.ok) throw new Error(`Session verification failed (${res.status}). Copy a fresh session from the dashboard.`);
        const data = { access_token: token.trim() };
        const previous = await context.secrets.get(TOKEN_KEY);
        if (previous !== data.access_token) await context.globalState.update(QUEUE_KEY, []);
        await context.secrets.store(TOKEN_KEY, data.access_token);
        vscode.window.showInformationMessage('DevPulse: signed in. Coding activity is tracked locally and only session metadata is sent to your backend.');
        tracker.resume();
        await refresh(provider, context);
      } catch (err) {
        vscode.window.showErrorMessage(`DevPulse: ${err instanceof Error ? err.message : err}`);
      }
    }),
    vscode.commands.registerCommand('devpulse.sendNow', async () => { await tracker.sendNow(); await refresh(provider, context); vscode.window.showInformationMessage('DevPulse: send attempted. Refresh the dashboard to confirm receipt; offline sessions stay queued.'); }),
    vscode.commands.registerCommand('devpulse.refresh', () => refresh(provider, context)),
    vscode.commands.registerCommand('devpulse.pause', () => tracker.togglePause()),
    vscode.commands.registerCommand('devpulse.signOut', async () => {
      await tracker.dispose();
      await context.globalState.update(QUEUE_KEY, []);
      await context.secrets.delete(TOKEN_KEY);
      provider.setMessage('Signed out.');
    }),
    { dispose: () => void tracker.dispose() },
  );

  void context.secrets.get(TOKEN_KEY).then(token => { if (token) tracker.resume(); });
  void refresh(provider, context);
}

export function deactivate() {}
