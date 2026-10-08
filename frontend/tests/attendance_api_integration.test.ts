/**
 * Student ERP — Phase 5 Task 5.5 Frontend Verification Suite
 * Attendance API Integration + Oversight
 *
 * Covers:
 * 1. AttendanceApiService communication with backend endpoints:
 *    - /api/v1/attendance/summary/ (Admin daily attendance overview)
 *    - /api/v1/attendance/analytics/ (Principal attendance telemetry & 4-status distribution)
 *    - /api/v1/attendance/absentees/ (Student absentees - strictly ABSENT only)
 *    - /api/v1/attendance/not-entered/ (Scheduled sessions with no attendance submission)
 *    - /api/v1/attendance/ (Attendance records query)
 * 2. AdminService attendance oversight integration & fallback resilience
 * 3. PrincipalService attendance analytics integration & fallback resilience
 * 4. AllocationService student absentees and not-entered integration & fallback resilience
 * 5. Strict canonical 4-status compliance: PRESENT, ABSENT, ON_DUTY, LEAVE
 * 6. Correct attendance percentage formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 * 7. Error handling and fallback behavior when API is unavailable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AttendanceApiService } from '../src/services/attendanceApiService';
import { AdminService } from '../src/features/admin/services/adminService';
import { AdminApiService } from '../src/features/admin/services/adminApiService';
import { PrincipalService } from '../src/features/principal/services/principalService';
import { AllocationService } from '../src/services/allocationService';
import {
  ATTENDANCE_STATUSES,
  calculateAttendancePercentage,
  isAttending,
  isAbsence,
} from '../src/utils/attendance';
import type { AdminAttendanceOverviewItem } from '../src/features/admin/types';
import type { PrincipalAttendanceTelemetry } from '../src/features/principal/types';
import type { StudentAbsenteeItem, AttendanceNotEnteredItem } from '../src/types';

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

describe('Phase 5 Task 5.5 — Attendance Integration & Oversight Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    AllocationService.resetState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    AllocationService.resetState();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Canonical 4-Status Rules & Percentages
  // ==========================================================================
  describe('Canonical 4-Status & Percentage Formulas', () => {
    it('enforces exactly 4 canonical statuses and rejects legacy statuses', () => {
      expect(ATTENDANCE_STATUSES).toEqual(['PRESENT', 'ABSENT', 'ON_DUTY', 'LEAVE']);
      expect(ATTENDANCE_STATUSES).not.toContain('LATE');
      expect(ATTENDANCE_STATUSES).not.toContain('EXCUSED');
    });

    it('correctly calculates percentage: (PRESENT + ON_DUTY) / (P + A + OD + L) * 100', () => {
      // 10 Present, 2 Absent, 3 On-Duty, 5 Leave => 13 presence / 20 total = 65.0%
      const pct = calculateAttendancePercentage({
        present: 10,
        absent: 2,
        onDuty: 3,
        leave: 5,
      });
      expect(pct).toBe(65);
    });

    it('verifies ON_DUTY counts as presence and LEAVE counts as absence', () => {
      expect(isAttending('PRESENT')).toBe(true);
      expect(isAttending('ON_DUTY')).toBe(true);
      expect(isAttending('ABSENT')).toBe(false);
      expect(isAttending('LEAVE')).toBe(false);

      expect(isAbsence('ABSENT')).toBe(true);
      expect(isAbsence('LEAVE')).toBe(true);
      expect(isAbsence('PRESENT')).toBe(false);
      expect(isAbsence('ON_DUTY')).toBe(false);
    });
  });

  // ==========================================================================
  // 2. AttendanceApiService Direct API Integration
  // ==========================================================================
  describe('AttendanceApiService Direct API Methods', () => {
    it('calls getAttendanceOverview with date parameter', async () => {
      localStorage.setItem('access_token', 'mock_jwt_token');

      const mockOverviewData: AdminAttendanceOverviewItem[] = [
        {
          date: '2026-10-08',
          class_id: 'cls-1',
          class_name: 'Grade 11 — Section A1',
          stream: 'Computer Science A',
          section_name: 'Section A1',
          total_students: 30,
          present_count: 28,
          on_duty_count: 1,
          leave_count: 1,
          absent_count: 0,
          attendance_percentage: 96.7,
          verified_by: 'Suresh Kumar',
          session_status: 'Completed',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockOverviewData,
        }),
      } as any);

      const result = await AttendanceApiService.getAttendanceOverview({ date: '2026-10-08' });
      expect(result).toHaveLength(1);
      expect(result[0].class_name).toBe('Grade 11 — Section A1');
      expect(result[0].attendance_percentage).toBe(96.7);
      expect(result[0].on_duty_count).toBe(1);
      expect(result[0].session_status).toBe('Completed');
    });

    it('calls getAttendanceAnalytics with telemetry response', async () => {
      localStorage.setItem('access_token', 'mock_jwt_token');

      const mockAnalytics: PrincipalAttendanceTelemetry = {
        overallPresenceRate: 95.5,
        totalSessions: 450,
        statusDistribution: [
          { status: 'PRESENT', label: 'Present', count: 420, percentage: 93.3, color: '#10b981', countsAs: 'Presence', description: 'Present' },
          { status: 'ON_DUTY', label: 'On Duty', count: 10, percentage: 2.2, color: '#0ea5e9', countsAs: 'Presence', description: 'On Duty' },
          { status: 'LEAVE', label: 'Leave', count: 12, percentage: 2.7, color: '#f59e0b', countsAs: 'Absence', description: 'Leave' },
          { status: 'ABSENT', label: 'Absent', count: 8, percentage: 1.8, color: '#ef4444', countsAs: 'Absence', description: 'Absent' },
        ],
        cohortMonthlyTrends: [
          { month: 'Jun', gr9: 95.0, gr10: 94.5, gr11: 96.0, gr12: 95.2 },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockAnalytics,
        }),
      } as any);

      const result = await AttendanceApiService.getAttendanceAnalytics();
      expect(result.overallPresenceRate).toBe(95.5);
      expect(result.statusDistribution).toHaveLength(4);
      expect(result.statusDistribution.find((s) => s.status === 'ON_DUTY')?.countsAs).toBe('Presence');
      expect(result.statusDistribution.find((s) => s.status === 'LEAVE')?.countsAs).toBe('Absence');
    });

    it('calls getStudentAbsentees with search and grade filtering', async () => {
      localStorage.setItem('access_token', 'mock_jwt_token');

      const mockAbsentees: StudentAbsenteeItem[] = [
        {
          id: 'att-1',
          student_id: 'STU202655001',
          student_name: 'Keerthana Suresh',
          grade_name: 'Grade 11 — Computer Science',
          section_name: 'A1',
          stream: 'Computer Science A',
          subject_name: 'Computer Science',
          date: '2026-10-08',
          period: 1,
          status: 'ABSENT',
          faculty_name: 'Suresh Kumar',
          faculty_id: 'fac-1',
          class_id: 'cls-1',
          section_id: 'sec-1',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockAbsentees,
        }),
      } as any);

      const result = await AttendanceApiService.getStudentAbsentees({
        date: '2026-10-08',
        grade: 'Grade 11',
        search: 'Keerthana',
      });

      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Keerthana Suresh');
      expect(result[0].status).toBe('ABSENT');
    });

    it('calls getAttendanceNotEntered for pending sessions', async () => {
      localStorage.setItem('access_token', 'mock_jwt_token');

      const mockNotEntered: AttendanceNotEnteredItem[] = [
        {
          id: 'ne-1',
          date: '2026-10-08',
          grade_name: 'Grade 11 — Computer Science',
          stream: 'Computer Science A',
          section_name: 'Section A2',
          subject_name: 'Mathematics',
          period: 'Period 1 (08:30 - 09:15)',
          faculty_name: 'Priya Sharma',
          faculty_id: 'fac-2',
          class_id: 'cls-1',
          section_id: 'sec-2',
          session_status: 'NOT ENTERED',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockNotEntered,
        }),
      } as any);

      const result = await AttendanceApiService.getAttendanceNotEntered({
        date: '2026-10-08',
      });

      expect(result).toHaveLength(1);
      expect(result[0].grade_name).toBe('Grade 11 — Computer Science');
      expect(result[0].faculty_name).toBe('Priya Sharma');
      expect(result[0].session_status).toBe('NOT ENTERED');
    });
  });

  // ==========================================================================
  // 3. AdminService Integration & Fallback
  // ==========================================================================
  describe('AdminService Attendance Integration', () => {
    it('returns live overview when API succeeds and user is authenticated', async () => {
      localStorage.setItem('access_token', 'test_token');

      vi.spyOn(AttendanceApiService, 'getAttendanceOverview').mockResolvedValueOnce([
        {
          date: '2026-10-08',
          class_id: 'cls-1',
          class_name: 'Grade 11 — Section A1',
          stream: 'Computer Science A',
          section_name: 'Section A1',
          total_students: 30,
          present_count: 29,
          on_duty_count: 1,
          leave_count: 0,
          absent_count: 0,
          attendance_percentage: 100.0,
          verified_by: 'Suresh Kumar',
          session_status: 'Completed',
        },
      ]);

      const data = await AdminService.getAttendanceOverview('2026-10-08');
      expect(data).toHaveLength(1);
      expect(data[0].class_name).toBe('Grade 11 — Section A1');
      expect(data[0].attendance_percentage).toBe(100.0);
    });

    it('falls back gracefully to cached mock data if API fails', async () => {
      localStorage.setItem('access_token', 'test_token');

      vi.spyOn(AttendanceApiService, 'getAttendanceOverview').mockRejectedValueOnce(
        new Error('Network error')
      );

      const data = await AdminService.getAttendanceOverview();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('attendance_percentage');
    });

    it('wires AdminApiService.getAttendanceOverview properly', async () => {
      const mockResult: AdminAttendanceOverviewItem[] = [
        {
          date: '2026-10-08',
          class_id: 'cls-1',
          class_name: 'Grade 10 — Section A',
          section_name: 'Section A',
          total_students: 32,
          present_count: 30,
          on_duty_count: 0,
          leave_count: 1,
          absent_count: 1,
          attendance_percentage: 93.8,
          verified_by: 'Staff',
          session_status: 'Completed',
        },
      ];

      vi.spyOn(AttendanceApiService, 'getAttendanceOverview').mockResolvedValueOnce(mockResult);
      const res = await AdminApiService.getAttendanceOverview('2026-10-08');
      expect(res).toEqual(mockResult);
    });
  });

  // ==========================================================================
  // 4. PrincipalService Integration & Fallback
  // ==========================================================================
  describe('PrincipalService Attendance Integration', () => {
    it('returns live analytics when API succeeds and user is authenticated', async () => {
      localStorage.setItem('access_token', 'test_token');

      const mockTelemetry: PrincipalAttendanceTelemetry = {
        overallPresenceRate: 96.2,
        totalSessions: 500,
        statusDistribution: [
          { status: 'PRESENT', label: 'Present', count: 470, percentage: 94.0, color: '#10b981', countsAs: 'Presence', description: 'Present' },
          { status: 'ON_DUTY', label: 'On Duty', count: 11, percentage: 2.2, color: '#0ea5e9', countsAs: 'Presence', description: 'On Duty' },
          { status: 'LEAVE', label: 'Leave', count: 10, percentage: 2.0, color: '#f59e0b', countsAs: 'Absence', description: 'Leave' },
          { status: 'ABSENT', label: 'Absent', count: 9, percentage: 1.8, color: '#ef4444', countsAs: 'Absence', description: 'Absent' },
        ],
        cohortMonthlyTrends: [],
      };

      vi.spyOn(AttendanceApiService, 'getAttendanceAnalytics').mockResolvedValueOnce(mockTelemetry);

      const res = await PrincipalService.getAttendanceAnalytics();
      expect(res.overallPresenceRate).toBe(96.2);
      expect(res.statusDistribution).toHaveLength(4);
    });

    it('falls back gracefully to telemetry mock data if API fails', async () => {
      localStorage.setItem('access_token', 'test_token');

      vi.spyOn(AttendanceApiService, 'getAttendanceAnalytics').mockRejectedValueOnce(
        new Error('Network offline')
      );

      const res = await PrincipalService.getAttendanceAnalytics();
      expect(res).toHaveProperty('overallPresenceRate');
      expect(res).toHaveProperty('statusDistribution');
      expect(res.statusDistribution.length).toBe(4);
    });
  });

  // ==========================================================================
  // 5. AllocationService Absentees and Not Entered Integration
  // ==========================================================================
  describe('AllocationService Student Absentees & Not Entered Integration', () => {
    it('returns live student absentees filtered strictly to ABSENT records', async () => {
      localStorage.setItem('access_token', 'test_token');

      const mockAbsentees: StudentAbsenteeItem[] = [
        {
          id: 'abs-1',
          student_id: 'STU202655001',
          student_name: 'Keerthana Suresh',
          grade_name: 'Grade 11 — Computer Science',
          stream: 'Computer Science A',
          section_name: 'Section A1',
          subject_name: 'Computer Science',
          date: '2026-10-08',
          period: 1,
          status: 'ABSENT',
          faculty_name: 'Suresh Kumar',
          faculty_id: 'fac-1',
          class_id: 'cls-1',
          section_id: 'sec-1',
        },
      ];

      vi.spyOn(AttendanceApiService, 'getStudentAbsentees').mockResolvedValueOnce(mockAbsentees);

      const result = await AllocationService.getStudentAbsentees({ date: '2026-10-08' });
      expect(result).toHaveLength(1);
      expect(result[0].student_name).toBe('Keerthana Suresh');
      expect(result[0].status).toBe('ABSENT');
    });

    it('falls back gracefully to mock absentees if API fails', async () => {
      localStorage.setItem('access_token', 'test_token');

      vi.spyOn(AttendanceApiService, 'getStudentAbsentees').mockRejectedValueOnce(
        new Error('API 500 error')
      );

      const result = await AllocationService.getStudentAbsentees();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((record) => {
        expect(record.status).toBe('ABSENT');
      });
    });

    it('returns live attendance not entered records', async () => {
      localStorage.setItem('access_token', 'test_token');

      const mockNotEntered: AttendanceNotEnteredItem[] = [
        {
          id: 'ne-1',
          date: '2026-10-08',
          grade_name: 'Grade 11 — Computer Science',
          stream: 'Computer Science A',
          section_name: 'Section A2',
          subject_name: 'Mathematics',
          period: 2,
          faculty_name: 'Priya Sharma',
          faculty_id: 'fac-2',
          class_id: 'cls-1',
          section_id: 'sec-2',
          session_status: 'NOT ENTERED',
        },
      ];

      vi.spyOn(AttendanceApiService, 'getAttendanceNotEntered').mockResolvedValueOnce(mockNotEntered);

      const result = await AllocationService.getAttendanceNotEntered({ date: '2026-10-08' });
      expect(result).toHaveLength(1);
      expect(result[0].faculty_name).toBe('Priya Sharma');
      expect(result[0].session_status).toBe('NOT ENTERED');
    });

    it('falls back gracefully to mock not entered if API fails', async () => {
      localStorage.setItem('access_token', 'test_token');

      vi.spyOn(AttendanceApiService, 'getAttendanceNotEntered').mockRejectedValueOnce(
        new Error('API 500 error')
      );

      const result = await AllocationService.getAttendanceNotEntered();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((record) => {
        expect(record.session_status).toBe('NOT ENTERED');
      });
    });
  });
});
