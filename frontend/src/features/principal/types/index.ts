/**
 * Student ERP — Principal Domain Types
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * Strongly typed domain interfaces for Executive Institutional Oversight.
 * CRITICAL GOVERNANCE:
 * - Read-only and oversight oriented (not unrestricted CRUD).
 * - Canonical 4-status attendance model (PRESENT, ABSENT, ON_DUTY, LEAVE).
 * - Academic scoring uses Marks /100, %, and CBSE 8-tier letter grades (A1 to E).
 * - STRICTLY NO GPA, CGPA, credits, or grade points.
 * - STRICTLY NO faculty ratings, reviews, rankings, appraisal scores, or AI evaluations.
 */

import type { AttendanceStatus } from '@/types';
import type { LetterGrade } from '@/utils/grading';

export interface PrincipalDashboardKPIs {
  total_students: number;
  total_faculty: number;
  total_classes: number;
  total_sections: number;
  school_attendance_rate: number;
  school_academic_average: number;
  academic_year: string;
  student_teacher_ratio: string;
  pending_reports_count: number;
  upcoming_events_count: number;
}

export interface PrincipalDashboardSummary {
  kpis: PrincipalDashboardKPIs;
  gradeDistribution: Record<LetterGrade, number>;
  attendanceTrend: { month: string; attendance: number }[];
  recentEvents: { title: string; category: string; date: string; location: string }[];
}

export interface GradeAcademicPerformance {
  grade: string;
  gradeLevel: number;
  academicAverage: number;
  passRate: number;
  highestScore: number;
  enrolledStudents: number;
  sectionsCount: number;
}

export interface StreamPerformanceItem {
  stream: string;
  g11Average: number;
  g12Average: number;
  enrolledStudents: number;
  topSubject: string;
}

export interface SubjectPerformanceItem {
  subjectName: string;
  code: string;
  department: string;
  schoolAverage: number;
  passRate: number;
  evaluatedStudents: number;
}

export interface PrincipalAttendanceTelemetry {
  overallPresenceRate: number;
  totalSessions: number;
  statusDistribution: {
    status: AttendanceStatus;
    label: string;
    count: number;
    percentage: number;
    color: string;
    countsAs: 'Presence' | 'Absence';
    description: string;
  }[];
  cohortMonthlyTrends: {
    month: string;
    gr9: number;
    gr10: number;
    gr11: number;
    gr12: number;
  }[];
}

export interface PrincipalFacultyItem {
  id: string;
  employee_code: string;
  name: string;
  department: string;
  designation: string;
  qualification: string;
  assigned_subjects: string[];
  class_teacher_of: string | null;
  assigned_classes: string[];
  weekly_periods: number;
  email: string;
  status: 'Active' | 'On Leave';
}

export type ReportApprovalState = 'Draft' | 'Review' | 'Approved';

export interface InstitutionalReportItem {
  id: string;
  title: string;
  category: 'Academic' | 'Attendance' | 'Faculty' | 'Event' | 'Governance';
  academic_year: string;
  generated_date: string;
  format: 'PDF' | 'XLSX' | 'CSV';
  file_size: string;
  description: string;
  status: ReportApprovalState;
  approved_by?: string;
  approved_at?: string;
  review_remarks?: string;
  summary_metrics?: Record<string, string | number>;
}
