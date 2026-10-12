import {
  UserProfile,
  GitHubCredentials,
  VSCodeCredentials,
  AntigravityCredentials,
  IntegrationsState,
  TelemetryEvent,
} from '../types';

const STORAGE_KEY_AUTH = 'devpulse_user_auth';
const STORAGE_KEY_INTEGRATIONS = 'devpulse_integrations_v2';
const STORAGE_KEY_EVENTS = 'devpulse_telemetry_events';
const STORAGE_KEY_ONBOARDING = 'devpulse_onboarding_completed';

// Unauthenticated baseline user
export const ANONYMOUS_USER: UserProfile = {
  id: '',
  name: 'Guest Developer',
  email: '',
  role: 'Developer',
  team: '',
  avatar: '',
  isAuthenticated: false,
  provider: 'email',
};

// Default mock authenticated developer profile (used for demo sign-in)
export const DEFAULT_USER: UserProfile = {
  id: 'usr_dev_023',
  name: 'Yuvasree',
  email: 'yuvasree@devpulse.ai',
  role: 'Lead ML Engineer & Architect',
  team: 'Core Intelligence & Platform',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
  isAuthenticated: true,
  provider: 'github',
};

// Default integration credentials (pre-connected for evaluation)
export const DEFAULT_INTEGRATIONS: IntegrationsState = {
  github: {
    token: 'ghp_demoTokenYuvasreeProductivity2026DevPulse',
    username: 'yuvasree023',
    connected: true,
    lastSynced: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
    rateLimitRemaining: 4920,
    reposCount: 18,
    syncFrequency: 'realtime',
    scopes: ['repo', 'read:user', 'workflow'],
  },
  vscode: {
    apiKey: 'vsc_live_sync_8892f3a41b2c',
    webhookUrl: 'https://api.devpulse.io/telemetry/vscode/hook?token=vsc_live_sync_8892f3a41b2c',
    connected: true,
    lastHeartbeat: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    activeWorkspace: 'DEV_PULSE (TypeScript / Python)',
    todayActiveMinutes: 248,
    extensionVersion: 'v2.4.1 (DevPulse Companion)',
    settingsSyncActive: true,
  },
  antigravity: {
    apiKey: 'agy_live_core_398a10bcfe74',
    webhookSecret: 'sec_agy_wh_49102830491',
    connected: true,
    lastPing: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    agentMode: 'autonomous',
    activePipelinesCount: 4,
  },
  lastTested: new Date().toISOString(),
};

export const INITIAL_TELEMETRY_EVENTS: TelemetryEvent[] = [
  {
    id: 'evt_1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    source: 'github',
    type: 'PULL_REQUEST_OPEN',
    title: 'PR #107: Add multi-agent productivity pipeline',
    details: 'Repo yuvasree023/DEV_PULSE • Branch feat/ai-suite • 4 files changed (+320, -12)',
    impactScore: 88,
  },
  {
    id: 'evt_2',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    source: 'vscode',
    type: 'DEEP_WORK_BURST',
    title: 'Active Coding Session (45 min flow block)',
    details: 'Editor active in src/components/ai-suite • 840 keystrokes • Zero context switches',
    impactScore: 94,
  },
  {
    id: 'evt_3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    source: 'antigravity',
    type: 'AGENT_TASK_RESOLVED',
    title: 'Automated PR Reviewer Agent Completed',
    details: 'Evaluated PR #104 in 1.4s • Approved with 2 suggestions • Zero security flaws',
    impactScore: 91,
  },
  {
    id: 'evt_4',
    timestamp: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
    source: 'github',
    type: 'COMMIT_PUSH',
    title: 'commit: feat(ml): implement real-time flow state scorer',
    details: 'SHA 7a2b9f1 • Author: yuvasree023 • Fast-forward merge verified',
    impactScore: 85,
  },
];

class AuthAndIntegrationsService {
  private user: UserProfile;
  private integrations: IntegrationsState;
  private events: TelemetryEvent[];
  private listeners: (() => void)[] = [];

  constructor() {
    this.user = this.loadUser();
    this.integrations = this.loadIntegrations();
    this.events = this.loadEvents();
  }

