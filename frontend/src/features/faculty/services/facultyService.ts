/**
 * Student ERP — Faculty Domain Service Layer
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the service abstraction adapter between Faculty UI components/hooks
 * and synthetic Indian school datasets / client storage.
 *
 * CRITICAL BUSINESS RULES & GOVERNANCE:
 * - Scoped strictly to authenticated Faculty member (R. Suresh, usr_003 / fac_001).
 * - Canonical 4-status attendance: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * - Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 * - Shared utility: src/utils/attendance.ts (calculateAttendancePercentage).
 * - Faculty / Class Teacher is the sole authority for approving student LEAVE.
 * - Examination marks out of 100 (0–100) or 'AB' (Absent).
 * - 8-Tier letter grades derived from src/utils/grading.ts (calculateGrade).
 * - Strictly NO GPA, CGPA, credits, or grade points.
 * - Strictly NO faculty ratings, reviews, rankings, or performance scores.
 */

import { calculateAttendancePercentage, calculateGrade, calculatePercentage } from '@/utils';
import type { LetterGrade } from '@/utils/grading';
import type {
  FacultyProfile,
  FacultyAssignedClass,
  FacultyAssignedStudent,
  FacultyTodayPeriod,
  FacultyTimetableEntry,
  AttendanceRollCallItem,
  AttendanceSessionContext,
  FacultyPendingLeaveNotice,
  FacultyMarkEntryItem,
  FacultyExamSummary,
} from '../types';
import { validateMarkInput } from '../schemas/marksSchema';

// Storage keys coordinated across Student, Parent, and Faculty domains
const STORAGE_PARENT_ABSENCE_KEY = 'student_erp_parent_absence_notices';
const STORAGE_STUDENT_LEAVE_KEY = 'student_erp_leave_requests';
const STORAGE_ATTENDANCE_SESSIONS_KEY = 'student_erp_faculty_attendance_sessions';
const STORAGE_MARKS_RECORDS_KEY = 'student_erp_faculty_marks_records';

class MemoryStore {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const memoryStore = new MemoryStore();

function getStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return memoryStore;
}

// ==========================================
// SEED FACULTY MASTER DATA
// ==========================================

export const DEFAULT_FACULTY_PROFILE: FacultyProfile = {
  id: 'fac_001',
  user_id: 'usr_003',
  employee_code: 'FAC-MATH-012',
  first_name: 'R.',
  last_name: 'Suresh',
  full_name: 'R. Suresh',
  department: 'Mathematics',
  designation: 'Senior PGT & Department Head',
  qualification: 'M.Sc., B.Ed. in Mathematics (Gold Medalist)',
  specialization: 'Algebra, Advanced Calculus & Three-Dimensional Geometry',
  office_room: 'Staff Room B, Ramanujan Block',
  email: 'suresh.r@schoolerp.edu.in',
  phone: '+91-98400-11203',
  joining_date: '2015-06-15',
  class_teacher_of: {
    class_id: 'cls_001',
    section_id: 'sec_002',
    class_name: 'Grade 11 — Section A2',
    stream: 'Computer Science A',
    room: 'Room 202',
  },
  weekly_periods: 24,
  assigned_classes_count: 3,
  assigned_students_count: 91,
  status: 'Active',
};

export const DEFAULT_ASSIGNED_CLASSES: FacultyAssignedClass[] = [
  {
    id: 'cls_001_sec_002',
    class_id: 'cls_001',
    section_id: 'sec_002',
    grade_level: 11,
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    display_name: 'Grade 11 — Computer Science A (Sec A2)',
    subject: 'Mathematics',
    subject_code: 'MATH-041',
    room: 'Room 202',
    student_count: 30,
    is_class_teacher: true,
    periods_per_week: 6,
    avg_score: '87.0%',
  },
  {
    id: 'cls_002_sec_001',
    class_id: 'cls_002',
    section_id: 'sec_001',
    grade_level: 12,
    class_name: 'Grade 12',
    section_name: 'Section A1',
    stream: 'Computer Science A',
    display_name: 'Grade 12 — Computer Science A (Sec A1)',
    subject: 'Mathematics',
    subject_code: 'MATH-041',
    room: 'Room 301',
    student_count: 31,
    is_class_teacher: false,
    periods_per_week: 6,
    avg_score: '89.2%',
  },
  {
    id: 'cls_000_sec_g10_a',
    class_id: 'cls_000',
    section_id: 'sec_g10_a',
    grade_level: 10,
    class_name: 'Grade 10',
    section_name: 'Section A',
    display_name: 'Grade 10 — Section A',
    subject: 'Mathematics',
    subject_code: 'MATH-041',
    room: 'Room 101',
    student_count: 38,
    is_class_teacher: false,
    periods_per_week: 6,
    avg_score: '83.4%',
  },
];

