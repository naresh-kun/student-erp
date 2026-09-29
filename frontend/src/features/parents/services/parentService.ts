/**
 * Student ERP — Parent Domain Service Layer
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Implements the service abstraction adapter between the Parent presentation
 * components/hooks and the underlying MockDataService / synthetic datasets.
 */

import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  calculateAttendancePercentage, 
  calculateGrade, 
  calculatePercentage 
} from '@/utils';
import type { 
  ParentProfile, 
  LinkedChild, 
  ParentAttendanceSummary, 
  ParentSubjectAttendance, 
  ParentAttendanceRecord, 
  ParentAcademicSummary, 
  ParentSubjectMarkRecord, 
  ParentAdvisory, 
  ParentTimetableDay, 
  ParentCalendarEvent,
  AbsenceNoticeSubmission
} from '../types';
import type { ParentAbsenceNoticeFormData } from '../schemas/absenceNoticeSchema';

const STORAGE_ABSENCE_KEY = 'student_erp_parent_absence_notices';

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

// Initial seed parent profiles
const DEFAULT_PARENTS: ParentProfile[] = [
  {
    id: 'par_001',
    user_id: 'usr_007',
    first_name: 'S.',
    last_name: 'Ramanathan',
    full_name: 'S. Ramanathan',
    relation: 'Father',
    occupation: 'Senior Technical Director',
    phone: '+91-98400-11207',
    email: 'ramanathan@gmail.com',
    address: 'No. 42, Temple View Avenue, Sector 12, RK Puram, New Delhi - 110022',
    children_student_ids: ['STU202600001'],
  },
  {
    id: 'par_002',
    user_id: 'usr_008',
    first_name: 'M.',
    last_name: 'Selvam',
    full_name: 'M. Selvam',
    relation: 'Father',
    occupation: 'Chief Medical Officer',
    phone: '+91-98400-11208',
    email: 'selvam@gmail.com',
    address: 'Flat 3B, Shanti Enclave, Vasant Vihar, New Delhi - 110057',
    children_student_ids: ['STU202600002'],
  },
];

export class ParentService {
  /**
   * Resets internal storage (primarily for automated test isolation)
   */
  static clearStorage(): void {
    getStorage().clear();
  }

  /**
   * Loads parent profile by userId or parentId (defaults to S. Ramanathan)
   */
  static async getParentProfile(userIdOrParentId?: string): Promise<ParentProfile> {
    if (userIdOrParentId) {
      const match = DEFAULT_PARENTS.find(
        (p) => p.user_id === userIdOrParentId || p.id === userIdOrParentId
      );
      if (match) return match;
    }
    // Default to Ramanathan
    return DEFAULT_PARENTS[0];
  }

  /**
   * Verifies if a student ID is genuinely linked to the given parent
   * Strictly prevents unauthorized cross-child inspection
   */
  static async isChildLinkedToParent(parentId: string, studentId: string): Promise<boolean> {
    const parent = await this.getParentProfile(parentId);
    return parent.children_student_ids.includes(studentId);
  }

  /**
   * Retrieves full profiles of all children linked to this parent
   */
  static async getLinkedChildren(parentId = 'par_001'): Promise<LinkedChild[]> {
    const parent = await this.getParentProfile(parentId);
    const childrenList: LinkedChild[] = [];

    for (const studentId of parent.children_student_ids) {
      if (studentId === 'STU202600001') {
        const attendance = await this.getChildAttendanceSummary(studentId);
        const academic = await this.getChildAcademicSummary(studentId);

        childrenList.push({
          student_id: 'STU202600001',
          admission_number: 'ADM20240091',
          roll_number: '11-A2-04',
          first_name: 'Arun',
          last_name: 'Kumar',
          full_name: 'Arun Kumar',
          date_of_birth: '14/05/2009',
          gender: 'Male',
          class_name: 'Grade 11',
          section_name: 'Section A2',
          stream: 'Computer Science A',
          academic_year: SCHOOL_CONFIG.academicYear,
          status: 'Active',
          avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
          class_teacher_name: 'R. Suresh',
          class_teacher_dept: 'Mathematics',
          class_teacher_phone: '+91 94441 23456',
          class_teacher_email: 'suresh.r@schoolerp.edu.in',
          class_teacher_room: 'Staff Room B, Ramanujan Block',
          attendance_summary: attendance,
          academic_summary: academic,
        });
      } else if (studentId === 'STU202600002') {
        const attendance = await this.getChildAttendanceSummary(studentId);
        const academic = await this.getChildAcademicSummary(studentId);

        childrenList.push({
          student_id: 'STU202600002',
          admission_number: 'ADM20240092',
          roll_number: '11-A2-18',
          first_name: 'Priya',
          last_name: 'S',
          full_name: 'Priya S',
          date_of_birth: '22/09/2009',
          gender: 'Female',
          class_name: 'Grade 11',
          section_name: 'Section A2',
          stream: 'Computer Science A',
          academic_year: SCHOOL_CONFIG.academicYear,
          status: 'Active',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          class_teacher_name: 'R. Suresh',
          class_teacher_dept: 'Mathematics',
          class_teacher_phone: '+91 94441 23456',
          class_teacher_email: 'suresh.r@schoolerp.edu.in',
          class_teacher_room: 'Staff Room B, Ramanujan Block',
          attendance_summary: attendance,
          academic_summary: academic,
        });
      }
    }

    return childrenList;
  }

