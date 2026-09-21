export interface Repository {
  id: number;
  url: string;
  license: string | null;
  full_name: string;
  is_forked: boolean;
  language: string;
  forks: number;
  stars: number;
  pr_count: number;
  avg_cycle_time_hours: number | null;
  ai_adoption_rate: number;
}

export interface PRReview {
  id: number;
  pr_id: number;
  user: string;
  user_type: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
  submitted_at: string;
  body: string | null;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  agent: 'copilot' | 'cursor' | null;
  user_id: number;
  user: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  repo_id: number;
  repo_url: string;
  html_url: string;
  cycle_time_hours?: number;
  reviews?: PRReview[];
  latest_review_state?: string;
}

export interface KPISummary {
  total_prs: number;
  merged_prs: number;
  avg_cycle_time_hours: number;
  avg_review_turnaround_hours: number;
  ai_assisted_percentage: number;
  throughput_per_week: number;
  human_cycle_time_hours: number;
  ai_cycle_time_hours: number;
}

export interface AgentBenchmark {
  agent: string;
  label: string;
  pr_count: number;
  avg_cycle_time_hours: number;
  avg_review_turnaround_hours: number;
  merge_rate_percent: number;
  color: string;
}

export interface BlockedTask {
  pr_id: number;
  title: string;
  user: string;
  repo_name: string;
  reason: string;
  days_blocked: number;
  agent: string | null;
  created_at: string;
  blocker_comment?: string;
}

export interface GeminiInsight {
  summary: string;
  recommendations: string[];
  generated_at: string;
  focus: string;
}

export interface ToolOperationalImpact {
  id: string;
  name: string;
  impactPercent: number;
  subtext: string;
  icon: string;
  color: string;
  badgeBg: string;
}

export interface ToolComparisonRow {
  id: string;
  name: string;
  icon: string;
  usage: number; // e.g. 80
  velocity: number; // e.g. -15 (% change in cycle time)
  capacity: number; // e.g. +8 (%)
  sentiment: number; // e.g. 54 or 85
}

export interface RadarDataPoint {
  axis: string;
  copilot: number;
  cursor: number;
  gemini: number;
  sourcegraph: number;
}

export interface ThroughputBenchmark {
  id: string;
  name: string;
  icon: string;
  percentChange: number; // e.g. -2, 10, 12, 23
  color: string;
}

export interface AdoptionDistribution {
  category: string;
  percentage: number;
  color: string;
}