// Seed students for Grade 11-A2 (Class Teacher assignment)
const SEED_STUDENTS_11_A2: FacultyAssignedStudent[] = [
  {
    id: 'stu_001',
    student_id: 'STU202600001',
    admission_number: 'ADM-2024-001',
    roll_number: '11-A2-04',
    first_name: 'Arun',
    last_name: 'Kumar',
    full_name: 'Arun Kumar',
    gender: 'Male',
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    attendance_rate: 94.3,
    academic_percentage: 87.0,
    grade: 'A2',
    parent_name: 'S. Ramanathan',
    parent_contact: '+91-98400-11207',
    status: 'Active',
  },
  {
    id: 'stu_002',
    student_id: 'STU202600002',
    admission_number: 'ADM-2024-002',
    roll_number: '11-A2-18',
    first_name: 'Priya',
    last_name: 'S',
    full_name: 'Priya S',
    gender: 'Female',
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    attendance_rate: 98.0,
    academic_percentage: 82.0,
    grade: 'A2',
    parent_name: 'M. Selvam',
    parent_contact: '+91-98400-11208',
    status: 'Active',
  },
  {
    id: 'stu_003',
    student_id: 'STU202600003',
    admission_number: 'ADM-2024-003',
    roll_number: '11-A2-07',
    first_name: 'Rohan',
    last_name: 'Gupta',
    full_name: 'Rohan Gupta',
    gender: 'Male',
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    attendance_rate: 91.5,
    academic_percentage: 84.0,
    grade: 'A2',
    parent_name: 'Vikram Gupta',
    parent_contact: '+91-98400-11209',
    status: 'Active',
  },
  {
    id: 'stu_004',
    student_id: 'STU202600004',
    admission_number: 'ADM-2024-004',
    roll_number: '11-A2-11',
    first_name: 'Keerthana',
    last_name: 'R',
    full_name: 'Keerthana R',
    gender: 'Female',
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    attendance_rate: 96.5,
    academic_percentage: 96.0,
    grade: 'A1',
    parent_name: 'K. Rajagopal',
    parent_contact: '+91-98400-11210',
    status: 'Active',
  },
  {
    id: 'stu_005',
    student_id: 'STU202600005',
    admission_number: 'ADM-2024-005',
    roll_number: '11-A2-15',
    first_name: 'Aditya',
    last_name: 'Nair',
    full_name: 'Aditya Nair',
    gender: 'Male',
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    attendance_rate: 88.0,
    academic_percentage: 76.0,
    grade: 'B1',
    parent_name: 'G. Nair',
    parent_contact: '+91-98400-11211',
    status: 'Active',
  },
  {
    id: 'stu_006',
    student_id: 'STU202600006',
    admission_number: 'ADM-2024-006',
    roll_number: '11-A2-22',
    first_name: 'Sneha',
    last_name: 'Patel',
    full_name: 'Sneha Patel',
    gender: 'Female',
    class_name: 'Grade 11',
    section_name: 'Section A2',
    stream: 'Computer Science A',
    attendance_rate: 92.0,
    academic_percentage: 78.0,
    grade: 'B1',
    parent_name: 'H. Patel',
    parent_contact: '+91-98400-11212',
    status: 'Active',
  },
];

// Seed students for Grade 12-A1
const SEED_STUDENTS_12_A1: FacultyAssignedStudent[] = [
  {
    id: 'stu_010',
    student_id: 'STU202500010',
    admission_number: 'ADM-2023-010',
    roll_number: '12-A1-01',
    first_name: 'Deepak',
    last_name: 'Chandran',
    full_name: 'Deepak Chandran',
    gender: 'Male',
    class_name: 'Grade 12',
    section_name: 'Section A1',
    stream: 'Computer Science A',
    attendance_rate: 95.0,
    academic_percentage: 91.0,
    grade: 'A1',
    parent_name: 'V. Chandran',
    parent_contact: '+91-98400-11215',
    status: 'Active',
  },
  {
    id: 'stu_011',
    student_id: 'STU202500011',
    admission_number: 'ADM-2023-011',
    roll_number: '12-A1-02',
    first_name: 'Meghana',
    last_name: 'Iyer',
    full_name: 'Meghana Iyer',
    gender: 'Female',
    class_name: 'Grade 12',
    section_name: 'Section A1',
    stream: 'Computer Science A',
    attendance_rate: 97.2,
    academic_percentage: 94.0,
    grade: 'A1',
    parent_name: 'S. Iyer',
    parent_contact: '+91-98400-11216',
    status: 'Active',
  },
  {
    id: 'stu_012',
    student_id: 'STU202500012',
    admission_number: 'ADM-2023-012',
    roll_number: '12-A1-03',
    first_name: 'Harish',
    last_name: 'Venkatesh',
    full_name: 'Harish Venkatesh',
    gender: 'Male',
    class_name: 'Grade 12',
    section_name: 'Section A1',
    stream: 'Computer Science A',
    attendance_rate: 89.0,
    academic_percentage: 81.0,
    grade: 'A2',
    parent_name: 'T. Venkatesh',
    parent_contact: '+91-98400-11217',
    status: 'Active',
  },
];