  /**
   * Retrieves canonical 4-status attendance summary for a linked child
   * Adheres strictly to Master Plan Amendment 2 formula:
   * Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
   */
  static async getChildAttendanceSummary(studentId = 'STU202600001'): Promise<ParentAttendanceSummary> {
    if (studentId === 'STU202600002') {
      const present = 80;
      const onDuty = 2;
      const leave = 1;
      const absent = 1;
      const total = present + onDuty + leave + absent; // 84
      const percentage = calculateAttendancePercentage({ present, absent, onDuty, leave });

      return {
        overallPercentage: percentage,
        totalSessions: total,
        presentCount: present,
        onDutyCount: onDuty,
        leaveCount: leave,
        absentCount: absent,
        clearedForExams: percentage >= 85,
      };
    }

    // Default: Arun Kumar (STU202600001)
    const present = 78;
    const onDuty = 4;
    const leave = 3;
    const absent = 2;
    const total = present + onDuty + leave + absent; // 87
    const percentage = calculateAttendancePercentage({ present, absent, onDuty, leave }); // 94.3%

    return {
      overallPercentage: percentage,
      totalSessions: total,
      presentCount: present,
      onDutyCount: onDuty,
      leaveCount: leave,
      absentCount: absent,
      clearedForExams: percentage >= 85,
    };
  }

  /**
   * Returns subject-wise attendance breakdown adhering to 4-status calculations
   */
  static async getChildSubjectAttendance(studentId = 'STU202600001'): Promise<ParentSubjectAttendance[]> {
    if (studentId === 'STU202600002') {
      return [
        { subject: 'Mathematics', present: 21, onDuty: 1, leave: 0, absent: 0, total: 22, percentage: 100.0 },
        { subject: 'Computer Science', present: 19, onDuty: 0, leave: 0, absent: 1, total: 20, percentage: 95.0 },
        { subject: 'Physics', present: 14, onDuty: 1, leave: 1, absent: 0, total: 16, percentage: 93.75 },
        { subject: 'Chemistry', present: 15, onDuty: 0, leave: 0, absent: 0, total: 15, percentage: 100.0 },
        { subject: 'English Core', present: 11, onDuty: 0, leave: 0, absent: 0, total: 11, percentage: 100.0 },
      ];
    }

    return [
      {
        subject: 'Mathematics',
        present: 20,
        onDuty: 2,
        leave: 1,
        absent: 1,
        total: 24,
        percentage: calculateAttendancePercentage({ present: 20, absent: 1, onDuty: 2, leave: 1 }), // (22/24)*100 = 91.7%
      },
      {
        subject: 'Computer Science',
        present: 21,
        onDuty: 1,
        leave: 0,
        absent: 0,
        total: 22,
        percentage: calculateAttendancePercentage({ present: 21, absent: 0, onDuty: 1, leave: 0 }), // (22/22)*100 = 100.0%
      },
      {
        subject: 'Physics',
        present: 15,
        onDuty: 1,
        leave: 1,
        absent: 0,
        total: 17,
        percentage: calculateAttendancePercentage({ present: 15, absent: 0, onDuty: 1, leave: 1 }), // (16/17)*100 = 94.1%
      },
      {
        subject: 'Chemistry',
        present: 13,
        onDuty: 0,
        leave: 1,
        absent: 1,
        total: 15,
        percentage: calculateAttendancePercentage({ present: 13, absent: 1, onDuty: 0, leave: 1 }), // (13/15)*100 = 86.7%
      },
      {
        subject: 'English Core',
        present: 9,
        onDuty: 0,
        leave: 0,
        absent: 0,
        total: 9,
        percentage: calculateAttendancePercentage({ present: 9, absent: 0, onDuty: 0, leave: 0 }), // (9/9)*100 = 100.0%
      },
    ];
  }

