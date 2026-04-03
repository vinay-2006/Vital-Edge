import axios, { AxiosInstance, AxiosError } from 'axios';
import { TriageInput, TriageResult, DashboardSummary } from './types';
import { toDBPriority, toFrontendPriority } from './priority-mapper';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
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
          data.priority = toFrontendPriority(data.priority);
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
            priority: toFrontendPriority(entry.priority),
          }));
        }

        return response;
      },
      (error: AxiosError) => {
        // Handle errors with user-friendly messages
        if (error.response) {
          const message = (error.response.data as ApiErrorResponse | undefined)?.error || 'Server error occurred';
          throw new Error(message);
        } else if (error.request) {
          throw new Error('Cannot connect to server. Please check your connection.');
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
}

export const apiClient = new ApiClient();
