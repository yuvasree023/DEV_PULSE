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
  agent: string | null;
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
  review_time_hours?: number;
  is_ai_assisted?: boolean;
  reviews?: PRReview[];
  latest_review_state?: string;
}

export interface WeeklyThroughputPoint {
  period: string;
  total_prs: number;
  merged_prs: number;
  ai_prs: number;
  non_ai_prs: number;
}

export interface OverviewMetrics {
  total_prs: number;
  merged_prs: number;
  merge_rate: number;
  ai_assisted_prs: number;
  ai_assisted_pct: number;
  non_ai_prs: number;
  non_ai_pct: number;
  avg_cycle_time_hours: number;
  median_cycle_time_hours: number;
  ai_avg_cycle_time_hours: number;
  ai_median_cycle_time_hours: number;
  non_ai_avg_cycle_time_hours: number;
  non_ai_median_cycle_time_hours: number;
  avg_review_time_hours: number;
  median_review_time_hours: number;
  ai_avg_review_time_hours: number;
  non_ai_avg_review_time_hours: number;
  total_reviews: number;
  total_repos: number;
  total_developers: number;
  weekly_throughput: WeeklyThroughputPoint[];
  disclaimer: string;
}

export interface AITrendPoint {
  period: string;
  total_prs: number;
  ai_prs: number;
  non_ai_prs: number;
  ai_percentage: number;
  avg_cycle_time_hours: number | null;
}

export interface AIImpactMetrics {
  comparison_title: string;
  disclaimer: string;
  summary: {
    ai_prs: number;
    ai_percentage: number;
    non_ai_prs: number;
    non_ai_percentage: number;
    ai_merge_rate: number;
    non_ai_merge_rate: number;
    ai_avg_cycle_time_hours: number;
    non_ai_avg_cycle_time_hours: number;
    ai_median_cycle_time_hours: number;
    non_ai_median_cycle_time_hours: number;
    ai_avg_review_time_hours: number;
    non_ai_avg_review_time_hours: number;
  };
  trend: AITrendPoint[];
}

export interface AIToolMetric {
  agent: string;
  pr_count: number;
  pr_percentage: number;
  merged_count: number;
  merge_rate: number;
  avg_cycle_time_hours: number | null;
  median_cycle_time_hours: number | null;
  avg_review_time_hours: number | null;
  is_ai: boolean;
}

export interface AIToolsResponse {
  total_prs: number;
  tools: AIToolMetric[];
  disclaimer: string;
}

export interface DeveloperMetric {
  user: string;
  pr_count: number;
  merged_prs: number;
  merge_rate: number;
  ai_assisted_pct: number;
  avg_cycle_time_hours: number | null;
  review_count: number;
  avg_review_time_hours: number | null;
}

export interface PeopleMetrics {
  total_developers: number;
  developers: DeveloperMetric[];
  disclaimer: string;
}

export interface ProjectMetric {
  id: number;
  repository: string;
  url: string;
  language: string;
  pr_count: number;
  merge_rate: number;
  avg_cycle_time_hours: number | null;
  ai_assisted_pct: number;
  stars: number;
  forks: number;
  is_forked: boolean;
  license: string | null;
}

export interface LanguageMetric {
  language: string;
  repo_count: number;
  pr_count: number;
  ai_assisted_pct: number;
}

export interface ProjectsMetrics {
  total_repositories: number;
  projects: ProjectMetric[];
  languages: LanguageMetric[];
  disclaimer: string;
}

export interface MLClusterCentroids {
  avg_pr_count: number;
  avg_ai_assisted_pct: number;
  avg_cycle_time_hours: number;
  avg_merge_rate_pct: number;
  avg_review_count: number;
}

export interface MLClusterSample {
  user: string;
  pr_count: number;
  ai_assisted_pct: number;
  avg_cycle_time_hours: number;
  merge_rate: number;
  review_count: number;
  pca_x: number;
  pca_y: number;
}

export interface MLCluster {
  cluster_id: number;
  name: string;
  color: string;
  developer_count: number;
  percentage_of_total: number;
  centroids: MLClusterCentroids;
  samples: MLClusterSample[];
}

export interface MLInsightsResponse {
  model: string;
  total_developers: number;
  n_clusters: number;
  feature_names: string[];
  pca_variance_explained: number[];
  clusters: MLCluster[];
  disclaimer: string;
}

export interface ExplainResponse {
  source: string;
  generated_at: string;
  explanation: string;
  grounding_status: string;
}

export interface DatasetInfoResponse {
  meta: {
    total_prs: number;
    total_reviews: number;
    total_repos: number;
    pr_columns: string[];
    review_columns: string[];
    repo_columns: string[];
    pr_file: string;
    reviews_file: string;
    repo_file: string;
  };
  validation_errors: Record<string, string[]>;
  is_valid: boolean;
}

export interface GeminiInsight {
  summary: string;
  recommendations: string[];
  generated_at: string;
  focus: string;
}

export interface BlockerAnalysis {
  pr_id: number;
  blocker_summary: string;
  severity: string;
  suggested_action: string;
}
