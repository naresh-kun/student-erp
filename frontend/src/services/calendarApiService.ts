/**
 * Student ERP — Academic Calendar API Service
 * Authoritative DRF HTTP integration under /api/v1/calendar/events/
 *
 * Implements Phase 6 Task 6.4 (and foundation for 6.5 & 6.6):
 * - REST API CRUD operations for CalendarEvent
 * - Multi-day interval overlap date filtering, category filtering, target_role scoping
 * - Scoping per caller role (Student, Parent, Faculty, Admin, Principal)
 * - Domain formatting for Student and Parent calendar presentations
 */

import { ApiClient } from '@/services/api';
import type { CalendarEventItem } from '@/services/mockService';
import type { ParentCalendarEvent } from '@/features/parents/types';

export interface BackendCalendarEvent {
  id: string;
  title: string;
  category: string; // 'academic' | 'exam' | 'holiday' | 'meeting' | 'administrative' | 'event'
  description?: string;
  start_date: string; // ISO string e.g. "2026-10-12T08:30:00Z"
  end_date: string;   // ISO string e.g. "2026-10-22T11:30:00Z"
  target_roles?: string[]; // ['Student', 'Parent', 'Faculty', 'Admin', 'Principal']
  location?: string;
  is_holiday: boolean;
  is_published: boolean;
  is_school_sanctioned?: boolean;
  od_eligible?: boolean;
  is_public?: boolean;
  created_by?: string;
  created_by_username?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FacultyCalendarEventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  is_holiday: boolean;
  is_published: boolean;
  target_roles?: string[];
}