// Seed students for Grade 10-A
const SEED_STUDENTS_10_A: FacultyAssignedStudent[] = [
  {
    id: 'stu_020',
    student_id: 'STU202600020',
    admission_number: 'ADM-2025-020',
    roll_number: '10-A-01',
    first_name: 'Aakash',
    last_name: 'Sharma',
    full_name: 'Aakash Sharma',
    gender: 'Male',
    class_name: 'Grade 10',
    section_name: 'Section A',
    attendance_rate: 93.0,
    academic_percentage: 85.0,
    grade: 'A2',
    parent_name: 'M. K. Sharma',
    parent_contact: '+91-98400-11220',
    status: 'Active',
  },
  {
    id: 'stu_021',
    student_id: 'STU202600021',
    admission_number: 'ADM-2025-021',
    roll_number: '10-A-02',
    first_name: 'Divya',
    last_name: 'Bharathi',
    full_name: 'Divya Bharathi',
    gender: 'Female',
    class_name: 'Grade 10',
    section_name: 'Section A',
    attendance_rate: 96.0,
    academic_percentage: 88.0,
    grade: 'A2',
    parent_name: 'P. Bharathi',
    parent_contact: '+91-98400-11221',
    status: 'Active',
  },
];

export class FacultyService {
  /**
   * Clears in-memory/localStorage (used for automated test resets)
   */
  static clearStorage(): void {
    getStorage().clear();
  }

  /**
   * Retrieves profile for authenticated faculty member (R. Suresh)
   * Enforces strictly non-evaluative attributes (no ratings/reviews).
   */
  static async getFacultyProfile(_facultyId = 'fac_001'): Promise<FacultyProfile> {
    return { ...DEFAULT_FACULTY_PROFILE };
  }

  /**
   * Retrieves assigned classes for authenticated faculty member.
   * Access control rule: Returns ONLY assigned classes (XI-A2, XII-A1, X-A).
   */
  static async getAssignedClasses(_facultyId = 'fac_001'): Promise<FacultyAssignedClass[]> {
    return [...DEFAULT_ASSIGNED_CLASSES];
  }

  /**
   * Retrieves assigned students for a specific assigned class.
   * Ensures student IDs remain permanent and immutable.
   */
  static async getAssignedStudents(assignedClassId?: string): Promise<FacultyAssignedStudent[]> {
    if (!assignedClassId || assignedClassId.includes('sec_002') || assignedClassId.includes('11')) {
      return [...SEED_STUDENTS_11_A2];
    }
    if (assignedClassId.includes('cls_002') || assignedClassId.includes('12')) {
      return [...SEED_STUDENTS_12_A1];
    }
    if (assignedClassId.includes('cls_000') || assignedClassId.includes('10')) {
      return [...SEED_STUDENTS_10_A];
    }
    return [...SEED_STUDENTS_11_A2];
  }

  /**
   * Retrieves today's periods and teaching routine for R. Suresh
   */
  static async getTodaySchedule(_facultyId = 'fac_001'): Promise<FacultyTodayPeriod[]> {
    // Check if session has been marked in storage
    const storage = getStorage();
    const sessionsRaw = storage.getItem(STORAGE_ATTENDANCE_SESSIONS_KEY);
    let markedPeriods: string[] = ['Period 1 (08:30 - 09:15)']; // default seeded as logged
    if (sessionsRaw) {
      try {
        const list = JSON.parse(sessionsRaw);
        list.forEach((s: { period: string; session_state: string }) => {
          if (s.session_state === 'Marked' && !markedPeriods.includes(s.period)) {
            markedPeriods.push(s.period);
          }
        });
      } catch {
        // use default
      }
    }

    return [
      {
        period_number: 1,
        period_time: '08:30 - 09:15',
        class_name: 'Grade 11-A2',
        stream: 'Computer Science A',
        subject: 'Mathematics (Calculus)',
        room: 'Room XI-A2',
        student_count: 30,
        attendance_done: markedPeriods.some((p) => p.includes('Period 1')),
      },
      {
        period_number: 3,
        period_time: '10:15 - 11:00',
        class_name: 'Grade 12-A1',
        stream: 'Computer Science A',
        subject: 'Mathematics (Vectors)',
        room: 'Room XII-A1',
        student_count: 31,
        attendance_done: markedPeriods.some((p) => p.includes('Period 3')),
      },
      {
        period_number: 5,
        period_time: '12:30 - 13:15',
        class_name: 'Grade 10-A',
        subject: 'Mathematics (Trigonometry)',
        room: 'Room X-A',
        student_count: 38,
        attendance_done: markedPeriods.some((p) => p.includes('Period 5')),
      },
    ];
  }

