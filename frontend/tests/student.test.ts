/**
 * Student ERP — Student Feature Domain Test Suite
 * Phase 2 — Task 2.2: Deep Student Role Experience
 *
 * Covers:
 * 1. Student profile data handling & immutability of Student ID
 * 2. Zod validation schemas for leave requests and profile contact updates
 * 3. Leave request state transitions (Strictly PENDING initial state; Faculty reviews)
 * 4. Student attendance calculations using the canonical 4-status utility
 * 5. Marks / percentage / 8-tier letter grade presentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  StudentService,
  leaveRequestSchema,
  studentProfileContactSchema,
  type StudentProfile
} from '../src/features/students';
import { SCHOOL_CONFIG } from '../src/config/schoolConfig';
import { 
  calculateAttendanceFromRecords, 
  calculateAttendancePercentage, 
  calculateGrade, 
  calculatePercentage,
  formatMarks,
  formatPercentage,
  type AttendanceStatus 
} from '../src/utils';

describe('Student Domain — Profile & Credential Immutability', () => {
  beforeEach(() => {
    StudentService.clearStorage();
  });

  it('loads authoritative student profile with permanent credentials', async () => {
    const profile = await StudentService.getProfile('STU202600001');

    expect(profile).toBeDefined();
    expect(profile.student_id).toBe('STU202600001');
    expect(profile.first_name).toBe('Arun');
    expect(profile.last_name).toBe('Kumar');
    expect(profile.admission_number).toBe('ADM20240091');
    expect(profile.roll_number).toBe('11-A2-04');
    expect(profile.class_name).toBe('Grade 11');
    expect(profile.section_name).toBe('Section A2');
    expect(profile.stream).toBe('Computer Science A');
    expect(profile.parent_name).toBe('S. Ramanathan');
    expect(profile.class_teacher_name).toBe('R. Suresh');
    expect(profile.status).toBe('Active');
  });

  it('strictly preserves immutable academic identifiers during contact update', async () => {
    const initialProfile = await StudentService.getProfile('STU202600001');

    const updatedProfile = await StudentService.updateContactInfo('STU202600001', {
      phone: '+91-98400-99999',
      emergency_contact: '+91-98400-88888',
      address: 'New Residence, 50 Gandhi Road, Anna Nagar, Madurai - 625020',
    });

    // Verify updated contact fields
    expect(updatedProfile.phone).toBe('+91-98400-99999');
    expect(updatedProfile.emergency_contact).toBe('+91-98400-88888');
    expect(updatedProfile.address).toBe('New Residence, 50 Gandhi Road, Anna Nagar, Madurai - 625020');

    // Verify immutable credentials remain strictly identical
    expect(updatedProfile.student_id).toBe(initialProfile.student_id);
    expect(updatedProfile.admission_number).toBe(initialProfile.admission_number);
    expect(updatedProfile.roll_number).toBe(initialProfile.roll_number);
    expect(updatedProfile.class_name).toBe(initialProfile.class_name);
    expect(updatedProfile.stream).toBe(initialProfile.stream);
  });
});

describe('Student Domain — Profile Validation Schema', () => {
  it('validates correct contact information', () => {
    const validData = {
      phone: '+91-98400-11205',
      emergency_contact: '+91-98400-11207',
      address: 'No. 42, Temple View Avenue, K.K. Nagar, Madurai - 625001',
    };
    const result = studentProfileContactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects short phone number (< 10 digits)', () => {
    const invalidData = {
      phone: '12345',
      emergency_contact: '+91-98400-11207',
      address: 'No. 42, Temple View Avenue, K.K. Nagar, Madurai - 625001',
    };
    const result = studentProfileContactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 10 digits');
    }
  });

  it('rejects short residential address (< 10 characters)', () => {
    const invalidData = {
      phone: '+91-98400-11205',
      emergency_contact: '+91-98400-11207',
      address: 'Short St',
    };
    const result = studentProfileContactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 10 characters');
    }
  });

  it('rejects phone number containing invalid alphabetic characters', () => {
    const invalidData = {
      phone: '+91-98400-ABCD5',
      emergency_contact: '+91-98400-11207',
      address: 'No. 42, Temple View Avenue, K.K. Nagar, Madurai - 625001',
    };
    const result = studentProfileContactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid telephone');
    }
  });

  it('rejects residential address exceeding 250 characters limit', () => {
    const invalidData = {
      phone: '+91-98400-11205',
      emergency_contact: '+91-98400-11207',
      address: 'A'.repeat(251),
    };
    const result = studentProfileContactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('not exceed 250 characters');
    }
  });
});

describe('Student Domain — Leave Request Validation Schema', () => {
  it('validates a valid student leave application', () => {
    const validLeave = {
      leave_type: 'Medical',
      start_date: '2026-10-05',
      end_date: '2026-10-06',
      reason: 'Diagnosed with viral fever, prescribed 2 days of clinical bed rest.',
    };
    const result = leaveRequestSchema.safeParse(validLeave);
    expect(result.success).toBe(true);
  });

  it('rejects leave application if conclusion date precedes commencement date', () => {
    const invalidDateLeave = {
      leave_type: 'Family Function',
      start_date: '2026-10-10',
      end_date: '2026-10-08', // Before start_date
      reason: 'Attending family religious ceremony in native town.',
    };
    const result = leaveRequestSchema.safeParse(invalidDateLeave);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot precede');
    }
  });

  it('rejects leave application with insufficient justification (< 10 characters)', () => {
    const briefReasonLeave = {
      leave_type: 'Medical',
      start_date: '2026-10-05',
      end_date: '2026-10-05',
      reason: 'Fever', // Only 5 characters
    };
    const result = leaveRequestSchema.safeParse(briefReasonLeave);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 10 characters');
    }
  });

  it('rejects unsupported / invalid leave categories', () => {
    const invalidCategoryLeave = {
      leave_type: 'Vacation', // Not an institutional category
      start_date: '2026-10-05',
      end_date: '2026-10-05',
      reason: 'Going out of town for recreational vacation travel.',
    };
    const result = leaveRequestSchema.safeParse(invalidCategoryLeave);
    expect(result.success).toBe(false);
  });

  it('rejects leave application with excessive reason length (> 300 characters)', () => {
    const excessiveReasonLeave = {
      leave_type: 'Medical',
      start_date: '2026-10-05',
      end_date: '2026-10-06',
      reason: 'A'.repeat(301),
    };
    const result = leaveRequestSchema.safeParse(excessiveReasonLeave);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('not exceed 300 characters');
    }
  });

  it('rejects leave application with non-ISO date format', () => {
    const invalidFormatLeave = {
      leave_type: 'Medical',
      start_date: '05/10/2026', // Non-ISO format
      end_date: '06/10/2026',
      reason: 'Medical clinical bed rest required due to illness.',
    };
    const result = leaveRequestSchema.safeParse(invalidFormatLeave);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('YYYY-MM-DD format');
    }
  });
});

describe('Student Domain — Leave Request Workflow & State Transitions', () => {
  beforeEach(() => {
    StudentService.clearStorage();
  });

  it('submits leave request strictly in PENDING state (student cannot self-approve)', async () => {
    const profile = await StudentService.getProfile('STU202600001');

    const newRequest = await StudentService.submitLeaveRequest(
      {
        leave_type: 'Medical',
        start_date: '2026-10-15',
        end_date: '2026-10-16',
        reason: 'Undergoing planned dental surgery and prescribed oral recovery.',
      },
      profile
    );

    // Business Rule: State must be PENDING upon submission
    expect(newRequest.status).toBe('PENDING');
    expect(newRequest.student_id).toBe('STU202600001');
    expect(newRequest.reviewed_by).toBeUndefined();

    // Verify it is placed into leave requests registry
    const requests = await StudentService.getLeaveRequests('STU202600001');
    const found = requests.find((r) => r.id === newRequest.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe('PENDING');
  });

  it('includes historical faculty-sanctioned leave with reviewer notes', async () => {
    const requests = await StudentService.getLeaveRequests('STU202600001');
    const sanctioned = requests.find((r) => r.status === 'APPROVED');

    expect(sanctioned).toBeDefined();
    expect(sanctioned?.reviewed_by).toContain('R. Suresh');
    expect(sanctioned?.review_note).toBeDefined();
  });
});

describe('Student Domain — Canonical Attendance Calculations', () => {
  it('enforces formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100', () => {
    // 78 Present, 4 On Duty, 3 Leave, 2 Absent = 87 Total
    // Numerator = 78 + 4 = 82
    // Denominator = 87
    // Rate = 82 / 87 * 100 = 94.25% -> 94.3%
    const counts = {
      present: 78,
      onDuty: 4,
      leave: 3,
      absent: 2,
    };

    const rate = calculateAttendancePercentage(counts);
    expect(rate).toBe(94.3);
  });

  it('counts LEAVE strictly as absence in attendance percentage calculation', () => {
    const records: Array<{ status: AttendanceStatus }> = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'ON_DUTY' }, // Counts as present
      { status: 'LEAVE' },   // Counts as absence
      { status: 'ABSENT' },  // Counts as absence
    ];

    const summary = calculateAttendanceFromRecords(records);
    expect(summary.total).toBe(6);
    expect(summary.effectivePresent).toBe(4); // 3 Present + 1 On Duty
    expect(summary.effectiveAbsent).toBe(2);  // 1 Leave + 1 Absent
    expect(summary.percentage).toBe(66.7);   // (4 / 6) * 100
  });

  it('determines board examination clearance threshold at 85%', async () => {
    const summary = await StudentService.getAttendanceSummary('STU202600001');
    expect(summary.overallPercentage).toBeGreaterThanOrEqual(85.0);
    expect(summary.clearedForExams).toBe(true);
  });
});

describe('Student Domain — Marks, Percentage & 8-Tier Letter Grade', () => {
  it('calculates cumulative marks, aggregate percentage, and authoritative grade', () => {
    // 5 subjects out of 100: Math 92, CS 96, Phys 84, Eng 88, Chem 75
    // Cumulative: 92 + 96 + 84 + 88 + 75 = 435 / 500
    // Percentage: 435 / 500 * 100 = 87.00%
    const totalScore = 435;
    const maxMarks = 500;
    const percentage = calculatePercentage(totalScore, maxMarks);
    const grade = calculateGrade(percentage);

    expect(percentage).toBe(87.0);
    expect(grade).toBe('A2'); // 81 to <91 is A2 (High Distinction)
    expect(formatPercentage(percentage)).toBe('87.00%');
    expect(formatMarks(totalScore, maxMarks)).toBe('435 / 500');
  });

  it('correctly identifies passing mark threshold (33%)', () => {
    expect(calculateGrade(33)).toBe('D'); // 33% is minimum pass
    expect(calculateGrade(32.99)).toBe('E'); // Below 33 is Needs Improvement / Remedial
  });

  it('verifies that no GPA, CGPA, or credit hours exist on student domain records', async () => {
    const records = await StudentService.getExamRecords();
    for (const record of records) {
      expect(record.score).toBeTypeOf('number');
      expect(record.max).toBe(100);
      expect((record as any).gpa).toBeUndefined();
      expect((record as any).cgpa).toBeUndefined();
      expect((record as any).credits).toBeUndefined();
    }
  });
});

describe('Student Domain — Indian School Governance & Visual Contracts', () => {
  it('confirms School ERP canonical branding in student domain context', () => {
    expect(SCHOOL_CONFIG.shortName).toBe('School ERP');
    expect(SCHOOL_CONFIG.academicYear).toBe('2026–27');
  });

  it('provides authentic Indian senior secondary stream and class hierarchy', async () => {
    const profile = await StudentService.getProfile('STU202600001');
    expect(profile.class_name).toBe('Grade 11');
    expect(profile.section_name).toBe('Section A2');
    expect(profile.stream).toBe('Computer Science A');
    expect(profile.nationality).toBe('Indian');
  });

  it('guarantees weekly timetable periods have subjects, faculty, and room allocations with zero credits', async () => {
    const grid = await StudentService.getWeeklyTimetable();
    expect(grid.length).toBeGreaterThan(0);
    const monday = grid.find((d) => d.day === 'Monday');
    expect(monday).toBeDefined();
    expect(monday?.periods.length).toBe(5);

    for (const period of monday?.periods || []) {
      expect(period.subject).toBeDefined();
      expect(period.teacher).toBeDefined();
      expect(period.room).toBeDefined();
      expect((period as any).credits).toBeUndefined();
    }
  });

  it('provides institutional calendar events strictly aligned with Indian school milestones', async () => {
    const events = await StudentService.getCalendarEvents();
    expect(events.length).toBeGreaterThan(0);
    const examEvent = events.find((e) => e.category === 'Examination');
    const holidayEvent = events.find((e) => e.category === 'Holiday');
    expect(examEvent?.title).toContain('Half-Yearly Examination');
    expect(holidayEvent?.title).toContain('Diwali');
  });
});
