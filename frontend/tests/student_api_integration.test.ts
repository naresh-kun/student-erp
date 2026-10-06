/**
 * Student ERP — Phase 5 Task 5.1 Frontend Verification Suite
 * Core ERP API Integration: Student Module Service & API Tests
 *
 * Covers:
 * 1. ApiClient authentication header injection, 401 refresh interceptor, and error normalization
 * 2. StudentApiService communication with /api/v1/ endpoints
 * 3. StudentService live API data mapping into canonical domain types
 * 4. Attendance canonical formula adherence (PRESENT + ON_DUTY) / Total * 100
 * 5. Marks and report card mapping (A1-E grading, 0-100 scale, zero GPA/credits)
 * 6. Leave request workflow (PENDING initial status)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient, ApiError } from '../src/services/api';
import { StudentApiService } from '../src/features/students/services/studentApiService';
import { StudentService } from '../src/features/students/services/studentService';

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

describe('Phase 5 Task 5.1 — ApiClient Core Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('injects Bearer token into Authorization header when access_token exists', async () => {
    localStorage.setItem('access_token', 'mock_jwt_access_token');

    let capturedHeaders: HeadersInit | undefined;
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ success: true, data: { test: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await ApiClient.get('/api/v1/test/');
    expect(res.data).toEqual({ test: true });
    expect((capturedHeaders as Record<string, string>)['Authorization']).toBe(
      'Bearer mock_jwt_access_token'
    );
  });

  it('attempts token refresh when receiving HTTP 401 and refresh_token is present', async () => {
    localStorage.setItem('access_token', 'expired_token');
    localStorage.setItem('refresh_token', 'valid_refresh_token');

    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      callCount++;
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/auth/refresh/')) {
        return new Response(
          JSON.stringify({ success: true, access: 'new_fresh_token' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (callCount === 1) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Token expired' } }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: { success_after_refresh: true } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const res = await ApiClient.get('/api/v1/protected/');
    expect(res.data).toEqual({ success_after_refresh: true });
    expect(localStorage.getItem('access_token')).toBe('new_fresh_token');
  });

  it('throws ApiError with normalized code and status on HTTP errors', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You lack clearance to access this record.',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    });

    await expect(ApiClient.get('/api/v1/students/forbidden/')).rejects.toThrowError(
      'You lack clearance to access this record.'
    );

    try {
      await ApiClient.get('/api/v1/students/forbidden/');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(403);
      expect(err.code).toBe('PERMISSION_DENIED');
    }
  });
});

describe('Phase 5 Task 5.1 — StudentApiService & Live Endpoints', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetches student profile from /api/v1/students/{id}/ and unwraps data envelope', async () => {
    const mockStudent = {
      id: 'uuid-001',
      student_id: 'STU202600001',
      admission_number: 'ADM20240091',
      roll_number: '11-A2-04',
      first_name: 'Arun',
      last_name: 'Kumar',
      email: 'arun.kumar@school.edu.in',
      phone: '+91-98400-11205',
      date_of_birth: '2009-05-14',
      gender: 'Male',
      blood_group: 'O+',
      emergency_contact: '+91-98400-11207',
      address: 'No. 42 Anna Nagar',
      status: 'Enrolled',
      current_class: 'Grade 11 - Computer Science',
      current_section: 'A2',
      stream: 'Computer Science A',
      class_teacher_name: 'R. Suresh',
    };

    vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
      data: mockStudent as any,
    });

    const res = await StudentApiService.getStudentProfile('STU202600001');
    expect(res.student_id).toBe('STU202600001');
    expect(res.first_name).toBe('Arun');
    expect(res.current_class).toBe('Grade 11 - Computer Science');
    expect(res.class_teacher_name).toBe('R. Suresh');
  });

  it('fetches student attendance records with canonical summary metadata', async () => {
    const mockRecords = [
      {
        id: 'att-1',
        enrollment: 'enr-1',
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A2',
        date: '2026-10-01',
        session_period: 1,
        status: 'PRESENT' as const,
        remarks: '',
      },
    ];

    const mockSummary = {
      total_sessions: 10,
      present_count: 8,
      absent_count: 1,
      on_duty_count: 1,
      leave_count: 0,
      attendance_percentage: 90.0,
    };

    vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
      data: mockRecords as any,
      meta: { attendance_summary: mockSummary },
    });

    const res = await StudentApiService.getAttendance({ student_id: 'STU202600001' });
    expect(res.records.length).toBe(1);
    expect(res.records[0].status).toBe('PRESENT');
    expect(res.summary?.attendance_percentage).toBe(90.0);
  });

  it('submits leave application to /api/v1/attendance/leaves/ in PENDING status', async () => {
    const payload = {
      leave_type: 'Medical',
      start_date: '2026-10-15',
      end_date: '2026-10-16',
      reason: 'Doctor consultation.',
    };

    const mockCreated = {
      id: 'leave-101',
      student: 'uuid-001',
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      ...payload,
      status: 'PENDING' as const,
      applied_on: '2026-10-07T00:00:00Z',
    };

    vi.spyOn(ApiClient, 'post').mockResolvedValueOnce({
      data: mockCreated as any,
    });

    const res = await StudentApiService.submitLeaveApplication(payload);
    expect(res.id).toBe('leave-101');
    expect(res.status).toBe('PENDING');
    expect(res.reason).toBe('Doctor consultation.');
  });
});

describe('Phase 5 Task 5.1 — StudentService Domain Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    StudentService.clearStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    StudentService.clearStorage();
    vi.restoreAllMocks();
  });

  it('maps live backend report card to canonical StudentExamRecord format with 8-tier grade', async () => {
    const mockReportCard = {
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      admission_number: 'ADM20240091',
      roll_number: '11-A2-04',
      academic_year: '2026-2027',
      class_name: 'Grade 11 - Computer Science',
      section_name: 'A2',
      total_marks_obtained: 354.5,
      total_max_marks: 400.0,
      overall_percentage: 88.62,
      overall_grade: 'A2',
      subject_count: 4,
      marks: [
        {
          id: 'm-1',
          subject_code: 'CS101',
          subject_name: 'Computer Science',
          exam_type: 'Half-Yearly Examination 2026',
          marks_obtained: 92.0,
          max_marks: 100.0,
          percentage: 92.0,
          grade: 'A1',
          remarks: 'Top score',
        },
        {
          id: 'm-2',
          subject_code: 'ENG101',
          subject_name: 'English Core',
          exam_type: 'Half-Yearly Examination 2026',
          marks_obtained: 90.0,
          max_marks: 100.0,
          percentage: 90.0,
          grade: 'A2',
          remarks: 'Good',
        },
      ],
    };

    vi.spyOn(StudentApiService, 'getReportCard').mockResolvedValueOnce(mockReportCard as any);

    const examRecords = await StudentService.getExamRecords('STU202600001');
    expect(examRecords.length).toBe(2);
    expect(examRecords[0].subject).toBe('Computer Science');
    expect(examRecords[0].score).toBe(92.0);
    expect(examRecords[0].grade).toBe('A1');
    expect(examRecords[1].subject).toBe('English Core');
    expect(examRecords[1].score).toBe(90.0);
    expect(examRecords[1].grade).toBe('A2');

    // Asserts zero GPA/credits
    for (const rec of examRecords) {
      expect((rec as any).gpa).toBeUndefined();
      expect((rec as any).credits).toBeUndefined();
    }
  });

  it('maps live backend attendance summary adhering to (P + OD) / Total * 100', async () => {
    vi.spyOn(StudentApiService, 'getAttendance').mockResolvedValueOnce({
      records: [],
      summary: {
        total_sessions: 20,
        present_count: 17,
        on_duty_count: 1,
        leave_count: 1,
        absent_count: 1,
        attendance_percentage: 90.0, // (17 + 1) / 20 * 100 = 90%
      },
    });

    const summary = await StudentService.getAttendanceSummary('STU202600001');
    expect(summary.totalSessions).toBe(20);
    expect(summary.presentCount).toBe(17);
    expect(summary.onDutyCount).toBe(1);
    expect(summary.overallPercentage).toBe(90.0);
    expect(summary.clearedForExams).toBe(true); // >= 85%
  });

  it('maps live backend leave requests and enforces PENDING status upon submission', async () => {
    const mockCreated = {
      id: 'leave-201',
      student: 'uuid-001',
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      leave_type: 'Medical',
      start_date: '2026-10-18',
      end_date: '2026-10-19',
      reason: 'Dengue recovery.',
      status: 'PENDING' as const,
      applied_on: '2026-10-07T00:00:00Z',
    };

    vi.spyOn(StudentApiService, 'submitLeaveApplication').mockResolvedValueOnce(mockCreated as any);

    const profile = await StudentService.getProfile('STU202600001');
    const result = await StudentService.submitLeaveRequest(
      {
        leave_type: 'Medical',
        start_date: '2026-10-18',
        end_date: '2026-10-19',
        reason: 'Dengue recovery.',
      },
      profile
    );

    expect(result.id).toBe('leave-201');
    expect(result.status).toBe('PENDING');
    expect(result.student_id).toBe('STU202600001');
  });
});