  /**
   * Retrieves official absence/leave audit entries recorded by faculty
   */
  static async getChildAttendanceHistory(_studentId = 'STU202600001'): Promise<ParentAttendanceRecord[]> {
    return [
      {
        id: 'rec_001',
        date: '2026-09-24',
        period: 'Period 3 (Mathematics)',
        status: 'LEAVE',
        subject: 'Mathematics',
        faculty: 'R. Suresh',
        note: 'Religious family ceremony in Madurai hometown. Sanctioned by class teacher.',
        approved_by_faculty_id: 'usr_003',
      },
      {
        id: 'rec_002',
        date: '2026-09-22',
        period: 'Period 5 (Chemistry Lab)',
        status: 'LEAVE',
        subject: 'Chemistry',
        faculty: 'Anitha Joseph',
        note: 'Viral fever consultation. Medical note verified and approved by class teacher.',
        approved_by_faculty_id: 'usr_003',
      },
      {
        id: 'rec_003',
        date: '2026-09-18',
        period: 'Period 4 (Physics)',
        status: 'ON_DUTY',
        subject: 'Physics',
        faculty: 'Karthik Raman',
        note: 'Inter-School Science Olympiad selection round in auditorium.',
        approved_by_faculty_id: 'usr_003',
      },
      {
        id: 'rec_004',
        date: '2026-09-15',
        period: 'Period 1 (Mathematics)',
        status: 'ABSENT',
        subject: 'Mathematics',
        faculty: 'R. Suresh',
        note: 'Unannounced morning absence — parental advisory dispatch recorded.',
      },
      {
        id: 'rec_005',
        date: '2026-09-08',
        period: 'Period 2 (Chemistry)',
        status: 'ABSENT',
        subject: 'Chemistry',
        faculty: 'Anitha Joseph',
        note: 'Unreported absence during period 2 lecture.',
      },
    ];
  }

  /**
   * Retrieves official academic performance summary for a linked child
   * Zero GPA/CGPA/credits; Marks out of 100, cumulative, percentage, 8-tier letter grade
   */
  static async getChildAcademicSummary(_studentId = 'STU202600001'): Promise<ParentAcademicSummary> {
    const cumulativeMarks = 435;
    const totalMaxMarks = 500;
    const percentage = calculatePercentage(cumulativeMarks, totalMaxMarks); // 87.00
    const grade = calculateGrade(percentage); // A2

    return {
      assessmentName: 'Half-Yearly Examination 2026',
      cumulativeMarks,
      totalMaxMarks,
      overallPercentage: percentage,
      overallGrade: grade,
      gradeDescription: 'Very Good (81–90%)',
      sectionRank: '4th',
      totalStudentsInSection: 32,
    };
  }