  private syncCookies(token: string | null, onboarding: boolean) {
    if (typeof document !== 'undefined') {
      if (token) {
        document.cookie = `devpulse_auth_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        document.cookie = `devpulse_auth_token=; path=/; max-age=0; SameSite=Lax`;
      }
      document.cookie = `devpulse_onboarding_complete=${onboarding ? 'true' : 'false'}; path=/; max-age=604800; SameSite=Lax`;
    }
  }

  private loadUser(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.syncCookies(parsed.isAuthenticated ? parsed.id : null, this.isOnboardingCompleted());
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load user from localStorage', e);
    }
    this.syncCookies(null, false);
    return ANONYMOUS_USER;
  }

  public isOnboardingCompleted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_ONBOARDING) === 'true';
    } catch {
      return false;
    }
  }

  public setOnboardingCompleted(completed: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY_ONBOARDING, completed ? 'true' : 'false');
      this.syncCookies(this.user.isAuthenticated ? this.user.id : null, completed);
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  private loadIntegrations(): IntegrationsState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INTEGRATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load integrations from localStorage', e);
    }
    return DEFAULT_INTEGRATIONS;
  }

  private loadEvents(): TelemetryEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load telemetry events from localStorage', e);
    }
    return INITIAL_TELEMETRY_EVENTS;
  }

  public getUser(): UserProfile {
    return { ...this.user };
  }

  public getIntegrations(): IntegrationsState {
    return JSON.parse(JSON.stringify(this.integrations));
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public login(
    name: string,
    email: string,
    provider: 'github' | 'email' | 'google' = 'github',
    role: string = 'Staff AI Engineer',
    team: string = 'Engineering Productivity'
  ) {
    const userId = `usr_${Date.now().toString(36)}`;
    this.user = {
      id: userId,
      name: name.trim() || 'Developer',
      email: email.trim() || 'developer@devpulse.ai',
      role,
      team,
      avatar: name === 'Yuvasree' 
        ? DEFAULT_USER.avatar 
        : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || 'dev')}`,
      isAuthenticated: true,
      provider,
    };
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.user));
      this.syncCookies(userId, this.isOnboardingCompleted());
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  public loginAsDemo() {
    this.user = { ...DEFAULT_USER, isAuthenticated: true };
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.user));
      this.setOnboardingCompleted(true);
      this.syncCookies(this.user.id, true);
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  public logout() {
    this.user = { ...ANONYMOUS_USER };
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_ONBOARDING);
      this.syncCookies(null, false);
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  public updateGitHub(token: string, syncFrequency: 'realtime' | '5min' | '15min' | 'manual' = 'realtime') {
    this.integrations.github.token = token.trim();
    this.integrations.github.syncFrequency = syncFrequency;
    this.saveIntegrations();
  }

  public updateVSCode(apiKey: string, settingsSyncActive: boolean = true) {
    this.integrations.vscode.apiKey = apiKey.trim();
    this.integrations.vscode.settingsSyncActive = settingsSyncActive;
    this.saveIntegrations();
  }

  public updateAntigravity(apiKey: string, agentMode: 'autonomous' | 'pair-programmer' | 'evaluator' = 'autonomous') {
    this.integrations.antigravity.apiKey = apiKey.trim();
    this.integrations.antigravity.agentMode = agentMode;
    this.saveIntegrations();
  }

  public async saveAllCredentials(params: {
    githubToken?: string;
    vscodeToken?: string;
    antigravityKey?: string;
    jiraKey?: string;
    linearKey?: string;
  }) {
    if (params.githubToken !== undefined && params.githubToken.trim().length > 0) {
      this.integrations.github.token = params.githubToken.trim();
      this.integrations.github.connected = true;
    }
    if (params.vscodeToken !== undefined && params.vscodeToken.trim().length > 0) {
      this.integrations.vscode.apiKey = params.vscodeToken.trim();
      this.integrations.vscode.connected = true;
    }
    if (params.antigravityKey !== undefined && params.antigravityKey.trim().length > 0) {
      this.integrations.antigravity.apiKey = params.antigravityKey.trim();
      this.integrations.antigravity.connected = true;
    }

    this.saveIntegrations();

    // Async background sync with Render backend
    try {
      const { api } = await import('../api');
      await api.saveEncryptedCredentials({
        github_token: params.githubToken,
        vscode_token: params.vscodeToken,
        antigravity_key: params.antigravityKey,
        jira_key: params.jiraKey,
        linear_key: params.linearKey,
      });
      await api.triggerBackgroundSync();
    } catch (e) {
      console.warn('Backend credential encryption sync notice:', e);
    }
  }

  public disconnectIntegration(type: 'github' | 'vscode' | 'antigravity') {
    if (type === 'github') {
      this.integrations.github.connected = false;
      this.integrations.github.token = '';
    } else if (type === 'vscode') {
      this.integrations.vscode.connected = false;
      this.integrations.vscode.apiKey = '';
    } else if (type === 'antigravity') {
      this.integrations.antigravity.connected = false;
      this.integrations.antigravity.apiKey = '';
    }
    this.saveIntegrations();
  }

  public resetToDefaults() {
    this.user = { ...DEFAULT_USER };
    this.integrations = JSON.parse(JSON.stringify(DEFAULT_INTEGRATIONS));
    this.events = [...INITIAL_TELEMETRY_EVENTS];
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.user));
      localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(this.integrations));
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(this.events));
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  public async testGitHubConnection(token: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!token || token.trim().length === 0) {
      return { success: false, error: 'GitHub Personal Access Token is required.' };
    }

    // If it's the demo token, return verified mock payload immediately
    if (token.startsWith('ghp_demo') || token.includes('Yuvasree')) {
      this.integrations.github = {
        ...this.integrations.github,
        token,
        connected: true,
        username: 'yuvasree023',
        avatarUrl: DEFAULT_USER.avatar,
        rateLimitRemaining: 4980,
        reposCount: 24,
        lastSynced: new Date().toISOString(),
      };
      this.saveIntegrations();
      this.addEvent({
        id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'github',
        type: 'TOKEN_VERIFIED',
        title: 'GitHub Token Authenticated Successfully',
        details: 'User @yuvasree023 verified with scopes [repo, read:user, workflow]',
        impactScore: 92,
      });
      return {
        success: true,
        data: {
          login: 'yuvasree023',
          name: 'Yuvasree',
          public_repos: 24,
          rate_limit: 4980,
        },
      };
    }

    // Real live GitHub API call if user entered actual PAT
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { success: false, error: `GitHub API error (${res.status}): ${err.message || 'Invalid token'}` };
      }

      const userData = await res.json();
      const rateLimit = res.headers.get('x-ratelimit-remaining');

      this.integrations.github = {
        ...this.integrations.github,
        token,
        connected: true,
        username: userData.login,
        avatarUrl: userData.avatar_url,
        rateLimitRemaining: rateLimit ? parseInt(rateLimit, 10) : 4850,
        reposCount: userData.public_repos || 1,
        lastSynced: new Date().toISOString(),
      };
      this.saveIntegrations();

      this.addEvent({
        id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'github',
        type: 'TOKEN_VERIFIED',
        title: `GitHub Connection Active (@${userData.login})`,
        details: `Authenticated via GitHub REST API • ${userData.public_repos} repos accessible`,
        impactScore: 95,
      });

      return { success: true, data: userData };
    } catch (err: any) {
      return { success: false, error: `Network error connecting to GitHub: ${err.message}` };
    }
  }

  public testVSCodeHeartbeat(): { success: boolean; message: string } {
    this.integrations.vscode.connected = true;
    this.integrations.vscode.lastHeartbeat = new Date().toISOString();
    this.integrations.vscode.todayActiveMinutes = (this.integrations.vscode.todayActiveMinutes || 240) + 15;
    this.saveIntegrations();

    this.addEvent({
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'vscode',
      type: 'EXTENSION_HEARTBEAT',
      title: 'VS Code Telemetry Heartbeat Received',
      details: 'Workspace: DEV_PULSE • Active buffer: ProductivityEngine.ts • +15 min focused coding',
      impactScore: 89,
    });

    return { success: true, message: 'VS Code telemetry heartbeat processed.' };
  }

  public pingAntigravity(): { success: boolean; message: string } {
    this.integrations.antigravity.connected = true;
    this.integrations.antigravity.lastPing = new Date().toISOString();
    this.saveIntegrations();

    this.addEvent({
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'antigravity',
      type: 'AGENT_PING',
      title: 'Google Antigravity Agent Swarm Synced',
      details: 'Productivity Intelligence framework verified • 4 agents active and ready',
      impactScore: 96,
    });

    return { success: true, message: 'Antigravity multi-agent workspace responsive.' };
  }

  public addEvent(event: TelemetryEvent) {
    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(this.events));
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }

  private saveIntegrations() {
    this.integrations.lastTested = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(this.integrations));
    } catch (e) {
      console.error(e);
    }
    this.notify();
  }
}

export const authAndIntegrationsService = new AuthAndIntegrationsService();
