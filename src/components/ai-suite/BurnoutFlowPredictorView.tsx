import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { BurnoutPredictorResult } from '../../types';
import {
  ShieldAlert,
  Sparkles,
  Zap,
  BatteryCharging,
  Clock,
  Calendar,
  AlertCircle,
  Brain,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export function BurnoutFlowPredictorView() {
  const [activeHours, setActiveHours] = useState<number>(5.5);
  const [meetingCount, setMeetingCount] = useState<number>(3);
  const [prediction, setPrediction] = useState<BurnoutPredictorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const data = await api.predictBurnoutFlow(activeHours, meetingCount);
      setPrediction(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [activeHours, meetingCount]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                ML-Based Burnout & Flow State Predictor
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                [ML-Powered]
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Uses time-series ML analysis on commit timings, active coding hours, and work habits to predict fatigue risk
            </p>
          </div>
        </div>

        <button
          onClick={fetchPrediction}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate ML Model</span>
        </button>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            Live Telemetry Parameters (Telemetry Simulator)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Real-time VS Code & Calendar Hook
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">Active Coding Hours Today</span>
              <span className="font-mono font-bold text-purple-700">{activeHours} hrs</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={activeHours}
              onChange={(e) => setActiveHours(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 hr (Light)</span>
              <span>6 hrs (Optimal)</span>
              <span>12 hrs (Overwork)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">Context Switches / Meetings Today</span>
              <span className="font-mono font-bold text-indigo-700">{meetingCount} interruptions</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={meetingCount}
              onChange={(e) => setMeetingCount(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (Deep Focus)</span>
              <span>3 (Typical)</span>
              <span>10 (High Fragmentation)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Predictor KPI Gauges */}
      {prediction && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flow State Gauge */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Flow State Index
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-700">{prediction.flowStateIndex}</span>
                <span className="text-xs font-bold text-emerald-600">/ 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.flowStateIndex}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block pt-1">
                {prediction.flowStateIndex >= 80 ? 'Peak Deep Work Flow' : 'Moderate Attention Span'}
              </span>
            </div>

            {/* Cognitive Fatigue Score */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cognitive Fatigue Index
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black ${
                    prediction.cognitiveFatigueScore > 60
                      ? 'text-rose-600'
                      : prediction.cognitiveFatigueScore > 40
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {prediction.cognitiveFatigueScore}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    prediction.cognitiveFatigueScore > 60
                      ? 'bg-rose-500'
                      : prediction.cognitiveFatigueScore > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${prediction.cognitiveFatigueScore}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block pt-1">
                Risk Classification: <strong className="text-slate-800">{prediction.burnoutRisk}</strong>
              </span>
            </div>

            {/* Context Switching Penalty */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Context Switching Penalty
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">-{prediction.contextSwitchingPenalty}</span>
                <span className="text-xs font-bold text-rose-500">Pts Flow Drag</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, prediction.contextSwitchingPenalty * 2)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block pt-1">
                Meeting fragmentation: {prediction.meetingFragmentationRatio}%
              </span>
            </div>

            {/* Focus Shield Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Protective Shield Status
              </span>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <span className="text-base font-extrabold text-slate-800">
                  {prediction.burnoutRisk === 'Low' ? 'Protected' : 'Caution Required'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {activeHours > 7 ? 'Exceeding recommended 6h focus ceiling' : 'Sustainable engineering rhythm'}
              </p>
            </div>
          </div>

          {/* 7-Day Forecast & Actionable Protocols Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Fatigue Forecast Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  7-Day Projected Fatigue & Flow Trajectory
                </h3>
                <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                  Yuvasree ML Time Series
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {prediction.weeklyForecast.map((item) => (
                  <div key={item.day} className="flex items-center gap-3">
                    <span className="w-8 text-xs font-bold text-slate-600">{item.day}</span>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="h-full bg-purple-600 rounded-l-full transition-all"
                        style={{ width: `${item.flowProbability}%` }}
                        title={`Flow Probability: ${item.flowProbability}%`}
                      />
                      <div
                        className="h-full bg-rose-300 rounded-r-full transition-all"
                        style={{ width: `${item.projectedFatigue}%` }}
                        title={`Fatigue: ${item.projectedFatigue}%`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 w-16 text-right">
                      {item.flowProbability}% flow
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Flow Probability
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                  Projected Fatigue Burden
                </span>
              </div>
            </div>

            {/* Actionable Engineering Health Protocols */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  Smart Flow Safeguard Protocols
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  Recommended
                </span>
              </div>

              <div className="space-y-3">
                {prediction.actionableProtocols.map((protocol, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{protocol.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                        {protocol.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{protocol.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