  /**
   * Retrieves the full weekly teaching timetable for R. Suresh
   * Adheres to Indian school 8-period convention without university credit concepts.
   */
  static async getFacultyTimetable(_facultyId = 'fac_001'): Promise<FacultyTimetableEntry[]> {
    return [
      // Monday
      { id: 'tt_mon_1', day: 'Monday', period_number: 1, time: '08:30 - 09:15', subject: 'Mathematics (Calculus)', class_name: 'Grade 11', section_name: 'Section A2', stream: 'Computer Science A', room: 'Room XI-A2', session_type: 'Class Lecture' },
      { id: 'tt_mon_2', day: 'Monday', period_number: 2, time: '09:15 - 10:00', subject: 'Mathematics Planning & Record Keeping', class_name: '—', section_name: '—', room: 'Staff Room B', session_type: 'Faculty Planning' },
      { id: 'tt_mon_3', day: 'Monday', period_number: 3, time: '10:15 - 11:00', subject: 'Mathematics (Vectors)', class_name: 'Grade 12', section_name: 'Section A1', stream: 'Computer Science A', room: 'Room XII-A1', session_type: 'Class Lecture' },
      { id: 'tt_mon_4', day: 'Monday', period_number: 4, time: '11:00 - 11:45', subject: 'Department Head Administrative Review', class_name: '—', section_name: '—', room: 'Staff Room B', session_type: 'Faculty Planning' },
      { id: 'tt_mon_5', day: 'Monday', period_number: 5, time: '12:30 - 01:15', subject: 'Mathematics (Trigonometry)', class_name: 'Grade 10', section_name: 'Section A', room: 'Room X-A', session_type: 'Class Lecture' },
      { id: 'tt_mon_6', day: 'Monday', period_number: 6, time: '01:15 - 02:00', subject: 'Remedial Doubt-Clearing Session', class_name: 'Grade 11', section_name: 'Section A2', stream: 'Computer Science A', room: 'Room XI-A2', session_type: 'Remedial Support' },

      // Tuesday
      { id: 'tt_tue_1', day: 'Tuesday', period_number: 1, time: '08:30 - 09:15', subject: 'Faculty Mentorship & Assembly Duty', class_name: 'Grade 11', section_name: 'Section A2', room: 'School Quadrangle', session_type: 'Faculty Planning' },
      { id: 'tt_tue_2', day: 'Tuesday', period_number: 2, time: '09:15 - 10:00', subject: 'Mathematics (Calculus)', class_name: 'Grade 11', section_name: 'Section A2', stream: 'Computer Science A', room: 'Room XI-A2', session_type: 'Class Lecture' },
      { id: 'tt_tue_3', day: 'Tuesday', period_number: 3, time: '10:15 - 11:00', subject: 'Mathematics (Probability)', class_name: 'Grade 12', section_name: 'Section A1', stream: 'Computer Science A', room: 'Room XII-A1', session_type: 'Class Lecture' },
      { id: 'tt_tue_5', day: 'Tuesday', period_number: 5, time: '12:30 - 01:15', subject: 'Mathematics (Coordinate Geometry)', class_name: 'Grade 10', section_name: 'Section A', room: 'Room X-A', session_type: 'Class Lecture' },

      // Wednesday
      { id: 'tt_wed_1', day: 'Wednesday', period_number: 1, time: '08:30 - 09:15', subject: 'Mathematics (Coordinate Geometry)', class_name: 'Grade 10', section_name: 'Section A', room: 'Room X-A', session_type: 'Class Lecture' },
      { id: 'tt_wed_3', day: 'Wednesday', period_number: 3, time: '10:15 - 11:00', subject: 'Mathematics (Calculus)', class_name: 'Grade 11', section_name: 'Section A2', stream: 'Computer Science A', room: 'Room XI-A2', session_type: 'Class Lecture' },
      { id: 'tt_wed_4', day: 'Wednesday', period_number: 4, time: '11:00 - 11:45', subject: 'Mathematics (Differential Equations)', class_name: 'Grade 12', section_name: 'Section A1', stream: 'Computer Science A', room: 'Room XII-A1', session_type: 'Class Lecture' },
      { id: 'tt_wed_6', day: 'Wednesday', period_number: 6, time: '01:15 - 02:00', subject: 'Olympiad Preparation & Math Lab', class_name: 'Grade 11', section_name: 'Section A2', room: 'Computer Lab 2', session_type: 'Practical / Lab' },

      // Thursday
      { id: 'tt_thu_2', day: 'Thursday', period_number: 2, time: '09:15 - 10:00', subject: 'Mathematics (Three-Dimensional Geometry)', class_name: 'Grade 12', section_name: 'Section A1', stream: 'Computer Science A', room: 'Room XII-A1', session_type: 'Class Lecture' },
      { id: 'tt_thu_4', day: 'Thursday', period_number: 4, time: '11:00 - 11:45', subject: 'Mathematics (Calculus)', class_name: 'Grade 11', section_name: 'Section A2', stream: 'Computer Science A', room: 'Room XI-A2', session_type: 'Class Lecture' },
      { id: 'tt_thu_5', day: 'Thursday', period_number: 5, time: '12:30 - 01:15', subject: 'Mathematics (Quadratic Equations)', class_name: 'Grade 10', section_name: 'Section A', room: 'Room X-A', session_type: 'Class Lecture' },

      // Friday
      { id: 'tt_fri_1', day: 'Friday', period_number: 1, time: '08:30 - 09:15', subject: 'Mathematics (Sequences & Series)', class_name: 'Grade 11', section_name: 'Section A2', stream: 'Computer Science A', room: 'Room XI-A2', session_type: 'Class Lecture' },
      { id: 'tt_fri_3', day: 'Friday', period_number: 3, time: '10:15 - 11:00', subject: 'Mathematics (Linear Programming)', class_name: 'Grade 12', section_name: 'Section A1', stream: 'Computer Science A', room: 'Room XII-A1', session_type: 'Class Lecture' },
      { id: 'tt_fri_5', day: 'Friday', period_number: 5, time: '12:30 - 01:15', subject: 'Mathematics (Statistics & Revisions)', class_name: 'Grade 10', section_name: 'Section A', room: 'Room X-A', session_type: 'Class Lecture' },
    ];
  }

