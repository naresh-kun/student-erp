/**
 * Student ERP — Faculty Domain Vitest Test Suite
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Comprehensive automated verification covering:
 * 1. Faculty profile loading & Class Teacher assignment for R. Suresh
 * 2. Assigned class scoping (XI-A2, XII-A1, X-A) and student scoping
 * 3. Permanent, immutable Student ID protection
 * 4. Timetable day filtering and 24 periods/week workload (no university credits)
 * 5. Four-status attendance roll call (PRESENT, ABSENT, ON_DUTY, LEAVE)
 * 6. "Mark All Present" canonical action
 * 7. Canonical attendance formula: (P + OD) / (P + A + OD + L) * 100
 * 8. LEAVE strictly counted as absence in the denominator
 * 9. Faculty-approved LEAVE workflow (Approve -> LEAVE, Reject -> REJECTED)
 * 10. Audit information recorded on leave approval (faculty ID, name, timestamp)
 * 11. Marks entry validation (0–100 boundaries, 'AB' support, rejection of <0 and >100)
 * 12. CBSE 8-tier letter grade derivation from shared utility
 * 13. Strictly NO GPA, CGPA, credits, or grade points
 * 14. Strictly NO faculty ratings, reviews, rankings, or performance scores
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FacultyService,
  DEFAULT_FACULTY_PROFILE,
  DEFAULT_ASSIGNED_CLASSES,
  validateMarkInput,
  AttendanceSessionSubmissionSchema,
  CanonicalAttendanceStatusSchema,
} from '../src/features/faculty';
import { calculateAttendancePercentage, calculateGrade, calculatePercentage } from '../src/utils';

describe('Faculty Domain — Profile & Class Teacher Mentorship', () => {
  beforeEach(() => {
    FacultyService.clearStorage();
  });

  it('loads authoritative profile for Senior PGT R. Suresh', async () => {
    const profile = await FacultyService.getFacultyProfile('fac_001');

    expect(profile).toBeDefined();
    expect(profile.id).toBe('fac_001');
    expect(profile.user_id).toBe('usr_003');
    expect(profile.employee_code).toBe('FAC-MATH-012');
    expect(profile.full_name).toBe('R. Suresh');
    expect(profile.department).toBe('Mathematics');
    expect(profile.designation).toBe('Senior PGT & Department Head');
    expect(profile.office_room).toContain('Ramanujan Block');
    expect(profile.weekly_periods).toBe(24);
  });

  it('verifies Class Teacher assignment for Grade 11 — Section A2', async () => {
    const profile = await FacultyService.getFacultyProfile('fac_001');

    expect(profile.class_teacher_of).not.toBeNull();
    expect(profile.class_teacher_of?.class_id).toBe('cls_001');
    expect(profile.class_teacher_of?.section_id).toBe('sec_002');
    expect(profile.class_teacher_of?.class_name).toBe('Grade 11 — Section A2');
    expect(profile.class_teacher_of?.stream).toBe('Computer Science A');
    expect(profile.class_teacher_of?.room).toBe('Room 202');
  });

  it('strictly enforces descriptive-only profile without teacher ratings or appraisal scores', async () => {
    const profile = await FacultyService.getFacultyProfile('fac_001');
    const profileKeys = Object.keys(profile);

    // Strictly forbidden fields
    expect(profileKeys).not.toContain('rating');
    expect(profileKeys).not.toContain('stars');
    expect(profileKeys).not.toContain('performance_score');
    expect(profileKeys).not.toContain('appraisal_grade');
    expect(profileKeys).not.toContain('teacher_rank');
    expect(profileKeys).not.toContain('review_count');
  });
});

describe('Faculty Domain — Assigned Class & Student Scoping', () => {
  beforeEach(() => {
    FacultyService.clearStorage();
  });

  it('scopes classes strictly to the 3 authorized classes for R. Suresh', async () => {
    const classes = await FacultyService.getAssignedClasses('fac_001');

    expect(classes).toHaveLength(3);
    const classNames = classes.map((c) => c.display_name);

    expect(classNames).toContain('Grade 11 — Computer Science A (Sec A2)');
    expect(classNames).toContain('Grade 12 — Computer Science A (Sec A1)');
    expect(classNames).toContain('Grade 10 — Section A');

    // Does NOT contain unauthorized sections
    expect(classNames).not.toContain('Grade 11 — Bio-Maths B (Sec B1)');
    expect(classNames).not.toContain('Grade 11 — Commerce C (Sec C1)');
    expect(classNames).not.toContain('Grade 10 — Section B');
  });

  it('scopes students strictly to the requested authorized class', async () => {
    const students11A2 = await FacultyService.getAssignedStudents('cls_001_sec_002');
    expect(students11A2.length).toBeGreaterThan(0);
    expect(students11A2.every((s) => s.class_name === 'Grade 11' && s.section_name === 'Section A2')).toBe(true);

    const students12A1 = await FacultyService.getAssignedStudents('cls_002_sec_001');
    expect(students12A1.length).toBeGreaterThan(0);
    expect(students12A1.every((s) => s.class_name === 'Grade 12' && s.section_name === 'Section A1')).toBe(true);

    const students10A = await FacultyService.getAssignedStudents('cls_000_sec_g10_a');
    expect(students10A.length).toBeGreaterThan(0);
    expect(students10A.every((s) => s.class_name === 'Grade 10' && s.section_name === 'Section A')).toBe(true);
  });

  it('enforces permanent, immutable Student ID across all assigned student records', async () => {
    const students = await FacultyService.getAssignedStudents('cls_001_sec_002');

    expect(students[0].student_id).toBe('STU202600001'); // Arun Kumar
    expect(students[1].student_id).toBe('STU202600002'); // Priya S
    expect(students.every((s) => s.student_id.startsWith('STU'))).toBe(true);
  });
});

describe('Faculty Domain — Timetable & Weekly Workload', () => {
  it('retrieves full weekly timetable adhering to Indian school 8-period convention', async () => {
    const timetable = await FacultyService.getFacultyTimetable('fac_001');

    expect(timetable.length).toBeGreaterThan(10);
    expect(timetable.every((entry) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(entry.day))).toBe(true);
    expect(timetable.every((entry) => entry.period_number >= 1 && entry.period_number <= 8)).toBe(true);
  });

  it('verifies today schedule periods for R. Suresh', async () => {
    const today = await FacultyService.getTodaySchedule('fac_001');

    expect(today).toHaveLength(3);
    expect(today[0].period_time).toBe('08:30 - 09:15');
    expect(today[0].class_name).toBe('Grade 11-A2');
    expect(today[0].room).toBe('Room XI-A2');
  });

  it('strictly avoids university credit-hour or semester GPA terminology', async () => {
    const timetable = await FacultyService.getFacultyTimetable('fac_001');
    const timetableStr = JSON.stringify(timetable).toLowerCase();

    expect(timetableStr).not.toContain('credit');
    expect(timetableStr).not.toContain('gpa');
    expect(timetableStr).not.toContain('semester');
    expect(timetableStr).not.toContain('professor');
  });
});

describe('Faculty Domain — Attendance Roll Call & Canonical 4-Status Model', () => {
  beforeEach(() => {
    FacultyService.clearStorage();
  });

  it('validates canonical attendance status schema accepts exactly 4 statuses', () => {
    expect(CanonicalAttendanceStatusSchema.safeParse('PRESENT').success).toBe(true);
    expect(CanonicalAttendanceStatusSchema.safeParse('ABSENT').success).toBe(true);
    expect(CanonicalAttendanceStatusSchema.safeParse('ON_DUTY').success).toBe(true);
    expect(CanonicalAttendanceStatusSchema.safeParse('LEAVE').success).toBe(true);

    // Rejects deprecated statuses
    expect(CanonicalAttendanceStatusSchema.safeParse('LATE').success).toBe(false);
    expect(CanonicalAttendanceStatusSchema.safeParse('EXCUSED').success).toBe(false);
    expect(CanonicalAttendanceStatusSchema.safeParse('HALF_DAY').success).toBe(false);
  });

  it('calculates attendance percentage using shared canonical formula: (P + OD) / Total * 100', () => {
    // 25 present, 2 on-duty, 2 leave, 1 absent -> total = 30
    // Attendance % = (25 + 2) / 30 * 100 = 27 / 30 * 100 = 90.0%
    const rate = calculateAttendancePercentage({
      present: 25,
      onDuty: 2,
      leave: 2,
      absent: 1,
    });

    expect(rate).toBe(90.0);
  });

  it('strictly counts LEAVE as absence in the denominator', () => {
    // If LEAVE were counted as present: (27 + 2) / 30 = 96.7%
    // Under canonical rule: LEAVE is in denominator only -> 27 / 30 = 90.0%
    const withLeave = calculateAttendancePercentage({
      present: 27,
      onDuty: 0,
      leave: 3,
      absent: 0,
    });

    expect(withLeave).toBe(90.0);
  });

  it('initializes attendance roll call session and supports "Mark All Present"', async () => {
    const context = {
      academic_year: '2026–27',
      date: '2026-09-25',
      class_id: 'cls_001',
      section_id: 'sec_002',
      class_display: 'Grade 11 — Section A2',
      subject: 'Mathematics',
      period: 'Period 1 (08:30 - 09:15)',
      session_state: 'Not Marked' as const,
    };

    const session = await FacultyService.getAttendanceRollCall(context);
    expect(session.records.length).toBeGreaterThan(0);
    expect(session.context.session_state).toBe('Not Marked');

    // Simulate "Mark All Present"
    const allPresent = session.records.map((r) => ({ ...r, status: 'PRESENT' as const }));
    const result = await FacultyService.submitAttendanceRollCall(context, allPresent, 'R. Suresh');

    expect(result.success).toBe(true);
    expect(result.percentage).toBe(100.0);
    expect(result.summary.present).toBe(session.records.length);
    expect(result.summary.absent).toBe(0);
    expect(result.summary.leave).toBe(0);
  });
});

describe('Faculty Domain — Faculty LEAVE Approval Workflow', () => {
  beforeEach(() => {
    FacultyService.clearStorage();
  });

  it('retrieves pending absence notices requiring Class Teacher review', async () => {
    const notices = await FacultyService.getPendingLeaveNotices('fac_001');

    expect(notices.length).toBeGreaterThan(0);
    expect(notices.some((n) => n.status === 'PENDING_FACULTY_REVIEW')).toBe(true);
    expect(notices.some((n) => n.student_id === 'STU202600001')).toBe(true);
  });

  it('approves absence notice and transforms status to sanctioned LEAVE', async () => {
    const notices = await FacultyService.getPendingLeaveNotices('fac_001');
    const target = notices.find((n) => n.status === 'PENDING_FACULTY_REVIEW');
    expect(target).toBeDefined();

    const reviewed = await FacultyService.reviewLeaveNotice(
      target!.id,
      'APPROVE',
      'fac_001',
      'R. Suresh'
    );

    expect(reviewed.status).toBe('LEAVE');
    expect(reviewed.approved_by_faculty_id).toBe('fac_001');
    expect(reviewed.approved_by_name).toContain('R. Suresh');
    expect(reviewed.approved_at).toBeDefined();
  });

  it('rejects absence notice and updates status to REJECTED', async () => {
    const notices = await FacultyService.getPendingLeaveNotices('fac_001');
    const target = notices.find((n) => n.status === 'PENDING_FACULTY_REVIEW');
    expect(target).toBeDefined();

    const reviewed = await FacultyService.reviewLeaveNotice(
      target!.id,
      'REJECT',
      'fac_001',
      'R. Suresh',
      'Insufficient medical certificate documentation.'
    );

    expect(reviewed.status).toBe('REJECTED');
    expect(reviewed.rejection_reason).toContain('Insufficient');
  });

  it('auto-reflects approved leave in the session attendance roll call', async () => {
    // 1. Approve notice for date 2026-09-28
    const notices = await FacultyService.getPendingLeaveNotices('fac_001');
    const notice1 = notices.find((n) => n.date === '2026-09-28');
    expect(notice1).toBeDefined();

    await FacultyService.reviewLeaveNotice(notice1!.id, 'APPROVE', 'fac_001', 'R. Suresh');

    // 2. Load attendance roll call for date 2026-09-28
    const session = await FacultyService.getAttendanceRollCall({
      academic_year: '2026–27',
      date: '2026-09-28',
      class_id: 'cls_001',
      section_id: 'sec_002',
      class_display: 'Grade 11 — Section A2',
      subject: 'Mathematics',
      period: 'Period 1 (08:30 - 09:15)',
      session_state: 'Not Marked',
    });

    const studentRecord = session.records.find((r) => r.student_id === notice1!.student_id);
    expect(studentRecord).toBeDefined();
    expect(studentRecord?.status).toBe('LEAVE');
    expect(studentRecord?.approved_by).toContain('R. Suresh');
  });
});

describe('Faculty Domain — Marks Entry, Boundaries & CBSE 8-Tier Grading', () => {
  beforeEach(() => {
    FacultyService.clearStorage();
  });

  it('validates score input: accepts 0 to 100 inclusive', () => {
    expect(validateMarkInput(0).valid).toBe(true);
    expect(validateMarkInput(50).valid).toBe(true);
    expect(validateMarkInput(100).valid).toBe(true);
    expect(validateMarkInput('92').valid).toBe(true);
  });

  it('validates score input: accepts "AB" (case-insensitive) for absent student', () => {
    expect(validateMarkInput('AB')).toEqual({ valid: true, value: 'AB' });
    expect(validateMarkInput('ab')).toEqual({ valid: true, value: 'AB' });
    expect(validateMarkInput(' Ab ')).toEqual({ valid: true, value: 'AB' });
  });

  it('validates score input: rejects negative numbers, >100, and invalid text', () => {
    expect(validateMarkInput(-5).valid).toBe(false);
    expect(validateMarkInput('-1').valid).toBe(false);
    expect(validateMarkInput(101).valid).toBe(false);
    expect(validateMarkInput('105').valid).toBe(false);
    expect(validateMarkInput('XYZ').valid).toBe(false);
    expect(validateMarkInput('A+').valid).toBe(false);
  });

  it('derives authoritative CBSE 8-tier letter grades from shared utility', () => {
    // A1: 91–100, A2: 81–<91, B1: 71–<81, B2: 61–<71, C1: 51–<61, C2: 41–<51, D: 33–<41, E: <33
    expect(calculateGrade(95)).toBe('A1');
    expect(calculateGrade(91)).toBe('A1');
    expect(calculateGrade(85)).toBe('A2');
    expect(calculateGrade(75)).toBe('B1');
    expect(calculateGrade(65)).toBe('B2');
    expect(calculateGrade(55)).toBe('C1');
    expect(calculateGrade(45)).toBe('C2');
    expect(calculateGrade(35)).toBe('D');
    expect(calculateGrade(25)).toBe('E');
  });

  it('saves marks entry sheet and computes class summary without faculty ratings', async () => {
    const sheet = await FacultyService.getMarksEntrySheet('cls_001_sec_002', 'MATH-041', 'Half-Yearly Examination');
    expect(sheet.entries.length).toBeGreaterThan(0);

    const updatedEntries = sheet.entries.map((entry, idx) => ({
      ...entry,
      score: idx === 0 ? 'AB' as const : 88,
    }));

    const result = await FacultyService.saveMarksEntrySheet(
      'cls_001_sec_002',
      'MATH-041',
      'Half-Yearly Examination',
      updatedEntries
    );

    expect(result.success).toBe(true);
    expect(result.summary.class_average).toBe(88.0);
    expect(result.summary.pass_rate).toBe(100.0);

    // Summary contains no teacher appraisal or rank
    const summaryKeys = Object.keys(result.summary);
    expect(summaryKeys).not.toContain('faculty_rating');
    expect(summaryKeys).not.toContain('teacher_ranking');
  });
});
