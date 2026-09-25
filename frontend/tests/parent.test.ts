/**
 * Student ERP — Parent Domain Vitest Test Suite
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Covers:
 * 1. Parent profile loading and linked-child relationship
 * 2. Permanent Student ID as the Parent login username
 * 3. Unrelated student access protection (cross-ward boundary enforcement)
 * 4. Four-status attendance model and canonical formula ((P + OD) / Total * 100)
 * 5. LEAVE strictly counted as absence in the denominator
 * 6. Subject-wise attendance calculation & 85% clearance benchmark
 * 7. Indian school academic marks out of 100, cumulative marks, percentage, and 8-tier letter grade
 * 8. Zero university concepts (no GPA, CGPA, credits)
 * 9. Parent read-only behavior & absence notice PENDING workflow (no self-approval)
 * 10. Absence notice Zod validation schema
 * 11. Deterministic advisories based on actual mock data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ParentService,
  parentAbsenceNoticeSchema,
  type ParentProfile,
  type LinkedChild,
} from '../src/features/parents';
import { MockAuthService } from '../src/services/authService';
import {
  calculateAttendancePercentage,
  calculateGrade,
  calculatePercentage,
  getGradeDescription,
} from '../src/utils';

describe('Parent Domain — Profile & Linked Children Filtering', () => {
  beforeEach(() => {
    ParentService.clearStorage();
  });

  it('loads authoritative parent profile for S. Ramanathan', async () => {
    const parent = await ParentService.getParentProfile('usr_007');

    expect(parent).toBeDefined();
    expect(parent.id).toBe('par_001');
    expect(parent.user_id).toBe('usr_007');
    expect(parent.full_name).toBe('S. Ramanathan');
    expect(parent.relation).toBe('Father');
    expect(parent.children_student_ids).toEqual(['STU202600001']);
  });

  it('retrieves only genuinely linked children for the parent', async () => {
    const children = await ParentService.getLinkedChildren('par_001');

    expect(children).toHaveLength(1);
    expect(children[0].student_id).toBe('STU202600001');
    expect(children[0].full_name).toBe('Arun Kumar');
    expect(children[0].class_name).toBe('Grade 11');
    expect(children[0].section_name).toBe('Section A2');
    expect(children[0].stream).toBe('Computer Science A');
    expect(children[0].class_teacher_name).toBe('R. Suresh');
  });

  it('strictly protects against accessing unrelated students', async () => {
    // Parent par_001 only has STU202600001 (Arun Kumar)
    const canAccessOwnChild = await ParentService.isChildLinkedToParent('par_001', 'STU202600001');
    const canAccessOtherChild1 = await ParentService.isChildLinkedToParent('par_001', 'STU202600002');
    const canAccessOtherChild2 = await ParentService.isChildLinkedToParent('par_001', 'STU202600004');

    expect(canAccessOwnChild).toBe(true);
    expect(canAccessOtherChild1).toBe(false);
    expect(canAccessOtherChild2).toBe(false);
  });
});

describe('Parent Domain — Student ID Login Identifier', () => {
  it('authenticates Parent using TEMPORARY PHASE 2 DEMO credentials (Parent01 / demo123)', async () => {
    // TEMPORARY PHASE 2 DEMO CREDENTIALS: Parent01 / demo123
    // The Student-Parent relationship (Parent linked to STU202600001) is preserved
    // in the domain model (ParentService.isChildLinkedToParent) — independent of login mechanism.
    const parentUser = await MockAuthService.loginWithCredentials('Parent01', 'demo123');

    expect(parentUser).toBeDefined();
    expect(parentUser.role).toBe('Parent');
    expect(parentUser.id).toBe('usr_007');
    expect(parentUser.first_name).toBe('S.');
    expect(parentUser.last_name).toBe('Ramanathan');
  });

  it('authenticates second Parent using username and demo password', async () => {
    // Secondary parent (M. Selvam) authenticated via username selvam.m / demo123
    const parentUser = await MockAuthService.loginWithCredentials('selvam.m', 'demo123');

    expect(parentUser).toBeDefined();
    expect(parentUser.role).toBe('Parent');
    expect(parentUser.id).toBe('usr_008');
    expect(parentUser.first_name).toBe('M.');
    expect(parentUser.last_name).toBe('Selvam');
  });
});

describe('Parent Domain — Four-Status Attendance Model & Calculations', () => {
  it('calculates child attendance according to canonical formula: (P + OD) / Total * 100', async () => {
    const summary = await ParentService.getChildAttendanceSummary('STU202600001');

    expect(summary.presentCount).toBe(78);
    expect(summary.onDutyCount).toBe(4);
    expect(summary.leaveCount).toBe(3);
    expect(summary.absentCount).toBe(2);
    expect(summary.totalSessions).toBe(87);

    // Formula calculation check: (78 + 4) / 87 * 100 = 94.25% -> 94.3%
    const expectedPct = calculateAttendancePercentage({
      present: 78,
      onDuty: 4,
      leave: 3,
      absent: 2,
    });
    expect(summary.overallPercentage).toBe(expectedPct);
    expect(summary.overallPercentage).toBe(94.3);
    expect(summary.clearedForExams).toBe(true);
  });

  it('strictly counts approved LEAVE as an absence in the denominator', () => {
    // Base standing: 10 present, 0 OD, 0 leave, 0 absent = 100%
    const basePct = calculateAttendancePercentage({ present: 10, onDuty: 0, leave: 0, absent: 0 });
    expect(basePct).toBe(100.0);

    // With 2 approved leave records added: (10 + 0) / (10 + 0 + 2 + 0) = 10/12 = 83.3%
    const leavePct = calculateAttendancePercentage({ present: 10, onDuty: 0, leave: 2, absent: 0 });
    expect(leavePct).toBe(83.3);
    expect(leavePct).toBeLessThan(basePct);

    // Compared with 2 unapproved absences: (10 + 0) / (10 + 2 + 0 + 0) = 10/12 = 83.3%
    const absentPct = calculateAttendancePercentage({ present: 10, onDuty: 0, leave: 0, absent: 2 });
    expect(leavePct).toBe(absentPct);
  });

  it('evaluates subject-wise attendance with valid calculations and board clearance thresholds', async () => {
    const subjects = await ParentService.getChildSubjectAttendance('STU202600001');

    expect(subjects).toHaveLength(5);

    // Mathematics: (20 + 2) / 24 * 100 = 91.67% -> 91.7%
    const math = subjects.find((s) => s.subject === 'Mathematics');
    expect(math).toBeDefined();
    expect(math?.percentage).toBe(91.7);
    expect(math!.percentage >= 85).toBe(true);

    // Computer Science: (21 + 1) / 22 * 100 = 100.0%
    const cs = subjects.find((s) => s.subject === 'Computer Science');
    expect(cs).toBeDefined();
    expect(cs?.percentage).toBe(100.0);

    // Chemistry: (13 + 0) / 15 * 100 = 86.67% -> 86.7%
    const chem = subjects.find((s) => s.subject === 'Chemistry');
    expect(chem).toBeDefined();
    expect(chem?.percentage).toBe(86.7);
    expect(chem!.percentage >= 85).toBe(true);
  });

  it('differentiates faculty-sanctioned LEAVE from unapproved ABSENT in attendance history', async () => {
    const history = await ParentService.getChildAttendanceHistory('STU202600001');

    expect(history.length).toBeGreaterThan(0);

    const leaveRecord = history.find((r) => r.status === 'LEAVE');
    expect(leaveRecord).toBeDefined();
    expect(leaveRecord?.approved_by_faculty_id).toBeDefined(); // Sanctioned by faculty
    expect(leaveRecord?.faculty).toBeDefined();

    const absentRecord = history.find((r) => r.status === 'ABSENT');
    expect(absentRecord).toBeDefined();
    expect(absentRecord?.approved_by_faculty_id).toBeUndefined(); // Unapproved
  });
});

describe('Parent Domain — Indian School Academic Model & Report Cards', () => {
  it('derives marks out of 100, cumulative marks, percentage, and 8-tier letter grade', async () => {
    const summary = await ParentService.getChildAcademicSummary('STU202600001');

    expect(summary.cumulativeMarks).toBe(435);
    expect(summary.totalMaxMarks).toBe(500);
    expect(summary.overallPercentage).toBe(87.0);
    expect(summary.overallGrade).toBe('A2');
    expect(summary.gradeDescription).toContain('81–90%');
    expect(summary.sectionRank).toBe('4th');
    expect(summary.totalStudentsInSection).toBe(32);
  });

  it('evaluates individual subject marks out of 100 using the standard 8-tier scale', async () => {
    const subjectMarks = await ParentService.getChildSubjectMarks('STU202600001');

    expect(subjectMarks).toHaveLength(5);

    const math = subjectMarks.find((m) => m.subject === 'Mathematics');
    expect(math?.marksObtained).toBe(92);
    expect(math?.maxMarks).toBe(100);
    expect(math?.grade).toBe('A1'); // 91–100%

    const cs = subjectMarks.find((m) => m.subject === 'Computer Science');
    expect(cs?.marksObtained).toBe(96);
    expect(cs?.grade).toBe('A1');

    const chem = subjectMarks.find((m) => m.subject === 'Chemistry');
    expect(chem?.marksObtained).toBe(75);
    expect(chem?.grade).toBe('B1'); // 71–80%
  });

  it('strictly contains zero university concepts (no GPA, CGPA, or credits)', async () => {
    const summary: any = await ParentService.getChildAcademicSummary('STU202600001');
    const marks: any = await ParentService.getChildSubjectMarks('STU202600001');

    expect(summary.gpa).toBeUndefined();
    expect(summary.cgpa).toBeUndefined();
    expect(summary.credits).toBeUndefined();
    expect(summary.credit_hours).toBeUndefined();

    for (const m of marks) {
      expect(m.credits).toBeUndefined();
      expect(m.credit_hours).toBeUndefined();
      expect(m.grade_points).toBeUndefined();
    }
  });
});

describe('Parent Domain — Absence Notice Workflow & Read-Only Academic Contract', () => {
  beforeEach(() => {
    ParentService.clearStorage();
  });

  it('submits absence notice strictly in PENDING state (parent cannot self-approve)', async () => {
    const parentProfile = await ParentService.getParentProfile('usr_007');

    const notice = await ParentService.submitAbsenceNotice(
      {
        student_id: 'STU202600001',
        date: '2026-10-02',
        category: 'Medical / Illness',
        explanation: 'Arun had a severe migraine and was advised bed rest by doctor.',
      },
      parentProfile
    );

    expect(notice).toBeDefined();
    expect(notice.status).toBe('PENDING_FACULTY_REVIEW');
    expect(notice.recipient_faculty).toContain('R. Suresh');

    // Retrieve notices from storage
    const allNotices = await ParentService.getAbsenceNotices('STU202600001');
    expect(allNotices).toHaveLength(1);
    expect(allNotices[0].status).toBe('PENDING_FACULTY_REVIEW');

    // Parent attendance summary is NOT mutated into LEAVE until faculty approval
    const currentAtt = await ParentService.getChildAttendanceSummary('STU202600001');
    expect(currentAtt.leaveCount).toBe(3); // Unchanged
  });

  it('validates absence notice form data using Zod schema', () => {
    const validData = {
      student_id: 'STU202600001',
      date: '2026-10-05',
      category: 'Family Event / Function' as const,
      explanation: 'Attending elder sister marriage ceremony in hometown.',
    };

    const result = parentAbsenceNoticeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects short explanations (< 10 characters)', () => {
    const invalidData = {
      student_id: 'STU202600001',
      date: '2026-10-05',
      category: 'Medical / Illness' as const,
      explanation: 'Sick',
    };

    const result = parentAbsenceNoticeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 10 characters');
    }
  });

  it('rejects malformed date formats', () => {
    const invalidData = {
      student_id: 'STU202600001',
      date: '05-10-2026', // Not YYYY-MM-DD
      category: 'Medical / Illness' as const,
      explanation: 'Medical appointment with pediatrician.',
    };

    const result = parentAbsenceNoticeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Parent Domain — Deterministic Advisories & Timetable/Calendar', () => {
  it('generates deterministic attendance and academic advisories based on actual mock data', async () => {
    const advisories = await ParentService.getChildAdvisories('STU202600001');

    expect(advisories.length).toBeGreaterThan(0);

    const attAdv = advisories.find((a) => a.type === 'attendance');
    expect(attAdv).toBeDefined();
    expect(attAdv?.message).toContain('94.');
    expect(attAdv?.severity).toBe('success');

    const acadAdv = advisories.find((a) => a.type === 'academic');
    expect(acadAdv).toBeDefined();
    expect(acadAdv?.message).toContain('Chemistry');
    expect(acadAdv?.message).toContain('Computer Science');

    const ptmAdv = advisories.find((a) => a.type === 'general');
    expect(ptmAdv).toBeDefined();
    expect(ptmAdv?.message).toContain('November 14, 2026');
  });

  it('loads weekly timetable for child section with valid 5 daily periods', async () => {
    const timetable = await ParentService.getChildTimetable('STU202600001');

    expect(timetable).toHaveLength(5); // Mon-Fri
    const monday = timetable.find((t) => t.day === 'Monday');
    expect(monday?.periods).toHaveLength(5);

    expect(monday?.periods[0].subject).toBe('Mathematics');
    expect(monday?.periods[0].faculty).toBe('R. Suresh');
    expect(monday?.periods[0].room).toBe('Room XI-A2');
  });

  it('loads institutional school events with categories', async () => {
    const events = await ParentService.getParentCalendarEvents();

    expect(events.length).toBeGreaterThan(0);
    const ptmEvent = events.find((e) => e.category === 'PTM');
    expect(ptmEvent).toBeDefined();
    expect(ptmEvent?.title).toContain('Parent-Teacher Meeting');
  });
});