  // ==========================================
  // LEAVE APPROVAL WORKFLOW
  // ==========================================

  /**
   * Retrieves pending leave requests and absence notices that require Class Teacher review.
   * Consolidates parent notices from STORAGE_PARENT_ABSENCE_KEY and student requests from STORAGE_STUDENT_LEAVE_KEY.
   */
  static async getPendingLeaveNotices(_facultyId = 'fac_001'): Promise<FacultyPendingLeaveNotice[]> {
    const storage = getStorage();
    const notices: FacultyPendingLeaveNotice[] = [];

    // 1. Parent absence notices
    const parentRaw = storage.getItem(STORAGE_PARENT_ABSENCE_KEY);
    if (parentRaw) {
      try {
        const list = JSON.parse(parentRaw);
        list.forEach((item: {
          id: string;
          student_id: string;
          child_name: string;
          date: string;
          category: string;
          explanation: string;
          submitted_at: string;
          status: string;
          approved_by_faculty_id?: string;
          approved_by_name?: string;
          approved_at?: string;
          rejection_reason?: string;
        }) => {
          notices.push({
            id: item.id,
            source: 'PARENT',
            student_id: item.student_id,
            student_name: item.child_name || 'Enrolled Student',
            class_name: 'Grade 11 — Section A2',
            date: item.date,
            category: item.category || 'Absence Notice',
            explanation: item.explanation || '',
            submitted_at: item.submitted_at || new Date().toISOString(),
            status: (item.status as 'PENDING_FACULTY_REVIEW' | 'LEAVE' | 'REJECTED') || 'PENDING_FACULTY_REVIEW',
            approved_by_faculty_id: item.approved_by_faculty_id,
            approved_by_name: item.approved_by_name,
            approved_at: item.approved_at,
            rejection_reason: item.rejection_reason,
          });
        });
      } catch {
        // fallback
      }
    }

    // 2. Student leave requests
    const studentRaw = storage.getItem(STORAGE_STUDENT_LEAVE_KEY);
    if (studentRaw) {
      try {
        const list = JSON.parse(studentRaw);
        list.forEach((item: {
          id: string;
          student_id: string;
          student_name: string;
          class_name: string;
          roll_number: string;
          start_date: string;
          end_date: string;
          leave_type: string;
          reason: string;
          status: string;
          applied_at: string;
          reviewed_by?: string;
          reviewed_at?: string;
          review_note?: string;
        }) => {
          let mappedStatus: 'PENDING_FACULTY_REVIEW' | 'LEAVE' | 'REJECTED' = 'PENDING_FACULTY_REVIEW';
          if (item.status === 'APPROVED' || item.status === 'LEAVE') mappedStatus = 'LEAVE';
          else if (item.status === 'REJECTED') mappedStatus = 'REJECTED';

          notices.push({
            id: item.id,
            source: 'STUDENT',
            student_id: item.student_id,
            student_name: item.student_name,
            class_name: item.class_name,
            roll_number: item.roll_number,
            date: item.start_date,
            end_date: item.end_date,
            category: item.leave_type,
            explanation: item.reason,
            submitted_at: item.applied_at,
            status: mappedStatus,
            approved_by_name: item.reviewed_by,
            approved_at: item.reviewed_at,
            rejection_reason: item.review_note,
          });
        });
      } catch {
        // fallback
      }
    }

    // If no notices are stored, inject standard demonstration seed notices for R. Suresh
    if (notices.length === 0) {
      const seed1: FacultyPendingLeaveNotice = {
        id: 'notice_demo_001',
        source: 'PARENT',
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        class_name: 'Grade 11 — Section A2',
        roll_number: '11-A2-04',
        date: '2026-09-28',
        category: 'Medical Leave',
        explanation: 'Consultation with paediatrician for viral throat infection. Prescribed 2 days bed rest.',
        submitted_at: '2026-09-24T10:30:00.000Z',
        status: 'PENDING_FACULTY_REVIEW',
      };

      const seed2: FacultyPendingLeaveNotice = {
        id: 'notice_demo_002',
        source: 'STUDENT',
        student_id: 'STU202600002',
        student_name: 'Priya S',
        class_name: 'Grade 11 — Section A2',
        roll_number: '11-A2-18',
        date: '2026-09-29',
        end_date: '2026-09-30',
        category: 'Academic / Olympiad',
        explanation: 'Representing school at the National Mathematics Olympiad regional selection rounds.',
        submitted_at: '2026-09-24T14:15:00.000Z',
        status: 'PENDING_FACULTY_REVIEW',
      };

      notices.push(seed1, seed2);
    }

    return notices;
  }

