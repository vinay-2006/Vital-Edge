import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TriageInput, TriageResult, DashboardSummary } from './types';
import { toDBPriority, toFrontendPriority } from './priority-mapper';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Render free tier sleeps after 15 min inactivity — cold start takes up to 60s
const REQUEST_TIMEOUT_MS = 70000; // 70 seconds
const MAX_RETRIES = 1;

type BackendPriority = 'RED' | 'YELLOW' | 'GREEN';

interface ApiErrorResponse {
  error?: string;
}

interface ResponseWithPriority {
  priority: BackendPriority;
}

interface RecentEntry {
  priority: BackendPriority;
}

interface ResponseWithRecentEntries {
  recentEntries: RecentEntry[];
}

export interface AnalyzeImagingInput {
  triage_level: string;
  vitals: any;
  symptoms: string[];
}

export interface AnalyzeImagingResponse {
  imaging_recommended: boolean;
  reason: string;
  pipeline: string[];
  analysis: {
    risk_score: number;
    possible_condition: string;
    confidence: number;
  } | null;
  report: {
    summary: string;
    findings: string[];
    recommendation: string;
  };
  safety_disclaimer: string[];
  image_path: string | null;
}

// Extend axios config type to support retry tracking
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    // Request interceptor - convert frontend priorities to backend format
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - convert backend priorities to frontend format
    this.client.interceptors.response.use(
      (response) => {
        // Convert priority in response data
        if (
          response.data &&
          typeof response.data === 'object' &&
          'priority' in response.data
        ) {
          const data = response.data as ResponseWithPriority;
          data.priority = toFrontendPriority(data.priority) as unknown as BackendPriority;
        }

        // Convert priorities in array responses
        if (
          response.data &&
          typeof response.data === 'object' &&
          'recentEntries' in response.data
        ) {
          const data = response.data as ResponseWithRecentEntries;
          data.recentEntries = data.recentEntries.map((entry) => ({
            ...entry,
            priority: toFrontendPriority(entry.priority) as unknown as BackendPriority,
          }));
        }

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as RetryableRequestConfig | undefined;

        // Auto-retry once on network errors (handles Render cold-start timeouts)
        if (!error.response && config) {
          config._retryCount = config._retryCount ?? 0;
          if (config._retryCount < MAX_RETRIES) {
            config._retryCount += 1;
            // Brief pause before retry
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return this.client(config);
          }
        }

        // Handle errors with user-friendly messages
        if (error.response) {
          const data = error.response.data as any;
          let message = data?.error || 'Server error occurred';
          
          // Surface Zod validation details from the backend
          if (data?.details && Array.isArray(data.details)) {
            const detailedMsgs = data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ');
            message += ` >> ${detailedMsgs}`;
          }
          
          throw new Error(message);
        } else if (error.request) {
          throw new Error(
            'Server is waking up — this can take up to 60 seconds on first load. Please try again in a moment.'
          );
        } else {
          throw new Error('Request failed. Please try again.');
        }
      }
    );
  }

  /**
   * Submit a new triage case
   */
  async submitTriage(input: TriageInput): Promise<TriageResult> {
    // Convert frontend priority references in input if any
    const response = await this.client.post<TriageResult>('/api/triage', input);
    return response.data;
  }

  /**
   * Get dashboard summary
   */
  async getDashboard(): Promise<DashboardSummary> {
    const response = await this.client.get<DashboardSummary>('/api/dashboard/summary');
    return response.data;
  }

  /**
   * Get a specific triage record
   */
  async getTriage(id: string): Promise<TriageResult> {
    const response = await this.client.get<TriageResult>(`/api/triage/${id}`);
    return response.data;
  }

  /**
   * Override the priority of a triage record
   */
  async overridePriority(
    id: string,
    newPriority: 'CRITICAL' | 'MODERATE' | 'STABLE',
    reason: string,
    operatorName?: string
  ): Promise<TriageResult> {
    // Convert frontend priority to backend format
    const dbPriority = toDBPriority(newPriority);

    const response = await this.client.post<TriageResult>(`/api/triage/${id}/override`, {
      newPriority: dbPriority,
      reason,
      operatorName,
    });
    return response.data;
  }

  /**
   * Export triage records to CSV
   */
  async exportCSV(params?: {
    startDate?: string;
    endDate?: string;
    operatorName?: string;
  }): Promise<Blob> {
    const response = await this.client.get('/api/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: {
    limit?: number;
    offset?: number;
    triageId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, unknown>> {
    const response = await this.client.get<Record<string, unknown>>('/api/audit-logs', { params });
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * [EXPERIMENTAL] Call the local imaging analysis module
   * Fails gracefully if not running locally.
   */
  async analyzeImaging(
    input: AnalyzeImagingInput,
    mockImagePath?: string
  ): Promise<AnalyzeImagingResponse> {
    const url = import.meta.env.VITE_IMAGING_API_URL || 'http://localhost:4010';
    
    try {
      const response = await axios.post<AnalyzeImagingResponse>(
        `${url}/analyze-imaging`,
        {
          ...input,
          image_path: mockImagePath,
        },
        { timeout: 10000 } // Fail fast if offline
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        if (!error.response) {
          throw new Error('Experimental module offline. Please run `npm run dev:imaging` locally.');
        }
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
