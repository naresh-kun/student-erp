/**
 * Student ERP — Marks API Service
 * Authoritative DRF HTTP client communicating under /api/v1/marks/
 *
 * Implements Phase 5 Task 5.6:
 * - Admin Examination Oversight (/api/v1/marks/summary/)
 * - Principal Institutional Academic Analytics (/api/v1/marks/analytics/)
 * - Evaluation records listing & filtering (/api/v1/marks/)
 * - Bulk marks entry (/api/v1/marks/bulk/)
 * - Student & Parent report card retrieval (/api/v1/marks/report-card/{student_id}/)
 * - Exam categories (/api/v1/marks/exam-types/)
 *
 * CRITICAL GOVERNANCE:
 * - Strictly CBSE 8-tier letter grading scale (A1, A2, B1, B2, C1, C2, D, E).
 * - Zero GPA, CGPA, credits, or grade points.
 * - Zero faculty performance rankings or evaluations.
 * - Preserves 'AB' for absent students.
 */

import { ApiClient } from '@/services/api';
import type {
  GradeAcademicPerformance,
  StreamPerformanceItem,
  SubjectPerformanceItem,
} from '@/features/principal/types';
import type { BackendReportCard } from '@/features/students/services/studentApiService';

export interface AdminMarksSummaryResponse {
  total_records: number;
  evaluated_students: number;
  school_average: number;
  pass_rate: number;
  grade_distribution: { grade: string; count: number; percentage: number }[];
  section_rollups: {
    section_id: string;
    section_name: string;
    class_name: string;
    student_count: number;
    average_marks: number;
    pass_rate: number;
  }[];
  subject_rollups: {
    subject_id: string;
    subject_name: string;
    subject_code: string;
    evaluated_count: number;
    average_marks: number;
    highest_mark: number;
    lowest_mark: number;
  }[];
}

export interface PrincipalAcademicKPIs {
  schoolAverageMarks: number;
  overallPassPercentage: number;
  distinctionCount: number;
  totalStudentsEvaluated: number;
}

export interface PrincipalAcademicAnalyticsResponse {
  kpis?: PrincipalAcademicKPIs;
  gradePerformance: GradeAcademicPerformance[];
  streamPerformance: StreamPerformanceItem[];
  subjectPerformance: SubjectPerformanceItem[];
  schoolGradeDistribution: { tier: string; count: number; percentage: number }[];
}

export interface MarkRecordItem {
  id: string;
  enrollment: string;
  student_id: string;
  student_name: string;
  subject: string;
  subject_code: string;
  subject_name: string;
  exam_type: string;
  exam_type_name: string;
  marks_obtained: number | string;
  max_marks: number;
  grade: string;
  remarks: string;
  evaluated_by?: string;
  evaluated_by_name?: string;
  evaluated_at: string;
  created_at: string;
}

export interface BulkMarkEntryItem {
  student_id?: string;
  enrollment_id?: string;
  subject_id: string;
  exam_type_id: string;
  marks_obtained: number | string;
  max_marks?: number;
  remarks?: string;
}