export class CalendarApiService {
  private static readonly MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Helper: Formats an ISO date range into human-readable Indian school academic label.
   * e.g. "October 12 - October 22, 2026" or "October 28, 2026".
   */
  static formatDateRange(startStr?: string, endStr?: string): string {
    if (!startStr) return '';
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return startStr;

    const startMonth = this.MONTH_NAMES[start.getUTCMonth()];
    const startDay = String(start.getUTCDate()).padStart(2, '0');
    const startYear = start.getUTCFullYear();

    if (!endStr) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    const end = new Date(endStr);
    if (isNaN(end.getTime())) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    const endMonth = this.MONTH_NAMES[end.getUTCMonth()];
    const endDay = String(end.getUTCDate()).padStart(2, '0');
    const endYear = end.getUTCFullYear();

    // Same day
    if (startYear === endYear && start.getUTCMonth() === end.getUTCMonth() && startDay === endDay) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    // Same month and year
    if (startYear === endYear && start.getUTCMonth() === end.getUTCMonth()) {
      return `${startMonth} ${startDay} - ${startMonth} ${endDay}, ${startYear}`;
    }

    // Different month, same year
    if (startYear === endYear) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    }

    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  }

  /**
   * Helper: Formats start and end times into "08:30 AM - 11:30 AM" or "All Day".
   */
  static formatTimeRange(startStr?: string, endStr?: string, isHoliday = false): string {
    if (isHoliday) return 'All Day';
    if (!startStr) return 'All Day';

    const start = new Date(startStr);
    if (isNaN(start.getTime())) return 'All Day';

    const formatTimeOnly = (d: Date): string => {
      let hours = d.getUTCHours();
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const startHours = start.getUTCHours();
    const startMins = start.getUTCMinutes();

    if (!endStr) {
      if (startHours === 0 && startMins === 0) return 'All Day';
      return formatTimeOnly(start);
    }

    const end = new Date(endStr);
    if (isNaN(end.getTime())) {
      return formatTimeOnly(start);
    }

    const endHours = end.getUTCHours();
    const endMins = end.getUTCMinutes();

    // Check if whole day (e.g. 00:00 to 23:59 or 00:00)
    if (startHours === 0 && startMins === 0 && (endHours === 23 || (endHours === 0 && endMins === 0))) {
      return 'All Day';
    }

    return `${formatTimeOnly(start)} - ${formatTimeOnly(end)}`;
  }

  /**
   * Helper: Maps backend category to canonical UI category display strings.
   */
  static formatCategory(cat?: string): string {
    if (!cat) return 'General';
    const c = cat.toLowerCase();
    switch (c) {
      case 'exam':
      case 'examination':
        return 'Examination';
      case 'holiday':
        return 'Holiday';
      case 'academic':
        return 'Academic';
      case 'meeting':
      case 'ptm':
        return 'Meeting';
      case 'administrative':
        return 'Administrative';
      default:
        return 'General';
    }
  }

  /**
   * Transforms BackendCalendarEvent to Student's CalendarEventItem format.
   */
  static transformEventToStudentItem(event: BackendCalendarEvent): CalendarEventItem {
    return {
      title: event.title,
      category: this.formatCategory(event.category),
      date: this.formatDateRange(event.start_date, event.end_date),
      time: this.formatTimeRange(event.start_date, event.end_date, event.is_holiday),
      venue: event.location || 'Campus',
      location: event.location || 'Campus',
      desc: event.description || '',
    };
  }

  /**
   * Transforms BackendCalendarEvent to Parent's ParentCalendarEvent format.
   */
  static transformEventToParentItem(event: BackendCalendarEvent): ParentCalendarEvent {
    const isPtm = (event.category || '').toLowerCase() === 'meeting' ||
                  (event.title || '').toLowerCase().includes('ptm') ||
                  (event.title || '').toLowerCase().includes('parent');

    const cat = isPtm
      ? 'PTM'
      : (event.is_holiday || (event.category || '').toLowerCase() === 'holiday')
      ? 'Holiday'
      : (event.category || '').toLowerCase() === 'exam'
      ? 'Examination'
      : (event.category || '').toLowerCase() === 'academic'
      ? 'Academic'
      : 'General';

    return {
      id: event.id,
      title: event.title,
      date: this.formatDateRange(event.start_date, event.end_date),
      time: this.formatTimeRange(event.start_date, event.end_date, event.is_holiday),
      location: event.location || 'Campus Closed',
      category: cat as ParentCalendarEvent['category'],
      desc: event.description || '',
    };
  }

  /**
   * Transforms BackendCalendarEvent to Faculty's FacultyCalendarEventItem format.
   */
  static transformEventToFacultyItem(event: BackendCalendarEvent): FacultyCalendarEventItem {
    return {
      id: event.id,
      title: event.title,
      category: this.formatCategory(event.category),
      date: this.formatDateRange(event.start_date, event.end_date),
      time: this.formatTimeRange(event.start_date, event.end_date, event.is_holiday),
      venue: event.location || 'Campus',
      description: event.description || '',
      is_holiday: Boolean(event.is_holiday),
      is_published: Boolean(event.is_published),
      target_roles: event.target_roles || [],
    };
  }

  /**
   * GET /api/v1/calendar/events/
   * Retrieves role-scoped academic calendar events with optional query filters.
   */
  static async getCalendarEvents(params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    is_holiday?: boolean;
    target_role?: string;
    search?: string;
    page?: number;
  }): Promise<BackendCalendarEvent[]> {
    const query: Record<string, any> = {};
    if (params?.start_date) query.start_date = params.start_date;
    if (params?.end_date) query.end_date = params.end_date;
    if (params?.category) query.category = params.category;
    if (params?.is_holiday !== undefined) query.is_holiday = params.is_holiday;
    if (params?.target_role) query.target_role = params.target_role;
    if (params?.search) query.search = params.search;
    if (params?.page !== undefined) query.page = params.page;

    const res = await ApiClient.get<any>('/api/v1/calendar/events/', query);
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data && Array.isArray(res.data.results)) {
      return res.data.results;
    }
    return [];
  }

  /**
   * GET /api/v1/calendar/events/{id}/
   * Retrieves single calendar event detail.
   */
  static async getCalendarEvent(id: string): Promise<BackendCalendarEvent> {
    const res = await ApiClient.get<BackendCalendarEvent>(`/api/v1/calendar/events/${id}/`);
    return res.data;
  }

  /**
   * POST /api/v1/calendar/events/
   * Creates a calendar event (Admin/Principal or Faculty draft).
   */
  static async createCalendarEvent(payload: Partial<BackendCalendarEvent>): Promise<BackendCalendarEvent> {
    const res = await ApiClient.post<BackendCalendarEvent>('/api/v1/calendar/events/', payload);
    return res.data;
  }

  /**
   * PATCH /api/v1/calendar/events/{id}/
   * Updates an existing calendar event.
   */
  static async updateCalendarEvent(id: string, payload: Partial<BackendCalendarEvent>): Promise<BackendCalendarEvent> {
    const res = await ApiClient.patch<BackendCalendarEvent>(`/api/v1/calendar/events/${id}/`, payload);
    return res.data;
  }

  /**
   * DELETE /api/v1/calendar/events/{id}/
   * Deletes a calendar event (Admin only).
   */
  static async deleteCalendarEvent(id: string): Promise<void> {
    await ApiClient.delete(`/api/v1/calendar/events/${id}/`);
  }
}
