/**
 * Student ERP — Admin Domain Types
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * Strongly typed domain interfaces for school administration operations.
 * CRITICAL GOVERNANCE:
 * - Student ID is permanent, unique, and immutable.
 * - Grades 11–12 support 4 approved streams: Computer Science A, Bio-Maths B, Commerce C, Pure Science D.
 * - Grades below 11 have no stream.
 * - Attendance uses canonical 4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * - Academic scoring uses Marks /100, cumulative, percentage, and 8-tier letter grades (A1 to E).
 * - Strictly NO GPA, CGPA, credits, or grade points.
 * - Strictly NO faculty ratings, reviews, or performance appraisal scores.
 */

import type { LetterGrade } from '@/utils/grading';

export interface AdminDashboardKPIs {
  total_students: number;
  total_parents: number;
  total_faculty: number;
  total_classes: number;
  total_sections: number;
  academic_year: string;
  overall_attendance_rate: number;
  student_teacher_ratio: string;
  active_examinations: number;
  upcoming_events_count: number;
  pending_operational_actions: number;
}

export interface AdminStudentItem {
  id: string;
  student_id: string;
  admission_number: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  name: string;
  class_id: string;
  class_name: string;
  grade_level: number;
  stream?: string;
  section_id: string;
  section_name: string;
  academic_year: string;
  gender: string;
  date_of_birth: string;
  blood_group?: string;
  parent_id: string;
  parent_name: string;
  parent_phone: string;
  attendance_percentage: number;
  academic_percentage: number;
  letter_grade: LetterGrade;
  status: 'Active' | 'Inactive';
}

export interface AdminParentItem {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  relation: string;
  occupation: string;
  phone: string;
  email: string;
  address: string;
  children: {
    student_id: string;
    name: string;
    class_name: string;
    roll_number: string;
  }[];
  status: 'Active' | 'Inactive';
}

export interface AdminFacultyItem {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  qualification: string;
  office_room: string;
  assigned_subjects: string[];
  class_teacher_of: string | null;
  assigned_classes: string[];
  weekly_periods: number;
  status: 'Active' | 'On Leave';
}

export interface AdminClassHierarchyItem {
  id: string;
  name: string;
  code: string;
  grade_level: number;
  stream?: string;
  academic_year: string;
  class_teacher_name: string;
  sections: {
    id: string;
    name: string;
    room: string;
    capacity: number;
    enrolled_count: number;
  }[];
  total_enrolled: number;
  total_capacity: number;
}

export interface AdminSubjectCatalogItem {
  id: string;
  code: string;
  name: string;
  department: string;
  weekly_periods: number;
  applicable_grades: string;
  applicable_streams: string;
  assigned_faculty_names: string[];
  status: 'Active' | 'Inactive';
  description: string;
}

export interface AdminAttendanceOverviewItem {
  date: string;
  class_id: string;
  class_name: string;
  stream?: string;
  section_name: string;
  total_students: number;
  present_count: number;
  on_duty_count: number;
  leave_count: number;
  absent_count: number;
  attendance_percentage: number;
  verified_by: string;
  session_status: 'Completed' | 'Pending';
}

export interface AdminMarksOverviewItem {
  exam_type: string;
  academic_year: string;
  class_name: string;
  stream?: string;
  section_name: string;
  subject_name: string;
  total_students: number;
  evaluated_count: number;
  average_percentage: number;
  highest_marks: number;
  pass_percentage: number;
  grade_distribution: Record<LetterGrade, number>;
  status: 'Published' | 'In Progress';
}

export interface AdminTimetableSlotItem {
  id: string;
  class_name: string;
  section_name: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  faculty_name: string;
  room_number: string;
}

export interface AdminCalendarEventItem {
  id: string;
  title: string;
  category: 'Examination' | 'Academic' | 'Holiday' | 'PTM' | 'Sports' | 'Cultural';
  description: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  target_audience: string;
  academic_relevance: string;
  od_eligible: boolean;
  is_holiday: boolean;
}

// ==========================================
// CLASS / SECTION ALLOCATION TYPES
// ==========================================

export type AllocationMethod = 'MERIT' | 'RANDOM';

export interface AllocationSourceStudent {
  student_id: string;
  student_name: string;
  gender: string;
  current_grade: string;
  qualifying_marks: number;
  merit_rank: number;
  current_section: string;
  allocated_section?: string;
  status: 'Unassigned' | 'Allocated' | 'Waitlisted';
}

export interface AllocationTargetSection {
  section_id: string;
  section_name: string;
  room: string;
  capacity: number;
  current_enrolled: number;
  target_intake: number;
}

export interface AllocationPreviewRecord {
  student_id: string;
  student_name: string;
  gender: string;
  current_section: string;
  proposed_section: string;
  basis: 'Merit Score' | 'Random Seeded';
  score: number;
  merit_rank: number;
}

export interface AllocationHistoryRecord {
  id: string;
  date: string;
  academic_year: string;
  grade: string;
  stream?: string;
  allocation_method: AllocationMethod;
  student_count: number;
  published_by: string;
  status: 'Committed' | 'Archived';
  notes: string;
}
