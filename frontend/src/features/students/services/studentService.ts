/**
 * Student ERP — Student Domain Service Layer
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Provides domain-specific async APIs interacting with MockDataService.
 */

import { MockDataService } from '@/services/mockService';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import type { 
  StudentProfile, 
  StudentLeaveRequest, 
  StudentAttendanceStatSummary,
  StudentSubjectAttendance 
} from '../types';
import type { LeaveRequestFormData } from '../schemas/leaveRequestSchema';
import type { StudentProfileContactFormData } from '../schemas/studentProfileSchema';
import { calculateAttendancePercentage } from '@/utils';

const STORAGE_LEAVE_KEY = 'student_erp_leave_requests';
const STORAGE_PROFILE_KEY = 'student_erp_profile_overrides';

class MemoryStorage {
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

const memoryStorage = new MemoryStorage();

function getStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return memoryStorage;
}

// Seed leave requests representing authentic Indian school scenarios
const DEFAULT_LEAVE_REQUESTS: StudentLeaveRequest[] = [
  {
    id: 'lv_001',
    student_id: 'STU202600001',
    student_name: 'Arun Kumar',
    class_name: 'Grade 11 — Computer Science A (Sec A2)',
    roll_number: '11-A2-04',
    leave_type: 'Medical',
    start_date: '2026-09-22',
    end_date: '2026-09-22',
    reason: 'Severe viral fever and medical consultation at Apollo Clinic.',
    status: 'APPROVED',
    applied_at: '2026-09-21T18:30:00Z',
    reviewed_by: 'R. Suresh (Class Teacher)',
    review_note: 'Medical certificate reviewed and verified. Sanctioned.',
    reviewed_at: '2026-09-22T08:15:00Z',
  },
  {
    id: 'lv_002',
    student_id: 'STU202600001',
    student_name: 'Arun Kumar',
    class_name: 'Grade 11 — Computer Science A (Sec A2)',
    roll_number: '11-A2-04',
    leave_type: 'Family Function',
    start_date: '2026-09-24',
    end_date: '2026-09-24',
    reason: 'Family elder religious ceremony in Madurai hometown.',
    status: 'APPROVED',
    applied_at: '2026-09-23T14:00:00Z',
    reviewed_by: 'R. Suresh (Class Teacher)',
    review_note: 'Parental note confirmed via telephone. Sanctioned.',
    reviewed_at: '2026-09-23T16:45:00Z',
  },
];

export class StudentService {
  /**
   * Loads complete student domain profile with immutable academic details
   */
  static async getProfile(studentId = 'STU202600001'): Promise<StudentProfile> {
    const rawStudent = await MockDataService.getStudentById(studentId);
    
    // Check for any client-side contact updates
    let contactOverrides: Partial<StudentProfileContactFormData> = {};
    try {
      const stored = getStorage().getItem(`${STORAGE_PROFILE_KEY}_${studentId}`);
      if (stored) {
        contactOverrides = JSON.parse(stored);
      }
    } catch {
      // Fallback to defaults
    }

    const profile: StudentProfile = {
      // Immutable Academic Credentials
      student_id: rawStudent?.student_id || 'STU202600001',
      admission_number: rawStudent?.admission_number || 'ADM20240091',
      roll_number: rawStudent?.roll_number || '11-A2-04',
      first_name: rawStudent?.first_name || 'Arun',
      last_name: rawStudent?.last_name || 'Kumar',
      date_of_birth: rawStudent?.date_of_birth || '2009-05-14',
      gender: rawStudent?.gender || 'Male',
      blood_group: rawStudent?.blood_group || 'O+',
      nationality: 'Indian',
      first_language: 'English / Tamil',
      admission_date: rawStudent?.enrollment_date || '2024-06-10',
      class_name: 'Grade 11',
      section_name: 'Section A2',
      stream: rawStudent?.stream || 'Computer Science A',
      academic_year: rawStudent?.academic_year || SCHOOL_CONFIG.academicYear,
      status: (rawStudent?.status as any) || 'Active',

      // Contact Information (Editable with validation)
      email: 'arun.kumar@schoolerp.edu.in',
      phone: contactOverrides.phone || '+91-98400-11205',
      emergency_contact: contactOverrides.emergency_contact || rawStudent?.emergency_contact || '+91-98400-11207',
      address: contactOverrides.address || rawStudent?.address || 'No. 42, Temple View Avenue, K.K. Nagar, Madurai - 625001',

      // Guardian Information
      parent_name: 'S. Ramanathan',
      parent_relation: 'Father',
      parent_phone: '+91-98400-11207',
      parent_email: 'ramanathan@gmail.com',

      // Academic Mentor / Class Teacher
      class_teacher_name: 'R. Suresh',
      class_teacher_dept: 'Mathematics',
      class_teacher_room: 'Staff Room B, Ramanujan Block',
      class_teacher_email: 'suresh.r@schoolerp.edu.in',
    };

    return profile;
  }

