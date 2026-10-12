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

// -------------------------------------------------------------
// Legacy & Benchmark Interfaces
// -------------------------------------------------------------
export interface ToolOperationalImpact {
  id: string;
  name: string;
  impactPercent: number;
  subtext: string;
  icon: string;
  color: string;
  badgeBg: string;
}

export interface AdoptionDistribution {
  category: string;
  percentage: number;
  color: string;
}

export interface ThroughputBenchmark {
  id: string;
  name: string;
  icon: string;
  percentChange: number;
  color: string;
}

export interface ToolComparisonRow {
  id: string;
  name: string;
  icon: string;
  usage: number;
  velocity: number;
  capacity: number;
  sentiment: number;
}

export interface RadarDataPoint {
  axis: string;
  copilot: number;
  cursor: number;
  gemini: number;
  sourcegraph: number;
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
  blocker_comment: string;
}

// -------------------------------------------------------------
// Authentication & User Profile
// -------------------------------------------------------------
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  avatar: string;
  isAuthenticated: boolean;
  provider: 'github' | 'email' | 'google' | 'antigravity';
}

// -------------------------------------------------------------
// Developer Tool Integrations
// -------------------------------------------------------------
export interface GitHubCredentials {
  token: string;
  username?: string;
  connected: boolean;
  lastSynced?: string;
  avatarUrl?: string;
  rateLimitRemaining?: number;
  reposCount?: number;
  syncFrequency: 'realtime' | '5min' | '15min' | 'manual';
  scopes: string[];
}

export interface VSCodeCredentials {
  apiKey: string;
  webhookUrl?: string;
  connected: boolean;
  lastHeartbeat?: string;
  activeWorkspace?: string;
  todayActiveMinutes?: number;
  extensionVersion?: string;
  settingsSyncActive: boolean;
}

export interface AntigravityCredentials {
  apiKey: string;
  webhookSecret?: string;
  connected: boolean;
  lastPing?: string;
  agentMode: 'autonomous' | 'pair-programmer' | 'evaluator';
  activePipelinesCount?: number;
}

export interface IntegrationsState {
  github: GitHubCredentials;
  vscode: VSCodeCredentials;
  antigravity: AntigravityCredentials;
  lastTested?: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  source: 'github' | 'vscode' | 'antigravity';
  type: string;
  title: string;
  details: string;
  impactScore?: number;
}

// -------------------------------------------------------------
// Real-Time Productivity Measurement Engine
// -------------------------------------------------------------
export interface HourlyVelocityPoint {
  hour: string;
  commits: number;
  linesChanged: number;
  focusPct: number;
}

export interface HeatmapPoint {
  date: string;
  dayOfWeek: string;
  hour: number;
  intensity: number; // 0 to 4
  count: number;
}

export interface RealTimeProductivityMetrics {
  focusScore: number; // 0-100 Flow State Index
  flowStateCategory: 'Peak Flow' | 'Optimal Flow' | 'Distracted' | 'Fatigued';
  flowTrend: string;
  dailyCodeVelocity: number; // commits & prs / active hour
  hourlyVelocity: HourlyVelocityPoint[];
  contributionHeatmap: HeatmapPoint[];
  taskCompletionRatio: number; // 0-100%
  completedTasksToday: number;
  plannedTasksToday: number;
  burnoutRiskScore: number; // 0-100
  burnoutCategory: 'Optimal' | 'Mild Fatigue' | 'High Risk' | 'Critical Overwork';
  contextSwitchingCount: number;
  uninterruptedCodingMinutes: number;
  lastCalculated: string;
  liveStreaming: boolean;
  telemetrySources: {
    github: boolean;
    vscode: boolean;
    antigravity: boolean;
  };
}

// -------------------------------------------------------------
// Dedicated AI Productivity Suite
// -------------------------------------------------------------
export type AIProductivitySuiteTab = 
  | 'burnout-flow'
  | 'code-quality'
  | 'commit-docs'
  | 'pr-velocity'
  | 'pr-reviewer';

export interface CodeSmellItem {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
  message: string;
  fix: string;
}

export interface CodeQualityAnalysisResult {
  overallScore: number; // 0-100
  maintainabilityIndex: number; // 0-100
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  duplicationPercentage: number;
  codeSmellsCount: number;
  smells: CodeSmellItem[];
  refactoredCode: string;
  explanation: string;
  modelAttribution: string;
}

export interface DocstringItem {
  functionName: string;
  signature: string;
  jsDoc: string;
  markdownDoc: string;
}

export interface CommitDocsResult {
  conventionalCommit: string;
  commitType: 'feat' | 'fix' | 'refactor' | 'perf' | 'docs' | 'chore';
  scope: string;
  shortSummary: string;
  breakingChanges: string[];
  docstrings: DocstringItem[];
  changelogSnippet: string;
  modelAttribution: string;
}

export interface SecurityVulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  cwe?: string;
  line: number;
  description: string;
  remediation: string;
}

export interface LogicDefect {
  title: string;
  edgeCase: string;
  suggestion: string;
}

export interface PerformanceFinding {
  metric: string;
  observation: string;
  optimization: string;
}

export interface AutomatedPRReviewResult {
  verdict: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
  overallScore: number; // 0-100
  securityIssues: SecurityVulnerability[];
  logicDefects: LogicDefect[];
  performanceFindings: PerformanceFinding[];
  styleNotes: { rule: string; suggestion: string }[];
  summaryComment: string;
  modelAttribution: string;
}

export interface BurnoutPredictorResult {
  flowStateIndex: number;
  burnoutRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  cognitiveFatigueScore: number;
  contextSwitchingPenalty: number;
  meetingFragmentationRatio: number;
  uninterruptedFocusHours?: number;
  weeklyForecast: { day: string; projectedFatigue: number; flowProbability: number }[];
  actionableProtocols: { title: string; impact: string; action: string }[];
  modelAttribution: string;
}

export interface PRVelocityLikelihoodResult {
  prSizeLines: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  reviewerCount: number;
  authorExperiencePrs: number;
  predictedReviewLatencyHours: number;
  mergeProbabilityPct: number;
  mergeProbabilityConfidence: number;
  riskCategory: 'Low Risk' | 'Moderate Risk' | 'High Friction';
  shapFactors: { feature: string; impact: number; description: string; direction: 'positive' | 'negative' }[];
  recommendations: string[];
  modelAttribution: string;
}

export interface EncryptedCredentialsPayload {
  github_token?: string;
  vscode_token?: string;
  antigravity_key?: string;
  jira_key?: string;
  linear_key?: string;
}

export interface OnboardingData {
  githubToken: string;
  vscodeToken: string;
  antigravityKey: string;
  jiraKey: string;
  linearKey: string;
  completed: boolean;
}

