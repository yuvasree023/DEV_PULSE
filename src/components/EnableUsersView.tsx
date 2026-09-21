import { HeartHandshake, Smile, Star, Award, BookOpen, MessageSquare } from 'lucide-react';
import { ToolIconRenderer } from './ToolIcons';

export function EnableUsersView() {
  const sentimentItems = [
    { tool: 'cursor', name: 'Cursor', score: 85, tag: 'Highest CSAT', quote: 'Multi-file refactoring and chat-with-codebase is seamless.' },
    { tool: 'gemini', name: 'Gemini Code Assist', score: 82, tag: 'Fastest Context', quote: 'Massive 1M token context handles large mono-repos effortlessly.' },
    { tool: 'copilot', name: 'GitHub Copilot', score: 54, tag: 'High Familiarity', quote: 'Great inline completions, but multi-step agent debugging is limited.' },
    { tool: 'sourcegraph', name: 'Sourcegraph Cody', score: 31, tag: 'Niche Search', quote: 'Accurate cross-repo symbol search, but IDE latency is noticeable.' },
  ];

  const enablementPrograms = [
    { title: 'Test-Driven Prompting Workshops', attendees: '142 engineers', status: 'Completed', impact: '+38% Unit Test PRs' },
    { title: 'Gemini Monorepo Refactor Guild', attendees: '85 engineers', status: 'In Progress', impact: '-22% Tech Debt' },
    { title: 'AI Code Review Best Practices', attendees: '210 reviewers', status: 'Scheduled', impact: 'Target: 2h Turnaround' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Enable Users & Developer Sentiment
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Engineering satisfaction index, feedback loops, and AI onboarding workshops
        </p>
      </div>

      {/* Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sentimentItems.map((item) => (
          <div key={item.tool} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ToolIconRenderer id={item.tool} className="w-7 h-7" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                  <span className="text-[11px] text-purple-600 font-medium">{item.tag}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                <Smile className="w-4 h-4 text-emerald-600" />
                <span className="text-base font-extrabold text-slate-900">{item.score}</span>
                <span className="text-[10px] text-slate-400">/100</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 italic bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              "{item.quote}"
            </p>
          </div>
        ))}
      </div>

      {/* Enablement initiatives */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" /> Enablement & Guild Workshops
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {enablementPrograms.map((prog) => (
            <div key={prog.title} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
              <div className="text-xs font-bold text-slate-800">{prog.title}</div>
              <div className="text-[11px] text-slate-500">{prog.attendees}</div>
              <div className="text-xs font-semibold text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded-md">
                {prog.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
