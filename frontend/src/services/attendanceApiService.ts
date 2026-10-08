/**
 * Student ERP — Attendance API Service
 * Authoritative DRF HTTP integration under /api/v1/attendance/
 *
 * Implements Phase 5 Task 5.5:
 * - Admin Attendance Oversight (/api/v1/attendance/summary/)
 * - Principal Attendance Intelligence Telemetry (/api/v1/attendance/analytics/)
 * - Student Absentees Register (/api/v1/attendance/absentees/)
 * - Attendance Not Entered Sessions (/api/v1/attendance/not-entered/)
 * - Attendance records & bulk roll call (/api/v1/attendance/, /api/v1/attendance/bulk/)
 * - Student & Parent Leave workflows (/api/v1/attendance/leaves/)
 *
 * Canonical 4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * Formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 */

import { ApiClient } from '@/services/api';
import type {
  StudentAbsenteeItem,
  AttendanceNotEnteredItem,
  AttendanceRecord,
} from '@/types';
import type { AdminAttendanceOverviewItem } from '@/features/admin/types';
import type { PrincipalAttendanceTelemetry } from '@/features/principal/types';

export class AttendanceApiService {
  /**
   * GET /api/v1/attendance/summary/
   * Section-by-section daily audit roll-up for Admin and Principal oversight.
   */
  static async getAttendanceOverview(params?: {
    date?: string;
    grade_level?: number;
  }): Promise<AdminAttendanceOverviewItem[]> {
    const query: Record<string, any> = {};
    if (params?.date) query.date = params.date;
    if (params?.grade_level) query.grade_level = params.grade_level;

    const res = await ApiClient.get<AdminAttendanceOverviewItem[]>('/api/v1/attendance/summary/', query);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * GET /api/v1/attendance/analytics/
   * Institutional presence telemetry, 4-status distribution, and cohort trends.
   */
  static async getAttendanceAnalytics(): Promise<PrincipalAttendanceTelemetry> {
    const res = await ApiClient.get<PrincipalAttendanceTelemetry>('/api/v1/attendance/analytics/');
    return res.data;
  }

  /**
   * GET /api/v1/attendance/absentees/
   * Dedicated register returning strictly students with status ABSENT.
   * Excludes PRESENT, ON_DUTY, and LEAVE.
   */
  static async getStudentAbsentees(filters?: {
    class_id?: string;
    section_id?: string;
    date?: string;
    grade?: string;
    search?: string;
    facultyId?: string;
  }): Promise<StudentAbsenteeItem[]> {
    const query: Record<string, any> = {};
    if (filters?.class_id) query.class_id = filters.class_id;
    if (filters?.section_id) query.section_id = filters.section_id;
    if (filters?.date) query.date = filters.date;
    if (filters?.grade && filters.grade !== 'ALL') query.grade = filters.grade;
    if (filters?.search) query.search = filters.search;
    if (filters?.facultyId) query.facultyId = filters.facultyId;

    const res = await ApiClient.get<StudentAbsenteeItem[]>('/api/v1/attendance/absentees/', query);
    const data = Array.isArray(res.data) ? res.data : [];
    // Strict safety invariant: ONLY ABSENT
    return data.filter((item) => item.status === 'ABSENT');
  }

  /**
   * GET /api/v1/attendance/not-entered/
   * Scheduled sessions where roll-call has not yet been submitted.
   * Distinct from student absence.
   */
  static async getAttendanceNotEntered(filters?: {
    date?: string;
    facultyId?: string;
    class_id?: string;
    section_id?: string;
    grade?: string;
    search?: string;
  }): Promise<AttendanceNotEnteredItem[]> {
    const query: Record<string, any> = {};
    if (filters?.date) query.date = filters.date;
    if (filters?.facultyId) query.facultyId = filters.facultyId;
    if (filters?.class_id) query.class_id = filters.class_id;
    if (filters?.section_id) query.section_id = filters.section_id;
    if (filters?.grade && filters.grade !== 'ALL') query.grade = filters.grade;
    if (filters?.search) query.search = filters.search;

    const res = await ApiClient.get<AttendanceNotEnteredItem[]>('/api/v1/attendance/not-entered/', query);
    const data = Array.isArray(res.data) ? res.data : [];
    return data.filter((item) => item.session_status === 'NOT ENTERED');
  }

  /**
   * GET /api/v1/attendance/
   * General attendance records query.
   */
  static async getAttendanceRecords(filters?: {
    student_id?: string;
    class_id?: string;
    section_id?: string;
    date?: string;
    month?: string;
    status?: string;
    grade?: string;
    search?: string;
  }): Promise<{ records: AttendanceRecord[]; summary?: any }> {
    const query: Record<string, any> = {};
    if (filters?.student_id) query.student_id = filters.student_id;
    if (filters?.class_id) query.class_id = filters.class_id;
    if (filters?.section_id) query.section_id = filters.section_id;
    if (filters?.date) query.date = filters.date;
    if (filters?.month) query.month = filters.month;
    if (filters?.status) query.status = filters.status;
    if (filters?.grade && filters.grade !== 'ALL') query.grade = filters.grade;
    if (filters?.search) query.search = filters.search;

    const res = await ApiClient.get<AttendanceRecord[]>('/api/v1/attendance/', query);
    const records = Array.isArray(res.data) ? res.data : [];
    const summary = (res as any).meta?.attendance_summary;
    return { records, summary };
  }
}
