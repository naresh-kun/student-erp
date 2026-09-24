/**
 * Student ERP — Student Domain Types
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

export interface StudentProfile {
  student_id: string; // Permanent, unique, immutable identifier (e.g. 'STU202600001')
  admission_number: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: string;
  blood_group?: string;
  nationality: string;
  first_language: string;
  admission_date: string;
  class_name: string; // e.g. 'Grade 11'
  section_name: string; // e.g. 'Section A2'
  stream?: string; // 'Computer Science A' | 'Bio-Maths B' | 'Commerce C' | 'Pure Science D'
  academic_year: string; // '2026–27'
  status: 'Active' | 'Suspended' | 'Alumni';
  
  // Contact Information
  email: string;
  phone: string;
  emergency_contact: string;
  address: string;

  // Guardian Information
  parent_name: string;
  parent_relation: string;
  parent_phone: string;
  parent_email: string;

  // Academic Mentor / Class Teacher
  class_teacher_name: string;
  class_teacher_dept: string;
  class_teacher_room: string;
  class_teacher_email: string;
}

export type StudentLeaveType = 
  | 'Medical' 
  | 'Family Function' 
  | 'Bereavement' 
  | 'Academic / Olympiad' 
  | 'Other';

export type StudentLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StudentLeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  roll_number: string;
  leave_type: StudentLeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason: string;
  status: StudentLeaveStatus;
  applied_at: string;
  reviewed_by?: string;
  review_note?: string;
  reviewed_at?: string;
}

export interface StudentAttendanceStatSummary {
  overallPercentage: number;
  totalSessions: number;
  presentCount: number;
  onDutyCount: number;
  leaveCount: number;
  absentCount: number;
  clearedForExams: boolean;
}

export interface StudentSubjectAttendance {
  subject: string;
  present: number;
  total: number;
  percentage: number;
}
