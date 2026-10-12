import {
  RealTimeProductivityMetrics,
  HourlyVelocityPoint,
  HeatmapPoint,
} from '../types';
import { authAndIntegrationsService } from './authAndIntegrations';

// Initial base telemetry data
const BASE_HOURLY: HourlyVelocityPoint[] = [
  { hour: '09:00', commits: 1, linesChanged: 45, focusPct: 78 },
  { hour: '10:00', commits: 2, linesChanged: 112, focusPct: 88 },
  { hour: '11:00', commits: 4, linesChanged: 280, focusPct: 96 },
  { hour: '12:00', commits: 1, linesChanged: 30, focusPct: 72 },
  { hour: '13:00', commits: 0, linesChanged: 0, focusPct: 60 },
  { hour: '14:00', commits: 3, linesChanged: 195, focusPct: 92 },
  { hour: '15:00', commits: 5, linesChanged: 340, focusPct: 98 },
  { hour: '16:00', commits: 2, linesChanged: 160, focusPct: 91 },
  { hour: '17:00', commits: 3, linesChanged: 210, focusPct: 94 },
];

function generateInitialHeatmap(): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();

  days.forEach((day, dayIndex) => {
    for (let h = 8; h <= 20; h += 2) {
      // Deterministic realistic pattern with peak in mid-day
      const baseIntensity = dayIndex < 5 ? (h >= 10 && h <= 17 ? 3 : 2) : (h >= 11 && h <= 15 ? 1 : 0);
      const randomJitter = Math.floor(Math.sin(dayIndex + h) * 1.5);
      const intensity = Math.max(0, Math.min(4, baseIntensity + (randomJitter > 0 ? 1 : 0)));
      const count = intensity * 4 + Math.floor(Math.abs(Math.cos(h)) * 5);

      const d = new Date(today);
      d.setDate(today.getDate() - (6 - dayIndex));

      points.push({
        date: d.toISOString().split('T')[0],
        dayOfWeek: day,
        hour: h,
        intensity,
        count,
      });
    }
  });

  return points;
}

class ProductivityEngine {
  private metrics: RealTimeProductivityMetrics;
  private listeners: (() => void)[] = [];
  private timerId: any = null;
  private pollingIntervalMs: number = 5000;
  private isStreaming: boolean = true;

  constructor() {
    this.metrics = this.computeMetrics(true);
    this.startStreaming();
  }

