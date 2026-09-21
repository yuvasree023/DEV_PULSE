import { OverviewMetrics } from '../types';
import { GitPullRequest, Clock, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface KPICardsProps {
  kpis: OverviewMetrics;
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      id: 'kpi-total-prs',
      title: 'Total Pull Requests',
      value: (kpis.total_prs || 0).toLocaleString(),
      subtext: `${(kpis.merged_prs || 0).toLocaleString()} merged (${kpis.merge_rate}% merge rate)`,
      icon: GitPullRequest,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'kpi-cycle-time',
      title: 'Observed Cycle Time (AI vs Overall)',
      value: `${kpis.ai_avg_cycle_time_hours}h vs ${kpis.avg_cycle_time_hours}h`,
      subtext: `Median: ${kpis.ai_median_cycle_time_hours}h (AI) • Non-AI: ${kpis.non_ai_avg_cycle_time_hours}h`,
      icon: Clock,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'kpi-review-turnaround',
      title: 'Avg First Review Time',
      value: `${kpis.avg_review_time_hours} hours`,
      subtext: `Median: ${kpis.median_review_time_hours}h from PR creation`,
      icon: CheckCircle2,
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'kpi-ai-assisted',
      title: 'AI-Assisted PR Share',
      value: `${kpis.ai_assisted_pct}%`,
      subtext: `${(kpis.ai_assisted_prs || 0).toLocaleString()} of ${(kpis.total_prs || 0).toLocaleString()} total pull requests`,
      icon: Sparkles,
      iconBg: 'bg-violet-50 text-violet-600',
    },
    {
      id: 'kpi-throughput',
      title: 'Monitored Repos & Devs',
      value: `${(kpis.total_repos || 0).toLocaleString()} Repos`,
      subtext: `${(kpis.total_developers || 0).toLocaleString()} active contributing developers`,
      icon: TrendingUp,
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all hover:shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 truncate pr-1">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg ${card.iconBg} shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-400 text-right pr-1 italic">
        * {kpis.disclaimer || 'Observed association — not causal evidence'}
      </div>
    </div>
  );
}
