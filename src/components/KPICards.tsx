import { KPISummary } from '../types';
import { GitPullRequest, Clock, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface KPICardsProps {
  kpis: KPISummary;
}

export function KPICards({ kpis }: KPICardsProps) {
  const productivityGain = Math.round(
    ((kpis.human_cycle_time_hours - kpis.ai_cycle_time_hours) / kpis.human_cycle_time_hours) * 100
  );

  const cards = [
    {
      id: 'kpi-total-prs',
      title: 'Total Pull Requests',
      value: kpis.total_prs.toLocaleString(),
      subtext: `${kpis.merged_prs} merged (${Math.round((kpis.merged_prs / kpis.total_prs) * 100)}% merge rate)`,
      icon: GitPullRequest,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      id: 'kpi-cycle-time',
      title: 'Avg Cycle Time (AI vs Human)',
      value: `${kpis.ai_cycle_time_hours}h vs ${kpis.human_cycle_time_hours}h`,
      subtext: `-${productivityGain}% lead time reduction with AI`,
      icon: Clock,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    },
    {
      id: 'kpi-review-turnaround',
      title: 'Avg Review Turnaround',
      value: `${kpis.avg_review_turnaround_hours} hours`,
      subtext: 'From PR creation to first reviewer feedback',
      icon: CheckCircle2,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    },
    {
      id: 'kpi-ai-assisted',
      title: 'AI Adoption Rate',
      value: `${kpis.ai_assisted_percentage}%`,
      subtext: 'Copilot & Cursor authored pull requests',
      icon: Sparkles,
      iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    },
    {
      id: 'kpi-throughput',
      title: 'Weekly Throughput',
      value: `${kpis.throughput_per_week} PRs/wk`,
      subtext: '+38% velocity uplift across teams',
      icon: TrendingUp,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {card.value}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
