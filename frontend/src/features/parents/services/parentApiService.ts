/**
 * Student ERP — Parent API Service
 * Authoritative client communicating with Django REST Framework for Parent domain entities:
 * - /api/v1/parents/{id}/ & /api/v1/parents/me/
 * - /api/v1/parents/{id}/children/ & /api/v1/parents/me/children/
 * - /api/v1/students/{student_id}/
 * - /api/v1/attendance/?student_id=... & /api/v1/attendance/leaves/?student_id=...
 * - /api/v1/marks/report-card/{student_id}/ & /api/v1/marks/?student_id=...
 */

import { ApiClient } from '@/services/api';
import type {
  BackendStudentDetail,
  BackendAttendanceRecord,
  BackendAttendanceSummary,
  BackendLeaveApplication,
  BackendReportCard,
} from '@/features/students/services/studentApiService';

export interface BackendParentUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface BackendParentDetail {
  id: string;
  user?: BackendParentUser;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  relation: string;
  occupation: string;
  address: string;
  children_count?: number;
  created_at?: string;
  updated_at?: string;
}

export class ParentApiService {
  /**
   * Fetches full profile for authenticated parent or by specific parent ID.
   */
  static async getParentProfile(identifier = 'me'): Promise<BackendParentDetail> {
    const res = await ApiClient.get<BackendParentDetail>(`/api/v1/parents/${identifier}/`);
    return res.data;
  }

  /**
   * Fetches linked children for authenticated parent or specified parent ID.
   */
  static async getLinkedChildren(identifier = 'me'): Promise<BackendStudentDetail[]> {
    const res = await ApiClient.get<BackendStudentDetail[]>(`/api/v1/parents/${identifier}/children/`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetches profile for a specific student (must be linked child when called by parent).
   */
  static async getChildProfile(studentId: string): Promise<BackendStudentDetail> {
    const res = await ApiClient.get<BackendStudentDetail>(`/api/v1/students/${studentId}/`);
    return res.data;
  }

  /**
   * Fetches attendance logs and calculated summary for a linked child.
   */
  static async getChildAttendance(
    studentId: string,
    params?: {
      date?: string;
      month?: string;
      status?: string;
      page?: number;
    }
  ): Promise<{ records: BackendAttendanceRecord[]; summary?: BackendAttendanceSummary }> {
    const res = await ApiClient.get<BackendAttendanceRecord[]>('/api/v1/attendance/', {
      student_id: studentId,
      ...params,
    });
    const summary = res.meta?.attendance_summary as BackendAttendanceSummary | undefined;
    return {
      records: Array.isArray(res.data) ? res.data : [],
      summary,
    };
  }

  /**
   * Fetches leave applications / absence notices for a linked child.
   */
  static async getChildLeaveApplications(studentId: string): Promise<BackendLeaveApplication[]> {
    const res = await ApiClient.get<BackendLeaveApplication[]>('/api/v1/attendance/leaves/', {
      student_id: studentId,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Submits an absence notice / leave application for a linked child in PENDING status.
   */
  static async submitAbsenceNotice(payload: {
    student_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
  }): Promise<BackendLeaveApplication> {
    const res = await ApiClient.post<BackendLeaveApplication>('/api/v1/attendance/leaves/', payload);
    return res.data;
  }

  /**
   * Fetches authoritative report card for a linked child.
   */
  static async getChildReportCard(studentId: string, academicYearId?: string): Promise<BackendReportCard> {
    const params: Record<string, any> = {};
    if (academicYearId) params.academic_year_id = academicYearId;

    const res = await ApiClient.get<BackendReportCard>(`/api/v1/marks/report-card/${studentId}/`, params);
    return res.data;
  }

  /**
   * Fetches individual marks evaluation records for a linked child.
   */
  static async getChildMarks(studentId: string): Promise<any[]> {
    const res = await ApiClient.get<any[]>('/api/v1/marks/', { student_id: studentId });
    return Array.isArray(res.data) ? res.data : [];
  }
}
