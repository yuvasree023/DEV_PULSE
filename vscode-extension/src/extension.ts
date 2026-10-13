import * as vscode from 'vscode';

const TOKEN_KEY = 'devpulse.sessionToken';

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

async function apiFetch(path: string, token: string): Promise<Response> {
  const base = backendUrl();
  if (!base) {
    throw new Error('Set devpulse.backendUrl in Settings first (your DevPulse backend URL).');
  }
  return fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
}

class StatsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private items: vscode.TreeItem[] = [];

  setStats(kpis: Kpis, username: string) {
    const mk = (label: string, value: unknown) => {
      const item = new vscode.TreeItem(`${label}: ${value ?? 'n/a'}`);
      item.iconPath = new vscode.ThemeIcon('graph');
      return item;
    };
    const head = new vscode.TreeItem(`Signed in as ${username}`);
    head.iconPath = new vscode.ThemeIcon('account');
    this.items = [
      head,
      mk('Commits', kpis.total_commits),
      mk('Pull requests', kpis.total_prs),
      mk('Repositories', kpis.total_repositories),
      mk('AI adoption', kpis.ai_adoption_rate != null ? `${kpis.ai_adoption_rate}%` : 'n/a'),
    ];
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
    provider.setMessage('Run "DevPulse: Sign in with GitHub Token" to connect.');
    return;
  }
  try {
    const [meRes, kpiRes] = await Promise.all([
      apiFetch('/api/auth/me', token),
      apiFetch('/api/analytics/kpis', token),
    ]);
    if (meRes.status === 401 || kpiRes.status === 401) {
      await context.secrets.delete(TOKEN_KEY);
      provider.setMessage('Session expired. Sign in again.');
      return;
    }
    if (!meRes.ok || !kpiRes.ok) {
      provider.setMessage(`Backend returned ${meRes.status}/${kpiRes.status}.`);
      return;
    }
    const me = (await meRes.json()) as { username?: string };
    const kpis = (await kpiRes.json()) as Kpis;
    provider.setStats(kpis, me.username || 'unknown');
  } catch (err) {
    provider.setMessage(err instanceof Error ? err.message : String(err));
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new StatsProvider();
  vscode.window.registerTreeDataProvider('devpulse.stats', provider);

  context.subscriptions.push(
    vscode.commands.registerCommand('devpulse.signIn', async () => {
      const pat = await vscode.window.showInputBox({
        prompt: 'GitHub Personal Access Token (public repos need no scopes; for private repos use a fine-grained read-only token)',
        password: true,
        ignoreFocusOut: true,
      });
      if (!pat) {
        return;
      }
      try {
        const base = backendUrl();
        if (!base) {
          throw new Error('Set devpulse.backendUrl in Settings first.');
        }
        const res = await fetch(`${base}/api/auth/pat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ token: pat }),
        });
        if (!res.ok) {
          throw new Error(`Sign-in failed (${res.status}).`);
        }
        const data = (await res.json()) as { access_token?: string };
        if (!data.access_token) {
          throw new Error('Backend did not return a session token.');
        }
        await context.secrets.store(TOKEN_KEY, data.access_token);
        vscode.window.showInformationMessage('DevPulse: signed in.');
        await refresh(provider, context);
      } catch (err) {
        vscode.window.showErrorMessage(`DevPulse: ${err instanceof Error ? err.message : err}`);
      }
    }),
    vscode.commands.registerCommand('devpulse.refresh', () => refresh(provider, context)),
    vscode.commands.registerCommand('devpulse.signOut', async () => {
      await context.secrets.delete(TOKEN_KEY);
      provider.setMessage('Signed out.');
    })
  );

  void refresh(provider, context);
}

export function deactivate() {}