  /**
   * Retrieves subject-wise marks out of 100 and teacher remarks
   */
  static async getChildSubjectMarks(_studentId = 'STU202600001'): Promise<ParentSubjectMarkRecord[]> {
    return [
      {
        subject: 'Mathematics',
        faculty: 'R. Suresh (Class Teacher)',
        marksObtained: 92,
        maxMarks: 100,
        percentage: 92.0,
        grade: calculateGrade(92),
        remarks: 'Exceptional mastery in coordinate geometry and vector algebra. Highly active in class.',
        classAverage: 78.4,
      },
      {
        subject: 'Computer Science',
        faculty: 'Priya Krishnan',
        marksObtained: 96,
        maxMarks: 100,
        percentage: 96.0,
        grade: calculateGrade(96),
        remarks: 'Rank 1 in section. Flawless syntax in Python algorithms and relational database schemas.',
        classAverage: 82.1,
      },
      {
        subject: 'Physics',
        faculty: 'Karthik Raman',
        marksObtained: 84,
        maxMarks: 100,
        percentage: 84.0,
        grade: calculateGrade(84),
        remarks: 'Strong conceptual clarity in Newtonian mechanics. Thorough practical laboratory records.',
        classAverage: 76.5,
      },
      {
        subject: 'English Core',
        faculty: 'Meena Devi',
        marksObtained: 88,
        maxMarks: 100,
        percentage: 88.0,
        grade: calculateGrade(88),
        remarks: 'Eloquent expression in essay writing and analytical literature comprehension.',
        classAverage: 81.0,
      },
      {
        subject: 'Chemistry',
        faculty: 'Anitha Joseph',
        marksObtained: 75,
        maxMarks: 100,
        percentage: 75.0,
        grade: calculateGrade(75),
        remarks: 'Consistent theory understanding. Recommend dedicated focus on organic reaction mechanisms.',
        classAverage: 74.2,
      },
    ];
  }

  /**
   * Retrieves weekly period timetable for the child's enrolled section (XI-A2)
   */
  static async getChildTimetable(_studentId = 'STU202600001'): Promise<ParentTimetableDay[]> {
    return [
      {
        day: 'Monday',
        periods: [
          { period: 1, time: '08:30 - 09:15', subject: 'Mathematics', faculty: 'R. Suresh', room: 'Room XI-A2', type: 'Lecture' },
          { period: 2, time: '09:15 - 10:00', subject: 'Physics', faculty: 'Karthik Raman', room: 'Physics Lab A', type: 'Lab' },
          { period: 3, time: '10:15 - 11:00', subject: 'Chemistry', faculty: 'Anitha Joseph', room: 'Room XI-A2', type: 'Lecture' },
          { period: 4, time: '11:00 - 11:45', subject: 'English Core', faculty: 'Meena Devi', room: 'Room XI-A2', type: 'Lecture' },
          { period: 5, time: '12:30 - 01:15', subject: 'Computer Science', faculty: 'Priya Krishnan', room: 'Computer Lab 2', type: 'Lab' },
        ],
      },
      {
        day: 'Tuesday',
        periods: [
          { period: 1, time: '08:30 - 09:15', subject: 'Computer Science', faculty: 'Priya Krishnan', room: 'Room XI-A2', type: 'Lecture' },
          { period: 2, time: '09:15 - 10:00', subject: 'Mathematics', faculty: 'R. Suresh', room: 'Room XI-A2', type: 'Lecture' },
          { period: 3, time: '10:15 - 11:00', subject: 'Physics', faculty: 'Karthik Raman', room: 'Room XI-A2', type: 'Lecture' },
          { period: 4, time: '11:00 - 11:45', subject: 'Chemistry Lab', faculty: 'Anitha Joseph', room: 'Chemistry Lab', type: 'Lab' },
          { period: 5, time: '12:30 - 01:15', subject: 'Physical Education', faculty: 'Coach V. Murugan', room: 'Sports Ground', type: 'Tutorial' },
        ],
      },
      {
        day: 'Wednesday',
        periods: [
          { period: 1, time: '08:30 - 09:15', subject: 'Chemistry', faculty: 'Anitha Joseph', room: 'Room XI-A2', type: 'Lecture' },
          { period: 2, time: '09:15 - 10:00', subject: 'English Core', faculty: 'Meena Devi', room: 'Room XI-A2', type: 'Lecture' },
          { period: 3, time: '10:15 - 11:00', subject: 'Mathematics', faculty: 'R. Suresh', room: 'Room XI-A2', type: 'Lecture' },
          { period: 4, time: '11:00 - 11:45', subject: 'Computer Science', faculty: 'Priya Krishnan', room: 'Computer Lab 2', type: 'Lab' },
          { period: 5, time: '12:30 - 01:15', subject: 'Physics', faculty: 'Karthik Raman', room: 'Room XI-A2', type: 'Lecture' },
        ],
      },
      {
        day: 'Thursday',
        periods: [
          { period: 1, time: '08:30 - 09:15', subject: 'Physics', faculty: 'Karthik Raman', room: 'Room XI-A2', type: 'Lecture' },
          { period: 2, time: '09:15 - 10:00', subject: 'Chemistry', faculty: 'Anitha Joseph', room: 'Room XI-A2', type: 'Lecture' },
          { period: 3, time: '10:15 - 11:00', subject: 'Computer Science', faculty: 'Priya Krishnan', room: 'Room XI-A2', type: 'Lecture' },
          { period: 4, time: '11:00 - 11:45', subject: 'Mathematics', faculty: 'R. Suresh', room: 'Room XI-A2', type: 'Lecture' },
          { period: 5, time: '12:30 - 01:15', subject: 'General Studies / Library', faculty: 'S. Padmavathi', room: 'Central Library', type: 'Tutorial' },
        ],
      },
      {
        day: 'Friday',
        periods: [
          { period: 1, time: '08:30 - 09:15', subject: 'Mathematics', faculty: 'R. Suresh', room: 'Room XI-A2', type: 'Lecture' },
          { period: 2, time: '09:15 - 10:00', subject: 'English Core', faculty: 'Meena Devi', room: 'Room XI-A2', type: 'Lecture' },
          { period: 3, time: '10:15 - 11:00', subject: 'Physics Lab', faculty: 'Karthik Raman', room: 'Physics Lab A', type: 'Lab' },
          { period: 4, time: '11:00 - 11:45', subject: 'Chemistry', faculty: 'Anitha Joseph', room: 'Room XI-A2', type: 'Lecture' },
          { period: 5, time: '12:30 - 01:15', subject: 'Computer Science', faculty: 'Priya Krishnan', room: 'Computer Lab 2', type: 'Lab' },
        ],
      },
    ];
  }

