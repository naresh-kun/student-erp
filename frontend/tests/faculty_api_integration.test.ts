/**
 * Student ERP — Phase 5 Task 5.3 Frontend Verification Suite
 * Core ERP API Integration: Faculty Module Service & API Tests
 *
 * Covers:
 * 1. FacultyApiService communication with /api/v1/ faculty profile, classes, students, attendance, marks, homework
 * 2. FacultyService live API data mapping into canonical domain types
 * 3. Assigned classes & TeachingAssignment mapping with Class Teacher status
 * 4. Scoped students mapping with immutable student identifiers
 * 5. Roll call attendance bulk recording (canonical 4 statuses: PRESENT, ABSENT, ON_DUTY, LEAVE)
 * 6. Class Teacher leave application review workflow (APPROVED, REJECTED)
 * 7. Marks entry & TeachingAssignment authority (CBSE grading, 0–100 scale)
 * 8. Homework management within authorized teaching scope (MOD_001)
 * 9. Offline / fallback resilience when API endpoints are unreachable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FacultyApiService } from '../src/features/faculty/services/facultyApiService';
import { FacultyService } from '../src/features/faculty/services/facultyService';
import type { AttendanceSessionContext, AttendanceRollCallItem, FacultyMarkEntryItem } from '../src/features/faculty/types';

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

describe('Phase 5 Task 5.3 — FacultyApiService', () => {
  beforeEach(() => {
    localStorage.clear();
    FacultyService.clearStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    FacultyService.clearStorage();
    vi.restoreAllMocks();
  });

  it('fetches faculty profile via /api/v1/faculty/me/', async () => {
    const mockProfile = {
      id: 'fac_uuid_001',
      employee_code: 'FAC2026001',
      department: 'Computer Science',
      designation: 'Senior Lecturer',
      qualification: 'M.Tech, Ph.D in Computer Science',
      specialization: 'Distributed Systems & Compiler Design',
      office_room: 'Lab 1 Staff Room',
      joining_date: '2020-06-01',
      is_active: true,
      status: 'Active',
      full_name: 'Suresh Kumar',
      class_teacher_of: {
        class_id: 'cls_001',
        section_id: 'sec_001',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A1',
        room: 'Lab 1',
      },
      assigned_classes_count: 2,
      assigned_students_count: 35,
      weekly_periods: 18,
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/faculty/me/');
      return new Response(JSON.stringify({ success: true, data: mockProfile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await FacultyApiService.getFacultyProfile();
    expect(res.id).toBe('fac_uuid_001');
    expect(res.employee_code).toBe('FAC2026001');
    expect(res.department).toBe('Computer Science');
    expect(res.class_teacher_of?.section_name).toBe('A1');
  });

  it('fetches assigned classes via /api/v1/faculty/me/classes/', async () => {
    const mockClasses = [
      {
        id: 'ta_001',
        class_id: 'cls_001',
        section_id: 'sec_001',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A1',
        display_name: 'Grade 11 - CS (A1)',
        subject_id: 'sub_001',
        subject: 'Computer Science',
        subject_code: 'CS101',
        room: 'Lab 1',
        student_count: 35,
        is_class_teacher: true,
        periods_per_week: 6,
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/faculty/me/classes/');
      return new Response(JSON.stringify({ success: true, data: mockClasses }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await FacultyApiService.getAssignedClasses();
    expect(res.length).toBe(1);
    expect(res[0].subject_code).toBe('CS101');
    expect(res[0].is_class_teacher).toBe(true);
  });

  it('fetches assigned students via /api/v1/students/?section_id=...', async () => {
    const mockStudents = [
      {
        id: 'stu_001',
        student_id: 'STU2026001',
        admission_number: 'ADM20240091',
        roll_number: '11A1-01',
        first_name: 'Arun',
        last_name: 'Kumar',
        full_name: 'Arun Kumar',
        gender: 'Male',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A1',
        status: 'Enrolled',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/students/');
      return new Response(JSON.stringify({ success: true, data: mockStudents }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await FacultyApiService.getAssignedStudents('sec_001');
    expect(res.length).toBe(1);
    expect(res[0].student_id).toBe('STU2026001');
  });

  it('records bulk attendance via /api/v1/attendance/bulk/', async () => {
    let capturedBody = '';
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/attendance/bulk/');
      capturedBody = String(init?.body || '');
      return new Response(JSON.stringify({ success: true, data: { saved_count: 1 } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await FacultyApiService.recordBulkAttendance({
      date: '2026-10-07',
      records: [
        {
          student_id: 'STU2026001',
          status: 'PRESENT',
          remarks: 'Morning lab',
        },
      ],
    });

    expect(res.saved_count).toBe(1);
    const parsed = JSON.parse(capturedBody);
    expect(parsed.records[0].status).toBe('PRESENT');
  });

  it('reviews leave application via PATCH /api/v1/attendance/leaves/{id}/', async () => {
    let capturedMethod = '';
    let capturedBody = '';
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/attendance/leaves/leave_001/');
      capturedMethod = String(init?.method);
      capturedBody = String(init?.body);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'leave_001',
            status: 'APPROVED',
            review_remarks: 'Sanctioned per prescription',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const res = await FacultyApiService.reviewLeaveApplication('leave_001', 'APPROVED', 'Sanctioned per prescription');
    expect(capturedMethod).toBe('PATCH');
    expect(res.status).toBe('APPROVED');
    const parsed = JSON.parse(capturedBody);
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.review_remarks).toBe('Sanctioned per prescription');
  });

  it('records bulk marks via /api/v1/marks/bulk/', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/marks/bulk/');
      return new Response(JSON.stringify({ success: true, data: { saved_count: 1 } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await FacultyApiService.recordBulkMarks({
      records: [
        {
          student_id: 'STU2026001',
          subject_id: 'sub_001',
          exam_type_id: 'exam_001',
          marks_obtained: 92.5,
          max_marks: 100,
        },
      ],
    });

    expect(res.saved_count).toBe(1);
  });

  it('manages homework via /api/v1/homework/', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 'hw_001', title: 'Binary Trees Assignment', status: 'PUBLISHED' },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (init?.method === 'PATCH') {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 'hw_001', title: 'Updated Trees Assignment', status: 'PUBLISHED' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (init?.method === 'DELETE') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: [{ id: 'hw_001', title: 'Binary Trees Assignment', status: 'PUBLISHED' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const list = await FacultyApiService.getHomework();
    expect(list.length).toBe(1);

    const created = await FacultyApiService.createHomework({
      title: 'Binary Trees Assignment',
      due_date: '2026-10-15',
    });
    expect(created.id).toBe('hw_001');

    const updated = await FacultyApiService.updateHomework('hw_001', { title: 'Updated Trees Assignment' });
    expect(updated.title).toBe('Updated Trees Assignment');

    await expect(FacultyApiService.deleteHomework('hw_001')).resolves.not.toThrow();
  });
});

describe('Phase 5 Task 5.3 — FacultyService Live Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    FacultyService.clearStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    FacultyService.clearStorage();
    vi.restoreAllMocks();
  });

  it('delegates getFacultyProfile to live API and maps into FacultyProfile domain type', async () => {
    const mockLiveProfile = {
      id: 'fac_suresh_live',
      employee_code: 'FAC2026001',
      department: 'Computer Science',
      designation: 'Senior Lecturer',
      qualification: 'M.Tech, Ph.D',
      specialization: 'System Architecture',
      office_room: 'Room 101',
      joining_date: '2020-06-01',
      is_active: true,
      status: 'Active',
      full_name: 'Suresh Kumar',
      class_teacher_of: {
        class_id: 'cls_001',
        section_id: 'sec_001',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A1',
        room: 'Lab 1',
      },
      assigned_classes_count: 2,
      assigned_students_count: 35,
      weekly_periods: 20,
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockLiveProfile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const profile = await FacultyService.getFacultyProfile();
    expect(profile.id).toBe('fac_suresh_live');
    expect(profile.employee_code).toBe('FAC2026001');
    expect(profile.full_name).toBe('Suresh Kumar');
    expect(profile.class_teacher_of?.class_name).toBe('Grade 11 - Computer Science');
    expect(profile.weekly_periods).toBe(20);
  });

  it('delegates getAssignedClasses to live API and maps into FacultyAssignedClass domain types', async () => {
    const mockLiveClasses = [
      {
        id: 'ta_101',
        class_id: 'cls_001',
        section_id: 'sec_001',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A1',
        display_name: 'Grade 11 - CS (A1)',
        subject_id: 'sub_001',
        subject: 'Computer Science',
        subject_code: 'CS101',
        room: 'Lab 1',
        student_count: 35,
        is_class_teacher: true,
        periods_per_week: 6,
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockLiveClasses }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const classes = await FacultyService.getAssignedClasses();
    expect(classes.length).toBe(1);
    expect(classes[0].subject_code).toBe('CS101');
    expect(classes[0].is_class_teacher).toBe(true);
    expect(classes[0].grade_level).toBe(11);
  });

  it('delegates getAssignedStudents to live API and derives roll_number and status', async () => {
    const mockLiveStudents = [
      {
        id: 'stu_live_001',
        student_id: 'STU2026001',
        admission_number: 'ADM20240091',
        roll_number: '11A1-01',
        first_name: 'Arun',
        last_name: 'Kumar',
        full_name: 'Arun Kumar',
        gender: 'Male',
        class_name: 'Grade 11 - Computer Science',
        section_name: 'A1',
        status: 'Enrolled',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockLiveStudents }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const students = await FacultyService.getAssignedStudents('sec_001');
    expect(students.length).toBe(1);
    expect(students[0].student_id).toBe('STU2026001');
    expect(students[0].full_name).toBe('Arun Kumar');
    expect(students[0].status).toBe('Active');
  });

  it('delegates getPendingLeaveNotices and reviewLeaveNotice to live API', async () => {
    const mockLeaves = [
      {
        id: 'leave_app_001',
        student: 'stu_001',
        student_id: 'STU2026001',
        student_name: 'Arun Kumar',
        leave_type: 'Medical',
        start_date: '2026-10-08',
        end_date: '2026-10-09',
        reason: 'Viral fever rest',
        status: 'PENDING',
        applied_on: '2026-10-07T08:00:00Z',
        reviewed_by: null,
        reviewed_by_name: null,
        reviewed_at: null,
        review_remarks: '',
      },
    ];

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: mockLeaves }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              ...mockLeaves[0],
              status: 'APPROVED',
              reviewed_by_name: 'Suresh Kumar',
              reviewed_at: '2026-10-07T09:00:00Z',
              review_remarks: 'Sanctioned',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    const notices = await FacultyService.getPendingLeaveNotices();
    expect(notices.length).toBe(1);
    expect(notices[0].id).toBe('leave_app_001');
    expect(notices[0].status).toBe('PENDING_FACULTY_REVIEW');

    const reviewed = await FacultyService.reviewLeaveNotice('leave_app_001', 'APPROVE', 'fac_001', 'Suresh Kumar', 'Sanctioned');
    expect(reviewed.status).toBe('LEAVE');
    expect(reviewed.approved_by_name).toBe('Suresh Kumar');
  });

  it('submits attendance roll call and syncs to live API', async () => {
    const context: AttendanceSessionContext = {
      academic_year: '2026–27',
      date: '2026-10-07',
      class_id: 'cls_001',
      section_id: 'sec_001',
      class_display: 'Grade 11 - CS (A1)',
      subject: 'Computer Science',
      period: 'Period 1 (08:30 - 09:15)',
      session_state: 'In Progress',
    };

    const records: AttendanceRollCallItem[] = [
      {
        id: 'rec_1',
        student_id: 'STU2026001',
        roll_number: '11A1-01',
        name: 'Arun Kumar',
        historical_rate: 95.0,
        status: 'PRESENT',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { saved_count: 1 } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await FacultyService.submitAttendanceRollCall(context, records, 'Suresh Kumar');
    expect(res.success).toBe(true);
    expect(res.percentage).toBe(100);
    expect(res.summary.present).toBe(1);
  });

  it('saves marks entry sheet and syncs to live API', async () => {
    const entries: FacultyMarkEntryItem[] = [
      {
        student_id: 'STU2026001',
        roll_number: '11A1-01',
        student_name: 'Arun Kumar',
        score: 88,
        derived_percentage: 88,
        derived_grade: 'A2',
        feedback: 'Good work',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { saved_count: 1 } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await FacultyService.saveMarksEntrySheet('cls_001', 'CS101', 'UT1', entries);
    expect(res.success).toBe(true);
    expect(res.summary.highest_score).toBe(88);
    expect(res.summary.pass_rate).toBe(100);
  });

  it('falls back seamlessly to seed data and local storage when live API is unreachable', async () => {
    // Network failure
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    // 1. Profile fallback
    const profile = await FacultyService.getFacultyProfile();
    expect(profile.employee_code).toBe('FAC-MATH-012');

    // 2. Classes fallback
    const classes = await FacultyService.getAssignedClasses();
    expect(classes.length).toBeGreaterThanOrEqual(1);

    // 3. Students fallback
    const students = await FacultyService.getAssignedStudents('sec_002');
    expect(students.length).toBeGreaterThanOrEqual(1);

    // 4. Pending notices fallback
    const notices = await FacultyService.getPendingLeaveNotices();
    expect(notices.length).toBeGreaterThanOrEqual(1);
  });
});
