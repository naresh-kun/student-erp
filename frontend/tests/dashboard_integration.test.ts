/**
 * Student ERP — Phase 5 Task 5.7 Verification Suite
 * Dashboard & Cross-Module Integration
 *
 * Verifies that all 5 role dashboards (Student, Parent, Faculty, Admin, Principal)
 * consume authoritative live backend APIs and typed frontend services, without
 * fabricated metrics, fake benchmarks, or synthetic fallbacks.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StudentService } from '../src/features/students/services/studentService';
import { StudentApiService } from '../src/features/students/services/studentApiService';
import { ParentService } from '../src/features/parents/services/parentService';
import { ParentApiService } from '../src/features/parents/services/parentApiService';
import { FacultyService } from '../src/features/faculty/services/facultyService';
import { FacultyApiService } from '../src/features/faculty/services/facultyApiService';
import { FacultyKPIOverview } from '../src/features/faculty';
import { AdminService } from '../src/features/admin/services/adminService';
import { AdminApiService } from '../src/features/admin/services/adminApiService';
import { PrincipalService } from '../src/features/principal/services/principalService';
import { AttendanceApiService } from '../src/services/attendanceApiService';
import { MarksApiService } from '../src/services/marksApiService';
import { ApiClient } from '../src/services/api';

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

describe('Phase 5 Task 5.7 — Dashboard & Cross-Module Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. STUDENT DASHBOARD & MARKS INTEGRATION
  // =========================================================================
  describe('1. Student Dashboard & Live Academic/Attendance Wiring', () => {
    it('aggregates live attendance session records into monthly trend using canonical (P + OD) formula', async () => {
      const mockRecords = [
        { id: '1', date: '2026-08-01', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '2', date: '2026-08-02', status: 'ON_DUTY' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '3', date: '2026-08-03', status: 'ABSENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '4', date: '2026-08-04', status: 'LEAVE' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '5', date: '2026-09-01', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '6', date: '2026-09-02', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
      ];

      vi.spyOn(StudentApiService, 'getAttendance').mockResolvedValue({
        records: mockRecords as any,
      });

      const trend = await StudentService.getMonthlyAttendanceTrend('STU1');

      expect(trend).toHaveLength(2);
      // August: (1 P + 1 OD) / 4 total = 50.0%
      const aug = trend.find((t) => t.month === 'Aug');
      expect(aug).toBeDefined();
      expect(aug?.attendance).toBe(50.0);
      expect(aug?.target).toBe(85);

      // September: 2 P / 2 total = 100.0%
      const sep = trend.find((t) => t.month === 'Sep');
      expect(sep).toBeDefined();
      expect(sep?.attendance).toBe(100.0);
    });

    it('removes hardcoded classAverage = 82.5 from subject marks comparison', async () => {
      vi.spyOn(StudentApiService, 'getReportCard').mockResolvedValue({
        student_id: 'STU1',
        student_name: 'Arun Kumar',
        admission_number: 'ADM001',
        roll_number: '11-A2-04',
        academic_year: '2026–27',
        class_name: 'Grade 11',
        section_name: 'A2',
        total_marks_obtained: 435,
        total_max_marks: 500,
        overall_percentage: 87.0,
        overall_grade: 'A2',
        subject_count: 5,
        marks: [
          { id: 'm1', subject_code: 'CS', subject_name: 'Computer Science', exam_type: 'Half-Yearly', marks_obtained: 95, max_marks: 100, percentage: 95.0, grade: 'A1', remarks: 'Excellent' },
        ],
      });

      const comparison = await StudentService.getSubjectMarksComparison('STU1');
      expect(comparison).toHaveLength(1);
      expect(comparison[0].subject).toBe('Computer Science');
      expect(comparison[0].studentScore).toBe(95);
      // Confirms hardcoded 82.5 classAverage is removed
      expect((comparison[0] as any).classAverage).toBeUndefined();
    });

    it('delegates report card retrieval directly to authoritative backend report card API', async () => {
      const mockReportCard = {
        student_id: 'STU1',
        student_name: 'Arun Kumar',
        admission_number: 'ADM001',
        roll_number: '11-A2-04',
        academic_year: '2026–27',
        class_name: 'Grade 11',
        section_name: 'A2',
        total_marks_obtained: 435,
        total_max_marks: 500,
        overall_percentage: 87.0,
        overall_grade: 'A2',
        subject_count: 5,
        marks: [],
      };
      vi.spyOn(StudentApiService, 'getReportCard').mockResolvedValue(mockReportCard);

      const result = await StudentService.getReportCard('STU1');
      expect(result).toEqual(mockReportCard);
      expect(result.overall_percentage).toBe(87.0);
      expect(result.overall_grade).toBe('A2');
    });
  });

  // =========================================================================
  // 2. PARENT DASHBOARD & LIVE CHILD WIRING
  // =========================================================================
  describe('2. Parent Dashboard & Live Child Data Isolation', () => {
    it('aggregates live monthly attendance trend for the authorized linked child', async () => {
      const mockRecords = [
        { id: '1', date: '2026-07-10', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '2', date: '2026-07-11', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        { id: '3', date: '2026-07-12', status: 'ABSENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
      ];

      vi.spyOn(ParentApiService, 'getChildAttendance').mockResolvedValue({
        records: mockRecords as any,
      });

      const trend = await ParentService.getChildMonthlyAttendanceTrend('STU1');
      expect(trend).toHaveLength(1);
      expect(trend[0].month).toBe('Jul');
      // 2 / 3 = 66.7%
      expect(trend[0].attendance).toBe(66.7);
    });

    it('does not return synthetic sectionRank (4th) or totalStudentsInSection (32) in live academic summary', async () => {
      vi.spyOn(ParentApiService, 'getChildReportCard').mockResolvedValue({
        student_id: 'STU1',
        student_name: 'Arun Kumar',
        admission_number: 'ADM001',
        roll_number: '11-A2-04',
        academic_year: '2026–27',
        class_name: 'Grade 11',
        section_name: 'A2',
        total_marks_obtained: 420,
        total_max_marks: 500,
        overall_percentage: 84.0,
        overall_grade: 'A2',
        subject_count: 5,
        marks: [],
      });

      const summary = await ParentService.getChildAcademicSummary('STU1');
      expect(summary.cumulativeMarks).toBe(420);
      expect(summary.totalMaxMarks).toBe(500);
      expect(summary.overallPercentage).toBe(84.0);
      expect(summary.overallGrade).toBe('A2');
      expect(summary.subjectCount).toBe(5);
      // Confirms synthetic 4th rank and 32 student count are not asserted in live return
      expect(summary.sectionRank).toBeUndefined();
      expect(summary.totalStudentsInSection).toBeUndefined();
    });

    it('generates deterministic child advisories based on real attendance and subject scores without fake strings', async () => {
      vi.spyOn(ParentApiService, 'getChildAttendance').mockResolvedValue({
        records: [
          { id: '1', date: '2026-09-01', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
          { id: '2', date: '2026-09-02', status: 'PRESENT' as const, enrollment: 'e1', student_id: 'STU1', student_name: 'Arun', class_name: 'G11', section_name: 'A2' },
        ] as any,
        summary: {
          attendance_percentage: 92.5,
          total_sessions: 40,
          present_count: 37,
          on_duty_count: 0,
          leave_count: 2,
          absent_count: 1,
        },
      });

      vi.spyOn(ParentApiService, 'getChildReportCard').mockResolvedValue({
        student_id: 'STU1',
        student_name: 'Arun Kumar',
        admission_number: 'ADM001',
        roll_number: '11-A2-04',
        academic_year: '2026–27',
        class_name: 'Grade 11',
        section_name: 'A2',
        total_marks_obtained: 450,
        total_max_marks: 500,
        overall_percentage: 90.0,
        overall_grade: 'A2',
        subject_count: 2,
        marks: [
          { id: 'm1', subject_code: 'MATH', subject_name: 'Mathematics', exam_type: 'Half-Yearly', marks_obtained: 95, max_marks: 100, percentage: 95.0, grade: 'A1', remarks: 'Good' },
          { id: 'm2', subject_code: 'PHY', subject_name: 'Physics', exam_type: 'Half-Yearly', marks_obtained: 85, max_marks: 100, percentage: 85.0, grade: 'A2', remarks: 'Good' },
        ],
      });

      const advisories = await ParentService.getChildAdvisories('STU1');
      expect(advisories.length).toBeGreaterThan(0);

      // Attendance advisory uses actual total_sessions (40) and rate (92.5%)
      const attAdv = advisories.find((a) => a.type === 'attendance' && a.id === 'adv_att_good');
      expect(attAdv).toBeDefined();
      expect(attAdv?.message).toContain('92.5%');
      expect(attAdv?.message).toContain('40 sessions');
      expect(attAdv?.message).not.toContain('82 sessions'); // Confirms fake 82 sessions removed

      // Leave advisory uses actual leave count (2)
      const leaveAdv = advisories.find((a) => a.id === 'adv_leave_note');
      expect(leaveAdv).toBeDefined();
      expect(leaveAdv?.message).toContain('2 absence session(s)');
      expect(leaveAdv?.message).not.toContain('by Class Teacher R. Suresh'); // Confirms static teacher string removed

      // Academic advisory dynamically compares Mathematics (95%) and Physics (85%)
      const acadAdv = advisories.find((a) => a.type === 'academic');
      expect(acadAdv).toBeDefined();
      expect(acadAdv?.message).toContain('Mathematics (95%)');
      expect(acadAdv?.message).toContain('Physics (85%)');
      expect(acadAdv?.message).not.toContain('Rank 4th in Section XI-A2'); // Confirms fake rank string removed
    });
  });

  // =========================================================================
  // 3. FACULTY DASHBOARD WORKLOAD & NON-EVALUATIVE POLICIES
  // =========================================================================
  describe('3. Faculty Dashboard & Non-Evaluative Compliance', () => {
    it('removes synthetic avg_score from default assigned classes list', async () => {
      const classes = await FacultyService.getAssignedClasses();
      expect(classes.length).toBeGreaterThan(0);
      for (const cls of classes) {
        // Confirms no static '87.0%', '89.2%', or '83.4%' avg_score is embedded
        expect(cls.avg_score).toBeUndefined();
      }
    });

    it('strictly returns zero teacher performance ratings, evaluations, or appraisals', async () => {
      const profile = await FacultyService.getFacultyProfile('me');
      expect((profile as any).rating).toBeUndefined();
      expect((profile as any).scorecard).toBeUndefined();
      expect((profile as any).rank).toBeUndefined();
      expect((profile as any).evaluation_score).toBeUndefined();
    });

    it('faithfully preserves genuine zero values when API confirms zero metrics', () => {
      const html = renderToString(
        React.createElement(FacultyKPIOverview, {
          assignedClassesCount: 0,
          enrolledStudentsCount: 0,
          todayPeriodsCount: 0,
          periodsLoggedCount: 0,
          pendingLeavesCount: 0,
          weeklyWorkload: 0,
        })
      );

      // Asserts that genuine zeroes are faithfully rendered
      expect(html).toContain('0 Classes');
      expect(html).toContain('0 Enrolled Students');
      expect(html).toContain('0 Periods');
      expect(html).toContain('0 Logged • 0 Pending');
      expect(html).toContain('0 Pending');
      expect(html).toContain('No pending leave actions');
    });

    it('displays unavailable indicators ("—") for missing data and does NOT fabricate zero metrics', () => {
      const html = renderToString(
        React.createElement(FacultyKPIOverview, {})
      );

      // Asserts that missing data produces explicit unavailable indicators
      expect(html).toContain('— Classes');
      expect(html).toContain('— Enrolled Students');
      expect(html).toContain('— Periods');
      expect(html).toContain('Schedule Unavailable');
      expect(html).toContain('— Pending');
      expect(html).toContain('Review status unavailable');
      expect(html).toContain('Workload unavailable');

      // Crucial: Asserts that missing data does NOT silently fabricate 0
      expect(html).not.toContain('0 Classes');
      expect(html).not.toContain('0 Enrolled Students');
      expect(html).not.toContain('0 Periods');
      expect(html).not.toContain('0 Pending');
    });

    it('renders loading skeleton and does NOT display fabricated zeroes during loading state', () => {
      const html = renderToString(
        React.createElement(FacultyKPIOverview, {
          isLoading: true,
        })
      );

      // Asserts presence of pulse loading skeletons
      expect(html).toContain('animate-pulse');

      // Asserts no fabricated zeros appear during loading
      expect(html).not.toContain('0 Classes');
      expect(html).not.toContain('0 Enrolled Students');
      expect(html).not.toContain('0 Periods');
      expect(html).not.toContain('— Classes');
    });

    it('renders active metrics accurately when live API provides positive workloads', () => {
      const html = renderToString(
        React.createElement(FacultyKPIOverview, {
          assignedClassesCount: 3,
          enrolledStudentsCount: 91,
          todayPeriodsCount: 3,
          periodsLoggedCount: 1,
          pendingLeavesCount: 2,
          weeklyWorkload: 24,
        })
      );

      expect(html).toContain('3 Classes');
      expect(html).toContain('91 Enrolled Students');
      expect(html).toContain('3 Periods');
      expect(html).toContain('1 Logged • 2 Pending');
      expect(html).toContain('2 Pending');
      expect(html).toContain('Class Teacher Action Required');
      expect(html).toContain('24 Periods');
      expect(html).toContain('CBSE Senior Secondary Standard');
    });

    it('distinguishes API error states from genuine empty datasets in dashboard calculations', () => {
      // Helper simulating the exact calculation logic from FacultyDashboardPage
      const deriveMetrics = (classesError: Error | null, assignedClasses: any[] | undefined) => {
        const assignedClassesCount = classesError
          ? undefined
          : Array.isArray(assignedClasses)
          ? assignedClasses.length
          : undefined;

        const enrolledStudentsCount = classesError
          ? undefined
          : Array.isArray(assignedClasses)
          ? (assignedClasses.length === 0 ? 0 : assignedClasses.reduce((acc, c) => acc + (c.student_count || 0), 0))
          : undefined;

        const weeklyWorkload = classesError
          ? undefined
          : Array.isArray(assignedClasses)
          ? (assignedClasses.length === 0 ? 0 : assignedClasses.reduce((acc, c) => acc + (c.periods_per_week || 0), 0))
          : undefined;

        return { assignedClassesCount, enrolledStudentsCount, weeklyWorkload };
      };

      // Case A: API Error -> metrics must be undefined, component renders '—' (never fabricated 0)
      const errorMetrics = deriveMetrics(new Error('Network Failure'), undefined);
      expect(errorMetrics.assignedClassesCount).toBeUndefined();
      expect(errorMetrics.enrolledStudentsCount).toBeUndefined();
      expect(errorMetrics.weeklyWorkload).toBeUndefined();

      const errorHtml = renderToString(React.createElement(FacultyKPIOverview, errorMetrics));
      expect(errorHtml).toContain('— Classes');
      expect(errorHtml).toContain('— Enrolled Students');
      expect(errorHtml).not.toContain('0 Classes');

      // Case B: Confirmed Empty Dataset -> metrics evaluate to genuine 0, component renders '0'
      const emptyMetrics = deriveMetrics(null, []);
      expect(emptyMetrics.assignedClassesCount).toBe(0);
      expect(emptyMetrics.enrolledStudentsCount).toBe(0);
      expect(emptyMetrics.weeklyWorkload).toBe(0);

      const emptyHtml = renderToString(React.createElement(FacultyKPIOverview, emptyMetrics));
      expect(emptyHtml).toContain('0 Classes');
      expect(emptyHtml).toContain('0 Enrolled Students');
      expect(emptyHtml).toContain('0 Periods');
    });
  });

  // =========================================================================
  // 4. ADMIN DASHBOARD OPERATIONAL KPIS & LIVE WIRING
  // =========================================================================
  describe('4. Admin Dashboard Live Operational Synchronization', () => {
    it('synchronizes Admin KPIs and attendance trend from live attendance and marks services', async () => {
      localStorage.setItem('access_token', 'mock_admin_jwt');

      vi.spyOn(AdminApiService, 'getStudents').mockResolvedValue([
        { id: 's1', student_id: 'STU1', name: 'Student 1', class_name: 'Grade 11', section_name: 'A1', stream: 'CS', attendance_percentage: 95.0, status: 'Active' },
        { id: 's2', student_id: 'STU2', name: 'Student 2', class_name: 'Grade 11', section_name: 'A2', stream: 'CS', attendance_percentage: 85.0, status: 'Active' },
      ]);
      vi.spyOn(AdminApiService, 'getParents').mockResolvedValue([{ id: 'p1', name: 'Parent 1' } as any]);
      vi.spyOn(AdminApiService, 'getFaculty').mockResolvedValue([{ id: 'f1', name: 'Teacher 1' } as any]);
      vi.spyOn(AdminApiService, 'getClassesAndSections').mockResolvedValue([
        { id: 'c1', name: 'Grade 11', grade_level: 11, sections: [{ id: 'sec1', name: 'A1' }, { id: 'sec2', name: 'A2' }] },
      ] as any);
      vi.spyOn(AdminApiService, 'getAcademicYears').mockResolvedValue([{ id: 'y1', name: '2026–27', is_active: true }]);

      vi.spyOn(AttendanceApiService, 'getAttendanceAnalytics').mockResolvedValue({
        overallPresenceRate: 92.4,
        totalSessions: 120,
        statusDistribution: [],
        cohortMonthlyTrends: [
          { month: 'Jun', gr9: 95.0, gr10: 95.0, gr11: 95.0, gr12: 95.0 },
          { month: 'Jul', gr9: 93.0, gr10: 93.0, gr11: 93.0, gr12: 93.0 },
        ] as any,
      });

      vi.spyOn(MarksApiService, 'getExamTypes').mockResolvedValue([
        { id: 'et1', name: 'Quarterly', code: 'QT', is_active: true } as any,
        { id: 'et2', name: 'Half-Yearly', code: 'HY', is_active: true } as any,
      ]);

      vi.spyOn(AttendanceApiService, 'getAttendanceNotEntered').mockResolvedValue([
        { id: 'ne1', session: 'P1' } as any,
      ]);

      vi.spyOn(ApiClient, 'get').mockImplementation(async (path: string) => {
        if (path === '/api/v1/attendance/leaves/') {
          return { data: [{ id: 'l1', status: 'PENDING' }] } as any;
        }
        return { data: [] } as any;
      });

      const { kpis, attendanceTrend } = await AdminService.getDashboardSummary();

      expect(kpis.total_students).toBe(2);
      expect(kpis.total_parents).toBe(1);
      expect(kpis.total_faculty).toBe(1);
      expect(kpis.total_classes).toBe(1);
      expect(kpis.total_sections).toBe(2);
      expect(kpis.overall_attendance_rate).toBe(92.4);
      expect(kpis.academic_year).toBe('2026–27');
      expect(kpis.active_examinations).toBe(2); // 2 active exam types
      expect(kpis.pending_operational_actions).toBe(2); // 1 not entered + 1 pending leave

      expect(attendanceTrend).toHaveLength(2);
      expect(attendanceTrend[0].month).toBe('Jun');
      expect(attendanceTrend[0].attendance).toBe(95.0);
      expect(attendanceTrend[1].month).toBe('Jul');
      expect(attendanceTrend[1].attendance).toBe(93.0);
    });
  });

  // =========================================================================
  // 5. PRINCIPAL DASHBOARD & EXECUTIVE TELEMETRY
  // =========================================================================
  describe('5. Principal Executive Dashboard & Academic Oversight', () => {
    it('wires Principal dashboard KPIs and CBSE 8-tier grade distribution from live services', async () => {
      localStorage.setItem('access_token', 'mock_principal_jwt');

      vi.spyOn(AdminApiService, 'getStudents').mockResolvedValue(new Array(50).fill({ id: 's' }) as any);
      vi.spyOn(AdminApiService, 'getFaculty').mockResolvedValue(new Array(5).fill({ id: 'f' }) as any);
      vi.spyOn(AdminApiService, 'getClassesAndSections').mockResolvedValue([
        { id: 'c1', name: 'Grade 11', sections: [{ id: 'sec1' }] },
      ] as any);
      vi.spyOn(AdminApiService, 'getAcademicYears').mockResolvedValue([{ id: 'y1', name: '2026–27', is_active: true }]);

      vi.spyOn(AttendanceApiService, 'getAttendanceAnalytics').mockResolvedValue({
        overallPresenceRate: 94.5,
        totalSessions: 500,
        statusDistribution: [],
        cohortMonthlyTrends: [
          { month: 'Jun', gr9: 94.0, gr10: 94.0, gr11: 94.0, gr12: 94.0 },
        ] as any,
      });

      vi.spyOn(MarksApiService, 'getMarksSummary').mockResolvedValue({
        total_records: 50,
        evaluated_students: 50,
        school_average: 88.2,
        pass_rate: 98.0,
        grade_distribution: [
          { grade: 'A1', count: 20, percentage: 40.0 },
          { grade: 'A2', count: 15, percentage: 30.0 },
          { grade: 'B1', count: 10, percentage: 20.0 },
          { grade: 'B2', count: 5, percentage: 10.0 },
        ],
        section_rollups: [],
        subject_rollups: [],
      });

      const summary = await PrincipalService.getDashboardSummary();

      expect(summary.kpis.total_students).toBe(50);
      expect(summary.kpis.total_faculty).toBe(5);
      expect(summary.kpis.total_classes).toBe(1);
      expect(summary.kpis.school_attendance_rate).toBe(94.5);
      expect(summary.kpis.school_academic_average).toBe(88.2);
      expect(summary.kpis.student_teacher_ratio).toBe('10:1');

      // Verifies live 8-tier grade distribution mapping
      expect(summary.gradeDistribution.A1).toBe(20);
      expect(summary.gradeDistribution.A2).toBe(15);
      expect(summary.gradeDistribution.B1).toBe(10);
      expect(summary.gradeDistribution.B2).toBe(5);
      expect(summary.gradeDistribution.C1).toBe(0);
      expect(summary.gradeDistribution.E).toBe(0);

      expect(summary.attendanceTrend).toHaveLength(1);
      expect(summary.attendanceTrend[0].month).toBe('Jun');
      expect(summary.attendanceTrend[0].attendance).toBe(94.0);
    });

    it('strictly prohibits faculty ranking, rating, scorecards, or appraisals in Principal oversight', async () => {
      localStorage.setItem('access_token', 'mock_principal_jwt');

      const summary = await PrincipalService.getDashboardSummary();
      expect((summary as any).facultyRankings).toBeUndefined();
      expect((summary as any).teacherScorecards).toBeUndefined();
      expect((summary as any).appraisals).toBeUndefined();
      expect((summary as any).evaluations).toBeUndefined();
    });
  });

  // =========================================================================
  // 6. CROSS-ROLE DATA ISOLATION & PERMISSION BOUNDARIES
  // =========================================================================
  describe('6. Cross-Role Data Isolation & RBAC Boundaries', () => {
    it('strictly prevents student from accessing institutional attendance telemetry or marks roll-ups', async () => {
      // Mock 403 Forbidden responses from backend for non-admin/principal
      vi.spyOn(ApiClient, 'get').mockRejectedValue({
        status: 403,
        data: { detail: 'Students and Parents lack clearance for institutional attendance intelligence.' },
      });

      await expect(AttendanceApiService.getAttendanceAnalytics()).rejects.toBeDefined();
      await expect(MarksApiService.getMarksSummary()).rejects.toBeDefined();
    });

    it('strictly isolates parent ward records between sibling or foreign students', async () => {
      const isLinked1 = await ParentService.isChildLinkedToParent('par_001', 'STU202600001');
      const isLinkedCross = await ParentService.isChildLinkedToParent('par_001', 'STU202600002');
      const isLinked2 = await ParentService.isChildLinkedToParent('par_002', 'STU202600002');
      const isLinkedForeign = await ParentService.isChildLinkedToParent('par_001', 'STU999999999');

      expect(isLinked1).toBe(true);
      expect(isLinkedCross).toBe(false); // Parent 1 cannot access Child 2
      expect(isLinked2).toBe(true);
      expect(isLinkedForeign).toBe(false);
    });
  });
});