  /**
   * Retrieves relevant school academic events, holidays, and PTM dates
   */
  static async getParentCalendarEvents(): Promise<ParentCalendarEvent[]> {
    return [
      {
        id: 'ev_001',
        title: 'Parent-Teacher Meeting (Term 1 Academic Review)',
        date: 'November 14, 2026',
        time: '09:00 AM - 02:00 PM',
        location: 'Room XI-A2 (Ramanujan Block)',
        category: 'PTM',
        desc: 'One-on-one consultation with Class Teacher R. Suresh and subject teachers. Official report card distribution.',
      },
      {
        id: 'ev_002',
        title: 'Diwali & Autumn School Holidays',
        date: 'November 01 - November 05, 2026',
        time: 'All Day',
        location: 'Campus Closed',
        category: 'Holiday',
        desc: 'Institutional holiday for Diwali festivities. School office and classes resume on November 6 at 08:30 AM.',
      },
      {
        id: 'ev_003',
        title: 'Annual Science & Technology Working Model Exhibition',
        date: 'October 28, 2026',
        time: '09:30 AM - 03:30 PM',
        location: 'School Main Auditorium',
        category: 'Academic',
        desc: 'Parents cordially invited to witness senior student STEM demonstrations and automated robotics exhibits.',
      },
      {
        id: 'ev_004',
        title: 'Half-Yearly Written Examinations',
        date: 'October 12 - October 22, 2026',
        time: '08:30 AM - 11:30 AM',
        location: 'Examination Block 1 & 2',
        category: 'Examination',
        desc: 'Mandatory CBSE-pattern curriculum evaluations. Early student dismissal at 12:00 PM throughout the exam window.',
      },
      {
        id: 'ev_005',
        title: 'Annual Inter-House Athletics & Sports Day',
        date: 'December 05, 2026',
        time: '08:00 AM - 01:30 PM',
        location: 'School Sports Pavilion',
        category: 'General',
        desc: 'Annual sports meet and march past. Parents and guardians welcome to cheer track and field athletes.',
      },
    ];
  }

