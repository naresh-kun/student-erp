/**
 * Student ERP — Faculty Domain Types
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements strongly typed data models for:
 * - Faculty Profile & Academic Mentorship
 * - Assigned Classes & Enrolled Students
 * - Instructional Timetable Routine
 * - Session Attendance Roll Call (4 canonical statuses)
 * - Faculty-Approved LEAVE Workflow
 * - Examination Marks Entry & CBSE 8-Tier Grade Derivation
 *
 * CRITICAL GOVERNANCE:
 * - No GPA, CGPA, credits, or grade points.
 * - No faculty performance scores, ratings, appraisal reviews, or teacher rankings.
 */

import type { AttendanceStatus } from '@/types';
import type { LetterGrade } from '@/utils/grading';

export interface ClassTeacherAssignment {
  class_id: string;
  section_id: string;
  class_name: string;
  stream?: string;
  room: string;
}

export interface FacultyProfile {
  id: string; // e.g. 'fac_001'
  user_id: string; // e.g. 'usr_003'
  employee_code: string; // e.g. 'FAC-MATH-012'
  first_name: string;
  last_name: string;
  full_name: string;
  department: string;
  designation: string;
  qualification: string;
  specialization: string;
  office_room: string;
  email: string;
  phone: string;
  joining_date: string;
  class_teacher_of: ClassTeacherAssignment | null;
  weekly_periods: number; // e.g. 24
  assigned_classes_count: number;
  assigned_students_count: number;
  status: 'Active' | 'On Leave';
}

export interface FacultyAssignedClass {
  id: string; // e.g. 'cls_001_sec_002'
  class_id: string; // e.g. 'cls_001'
  section_id: string; // e.g. 'sec_002'
  grade_level: number; // 10, 11, 12
  class_name: string; // 'Grade 11'
  section_name: string; // 'Section A2'
  stream?: string; // 'Computer Science A'
  display_name: string; // 'Grade 11 — Computer Science A (Sec A2)'
  subject: string; // 'Mathematics'
  subject_code: string; // 'MATH-041'
  room: string; // 'Room 202'
  student_count: number;
  is_class_teacher: boolean;
  periods_per_week: number;
  avg_score?: string; // e.g. '87.0%'
}

export interface FacultyAssignedStudent {
  id: string;
  student_id: string; // Permanent, immutable identifier (e.g. 'STU202600001')
  admission_number: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  class_name: string;
  section_name: string;
  stream?: string;
  attendance_rate: number;
  academic_percentage: number;
  grade: LetterGrade;
  parent_name: string;
  parent_contact: string;
  status: 'Active' | 'Inactive';
}

export interface FacultyTodayPeriod {
  period_number: number;
  period_time: string; // e.g. '08:30 - 09:15'
  class_name: string; // e.g. 'Grade 11-A2 (Comp Sci)'
  stream?: string;
  subject: string; // e.g. 'Mathematics (Calculus)'
  room: string; // e.g. 'Room XI-A2'
  student_count: number;
  attendance_done: boolean;
  attendance_session_id?: string;
}

export type FacultySessionType = 
  | 'Class Lecture' 
  | 'Faculty Planning' 
  | 'Remedial Support' 
  | 'Practical / Lab';

export interface FacultyTimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period_number: number;
  time: string;
  subject: string;
  class_name: string;
  section_name: string;
  stream?: string;
  room: string;
  session_type: FacultySessionType;
  class_id?: string;
  section_id?: string;
}

export interface AttendanceRollCallItem {
  id: string;
  student_id: string; // Immutable permanent ID
  roll_number: string;
  name: string;
  historical_rate: number;
  status: AttendanceStatus; // Exactly 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE'
  leave_reason?: string;
  approved_by?: string;
  note?: string;
}

export interface AttendanceSessionContext {
  academic_year: string; // '2026–27'
  date: string; // YYYY-MM-DD
  class_id: string;
  section_id: string;
  class_display: string;
  subject: string;
  period: string;
  session_state: 'Not Marked' | 'In Progress' | 'Marked';
  marked_at?: string;
  marked_by?: string;
}

export interface FacultyPendingLeaveNotice {
  id: string;
  source: 'PARENT' | 'STUDENT';
  student_id: string;
  student_name: string;
  class_name: string;
  roll_number?: string;
  date: string;
  end_date?: string;
  category: string; // Medical, Family Function, etc.
  explanation: string;
  submitted_at: string;
  status: 'PENDING_FACULTY_REVIEW' | 'LEAVE' | 'REJECTED';
  approved_by_faculty_id?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface FacultyMarkEntryItem {
  student_id: string;
  roll_number: string;
  student_name: string;
  score: number | 'AB' | '';
  derived_percentage: number | null;
  derived_grade: LetterGrade | 'AB' | '—';
  feedback: string;
  error?: string;
}

export interface FacultyExamSummary {
  exam_name: string;
  subject: string;
  class_name: string;
  total_students: number;
  assessed_count: number;
  pending_count: number;
  class_average: number;
  highest_score: number;
  pass_rate: number;
  grade_distribution: Array<{ grade: LetterGrade; count: number; percentage: number }>;
}
