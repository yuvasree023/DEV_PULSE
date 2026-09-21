import {
  OverviewMetrics,
  AIImpactMetrics,
  AIToolsResponse,
  PeopleMetrics,
  ProjectsMetrics,
  MLInsightsResponse,
  ExplainResponse,
  DatasetInfoResponse,
  PullRequest
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody || response.statusText}`);
    }
    return (await response.json()) as T;
  } catch (err: any) {
    console.error(`Failed to fetch from ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  checkHealth: (): Promise<{ status: string }> => fetchJson<{ status: string }>('/health'),

  getOverview: (): Promise<OverviewMetrics> => fetchJson<OverviewMetrics>('/api/overview'),
  
  getAIImpact: (): Promise<AIImpactMetrics> => fetchJson<AIImpactMetrics>('/api/ai-impact'),
  
  getAITools: (): Promise<AIToolsResponse> => fetchJson<AIToolsResponse>('/api/ai-tools'),
  
  getPeople: (limit = 100): Promise<PeopleMetrics> => fetchJson<PeopleMetrics>(`/api/people?limit=${limit}`),
  
  getProjects: (limit = 100): Promise<ProjectsMetrics> => fetchJson<ProjectsMetrics>(`/api/projects?limit=${limit}`),
  
  getMLInsights: (clusters = 4): Promise<MLInsightsResponse> => fetchJson<MLInsightsResponse>(`/api/ml-insights?clusters=${clusters}`),
  
  getDatasetInfo: (): Promise<DatasetInfoResponse> => fetchJson<DatasetInfoResponse>('/api/dataset-info'),
  
  getPullRequests: (limit = 50): Promise<{ pull_requests: PullRequest[] }> => 
    fetchJson<{ pull_requests: PullRequest[] }>(`/api/pull-requests?limit=${limit}`),

  explainMetrics: (focus = 'holistic overview', customQuery?: string): Promise<ExplainResponse> => {
    return fetchJson<ExplainResponse>('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus, custom_query: customQuery })
    });
  },

  uploadDataset: async (files: {
    prFile?: File | null;
    reviewsFile?: File | null;
    repoFile?: File | null;
  }): Promise<{ status: string; message: string; meta: any }> => {
    const formData = new FormData();
    if (files.prFile) formData.append('pull_request_file', files.prFile);
    if (files.reviewsFile) formData.append('pr_reviews_file', files.reviewsFile);
    if (files.repoFile) formData.append('repository_file', files.repoFile);

    const response = await fetch(`${API_BASE_URL}/api/upload-dataset`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    return response.json();
  },

  resetDataset: (): Promise<{ status: string; message: string; meta: any }> => {
    return fetchJson<{ status: string; message: string; meta: any }>('/api/reset-dataset', {
      method: 'POST'
    });
  }
};