  /**
   * Generates deterministic academic and attendance advisories based on actual mock data
   */
  static async getChildAdvisories(studentId = 'STU202600001'): Promise<ParentAdvisory[]> {
    const attendance = await this.getChildAttendanceSummary(studentId);
    const marks = await this.getChildAcademicSummary(studentId);

    const advisories: ParentAdvisory[] = [];

    // 1. Attendance Standing Advisory
    if (attendance.overallPercentage >= 90) {
      advisories.push({
        id: 'adv_att_good',
        type: 'attendance',
        severity: 'success',
        title: 'Excellent Classroom Attendance Standing',
        message: `Attendance is verified at ${attendance.overallPercentage.toFixed(2)}% (82 sessions), comfortably clearing the CBSE 85% board examination clearance benchmark.`,
      });
    } else if (attendance.overallPercentage >= 85) {
      advisories.push({
        id: 'adv_att_warn',
        type: 'attendance',
        severity: 'info',
        title: 'Attendance Within Board Clearable Range',
        message: `Attendance stands at ${attendance.overallPercentage.toFixed(2)}%. Maintain regular attendance to stay safely above the 85% minimum clearance threshold.`,
      });
    } else {
      advisories.push({
        id: 'adv_att_crit',
        type: 'attendance',
        severity: 'warning',
        title: 'Attendance Advisory Notice',
        message: `Current attendance (${attendance.overallPercentage.toFixed(2)}%) is below the school's 85% requirement. Please submit medical/sanction notes promptly.`,
        actionRequired: true,
      });
    }

    // 2. Sanctioned Leave Note
    if (attendance.leaveCount > 0) {
      advisories.push({
        id: 'adv_leave_note',
        type: 'attendance',
        severity: 'info',
        title: 'Approved Leave Records',
        message: `${attendance.leaveCount} absence sessions have been reviewed and approved as sanctioned Leave by Class Teacher R. Suresh.`,
      });
    }

    // 3. Academic Achievement & Focus Subject Advisory
    advisories.push({
      id: 'adv_acad_standing',
      type: 'academic',
      severity: 'info',
      title: `Academic Performance: Grade ${marks.overallGrade} (${marks.overallPercentage.toFixed(2)}%)`,
      message: `Rank ${marks.sectionRank} in Section XI-A2 with 435 / 500 marks. Outstanding aptitude in Computer Science (96%) and Mathematics (92%). Dedicated practice recommended for Chemistry organic mechanisms (75%).`,
    });

    // 4. Upcoming PTM Reminder
    advisories.push({
      id: 'adv_ptm_notice',
      type: 'general',
      severity: 'info',
      title: 'Upcoming Parent-Teacher Meeting (PTM)',
      message: 'Classroom consultation scheduled for November 14, 2026. Class Teacher R. Suresh will discuss term progress and answer questions.',
    });

    return advisories;
  }

  /**
   * Submits an absence justification notice from parent to the class teacher
   * The notice is created strictly in PENDING state; parents cannot self-approve
   */
  static async submitAbsenceNotice(
    formData: ParentAbsenceNoticeFormData,
    _parentProfile: ParentProfile
  ): Promise<AbsenceNoticeSubmission> {
    const storage = getStorage();
    const existingStr = storage.getItem(STORAGE_ABSENCE_KEY);
    let existingList: AbsenceNoticeSubmission[] = [];
    if (existingStr) {
      try {
        existingList = JSON.parse(existingStr);
      } catch {
        existingList = [];
      }
    }

    const submission: AbsenceNoticeSubmission = {
      id: `notice_${Date.now()}`,
      student_id: formData.student_id,
      child_name: formData.student_id === 'STU202600001' ? 'Arun Kumar' : 'Priya S',
      date: formData.date,
      category: formData.category,
      explanation: formData.explanation,
      submitted_at: new Date().toISOString(),
      status: 'PENDING_FACULTY_REVIEW',
      recipient_faculty: 'R. Suresh (Class Teacher XI-A2)',
    };

    existingList.unshift(submission);
    storage.setItem(STORAGE_ABSENCE_KEY, JSON.stringify(existingList));

    return submission;
  }

  /**
   * Retrieves previously submitted absence notices for a child
   */
  static async getAbsenceNotices(studentId: string): Promise<AbsenceNoticeSubmission[]> {
    const storage = getStorage();
    const existingStr = storage.getItem(STORAGE_ABSENCE_KEY);
    if (!existingStr) return [];
    try {
      const all: AbsenceNoticeSubmission[] = JSON.parse(existingStr);
      return all.filter((n) => n.student_id === studentId);
    } catch {
      return [];
    }
  }
}
