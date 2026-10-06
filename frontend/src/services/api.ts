/**
 * Student ERP — Core API Client
 * Authoritative HTTP client communicating with Django REST Framework (/api/v1/)
 * Supports JWT authentication, automatic token refresh, and standardized error parsing.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const STORAGE_KEY_ACCESS = 'access_token';
const STORAGE_KEY_REFRESH = 'refresh_token';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any[];

  constructor(message: string, status: number, code = 'API_ERROR', details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiClient {
  private static isRefreshing = false;
  private static refreshSubscribers: Array<(token: string) => void> = [];

  private static subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private static onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private static getAccessToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(STORAGE_KEY_ACCESS);
  }

  private static getRefreshToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(STORAGE_KEY_REFRESH);
  }

  private static setAccessToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_ACCESS, token);
    }
  }

  private static async refreshAuthToken(): Promise<string | null> {
    const refresh = this.getRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const newAccess = data.access || data.data?.access;
      if (newAccess) {
        this.setAccessToken(newAccess);
        return newAccess;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Primary fetch wrapper with interceptor logic for 401 auto-refresh.
   */
  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; meta?: Record<string, any> }> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized with automatic JWT token refresh
    if (response.status === 401 && this.getRefreshToken()) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAuthToken();
        this.isRefreshing = false;

        if (newToken) {
          this.onTokenRefreshed(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        }
      } else {
        // Wait for active refresh to complete
        const retryToken = await new Promise<string | null>((resolve) => {
          this.subscribeTokenRefresh((t) => resolve(t));
        });
        if (retryToken) {
          headers['Authorization'] = `Bearer ${retryToken}`;
          response = await fetch(url, { ...options, headers });
        }
      }
    }

    if (!response.ok) {
      let errorBody: any = {};
      try {
        errorBody = await response.json();
      } catch {
        // Fallback for non-JSON error
      }

      const message =
        errorBody.error?.message ||
        errorBody.detail ||
        errorBody.message ||
        `Request failed with status ${response.status}`;
      const code = errorBody.error?.code || (response.status === 403 ? 'PERMISSION_DENIED' : 'API_ERROR');
      const details = errorBody.error?.details || errorBody.errors;

      throw new ApiError(message, response.status, code, details);
    }

    if (response.status === 204) {
      return { data: null as any };
    }

    const json = await response.json();

    // Standard envelope extraction
    if (json && typeof json === 'object') {
      if ('success' in json && 'data' in json) {
        return { data: json.data, meta: json.meta };
      }
      if ('results' in json) {
        return { data: json.results, meta: { count: json.count, next: json.next, previous: json.previous } };
      }
    }

    return { data: json };
  }

  static async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<{ data: T; meta?: Record<string, any> }> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  static async post<T = any>(endpoint: string, body?: any): Promise<{ data: T; meta?: Record<string, any> }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async patch<T = any>(endpoint: string, body?: any): Promise<{ data: T; meta?: Record<string, any> }> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T = any>(endpoint: string): Promise<{ data: T; meta?: Record<string, any> }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
