/**
 * Student ERP — Parent Domain Types
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

export interface ParentProfile {
  id: string; // e.g. 'par_001'
  user_id: string; // e.g. 'usr_007'
  first_name: string; // 'S.'
  last_name: string; // 'Ramanathan'
  full_name: string; // 'S. Ramanathan'
  relation: string; // 'Father'
  occupation: string; // 'Senior Technical Director'
  phone: string; // '+91-98400-11207'
  email: string; // 'ramanathan@gmail.com'
  address: string; // 'No. 42, Temple View Avenue, Sector 12, RK Puram, New Delhi - 110022'
  children_student_ids: string[]; // ['STU202600001']
}

export interface ParentAttendanceSummary {
  overallPercentage: number;
  totalSessions: number;
  presentCount: number;
  onDutyCount: number;
  leaveCount: number; // Faculty-approved leave (counted as absence in denominator)
  absentCount: number; // Unapproved absence
  clearedForExams: boolean; // Clearance benchmark >= 85%
}

export interface ParentSubjectAttendance {
  subject: string;
  present: number;
  onDuty: number;
  leave: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface ParentAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  period: string;
  status: 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE';
  subject: string;
  faculty: string;
  note?: string;
  approved_by_faculty_id?: string;
}

export interface ParentAcademicSummary {
  assessmentName: string; // e.g. 'Half-Yearly Examination 2026'
  cumulativeMarks: number; // e.g. 435
  totalMaxMarks: number; // e.g. 500
  overallPercentage: number; // e.g. 87.00
  overallGrade: string; // e.g. 'A2'
  gradeDescription: string; // 'Very Good (81–90%)'
  sectionRank: string; // '4th'
  totalStudentsInSection: number; // 32
}

export interface ParentSubjectMarkRecord {
  subject: string;
  faculty: string;
  marksObtained: number | 'AB';
  maxMarks: number;
  percentage: number;
  grade: string;
  remarks: string;
  classAverage: number;
}

export interface LinkedChild {
  student_id: string; // Permanent business identifier used for parent login
  admission_number: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  class_name: string; // e.g. 'Grade 11'
  section_name: string; // e.g. 'Section A2'
  stream?: string; // 'Computer Science A' | 'Bio-Maths B' | 'Commerce C' | 'Pure Science D'
  academic_year: string; // '2026–27'
  status: 'Active' | 'Suspended' | 'Alumni';
  avatar_url?: string;

  // Class Teacher / Academic Mentor
  class_teacher_name: string;
  class_teacher_dept: string;
  class_teacher_phone: string;
  class_teacher_email: string;
  class_teacher_room: string;

  // Academic & Attendance Previews
  attendance_summary: ParentAttendanceSummary;
  academic_summary: ParentAcademicSummary;
}

export interface ParentAdvisory {
  id: string;
  type: 'attendance' | 'academic' | 'general';
  severity: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  date?: string;
  actionRequired?: boolean;
}

export interface ParentTimetablePeriod {
  period: number;
  time: string; // '08:30 - 09:15'
  subject: string;
  faculty: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
}

export interface ParentTimetableDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periods: ParentTimetablePeriod[];
}

export interface ParentCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'PTM' | 'Holiday' | 'Examination' | 'Academic' | 'General';
  desc: string;
}

export interface AbsenceNoticeSubmission {
  id: string;
  student_id: string;
  child_name: string;
  date: string;
  category: 'Medical / Illness' | 'Family Event / Function' | 'Religious Observance' | 'Educational Competition / Exam' | 'Other';
  explanation: string;
  submitted_at: string;
  status: 'PENDING_FACULTY_REVIEW';
  recipient_faculty: string;
}
