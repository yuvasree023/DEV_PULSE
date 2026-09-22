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

// Standardized API Base URL supporting both VITE_API_URL (recommended) and VITE_API_BASE_URL
export const API_BASE = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  url: string;
  endpoint: string;

  constructor(message: string, status: number, url: string, endpoint: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.endpoint = endpoint;
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      const cleanBody = errorBody.length > 200 ? errorBody.slice(0, 200) + '...' : errorBody;
      throw new ApiError(
        `API error ${response.status} (${response.statusText}): ${cleanBody || 'No response body'} [Request: ${url}]`,
        response.status,
        url,
        endpoint
      );
    }
    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
    // Network / CORS / unreachable error
    console.error(`Network or fetch failure for ${url}:`, err);
    throw new ApiError(
      `Failed to connect to ${url}: ${err.message || 'Network error / server unreachable'}`,
      0,
      url,
      endpoint
    );
  }
}

/**
 * Cold-start helper with retry & exponential backoff (up to ~60s total)
 * Especially useful for free-tier Render/Railway servers that sleep when idle.
 */
async function checkServerHealthWithRetry(
  onProgress?: (elapsedSec: number, status: string) => void,
  maxWaitMs = 60000
): Promise<boolean> {
  const startTime = Date.now();
  let delayMs = 1500;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        return true;
      }
    } catch {
      // Ignored during wake-up polling
    }

    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    if (onProgress) {
      onProgress(elapsedSec, `Waking up backend server (${elapsedSec}s)...`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs = Math.min(delayMs * 1.3, 5000);
  }

  return false;
}

export const api = {
  checkHealth: (): Promise<{ status: string }> => fetchJson<{ status: string }>('/health'),

  checkServerHealthWithRetry,

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

    const response = await fetch(`${API_BASE}/api/upload-dataset`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `Upload failed (${response.status}): ${errorText}`,
        response.status,
        `${API_BASE}/api/upload-dataset`,
        '/api/upload-dataset'
      );
    }

    return response.json();
  },

  resetDataset: (): Promise<{ status: string; message: string; meta: any }> => {
    return fetchJson<{ status: string; message: string; meta: any }>('/api/reset-dataset', {
      method: 'POST'
    });
  }
};