  /**
   * Resets local storage in testing environments
   */
  static clearStorage(): void {
    getStorage().clear();
  }

  /**
   * Updates student contact information.
   * Core academic attributes (student_id, roll_number, admission_number, stream) are strictly excluded.
   */
  static async updateContactInfo(
    studentId: string,
    data: StudentProfileContactFormData
  ): Promise<StudentProfile> {
    try {
      getStorage().setItem(`${STORAGE_PROFILE_KEY}_${studentId}`, JSON.stringify(data));
    } catch {
      // Storage error fallback
    }
    return this.getProfile(studentId);
  }

  /**
   * Retrieves all leave applications for the student.
   * Merges persistent defaults with user-submitted requests from local storage.
   */
  static async getLeaveRequests(studentId = 'STU202600001'): Promise<StudentLeaveRequest[]> {
    let storedRequests: StudentLeaveRequest[] = [];
    try {
      const stored = getStorage().getItem(STORAGE_LEAVE_KEY);
      if (stored) {
        storedRequests = JSON.parse(stored);
      }
    } catch {
      storedRequests = [];
    }

    const allRequests = [...storedRequests, ...DEFAULT_LEAVE_REQUESTS];
    return allRequests.filter((r) => r.student_id === studentId);
  }

  /**
   * Submits a new student leave request.
   * BUSINESS RULE: Student submits -> request is placed strictly in PENDING state.
   * Student CANNOT self-approve. Class Teacher / Faculty reviews.
   */
  static async submitLeaveRequest(
    data: LeaveRequestFormData,
    student: StudentProfile
  ): Promise<StudentLeaveRequest> {
    const newRequest: StudentLeaveRequest = {
      id: `lv_${Date.now()}`,
      student_id: student.student_id,
      student_name: `${student.first_name} ${student.last_name}`.trim(),
      class_name: `${student.class_name} — ${student.stream || ''} (${student.section_name})`.trim(),
      roll_number: student.roll_number,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
      status: 'PENDING', // STRICT: Initial state is ALWAYS PENDING
      applied_at: new Date().toISOString(),
    };

    try {
      const stored = getStorage().getItem(STORAGE_LEAVE_KEY);
      const list: StudentLeaveRequest[] = stored ? JSON.parse(stored) : [];
      list.unshift(newRequest);
      getStorage().setItem(STORAGE_LEAVE_KEY, JSON.stringify(list));
    } catch {
      // Storage fallback
    }

    return newRequest;
  }

  /**
   * Calculates comprehensive attendance statistics using the canonical formula:
   * Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
   */
  static async getAttendanceSummary(_studentId = 'STU202600001'): Promise<StudentAttendanceStatSummary> {
    const presentCount = 78;
    const onDutyCount = 4;
    const leaveCount = 3;
    const absentCount = 2;
    const totalSessions = presentCount + onDutyCount + leaveCount + absentCount; // 87

    const overallPercentage = calculateAttendancePercentage({
      present: presentCount,
      onDuty: onDutyCount,
      leave: leaveCount,
      absent: absentCount,
    });

    return {
      overallPercentage,
      totalSessions,
      presentCount,
      onDutyCount,
      leaveCount,
      absentCount,
      clearedForExams: overallPercentage >= 85,
    };
  }

  /**
   * Retrieves subject-wise attendance breakdown
   */
  static async getSubjectAttendance(): Promise<StudentSubjectAttendance[]> {
    return MockDataService.getSubjectAttendance();
  }

  /**
   * Retrieves verified attendance session logs
   */
  static async getAttendanceLogs() {
    return MockDataService.getStudentAttendanceHistory();
  }

  /**
   * Retrieves examination marks and comparison data
   */
  static async getExamRecords() {
    return MockDataService.getStudentExamRecords();
  }

  static async getSubjectMarksComparison() {
    return MockDataService.getSubjectMarksComparison();
  }

  /**
   * Timetable and schedule
   */
  static async getWeeklyTimetable() {
    return MockDataService.getWeeklyTimetableGrid();
  }

  /**
   * Academic calendar events
   */
  static async getCalendarEvents() {
    return MockDataService.getAcademicCalendarEvents('Student');
  }
}
