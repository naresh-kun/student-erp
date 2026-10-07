/**
 * Student ERP — Phase 5 Task 5.2 Frontend Verification Suite
 * Core ERP API Integration: Parent Module Service & API Tests
 *
 * Covers:
 * 1. ParentApiService communication with /api/v1/ parent, student, attendance, and marks endpoints
 * 2. ParentService live API data mapping into canonical domain types
 * 3. Linked children profile mapping with class teacher, section, and stream
 * 4. Attendance canonical formula adherence (PRESENT + ON_DUTY) / Total * 100 for wards
 * 5. Marks and report card mapping (A1-E grading, 0-100 scale, zero GPA/credits)
 * 6. Absence notice workflow (PENDING status mapping to PENDING_FACULTY_REVIEW)
 * 7. Offline / fallback resilience when API endpoints are unreachable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ParentApiService } from '../src/features/parents/services/parentApiService';
import { ParentService } from '../src/features/parents/services/parentService';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createLocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

describe('Phase 5 Task 5.2 — ParentApiService', () => {
  beforeEach(() => {
    localStorage.clear();
    ParentService.clearStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    ParentService.clearStorage();
    vi.restoreAllMocks();
  });

  it('fetches parent profile via /api/v1/parents/me/', async () => {
    const mockProfile = {
      id: 'par_uuid_001',
      relation: 'Father',
      occupation: 'Senior Technical Director',
      address: 'No. 42, Temple View Avenue, New Delhi',
      first_name: 'S.',
      last_name: 'Ramanathan',
      email: 'ramanathan@gmail.com',
      phone: '+91-98400-11207',
      children_count: 1,
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/parents/me/');
      return new Response(JSON.stringify({ success: true, data: mockProfile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await ParentApiService.getParentProfile();
    expect(res.id).toBe('par_uuid_001');
    expect(res.relation).toBe('Father');
    expect(res.occupation).toBe('Senior Technical Director');
  });

  it('fetches linked children via /api/v1/parents/me/children/', async () => {
    const mockChildren = [
      {
        id: 'stu_uuid_001',
        student_id: 'STU202600001',
        admission_number: 'ADM20240091',
        roll_number: '11-A2-04',
        first_name: 'Arun',
        last_name: 'Kumar',
        current_class: 'Grade 11 - Computer Science',
        current_section: 'A2',
        stream: 'Computer Science A',
        status: 'Enrolled',
        class_teacher_name: 'R. Suresh',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/parents/me/children/');
      return new Response(JSON.stringify({ success: true, data: mockChildren }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await ParentApiService.getLinkedChildren();
    expect(res.length).toBe(1);
    expect(res[0].student_id).toBe('STU202600001');
    expect(res[0].first_name).toBe('Arun');
  });

  it('fetches child attendance and parses meta summary', async () => {
    const mockRecords = [
      {
        id: 'att_001',
        date: '2026-10-01',
        status: 'PRESENT',
        session_period: 1,
      },
      {
        id: 'att_002',
        date: '2026-10-02',
        status: 'ABSENT',
        session_period: 2,
      },
    ];
    const mockSummary = {
      total_sessions: 2,
      present_count: 1,
      absent_count: 1,
      on_duty_count: 0,
      leave_count: 0,
      attendance_percentage: 50.0,
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/attendance/?student_id=STU202600001');
      return new Response(
        JSON.stringify({
          success: true,
          data: mockRecords,
          meta: { attendance_summary: mockSummary },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const res = await ParentApiService.getChildAttendance('STU202600001');
    expect(res.records.length).toBe(2);
    expect(res.summary?.attendance_percentage).toBe(50.0);
    expect(res.summary?.total_sessions).toBe(2);
  });

  it('submits absence notice via /api/v1/attendance/leaves/', async () => {
    let capturedBody: any;
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/attendance/leaves/');
      capturedBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'leave_123',
            student_id: capturedBody.student_id,
            student_name: 'Arun Kumar',
            leave_type: capturedBody.leave_type,
            start_date: capturedBody.start_date,
            end_date: capturedBody.end_date,
            reason: capturedBody.reason,
            status: 'PENDING',
            applied_on: '2026-10-07T10:00:00Z',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const res = await ParentApiService.submitAbsenceNotice({
      student_id: 'STU202600001',
      leave_type: 'Medical',
      start_date: '2026-10-15',
      end_date: '2026-10-16',
      reason: 'Fever consultation',
    });

    expect(res.status).toBe('PENDING');
    expect(capturedBody.student_id).toBe('STU202600001');
    expect(capturedBody.leave_type).toBe('Medical');
  });

  it('fetches report card for a linked child', async () => {
    const mockReportCard = {
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      total_marks_obtained: 460.0,
      total_max_marks: 500.0,
      overall_percentage: 92.0,
      overall_grade: 'A1',
      subject_count: 5,
      marks: [
        {
          subject_name: 'Computer Science',
          marks_obtained: 96,
          max_marks: 100,
          grade: 'A1',
          percentage: 96.0,
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/marks/report-card/STU202600001/');
      return new Response(JSON.stringify({ success: true, data: mockReportCard }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await ParentApiService.getChildReportCard('STU202600001');
    expect(res.student_id).toBe('STU202600001');
    expect(res.overall_grade).toBe('A1');
    expect(res.overall_percentage).toBe(92.0);
  });
});

describe('Phase 5 Task 5.2 — ParentService Domain Adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    ParentService.clearStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    ParentService.clearStorage();
    vi.restoreAllMocks();
  });

  it('maps live backend parent profile into canonical ParentProfile', async () => {
    vi.spyOn(ParentApiService, 'getParentProfile').mockResolvedValue({
      id: 'par_live_01',
      first_name: 'S.',
      last_name: 'Ramanathan',
      relation: 'Father',
      occupation: 'Senior Technical Director',
      phone: '+91-98400-11207',
      email: 'ramanathan@gmail.com',
      address: 'No. 42, Temple View Avenue, New Delhi',
    });

    vi.spyOn(ParentApiService, 'getLinkedChildren').mockResolvedValue([
      {
        id: 'stu_01',
        student_id: 'STU202600001',
        admission_number: 'ADM20240091',
        roll_number: '11-A2-04',
        first_name: 'Arun',
        last_name: 'Kumar',
        status: 'Enrolled',
        current_class: 'Grade 11',
        current_section: 'A2',
        stream: 'Computer Science A',
      } as any,
    ]);

    const profile = await ParentService.getParentProfile('par_live_01');
    expect(profile.id).toBe('par_live_01');
    expect(profile.full_name).toBe('S. Ramanathan');
    expect(profile.relation).toBe('Father');
    expect(profile.children_student_ids).toEqual(['STU202600001']);
  });

  it('maps live backend linked children with calculated attendance & marks', async () => {
    vi.spyOn(ParentApiService, 'getLinkedChildren').mockResolvedValue([
      {
        id: 'stu_01',
        student_id: 'STU202600001',
        admission_number: 'ADM20240091',
        roll_number: '11-A2-04',
        first_name: 'Arun',
        last_name: 'Kumar',
        status: 'Enrolled',
        current_class: 'Grade 11 - Computer Science',
        current_section: 'A2',
        stream: 'Computer Science A',
        class_teacher_name: 'R. Suresh',
        class_teacher_email: 'suresh.r@schoolerp.edu.in',
      } as any,
    ]);

    vi.spyOn(ParentApiService, 'getChildAttendance').mockResolvedValue({
      records: [],
      summary: {
        total_sessions: 100,
        present_count: 90,
        absent_count: 5,
        on_duty_count: 3,
        leave_count: 2,
        attendance_percentage: 93.0,
      },
    });

    vi.spyOn(ParentApiService, 'getChildReportCard').mockResolvedValue({
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      admission_number: 'ADM20240091',
      roll_number: '11-A2-04',
      academic_year: '2026-2027',
      class_name: 'Grade 11',
      section_name: 'A2',
      total_marks_obtained: 460,
      total_max_marks: 500,
      overall_percentage: 92.0,
      overall_grade: 'A1',
      subject_count: 5,
      marks: [],
    });

    const children = await ParentService.getLinkedChildren();
    expect(children.length).toBe(1);
    expect(children[0].student_id).toBe('STU202600001');
    expect(children[0].class_name).toBe('Grade 11');
    expect(children[0].section_name).toBe('Section A2');
    expect(children[0].class_teacher_name).toBe('R. Suresh');
    expect(children[0].attendance_summary.overallPercentage).toBe(93.0);
    expect(children[0].academic_summary.overallGrade).toBe('A1');
  });

  it('submits absence notice through ParentApiService and maps to domain submission', async () => {
    vi.spyOn(ParentApiService, 'submitAbsenceNotice').mockResolvedValue({
      id: 'leave_live_999',
      student: 'stu_uuid',
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      leave_type: 'Medical',
      start_date: '2026-10-18',
      end_date: '2026-10-18',
      reason: 'Orthopedic consultation',
      status: 'PENDING',
      applied_on: '2026-10-07T12:00:00Z',
    });

    const submission = await ParentService.submitAbsenceNotice(
      {
        student_id: 'STU202600001',
        date: '2026-10-18',
        category: 'Medical / Illness',
        explanation: 'Orthopedic consultation and prescribed bed rest.',
      },
      { id: 'par_001' } as any
    );

    expect(submission.id).toBe('leave_live_999');
    expect(submission.status).toBe('PENDING_FACULTY_REVIEW');
    expect(submission.student_id).toBe('STU202600001');
  });

  it('falls back gracefully to mock records when backend is unreachable', async () => {
    vi.spyOn(ParentApiService, 'getParentProfile').mockRejectedValue(new Error('Network error'));

    const profile = await ParentService.getParentProfile('par_001');
    expect(profile).toBeDefined();
    expect(profile.first_name).toBe('S.');
    expect(profile.relation).toBe('Father');
    expect(profile.children_student_ids).toContain('STU202600001');
  });
});
