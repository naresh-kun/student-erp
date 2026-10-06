/**
 * Student ERP — Student API Service
 * Authoritative client communicating with Django REST Framework for Student domain entities:
 * - /api/v1/students/{id}/ & /api/v1/students/me/
 * - /api/v1/attendance/ & /api/v1/attendance/leaves/
 * - /api/v1/marks/ & /api/v1/marks/report-card/{student_id}/
 */

import { ApiClient } from '@/services/api';

export interface BackendStudentDetail {
  id: string;
  student_id: string;
  admission_number: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  emergency_contact: string;
  address: string;
  status: string;
  parent?: {
    id: string;
    name: string;
    relation: string;
    phone: string;
    email: string;
    occupation: string;
  };
  enrollments?: Array<{
    id: string;
    academic_year: string;
    class_name: string;
    section_name: string;
    status: string;
    class_teacher_name?: string;
    class_teacher_email?: string;
  }>;
  current_class?: string;
  current_section?: string;
  stream?: string;
  academic_year?: string;
  class_teacher_name?: string;
  class_teacher_email?: string;
  class_teacher_dept?: string;
  class_teacher_room?: string;
}

export interface BackendAttendanceRecord {
  id: string;
  enrollment: string;
  student_id: string;
  student_name: string;
  class_name: string;
  section_name: string;
  date: string;
  session_period: number | null;
  status: 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE';
  remarks: string;
  recorded_by?: string;
  recorded_by_name?: string;
  approved_by_faculty?: string;
  approved_by_faculty_name?: string;
}

export interface BackendAttendanceSummary {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  on_duty_count: number;
  leave_count: number;
  attendance_percentage: number;
}

export interface BackendLeaveApplication {
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
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_remarks?: string;
}

export interface BackendReportCard {
  student_id: string;
  student_name: string;
  admission_number: string;
  roll_number: string;
  academic_year: string;
  class_name: string;
  section_name: string;
  total_marks_obtained: number;
  total_max_marks: number;
  overall_percentage: number;
  overall_grade: string;
  subject_count: number;
  marks: Array<{
    id: string;
    subject_id?: string;
    subject_code: string;
    subject_name: string;
    exam_type: string;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    grade: string;
    remarks: string;
  }>;
}

export class StudentApiService {
  /**
   * Fetches full profile for authenticated student or by specific student ID.
   */
  static async getStudentProfile(identifier = 'me'): Promise<BackendStudentDetail> {
    const res = await ApiClient.get<BackendStudentDetail>(`/api/v1/students/${identifier}/`);
    return res.data;
  }

  /**
   * Fetches attendance records and canonical summary statistics for the student.
   */
  static async getAttendance(params?: {
    student_id?: string;
    date?: string;
    month?: string;
    status?: string;
    page?: number;
  }): Promise<{ records: BackendAttendanceRecord[]; summary?: BackendAttendanceSummary }> {
    const res = await ApiClient.get<BackendAttendanceRecord[]>('/api/v1/attendance/', params);
    const summary = res.meta?.attendance_summary as BackendAttendanceSummary | undefined;
    return {
      records: Array.isArray(res.data) ? res.data : [],
      summary,
    };
  }

  /**
   * Fetches leave applications for the student.
   */
  static async getLeaveApplications(studentId?: string): Promise<BackendLeaveApplication[]> {
    const params: Record<string, any> = {};
    if (studentId) params.student_id = studentId;

    const res = await ApiClient.get<BackendLeaveApplication[]>('/api/v1/attendance/leaves/', params);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Submits a new leave application in PENDING status.
   */
  static async submitLeaveApplication(payload: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
  }): Promise<BackendLeaveApplication> {
    const res = await ApiClient.post<BackendLeaveApplication>('/api/v1/attendance/leaves/', payload);
    return res.data;
  }

  /**
   * Fetches official report card containing cumulative totals and exam marks.
   */
  static async getReportCard(studentId: string, academicYearId?: string): Promise<BackendReportCard> {
    const params: Record<string, any> = {};
    if (academicYearId) params.academic_year_id = academicYearId;

    const res = await ApiClient.get<BackendReportCard>(`/api/v1/marks/report-card/${studentId}/`, params);
    return res.data;
  }

  /**
   * Fetches individual marks evaluation records.
   */
  static async getMarks(params?: {
    student_id?: string;
    subject_id?: string;
    exam_type_id?: string;
  }): Promise<any[]> {
    const res = await ApiClient.get<any[]>('/api/v1/marks/', params);
    return Array.isArray(res.data) ? res.data : [];
  }
}
