import React, { useState, useEffect } from 'react';
import { productivityEngine } from '../../services/productivityEngine';
import { authAndIntegrationsService } from '../../services/authAndIntegrations';
import {
  RealTimeProductivityMetrics,
  HourlyVelocityPoint,
  HeatmapPoint,
} from '../../types';
import {
  Activity,
  Zap,
  TrendingUp,
  Brain,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Flame,
  Radio,
  Github,
  Code2,
  Cpu,
  Layers,
  BarChart3,
  Calendar,
} from 'lucide-react';

export function RealTimeDashboardView() {
  const [metrics, setMetrics] = useState<RealTimeProductivityMetrics>(productivityEngine.getMetrics());
  const [isStreaming, setIsStreaming] = useState<boolean>(metrics.liveStreaming);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [selectedPolling, setSelectedPolling] = useState<number>(5000);

  useEffect(() => {
    const unsubscribe = productivityEngine.subscribe(() => {
      setMetrics(productivityEngine.getMetrics());
      setPulseCount((c) => c + 1);
    });
    return unsubscribe;
  }, []);

  const handleToggleStream = () => {
    const newState = productivityEngine.toggleStreaming();
    setIsStreaming(newState);
  };

  const handleSimulatePush = () => {
    productivityEngine.simulatePushEvent();
  };

  const handlePollingChange = (ms: number) => {
    setSelectedPolling(ms);
    productivityEngine.setPollingInterval(ms);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-semibold">Simulated demo data.</span> These numbers are generated locally for illustration and are not your real activity. Real telemetry appears under My Activity once the VS Code extension or Colab connector sends sessions.
      </div>
      {/* Real-Time Live Control Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isStreaming ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
              }`}
            />
            <span
              className={`absolute w-2.5 h-2.5 rounded-full ${
                isStreaming ? 'bg-emerald-600' : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Real-Time Productivity Measurement Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                Yuvasree ML Flow v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Streaming active telemetry from connected IDE & git pipelines</span>
              <span>•</span>
              <span className="font-mono text-purple-700 font-semibold">
                Last calculated: {metrics.lastCalculated}
              </span>
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5">
          {/* Polling Interval Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => handlePollingChange(2000)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold cursor-pointer transition-colors ${
                selectedPolling === 2000 ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2s Pulse
            </button>
            <button
              onClick={() => handlePollingChange(5000)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold cursor-pointer transition-colors ${
                selectedPolling === 5000 ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5s Live
            </button>
            <button
              onClick={() => handlePollingChange(15000)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold cursor-pointer transition-colors ${
                selectedPolling === 15000 ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              15s
            </button>
          </div>

          {/* Pause / Resume Streaming */}
          <button
            onClick={handleToggleStream}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isStreaming
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Stream</span>
              </>
            )}
          </button>

          {/* Trigger Instant Event */}
          <button
            onClick={handleSimulatePush}
            title="Inject an active commit and recalculate ML scoring"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulate Commit Push</span>
          </button>
        </div>
      </div>

      {/* Connected Integrations Live Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-slate-800" />
            <span className="font-bold text-slate-800">GitHub Telemetry</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Simulated feed
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">VS Code Activity</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {metrics.uninterruptedCodingMinutes}m Focus
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-slate-800">Antigravity Swarm</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            Simulated agents
          </span>
        </div>
      </div>

      {/* 4 Core Real-Time Metric Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Focus Score / Flow State Index */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Flow State Index
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
              {metrics.flowTrend}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-purple-700 tracking-tight">
              {metrics.focusScore}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-700"
              style={{ width: `${metrics.focusScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Status: <strong className="text-slate-800">{metrics.flowStateCategory}</strong></span>
            <span className="font-mono text-purple-600">Yuvasree ML</span>
          </div>
        </div>

        {/* Metric 2: Daily Code Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Daily Code Velocity
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              Active Pace
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">
              {metrics.dailyCodeVelocity}
            </span>
            <span className="text-xs font-bold text-emerald-600">commits/hr</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (metrics.dailyCodeVelocity / 5) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Peak throughput: 4.8/hr</span>
            <span className="font-mono text-emerald-600">Telemetry Ingest</span>
          </div>
        </div>

        {/* Metric 3: Task Completion Efficiency Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Task Efficiency Ratio
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
              PR Turnaround
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">
              {metrics.taskCompletionRatio}%
            </span>
            <span className="text-xs font-bold text-blue-600">Target: 85%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${metrics.taskCompletionRatio}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>{metrics.completedTasksToday} of {metrics.plannedTasksToday} tasks finished</span>
            <span className="font-mono text-blue-600">Closed PRs</span>
          </div>
        </div>

        {/* Metric 4: Burnout & Interruption Risk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Burnout Risk Guard
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                metrics.burnoutRiskScore > 50
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {metrics.burnoutCategory}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-black tracking-tight ${
                metrics.burnoutRiskScore > 50 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {metrics.burnoutRiskScore}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100 risk</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                metrics.burnoutRiskScore > 50 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${metrics.burnoutRiskScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Interrupted {metrics.contextSwitchingCount} times today</span>
            <span className="font-mono text-slate-400">Telemetry Sensor</span>
          </div>
        </div>
      </div>

      {/* Hourly Velocity Interactive Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Velocity Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Daily Code Velocity & Hourly Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
              Live Feed
            </span>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2">
            {metrics.hourlyVelocity.map((item, idx) => {
              const maxLines = 350;
              const heightPct = Math.max(12, Math.min(100, (item.linesChanged / maxLines) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    +{item.linesChanged}
                  </div>

                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                    <div
                      className="w-full bg-gradient-to-t from-purple-700 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">{item.hour}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Peak hour: <strong>15:00 (+340 lines, 5 commits)</strong></span>
            <span className="flex items-center gap-1.5 font-medium text-purple-700">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Focus peak at 98%
            </span>
          </div>
        </div>

        {/* Real-Time Contribution Heatmap Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Weekly Flow & Contribution Heatmap
              </h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
              Live Matrix
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const dayPoints = metrics.contributionHeatmap.filter((p) => p.dayOfWeek === day);

              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-8 text-[11px] font-bold text-slate-500">{day}</span>
                  <div className="flex-1 flex gap-1.5">
                    {dayPoints.map((point, pIdx) => {
                      const colors = [
                        'bg-slate-100',
                        'bg-purple-200',
                        'bg-purple-400',
                        'bg-purple-600',
                        'bg-indigo-900',
                      ];

                      return (
                        <div
                          key={pIdx}
                          title={`${day} ${point.hour}:00 - ${point.count} developer actions`}
                          className={`flex-1 h-5 rounded-md transition-all cursor-pointer hover:ring-2 hover:ring-purple-400 ${
                            colors[point.intensity]
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Intensity: Less</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100" />
              <span className="w-3 h-3 rounded bg-purple-200" />
              <span className="w-3 h-3 rounded bg-purple-400" />
              <span className="w-3 h-3 rounded bg-purple-600" />
              <span className="w-3 h-3 rounded bg-indigo-900" />
            </div>
            <span>More Velocity</span>
          </div>
        </div>
      </div>
    </div>
  );
      }