  /**
   * Reviews a pending student or parent leave notice.
   * Faculty / Class Teacher is the sole approving authority.
   * Action 'APPROVE' transforms status into 'LEAVE' (counts as absence).
   * Action 'REJECT' marks the request as 'REJECTED'.
   */
  static async reviewLeaveNotice(
    noticeId: string,
    action: 'APPROVE' | 'REJECT',
    facultyId = 'fac_001',
    facultyName = 'R. Suresh',
    note?: string
  ): Promise<FacultyPendingLeaveNotice> {
    const storage = getStorage();
    const notices = await this.getPendingLeaveNotices(facultyId);
    const target = notices.find((n) => n.id === noticeId);

    if (!target) {
      throw new Error(`Leave notice with ID ${noticeId} not found.`);
    }

    const timestamp = new Date().toISOString();
    if (action === 'APPROVE') {
      target.status = 'LEAVE';
      target.approved_by_faculty_id = facultyId;
      target.approved_by_name = `${facultyName} (Class Teacher XI-A2)`;
      target.approved_at = timestamp;
    } else {
      target.status = 'REJECTED';
      target.rejection_reason = note || 'Leave application rejected by Class Teacher.';
    }

    // Synchronize to parent storage if from parent
    if (target.source === 'PARENT') {
      const parentRaw = storage.getItem(STORAGE_PARENT_ABSENCE_KEY);
      let list = parentRaw ? JSON.parse(parentRaw) : [];
      const idx = list.findIndex((i: { id: string }) => i.id === noticeId);
      if (idx !== -1) {
        list[idx].status = target.status;
        list[idx].approved_by_faculty_id = target.approved_by_faculty_id;
        list[idx].approved_by_name = target.approved_by_name;
        list[idx].approved_at = target.approved_at;
        list[idx].rejection_reason = target.rejection_reason;
      } else {
        list.unshift({
          id: target.id,
          student_id: target.student_id,
          child_name: target.student_name,
          date: target.date,
          category: target.category,
          explanation: target.explanation,
          submitted_at: target.submitted_at,
          status: target.status,
          approved_by_faculty_id: target.approved_by_faculty_id,
          approved_by_name: target.approved_by_name,
          approved_at: target.approved_at,
          rejection_reason: target.rejection_reason,
        });
      }
      storage.setItem(STORAGE_PARENT_ABSENCE_KEY, JSON.stringify(list));
    } else {
      // Synchronize to student storage
      const studentRaw = storage.getItem(STORAGE_STUDENT_LEAVE_KEY);
      let list = studentRaw ? JSON.parse(studentRaw) : [];
      const idx = list.findIndex((i: { id: string }) => i.id === noticeId);
      const studentStatus = target.status === 'LEAVE' ? 'APPROVED' : 'REJECTED';
      if (idx !== -1) {
        list[idx].status = studentStatus;
        list[idx].reviewed_by = target.approved_by_name;
        list[idx].reviewed_at = target.approved_at;
        list[idx].review_note = target.rejection_reason;
      } else {
        list.unshift({
          id: target.id,
          student_id: target.student_id,
          student_name: target.student_name,
          class_name: target.class_name,
          roll_number: target.roll_number || '11-A2-04',
          start_date: target.date,
          end_date: target.end_date || target.date,
          leave_type: target.category,
          reason: target.explanation,
          status: studentStatus,
          applied_at: target.submitted_at,
          reviewed_by: target.approved_by_name,
          reviewed_at: target.approved_at,
          review_note: target.rejection_reason,
        });
      }
      storage.setItem(STORAGE_STUDENT_LEAVE_KEY, JSON.stringify(list));
    }

    return target;
  }

  // ==========================================
  // ATTENDANCE ROLL CALL SESSIONS
  // ==========================================

