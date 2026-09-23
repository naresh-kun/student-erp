/**
 * Student ERP — Domain Types & Data Transfer Objects (DTOs)
 * Master Type Definitions across all 5 System Roles
 */

export type UserRole = 'Student' | 'Parent' | 'Faculty' | 'Admin' | 'Principal';

export interface User {
  id: string;
  username: string;
  email: string;
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
  user_id: string;
  roll_number: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: string;
  section_id: string;
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
  class_teacher_id?: string;
  sections: Section[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
  description: string;
  faculty_ids: string[];
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

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
}

export interface MarkRecord {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type: string;
  academic_year: string;
  term: string;
  marks_obtained: number;
  max_marks: number;
  grade: string;
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
