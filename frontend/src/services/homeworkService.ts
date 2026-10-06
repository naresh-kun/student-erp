/**
 * Student ERP — Homework API Service (MOD_001)
 * Authoritative client communicating directly with /api/v1/homework/
 * Backed by Django REST Framework and PostgreSQL persistence.
 */

import type {
  HomeworkItem,
  HomeworkCreatePayload,
  HomeworkUpdatePayload,
  HomeworkFilters,
} from '@/types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export interface TeachingScopeItem {
  assignment_id: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  academic_year_id: string;
  academic_year_name: string;
}

export class HomeworkService {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Fetches scoped list of homework records with optional filtering.
   */
  static async getHomeworkList(filters?: HomeworkFilters): Promise<HomeworkItem[]> {
    const headers = await this.getAuthHeaders();
    const queryParams = new URLSearchParams();

    if (filters?.section_id) queryParams.append('section_id', filters.section_id);
    if (filters?.class_id) queryParams.append('class_id', filters.class_id);
    if (filters?.subject_id) queryParams.append('subject_id', filters.subject_id);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.due_date_from) queryParams.append('due_date_from', filters.due_date_from);
    if (filters?.due_date_to) queryParams.append('due_date_to', filters.due_date_to);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', String(filters.page));

    const qs = queryParams.toString();
    const url = `${API_BASE_URL}/api/v1/homework/${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || `Failed to fetch homework: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (data.results || []);
  }

  /**
   * Fetches full detail for a single homework entity.
   */
  static async getHomeworkById(id: string): Promise<HomeworkItem> {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/v1/homework/${id}/`;

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || `Failed to fetch homework details: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || data;
  }

  /**
   * Creates a new homework assignment within authorized teaching scope.
   */
  static async createHomework(payload: HomeworkCreatePayload): Promise<HomeworkItem> {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/v1/homework/`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message ||
        err.detail ||
        (err.errors ? JSON.stringify(err.errors) : `Failed to create homework (${res.status})`)
      );
    }

    const data = await res.json();
    return data.data || data;
  }

  /**
   * Updates an authored homework record.
   */
  static async updateHomework(id: string, payload: HomeworkUpdatePayload): Promise<HomeworkItem> {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/v1/homework/${id}/`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || `Failed to update homework: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || data;
  }

  /**
   * Deletes an authored homework record.
   */
  static async deleteHomework(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/v1/homework/${id}/`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || `Failed to delete homework: ${res.statusText}`);
    }
  }

  /**
   * Retrieves the faculty member's authorized teaching scope (TeachingAssignments)
   * to populate Section and Subject dropdowns in the creation form.
   */
  static async getTeachingScope(): Promise<TeachingScopeItem[]> {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}/api/v1/homework/scope/`;

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.data || [];
  }
}