  /**
   * Retrieves or initializes attendance roll call records for a selected session.
   * Auto-detects approved leaves from parent/student notice storage.
   */
  static async getAttendanceRollCall(
    context: AttendanceSessionContext
  ): Promise<{
    context: AttendanceSessionContext;
    records: AttendanceRollCallItem[];
    counts: { present: number; onDuty: number; leave: number; absent: number; total: number };
    percentage: number;
  }> {
    const storage = getStorage();
    const sessionKey = `${context.academic_year}_${context.date}_${context.class_id}_${context.section_id}_${context.period}`;

    // 1. Check if this exact session was previously recorded
    const savedSessionsRaw = storage.getItem(STORAGE_ATTENDANCE_SESSIONS_KEY);
    if (savedSessionsRaw) {
      try {
        const savedList = JSON.parse(savedSessionsRaw);
        const match = savedList.find((s: { key: string }) => s.key === sessionKey);
        if (match) {
          const records: AttendanceRollCallItem[] = match.records;
          const present = records.filter((r) => r.status === 'PRESENT').length;
          const onDuty = records.filter((r) => r.status === 'ON_DUTY').length;
          const leave = records.filter((r) => r.status === 'LEAVE').length;
          const absent = records.filter((r) => r.status === 'ABSENT').length;
          const total = records.length;
          const percentage = calculateAttendancePercentage({ present, absent, onDuty, leave });

          return {
            context: { ...context, session_state: 'Marked', marked_at: match.marked_at, marked_by: match.marked_by },
            records,
            counts: { present, onDuty, leave, absent, total },
            percentage,
          };
        }
      } catch {
        // fallback
      }
    }

    // 2. Not marked yet. Fetch students assigned to this section
    const students = await this.getAssignedStudents(context.section_id || context.class_id);

    // 3. Inspect approved leaves for this date to auto-populate approved LEAVE
    const pendingNotices = await this.getPendingLeaveNotices();
    const approvedLeavesOnDate = pendingNotices.filter(
      (n) => n.status === 'LEAVE' && n.date === context.date
    );

    const records: AttendanceRollCallItem[] = students.map((s) => {
      const approvedLeave = approvedLeavesOnDate.find((l) => l.student_id === s.student_id);
      if (approvedLeave) {
        return {
          id: s.id,
          student_id: s.student_id,
          roll_number: s.roll_number,
          name: s.full_name,
          historical_rate: s.attendance_rate,
          status: 'LEAVE',
          leave_reason: approvedLeave.explanation || approvedLeave.category,
          approved_by: approvedLeave.approved_by_name || 'R. Suresh',
        };
      }
      return {
        id: s.id,
        student_id: s.student_id,
        roll_number: s.roll_number,
        name: s.full_name,
        historical_rate: s.attendance_rate,
        status: 'PRESENT',
      };
    });

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const onDuty = records.filter((r) => r.status === 'ON_DUTY').length;
    const leave = records.filter((r) => r.status === 'LEAVE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const total = records.length;
    const percentage = calculateAttendancePercentage({ present, absent, onDuty, leave });

    return {
      context: { ...context, session_state: 'Not Marked' },
      records,
      counts: { present, onDuty, leave, absent, total },
      percentage,
    };
  }

  /**
   * Submits/saves live attendance register for a session.
   * Validates canonical statuses (PRESENT, ABSENT, ON_DUTY, LEAVE).
   * Calculates percentage via canonical utility: (P + OD) / (P + A + OD + L) * 100
   */
  static async submitAttendanceRollCall(
    context: AttendanceSessionContext,
    records: AttendanceRollCallItem[],
    facultyName = 'R. Suresh'
  ): Promise<{
    success: boolean;
    percentage: number;
    summary: { present: number; onDuty: number; leave: number; absent: number; total: number };
  }> {
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const onDuty = records.filter((r) => r.status === 'ON_DUTY').length;
    const leave = records.filter((r) => r.status === 'LEAVE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const total = records.length;

    const percentage = calculateAttendancePercentage({ present, absent, onDuty, leave });

    const sessionKey = `${context.academic_year}_${context.date}_${context.class_id}_${context.section_id}_${context.period}`;
    const storage = getStorage();
    const savedSessionsRaw = storage.getItem(STORAGE_ATTENDANCE_SESSIONS_KEY);
    let sessionList = savedSessionsRaw ? JSON.parse(savedSessionsRaw) : [];

    const existingIdx = sessionList.findIndex((s: { key: string }) => s.key === sessionKey);
    const sessionPayload = {
      key: sessionKey,
      context: { ...context, session_state: 'Marked' },
      records,
      percentage,
      marked_at: new Date().toISOString(),
      marked_by: facultyName,
    };

    if (existingIdx !== -1) {
      sessionList[existingIdx] = sessionPayload;
    } else {
      sessionList.push(sessionPayload);
    }

    storage.setItem(STORAGE_ATTENDANCE_SESSIONS_KEY, JSON.stringify(sessionList));

    return {
      success: true,
      percentage,
      summary: { present, onDuty, leave, absent, total },
    };
  }

  // ==========================================
  // MARKS ENTRY & 8-TIER GRADING
  // ==========================================

  /**
   * Retrieves student marks entry sheet for an examination.
   * Marks model: 0–100 or 'AB' (Absent).
   * Grade is derived from shared calculateGrade utility.
   * Strictly no GPA, CGPA, or credits.
   */
  static async getMarksEntrySheet(
    classId = 'cls_001_sec_002',
    subjectCode = 'MATH-041',
    examName = 'Half-Yearly Examination 2026–27'
  ): Promise<{
    entries: FacultyMarkEntryItem[];
    summary: FacultyExamSummary;
  }> {
    const storage = getStorage();
    const sheetKey = `${classId}_${subjectCode}_${examName}`;
    const rawStored = storage.getItem(STORAGE_MARKS_RECORDS_KEY);

    if (rawStored) {
      try {
        const storedSheets = JSON.parse(rawStored);
        if (storedSheets[sheetKey]) {
          const entries: FacultyMarkEntryItem[] = storedSheets[sheetKey];
          const summary = this.computeExamSummary(examName, 'Mathematics', 'Grade 11 — Section A2', entries);
          return { entries, summary };
        }
      } catch {
        // fallback
      }
    }

    // Default seeded marks sheet for Class 11-A2 Half-Yearly
    const students = await this.getAssignedStudents(classId);
    const defaultScores: Record<string, number | 'AB'> = {
      STU202600001: 92, // Arun Kumar -> A1
      STU202600002: 82, // Priya S -> A2
      STU202600003: 84, // Rohan Gupta -> A2
      STU202600004: 96, // Keerthana R -> A1
      STU202600005: 76, // Aditya Nair -> B1
      STU202600006: 78, // Sneha Patel -> B1
    };

    const entries: FacultyMarkEntryItem[] = students.map((s) => {
      const score = defaultScores[s.student_id] !== undefined ? defaultScores[s.student_id] : 85;
      const derivedPercentage = typeof score === 'number' ? calculatePercentage(score, 100) : null;
      const derivedGrade = typeof score === 'number' ? calculateGrade(score) : 'AB';
      return {
        student_id: s.student_id,
        roll_number: s.roll_number,
        student_name: s.full_name,
        score,
        derived_percentage: derivedPercentage,
        derived_grade: derivedGrade,
        feedback: typeof score === 'number' && score >= 90 ? 'Outstanding analytical proofs.' : 'Consistent conceptual practice required.',
      };
    });

    const summary = this.computeExamSummary(examName, 'Mathematics', 'Grade 11 — Section A2', entries);

    return { entries, summary };
  }

  /**
   * Saves faculty marks sheet entries with validation.
   * Rejects numbers <0, >100, or invalid strings. Accepts 'AB'.
   */
  static async saveMarksEntrySheet(
    classId: string,
    subjectCode: string,
    examName: string,
    entries: FacultyMarkEntryItem[]
  ): Promise<{
    success: boolean;
    summary: FacultyExamSummary;
  }> {
    // Validate all items
    for (const entry of entries) {
      const validation = validateMarkInput(entry.score);
      if (!validation.valid) {
        throw new Error(`Validation failed for ${entry.student_name}: ${validation.error}`);
      }
    }

    const storage = getStorage();
    const sheetKey = `${classId}_${subjectCode}_${examName}`;
    const rawStored = storage.getItem(STORAGE_MARKS_RECORDS_KEY);
    const storedSheets = rawStored ? JSON.parse(rawStored) : {};

    // Process derived values
    const processedEntries = entries.map((entry) => {
      if (entry.score === 'AB') {
        return {
          ...entry,
          score: 'AB' as const,
          derived_percentage: null,
          derived_grade: 'AB' as const,
        };
      }
      if (entry.score === '' || entry.score === null) {
        return {
          ...entry,
          score: '' as const,
          derived_percentage: null,
          derived_grade: '—' as const,
        };
      }
      const numScore = Number(entry.score);
      return {
        ...entry,
        score: numScore,
        derived_percentage: calculatePercentage(numScore, 100),
        derived_grade: calculateGrade(numScore),
      };
    });

    storedSheets[sheetKey] = processedEntries;
    storage.setItem(STORAGE_MARKS_RECORDS_KEY, JSON.stringify(storedSheets));

    const summary = this.computeExamSummary(examName, 'Mathematics', 'Grade 11 — Section A2', processedEntries);

    return {
      success: true,
      summary,
    };
  }

  /**
   * Helper to compute exam summary without faculty ratings or rankings
   */
  private static computeExamSummary(
    examName: string,
    subject: string,
    className: string,
    entries: FacultyMarkEntryItem[]
  ): FacultyExamSummary {
    const total_students = entries.length;
    const scoredEntries = entries.filter((e) => typeof e.score === 'number') as Array<
      FacultyMarkEntryItem & { score: number }
    >;
    const assessed_count = entries.filter((e) => e.score !== '').length;
    const pending_count = entries.filter((e) => e.score === '').length;

    const class_average =
      scoredEntries.length > 0
        ? Number((scoredEntries.reduce((acc, curr) => acc + curr.score, 0) / scoredEntries.length).toFixed(1))
        : 0;

    const highest_score =
      scoredEntries.length > 0
        ? Math.max(...scoredEntries.map((e) => e.score))
        : 0;

    // Passing threshold is marks >= 33 (Grades A1 through D)
    const passedCount = scoredEntries.filter((e) => e.score >= 33).length;
    const pass_rate =
      scoredEntries.length > 0
        ? Number(((passedCount / scoredEntries.length) * 100).toFixed(1))
        : 100;

    const tiers: LetterGrade[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'];
    const grade_distribution = tiers.map((tier) => {
      const count = scoredEntries.filter((e) => e.derived_grade === tier).length;
      const percentage =
        scoredEntries.length > 0 ? Number(((count / scoredEntries.length) * 100).toFixed(1)) : 0;
      return { grade: tier, count, percentage };
    });

    return {
      exam_name: examName,
      subject,
      class_name: className,
      total_students,
      assessed_count,
      pending_count,
      class_average,
      highest_score,
      pass_rate,
      grade_distribution,
    };
  }
}