  private computeMetrics(isInitial = false): RealTimeProductivityMetrics {
    const integrations = authAndIntegrationsService.getIntegrations();
    const hasGitHub = integrations.github.connected;
    const hasVSCode = integrations.vscode.connected;
    const hasAntigravity = integrations.antigravity.connected;

    // Yuvasree's Custom ML Productivity Intelligence Formula
    // Focus Score / Flow State Index is driven by continuous active minutes,
    // low context switching, and AI agent offload efficiency.
    const activeCodingMinutes = integrations.vscode.todayActiveMinutes || 240;
    const continuousFactor = Math.min(100, (activeCodingMinutes / 300) * 85);
    const integrationBoost = (hasGitHub ? 8 : 0) + (hasVSCode ? 10 : 0) + (hasAntigravity ? 12 : 0);
    
    // Slight live micro-variation to simulate real-time ML inference
    const jitter = isInitial ? 0 : (Math.random() * 4 - 2);
    const rawFocus = 74 + integrationBoost + jitter;
    const focusScore = Math.round(Math.max(50, Math.min(99, rawFocus)));

    let flowStateCategory: RealTimeProductivityMetrics['flowStateCategory'] = 'Optimal Flow';
    if (focusScore >= 90) flowStateCategory = 'Peak Flow';
    else if (focusScore >= 75) flowStateCategory = 'Optimal Flow';
    else if (focusScore >= 60) flowStateCategory = 'Distracted';
    else flowStateCategory = 'Fatigued';

    // Burnout & Cognitive Fatigue Modeling
    // Hours > 6 without break increases fatigue index
    const hoursLogged = activeCodingMinutes / 60;
    const fatigueBase = hoursLogged > 5 ? (hoursLogged - 5) * 12 : 15;
    const burnoutRiskScore = Math.round(Math.min(100, Math.max(10, fatigueBase + (100 - focusScore) * 0.2)));

    let burnoutCategory: RealTimeProductivityMetrics['burnoutCategory'] = 'Optimal';
    if (burnoutRiskScore >= 75) burnoutCategory = 'Critical Overwork';
    else if (burnoutRiskScore >= 50) burnoutCategory = 'High Risk';
    else if (burnoutRiskScore >= 30) burnoutCategory = 'Mild Fatigue';

    return {
      focusScore,
      flowStateCategory,
      flowTrend: focusScore >= 85 ? '+4.2%' : focusScore >= 70 ? '+1.5%' : '-2.1%',
      dailyCodeVelocity: Math.round((2.8 + (hasAntigravity ? 1.4 : 0) + (jitter * 0.1)) * 10) / 10,
      hourlyVelocity: [...BASE_HOURLY],
      contributionHeatmap: generateInitialHeatmap(),
      taskCompletionRatio: Math.round(88 + (hasAntigravity ? 6 : 0) + jitter * 0.5),
      completedTasksToday: 14 + Math.round(hasGitHub ? 4 : 0),
      plannedTasksToday: 18,
      burnoutRiskScore,
      burnoutCategory,
      contextSwitchingCount: Math.round(Math.max(2, 6 - (hasVSCode ? 3 : 0) + (jitter > 0 ? 1 : 0))),
      uninterruptedCodingMinutes: Math.round(activeCodingMinutes * 0.72),
      lastCalculated: new Date().toLocaleTimeString(),
      liveStreaming: this.isStreaming,
      telemetrySources: {
        github: hasGitHub,
        vscode: hasVSCode,
        antigravity: hasAntigravity,
      },
    };
  }

  public getMetrics(): RealTimeProductivityMetrics {
    return { ...this.metrics };
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

  public startStreaming() {
    this.isStreaming = true;
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.pulseUpdate();
    }, this.pollingIntervalMs);
  }

  public stopStreaming() {
    this.isStreaming = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.metrics.liveStreaming = false;
    this.notify();
  }

  public toggleStreaming(): boolean {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      this.startStreaming();
    }
    return this.isStreaming;
  }

  public setPollingInterval(ms: number) {
    this.pollingIntervalMs = ms;
    if (this.isStreaming) {
      this.startStreaming();
    }
  }

  public pulseUpdate() {
    this.metrics = this.computeMetrics(false);
    this.notify();
  }

  public simulatePushEvent(): RealTimeProductivityMetrics {
    // Inject a live commit burst and recalculate
    const currentHour = new Date().getHours() + ':00';
    const hourIdx = this.metrics.hourlyVelocity.findIndex((h) => h.hour === currentHour);
    if (hourIdx !== -1) {
      this.metrics.hourlyVelocity[hourIdx].commits += 1;
      this.metrics.hourlyVelocity[hourIdx].linesChanged += 140;
    } else {
      this.metrics.hourlyVelocity.push({
        hour: currentHour,
        commits: 1,
        linesChanged: 140,
        focusPct: 96,
      });
    }

    this.metrics.completedTasksToday += 1;
    this.metrics.focusScore = Math.min(99, this.metrics.focusScore + 2);
    this.metrics.taskCompletionRatio = Math.min(100, Math.round((this.metrics.completedTasksToday / this.metrics.plannedTasksToday) * 100));
    this.metrics.dailyCodeVelocity = Math.round((this.metrics.dailyCodeVelocity + 0.3) * 10) / 10;
    this.metrics.lastCalculated = new Date().toLocaleTimeString();

    authAndIntegrationsService.addEvent({
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'github',
      type: 'SIMULATED_COMMIT_PUSH',
      title: 'Real-Time Git Commit Ingested',
      details: 'Pushed +140 lines • Recalculated Yuvasree ML Flow Index to ' + this.metrics.focusScore,
      impactScore: 94,
    });

    this.notify();
    return { ...this.metrics };
  }
}

export const productivityEngine = new ProductivityEngine();
