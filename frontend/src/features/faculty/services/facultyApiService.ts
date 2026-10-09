/**
 * Student ERP — Faculty API Service
 * Authoritative client communicating with Django REST Framework for Faculty domain entities:
 * - /api/v1/faculty/me/ & /api/v1/faculty/{id}/
 * - /api/v1/faculty/me/classes/ & /api/v1/faculty/{id}/classes/
 * - /api/v1/students/?section_id=...
 * - /api/v1/attendance/ & /api/v1/attendance/bulk/
 * - /api/v1/attendance/leaves/ & /api/v1/attendance/leaves/{id}/
 * - /api/v1/marks/ & /api/v1/marks/bulk/
 * - /api/v1/homework/
 */

import { ApiClient } from '@/services/api';
import type { AttendanceStatus } from '@/types';

export interface BackendFacultyUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface BackendClassTeacherOf {
  class_id: string;
  section_id: string;
  class_name: string;
  section_name: string;
  name?: string;
  display_name?: string;
  room?: string;
}

export interface BackendFacultyDetail {
  id: string;
  user?: BackendFacultyUser;
  employee_code: string;
  department: string;
  designation: string;
  qualification: string;
  specialization: string;
  office_room: string;
  joining_date: string;
  is_active: boolean;
  status: string;
  full_name: string;
  class_teacher_of: BackendClassTeacherOf | null;
  assigned_classes_count: number;
  assigned_students_count: number;
  weekly_periods: number;
}

export interface BackendFacultyClassItem {
  id: string;
  class_id: string;
  section_id: string;
  class_name: string;
  section_name: string;
  display_name: string;
  subject_id: string;
  subject: string;
  subject_code: string;
  room: string;
  student_count: number;
  is_class_teacher: boolean;
  periods_per_week: number;
}

export interface BackendFacultyStudentItem {
  id: string;
  student_id: string;
  admission_number: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  class_name: string;
  section_name: string;
  status: string;
}

export interface BackendFacultyLeaveItem {
  id: string;
  student: string;
  student_id: string;
  student_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  applied_on: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_remarks: string;
}

export interface BulkAttendanceRecordPayload {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
  session_period?: number;
}

export interface BulkAttendancePayload {
  date: string;
  session_period?: number;
  section_id?: string;
  records: BulkAttendanceRecordPayload[];
}

export interface BulkMarkRecordPayload {
  student_id: string;
  subject_id: string;
  exam_type_id: string;
  marks_obtained: number | string;
  max_marks?: number;
  remarks?: string;
}

export interface BulkMarkPayload {
  records: BulkMarkRecordPayload[];
}

export interface FacultyHomeworkItem {
  id: string;
  title: string;
  description: string;
  class_name?: string;
  section?: string;
  section_name?: string;
  subject?: string;
  subject_name?: string;
  faculty_name?: string;
  assigned_date?: string;
  due_date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  max_points?: number;
}

export class FacultyApiService {
  /**
   * Fetches full profile for authenticated faculty or designated ID.
   */
  static async getFacultyProfile(identifier = 'me'): Promise<BackendFacultyDetail> {
    const res = await ApiClient.get<BackendFacultyDetail>(`/api/v1/faculty/${identifier}/`);
    return res.data;
  }

  /**
   * Fetches authoritative assigned classes, sections, and subjects for the faculty member.
   */
  static async getAssignedClasses(identifier = 'me'): Promise<BackendFacultyClassItem[]> {
    const res = await ApiClient.get<BackendFacultyClassItem[]>(`/api/v1/faculty/${identifier}/classes/`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Fetches scoped student roster for an assigned section or all taught sections.
   */
  static async getAssignedStudents(sectionId?: string): Promise<BackendFacultyStudentItem[]> {
    const params: Record<string, string> = {};
    if (sectionId) {
      params.section_id = sectionId;
    }
    const res = await ApiClient.get<BackendFacultyStudentItem[]>('/api/v1/students/', params);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Records bulk attendance for an authorized section and session.
   */
  static async recordBulkAttendance(payload: BulkAttendancePayload): Promise<{ saved_count: number }> {
    const res = await ApiClient.post<{ saved_count: number }>('/api/v1/attendance/bulk/', payload);
    return res.data;
  }

  /**
   * Fetches leave applications scoped to faculty (Class Teacher and reviewer scope).
   */
  static async getLeaveApplications(params?: {
    student_id?: string;
    status?: string;
  }): Promise<BackendFacultyLeaveItem[]> {
    const res = await ApiClient.get<BackendFacultyLeaveItem[]>('/api/v1/attendance/leaves/', params);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Class Teacher action: approves or rejects a student leave application.
   */
  static async reviewLeaveApplication(
    leaveId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewRemarks?: string
  ): Promise<BackendFacultyLeaveItem> {
    const payload: { status: string; review_remarks?: string } = { status };
    if (reviewRemarks) {
      payload.review_remarks = reviewRemarks;
    }
    const res = await ApiClient.patch<BackendFacultyLeaveItem>(`/api/v1/attendance/leaves/${leaveId}/`, payload);
    return res.data;
  }

  /**
   * Records marks in bulk for an authorized TeachingAssignment.
   */
  static async recordBulkMarks(payload: BulkMarkPayload): Promise<{ saved_count: number }> {
    const res = await ApiClient.post<{ saved_count: number }>('/api/v1/marks/bulk/', payload);
    return res.data;
  }

  /**
   * Fetches homework scoped to authorized faculty assignments.
   */
  static async getHomework(params?: {
    section_id?: string;
    subject_id?: string;
    status?: string;
  }): Promise<FacultyHomeworkItem[]> {
    const res = await ApiClient.get<FacultyHomeworkItem[]>('/api/v1/homework/', params);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Creates a new homework assignment within authorized teaching scope.
   */
  static async createHomework(payload: Partial<FacultyHomeworkItem>): Promise<FacultyHomeworkItem> {
    const res = await ApiClient.post<FacultyHomeworkItem>('/api/v1/homework/', payload);
    return res.data;
  }

  /**
   * Updates an existing homework assignment owned by this faculty member.
   */
  static async updateHomework(homeworkId: string, payload: Partial<FacultyHomeworkItem>): Promise<FacultyHomeworkItem> {
    const res = await ApiClient.patch<FacultyHomeworkItem>(`/api/v1/homework/${homeworkId}/`, payload);
    return res.data;
  }

  /**
   * Deletes a homework assignment owned by this faculty member.
   */
  static async deleteHomework(homeworkId: string): Promise<void> {
    await ApiClient.delete(`/api/v1/homework/${homeworkId}/`);
  }
}