export interface ExamTypeItem {
  id: string;
  name: string;
  weightage: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export class MarksApiService {
  /**
   * GET /api/v1/marks/summary/
   * Section-and-subject evaluation audit roll-up for Admin and Principal oversight.
   */
  static async getMarksSummary(params?: {
    academic_year_id?: string;
    academic_year?: string;
    exam_type_id?: string;
    exam_type?: string;
    grade_level?: number;
    gradeLevel?: number;
    class_id?: string;
    section_id?: string;
    subject_id?: string;
    subject_code?: string;
  }): Promise<AdminMarksSummaryResponse> {
    const query: Record<string, any> = {};
    if (params?.academic_year_id || params?.academic_year) {
      query.academic_year_id = params.academic_year_id || params.academic_year;
    }
    if (params?.exam_type_id || params?.exam_type) {
      query.exam_type_id = params.exam_type_id || params.exam_type;
    }
    if (params?.grade_level !== undefined || params?.gradeLevel !== undefined) {
      query.grade_level = params.grade_level ?? params.gradeLevel;
    }
    if (params?.class_id) query.class_id = params.class_id;
    if (params?.section_id) query.section_id = params.section_id;
    if (params?.subject_id || params?.subject_code) {
      query.subject_id = params.subject_id || params.subject_code;
    }

    const res = await ApiClient.get<AdminMarksSummaryResponse>('/api/v1/marks/summary/', query);
    return res.data;
  }

  /**
   * GET /api/v1/marks/analytics/
   * Longitudinal academic performance analytics, cohort grade comparison,
   * stream comparison, and CBSE 8-tier letter grade distribution for leadership.
   */
  static async getAcademicAnalytics(params?: {
    grade_level?: number;
    gradeLevel?: number;
    stream?: string;
    academic_year_id?: string;
    academic_year?: string;
    exam_type_id?: string;
    exam_type?: string;
  }): Promise<PrincipalAcademicAnalyticsResponse> {
    const query: Record<string, any> = {};
    if (params?.grade_level !== undefined || params?.gradeLevel !== undefined) {
      query.grade_level = params.grade_level ?? params.gradeLevel;
    }
    if (params?.stream && params.stream !== 'ALL') query.stream = params.stream;
    if (params?.academic_year_id || params?.academic_year) {
      query.academic_year_id = params.academic_year_id || params.academic_year;
    }
    if (params?.exam_type_id || params?.exam_type) {
      query.exam_type_id = params.exam_type_id || params.exam_type;
    }

    const res = await ApiClient.get<PrincipalAcademicAnalyticsResponse>('/api/v1/marks/analytics/', query);
    return res.data;
  }

  /**
   * GET /api/v1/marks/
   * Lists marks records filtered by student, subject, exam type, class, or section.
   */
  static async getMarksList(params?: {
    student_id?: string;
    subject_id?: string;
    subject_code?: string;
    exam_type_id?: string;
    exam_type?: string;
    class_id?: string;
    section_id?: string;
  }): Promise<MarkRecordItem[]> {
    const query: Record<string, any> = {};
    if (params?.student_id) query.student_id = params.student_id;
    if (params?.subject_id || params?.subject_code) {
      query.subject_id = params.subject_id || params.subject_code;
    }
    if (params?.exam_type_id || params?.exam_type) {
      query.exam_type_id = params.exam_type_id || params.exam_type;
    }
    if (params?.class_id) query.class_id = params.class_id;
    if (params?.section_id) query.section_id = params.section_id;

    const res = await ApiClient.get<MarkRecordItem[]>('/api/v1/marks/', query);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * POST /api/v1/marks/bulk/
   * Persists marks records in batch for authorized Faculty or Admin.
   * Accepts numeric scores (0–100) or 'AB' for absent students.
   */
  static async recordBulkMarks(payload: {
    records: BulkMarkEntryItem[];
  }): Promise<{ saved_count: number; records: MarkRecordItem[] }> {
    const res = await ApiClient.post<{ saved_count: number; records: MarkRecordItem[] }>(
      '/api/v1/marks/bulk/',
      payload
    );
    return res.data;
  }

  /**
   * GET /api/v1/marks/report-card/{student_id}/
   * Returns authoritative calculated cumulative report card.
   */
  static async getReportCard(
    studentId: string,
    academicYearId?: string
  ): Promise<BackendReportCard> {
    const params = academicYearId ? { academic_year_id: academicYearId } : undefined;
    const res = await ApiClient.get<BackendReportCard>(
      `/api/v1/marks/report-card/${studentId}/`,
      params
    );
    return res.data;
  }

  /**
   * GET /api/v1/marks/exam-types/
   * Lists assessment/examination categories with optional is_active filter.
   */
  static async getExamTypes(params?: { is_active?: boolean }): Promise<ExamTypeItem[]> {
    const query = params?.is_active !== undefined ? { is_active: params.is_active } : undefined;
    const res = await ApiClient.get<ExamTypeItem[]>('/api/v1/marks/exam-types/', query);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * GET /api/v1/marks/exam-types/{id}/
   * Retrieves single assessment/examination category detail.
   */
  static async getExamTypeById(id: string): Promise<ExamTypeItem> {
    const res = await ApiClient.get<ExamTypeItem>(`/api/v1/marks/exam-types/${id}/`);
    return res.data;
  }

  /**
   * PATCH /api/v1/marks/exam-types/{id}/
   * Updates assessment/examination category (Admin authorized).
   */
  static async updateExamType(
    id: string,
    payload: Partial<Pick<ExamTypeItem, 'name' | 'weightage' | 'is_active'>>
  ): Promise<ExamTypeItem> {
    const res = await ApiClient.patch<ExamTypeItem>(`/api/v1/marks/exam-types/${id}/`, payload);
    return res.data;
  }
}
