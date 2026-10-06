/**
 * Student ERP — Domain Types & Data Transfer Objects (DTOs)
 * Master Type Definitions across all 5 System Roles
 */

export type UserRole = 'Student' | 'Parent' | 'Faculty' | 'Admin' | 'Principal';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string; // Permanent, unique, system-generated business identifier (e.g. STU202600001)
  user_id: string;
  roll_number: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: string;
  section_id: string;
  stream?: string; // For Grades 11-12: 'Computer Science A', 'Bio-Maths B', 'Commerce C', 'Pure Science D'
  parent_id?: string;
  academic_year: string;
  enrollment_date: string;
  status: 'Active' | 'Suspended' | 'Alumni';
  blood_group?: string;
  emergency_contact: string;
  address: string;
}

export interface Parent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  relation: string;
  occupation: string;
  phone: string;
  email: string;
  address: string;
  children_student_ids: string[];
}

export interface Faculty {
  id: string;
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  designation: string;
  qualification: string;
  specialization: string;
  office_room: string;
  joining_date: string;
  assigned_subject_ids: string[];
  class_teacher_of?: string | null;
}

export interface Section {
  id: string;
  name: string;
  room: string;
  capacity: number;
  enrolled_count: number;
}

export interface ClassEntity {
  id: string;
  name: string;
  code: string;
  academic_year: string;
  grade_level: number; // e.g. 10, 11, 12
  stream?: string; // Only applicable to Grades 11 & 12
  class_teacher_id?: string;
  sections: Section[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  weekly_periods: number; // School weekly periods allocation
  description: string;
  faculty_ids: string[];
}

/**
 * Master Plan Amendment 2 — Four Canonical Attendance Statuses:
 * - PRESENT: In-person presence during lecture/session (counts as present)
 * - ABSENT: Unapproved absence (counts as absence)
 * - ON_DUTY: Authorized institutional representation (counts as present)
 * - LEAVE: Faculty/school-approved absence (counts as absence)
 */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  faculty_id: string;
  date: string;
  session_period: number;
  status: AttendanceStatus;
  remarks?: string;
  approved_by_faculty_id?: string;
}

export interface MarkRecord {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type: string; // 'Cycle Test 1' | 'Unit Test 1' | 'Quarterly Examination' | 'Half-Yearly Examination' | 'Annual Examination'
  academic_year: string;
  term: string;
  marks_obtained: number | 'AB'; // 0-100 or 'AB' for absent
  max_marks: number; // Standard 100
  percentage: number;
  grade: string; // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E'
  remarks?: string;
  evaluated_by: string;
  evaluated_at: string;
}

export interface TimetableSlot {
  id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  faculty_id: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  room_number: string;
}

export type TimetableEntry = TimetableSlot;

export interface CalendarEvent {
  id: string;
  title: string;
  category: 'Exam' | 'Academic' | 'Holiday' | 'Meeting';
  description: string;
  start_date: string;
  end_date: string;
  target_roles: UserRole[];
  location: string;
  is_holiday: boolean;
}

// ==========================================
// TASK 2.7 OPERATIONAL REVISION INTERFACES
// ==========================================

export interface StudentAllocationItem {
  id: string;
  student_id: string; // Permanent, immutable identifier (e.g. STU202600001)
  student_name: string;
  grade_level: number;
  grade_name: string;
  grade?: string; // Alias for grade_name
  stream?: string; // Applicable to Grades 11-12
  section_id: string;
  section_name: string;
  section?: string; // Alias for section_name
  roll_number: string;
  academic_year: string;
  allocation_status: 'Allocated' | 'Pending' | 'Deallocated' | 'Unassigned';
}

export interface ClassTeacherAllocationItem {
  id: string;
  faculty_id: string;
  faculty_name: string;
  employee_code: string;
  designation: string;
  subjects: string[]; // Subject(s) Handling
  assigned_subjects?: string[]; // Alias for subjects
  academic_year: string;
  grade_level: number;
  grade_name: string;
  grade?: string; // Alias for grade_name
  stream?: string;
  section_id: string;
  section_name: string;
  section?: string; // Alias for section_name
  status?: string; // Alias for assignment_status
  is_assigned: boolean;
  assignment_status: 'Assigned' | 'Unassigned';
}

export interface StudentAbsenteeItem {
  id: string;
  student_id: string;
  student_name: string;
  grade_name: string;
  grade?: string; // Alias for grade_name
  stream?: string;
  section_name: string;
  section?: string; // Alias for section_name
  subject_name: string;
  subject?: string; // Alias for subject_name
  date: string;
  period: string | number;
  status: 'ABSENT'; // Strictly ONLY ABSENT
  faculty_name: string;
  faculty_id: string;
  class_id: string;
  section_id: string;
}

export interface AttendanceNotEnteredItem {
  id: string;
  date: string;
  grade_name: string;
  grade?: string; // Alias for grade_name
  stream?: string;
  section_name: string;
  section?: string; // Alias for section_name
  subject_name: string;
  subject?: string; // Alias for subject_name
  period: string | number;
  faculty_name: string;
  faculty_id: string;
  class_id: string;
  section_id: string;
  session_status: 'NOT ENTERED';
}

export interface GlobalSearchResultItem {
  type: 'STUDENT' | 'FACULTY';
  id: string;
  identifier: string; // Student ID or Employee Code
  title: string;
  subtitle: string;
  departmentOrClass: string;
  subjects?: string[];
  allocationRecord?: StudentAllocationItem | ClassTeacherAllocationItem;
}

// ============================================================================
// Homework Management (MOD_001)
// ============================================================================
export type HomeworkStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface HomeworkFacultyInfo {
  id: string;
  employee_code: string;
  name: string;
  email: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description?: string;
  status: HomeworkStatus;
  assigned_date: string;
  due_date: string | null;
  academic_year_id?: string;
  academic_year_name?: string;
  school_class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  faculty_id: string;
  faculty_name: string;
  faculty?: HomeworkFacultyInfo;
  created_at: string;
  updated_at: string;
}

export interface HomeworkCreatePayload {
  title: string;
  description?: string;
  section_id: string;
  subject_id: string;
  assigned_date?: string;
  due_date?: string | null;
  status?: HomeworkStatus;
}

export interface HomeworkUpdatePayload {
  title?: string;
  description?: string;
  due_date?: string | null;
  status?: HomeworkStatus;
}

export interface HomeworkFilters {
  section_id?: string;
  class_id?: string;
  subject_id?: string;
  status?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  page?: number;
}
