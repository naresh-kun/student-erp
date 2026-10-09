/**
 * Student ERP — Phase 5 Task 5.6 Frontend Verification Suite
 * Marks API Integration + Multi-Role Institutional Oversight
 *
 * Covers:
 * 1. MarksApiService communication with /api/v1/marks/ endpoints:
 *    - /api/v1/marks/summary/ (Admin oversight roll-ups)
 *    - /api/v1/marks/analytics/ (Principal academic analytics)
 *    - /api/v1/marks/ (List filtering)
 *    - /api/v1/marks/bulk/ (Bulk entry with 0-100 and 'AB' Absent handling)
 *    - /api/v1/marks/report-card/{student_id}/ (Report cards)
 *    - /api/v1/marks/exam-types/ (Exam types)
 * 2. AdminService live integration with MarksApiService.getMarksSummary()
 * 3. PrincipalService live integration with MarksApiService.getAcademicAnalytics()
 * 4. FacultyService marks entry workflow with 'AB' support and live Marks API synchronization
 * 5. Student & Parent marks data flow with 0-100 marks and CBSE 8-tier grade derivations
 * 6. Enforces Indian School Academic Standards (Zero GPA / CGPA / credits)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MarksApiService } from '../src/services/marksApiService';
import { ApiClient } from '../src/services/api';
import { AdminService } from '../src/features/admin/services/adminService';
import { PrincipalService } from '../src/features/principal/services/principalService';
import { FacultyService } from '../src/features/faculty/services/facultyService';
import { FacultyApiService } from '../src/features/faculty/services/facultyApiService';
import { StudentService } from '../src/features/students/services/studentService';
import { StudentApiService } from '../src/features/students/services/studentApiService';
import { ParentService } from '../src/features/parents/services/parentService';
import { ParentApiService } from '../src/features/parents/services/parentApiService';

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

describe('Phase 5 Task 5.6 — Marks API Integration & Multi-Role Oversight', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. MarksApiService Direct Endpoints', () => {
    it('fetches marks summary for administrative oversight via GET /api/v1/marks/summary/', async () => {
      const mockSummaryData = {
        total_records: 120,
        evaluated_students: 40,
        school_average: 81.5,
        pass_rate: 97.5,
        grade_distribution: [
          { grade: 'A1', count: 35, percentage: 29.17 },
          { grade: 'A2', count: 40, percentage: 33.33 },
          { grade: 'B1', count: 25, percentage: 20.83 },
          { grade: 'B2', count: 12, percentage: 10.0 },
          { grade: 'C1', count: 5, percentage: 4.17 },
          { grade: 'C2', count: 2, percentage: 1.67 },
          { grade: 'D', count: 1, percentage: 0.83 },
          { grade: 'E', count: 0, percentage: 0.0 },
        ],
        section_rollups: [
          {
            section_id: 'sec-1',
            section_name: '11-A',
            class_name: 'Grade 11',
            student_count: 20,
            average_marks: 84.0,
            pass_rate: 100.0,
          },
        ],
        subject_rollups: [
          {
            subject_id: 'sub-1',
            subject_name: 'Mathematics',
            subject_code: 'MATH-041',
            evaluated_count: 40,
            average_marks: 82.0,
            highest_mark: 99.0,
            lowest_mark: 45.0,
          },
        ],
      };

      vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
        data: mockSummaryData,
        status: 200,
        headers: {},
      } as any);

      const result = await MarksApiService.getMarksSummary({ grade_level: 11 });

      expect(ApiClient.get).toHaveBeenCalledWith('/api/v1/marks/summary/', { grade_level: 11 });
      expect(result.total_records).toBe(120);
      expect(result.school_average).toBe(81.5);
      expect(result.grade_distribution.length).toBe(8);
      expect(result.section_rollups[0].class_name).toBe('Grade 11');
    });

    it('fetches academic analytics for principal oversight via GET /api/v1/marks/analytics/', async () => {
      const mockAnalyticsData = {
        kpis: {
          schoolAverageMarks: 79.4,
          overallPassPercentage: 98.2,
          distinctionCount: 42,
          totalStudentsEvaluated: 110,
        },
        gradePerformance: [
          {
            gradeLevel: 11,
            gradeName: 'Grade 11',
            studentCount: 55,
            averageMarks: 81.2,
            passPercentage: 98.0,
            streamBreakdown: [],
          },
        ],
        streamPerformance: [
          {
            stream: 'Science',
            studentCount: 30,
            averageMarks: 83.5,
            passPercentage: 100.0,
          },
        ],
        subjectPerformance: [
          {
            subjectName: 'Physics',
            subjectCode: 'PHY-042',
            averageMarks: 78.5,
            highestMarks: 98.0,
            passPercentage: 96.5,
          },
        ],
        schoolGradeDistribution: [
          { tier: 'A1', count: 28, percentage: 25.45 },
          { tier: 'A2', count: 32, percentage: 29.09 },
        ],
      };

      vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
        data: mockAnalyticsData,
        status: 200,
        headers: {},
      } as any);

      const result = await MarksApiService.getAcademicAnalytics({ grade_level: 11, stream: 'Science' });

      expect(ApiClient.get).toHaveBeenCalledWith('/api/v1/marks/analytics/', {
        grade_level: 11,
        stream: 'Science',
      });
      expect(result.kpis.schoolAverageMarks).toBe(79.4);
      expect(result.gradePerformance[0].gradeName).toBe('Grade 11');
      expect(result.subjectPerformance[0].subjectCode).toBe('PHY-042');
    });

    it('persists bulk marks records including absent "AB" entries via POST /api/v1/marks/bulk/', async () => {
      const mockResponse = {
        saved_count: 2,
        records: [
          {
            id: 'mark-1',
            enrollment: 'enr-1',
            student_id: 'STU202600001',
            student_name: 'Arun Kumar',
            subject: 'sub-1',
            subject_code: 'MATH-041',
            subject_name: 'Mathematics',
            exam_type: 'exam-1',
            exam_type_name: 'Half-Yearly',
            marks_obtained: 95.0,
            max_marks: 100,
            grade: 'A1',
            remarks: 'Superb work',
            evaluated_at: '2026-10-08T10:00:00Z',
            created_at: '2026-10-08T10:00:00Z',
          },
          {
            id: 'mark-2',
            enrollment: 'enr-2',
            student_id: 'STU202600002',
            student_name: 'Priya Sharma',
            subject: 'sub-1',
            subject_code: 'MATH-041',
            subject_name: 'Mathematics',
            exam_type: 'exam-1',
            exam_type_name: 'Half-Yearly',
            marks_obtained: 'AB',
            max_marks: 100,
            grade: 'AB',
            remarks: 'Medical leave during exam',
            evaluated_at: '2026-10-08T10:00:00Z',
            created_at: '2026-10-08T10:00:00Z',
          },
        ],
      };

      vi.spyOn(ApiClient, 'post').mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
      } as any);

      const payload = {
        records: [
          {
            student_id: 'STU202600001',
            subject_id: 'MATH-041',
            exam_type_id: 'Half-Yearly',
            marks_obtained: 95,
            max_marks: 100,
            remarks: 'Superb work',
          },
          {
            student_id: 'STU202600002',
            subject_id: 'MATH-041',
            exam_type_id: 'Half-Yearly',
            marks_obtained: 'AB' as const,
            max_marks: 100,
            remarks: 'Medical leave during exam',
          },
        ],
      };

      const result = await MarksApiService.recordBulkMarks(payload);

      expect(ApiClient.post).toHaveBeenCalledWith('/api/v1/marks/bulk/', payload);
      expect(result.saved_count).toBe(2);
      expect(result.records[1].grade).toBe('AB');
    });

    it('fetches official student report card via GET /api/v1/marks/report-card/{student_id}/', async () => {
      const mockReportCard = {
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        roll_number: '11-A2-04',
        class_name: 'Grade 11 - Section A2',
        academic_year: '2026–27',
        total_marks_obtained: 450,
        total_max_marks: 500,
        overall_percentage: 90.0,
        overall_grade: 'A2',
        marks: [
          {
            subject_name: 'Mathematics',
            subject_code: 'MATH-041',
            exam_type: 'Half-Yearly',
            marks_obtained: 95,
            max_marks: 100,
            percentage: 95.0,
            grade: 'A1',
            remarks: 'Exceptional proofs',
          },
        ],
      };

      vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
        data: mockReportCard,
        status: 200,
        headers: {},
      } as any);

      const result = await MarksApiService.getReportCard('STU202600001');

      expect(ApiClient.get).toHaveBeenCalledWith('/api/v1/marks/report-card/STU202600001/', undefined);
      expect(result.overall_grade).toBe('A2');
      expect(result.marks[0].grade).toBe('A1');
    });

    it('lists active exam types via GET /api/v1/marks/exam-types/?is_active=true', async () => {
      const mockExamTypes = [
        { id: 'et-1', name: 'Cycle Test', weightage: 10, is_active: true, created_at: '2026-01-01' },
        { id: 'et-2', name: 'Quarterly Examination', weightage: 20, is_active: true, created_at: '2026-01-01' },
        { id: 'et-3', name: 'Half-Yearly Examination', weightage: 30, is_active: true, created_at: '2026-01-01' },
        { id: 'et-4', name: 'Final / Annual Examination', weightage: 40, is_active: true, created_at: '2026-01-01' },
      ];

      vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
        data: mockExamTypes,
        status: 200,
        headers: {},
      } as any);

      const result = await MarksApiService.getExamTypes({ is_active: true });

      expect(ApiClient.get).toHaveBeenCalledWith('/api/v1/marks/exam-types/', { is_active: true });
      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('Cycle Test');
    });

    it('retrieves single exam type detail via GET /api/v1/marks/exam-types/{id}/', async () => {
      const mockDetail = {
        id: 'et-3',
        name: 'Half-Yearly Examination',
        weightage: 30,
        is_active: true,
        created_at: '2026-01-01',
      };

      vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
        data: mockDetail,
        status: 200,
        headers: {},
      } as any);

      const result = await MarksApiService.getExamTypeById('et-3');

      expect(ApiClient.get).toHaveBeenCalledWith('/api/v1/marks/exam-types/et-3/');
      expect(result.id).toBe('et-3');
      expect(result.name).toBe('Half-Yearly Examination');
    });

    it('updates exam type via PATCH /api/v1/marks/exam-types/{id}/', async () => {
      const mockUpdated = {
        id: 'et-1',
        name: 'Cycle Test Series A',
        weightage: 15,
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-10-08T20:00:00Z',
      };

      vi.spyOn(ApiClient, 'patch').mockResolvedValueOnce({
        data: mockUpdated,
        status: 200,
        headers: {},
      } as any);

      const result = await MarksApiService.updateExamType('et-1', {
        name: 'Cycle Test Series A',
        weightage: 15,
      });

      expect(ApiClient.patch).toHaveBeenCalledWith('/api/v1/marks/exam-types/et-1/', {
        name: 'Cycle Test Series A',
        weightage: 15,
      });
      expect(result.name).toBe('Cycle Test Series A');
      expect(result.weightage).toBe(15);
    });
  });

  describe('2. Admin Console Live Marks Oversight Integration', () => {
    it('wires AdminService.getMarksSummary to live MarksApiService.getMarksSummary', async () => {
      const mockSummary = {
        total_records: 200,
        evaluated_students: 50,
        school_average: 83.2,
        pass_rate: 98.5,
        grade_distribution: [
          { grade: 'A1', count: 60, percentage: 30.0 },
          { grade: 'A2', count: 50, percentage: 25.0 },
          { grade: 'B1', count: 40, percentage: 20.0 },
          { grade: 'B2', count: 30, percentage: 15.0 },
          { grade: 'C1', count: 12, percentage: 6.0 },
          { grade: 'C2', count: 5, percentage: 2.5 },
          { grade: 'D', count: 3, percentage: 1.5 },
          { grade: 'E', count: 0, percentage: 0.0 },
        ],
        section_rollups: [
          {
            section_id: 'sec-101',
            section_name: '11-A2',
            class_name: 'Grade 11',
            student_count: 25,
            average_marks: 86.4,
            pass_rate: 100.0,
          },
        ],
        subject_rollups: [
          {
            subject_id: 'sub-201',
            subject_name: 'Computer Science',
            subject_code: 'CS-083',
            evaluated_count: 50,
            average_marks: 88.0,
            highest_mark: 100.0,
            lowest_mark: 62.0,
          },
        ],
      };

      vi.spyOn(MarksApiService, 'getMarksSummary').mockResolvedValueOnce(mockSummary as any);

      const summary = await AdminService.getMarksSummary();

      expect(MarksApiService.getMarksSummary).toHaveBeenCalled();
      expect(summary.total_records).toBe(200);
      expect(summary.school_average).toBe(83.2);
      expect(summary.pass_rate).toBe(98.5);
      expect(summary.grade_distribution.find((g) => g.grade === 'A1')?.count).toBe(60);
      expect(summary.section_rollups[0].section_name).toBe('11-A2');
      expect(summary.subject_rollups[0].subject_code).toBe('CS-083');

      // Also verify getMarksOverview maps subject rollups
      vi.spyOn(MarksApiService, 'getMarksSummary').mockResolvedValueOnce(mockSummary as any);
      const overviewCards = await AdminService.getMarksOverview();
      expect(overviewCards.length).toBe(1);
      expect(overviewCards[0].subject_name).toBe('Computer Science');
      expect(overviewCards[0].average_percentage).toBe(88.0);
    });

    it('falls back gracefully to synthetic baseline when Marks API is temporarily unavailable', async () => {
      vi.spyOn(MarksApiService, 'getMarksSummary').mockRejectedValueOnce(new Error('Network error'));

      const summary = await AdminService.getMarksSummary();

      expect(summary).toBeDefined();
      expect(summary.total_records).toBeGreaterThan(0);
      expect(summary.school_average).toBeGreaterThan(70);
      expect(summary.grade_distribution.length).toBe(8);

      const overviewCards = await AdminService.getMarksOverview();
      expect(overviewCards.length).toBeGreaterThan(0);
    });
  });

  describe('3. Principal Console Live Academic Analytics Integration', () => {
    it('wires PrincipalService.getAcademicAnalytics to live MarksApiService.getAcademicAnalytics', async () => {
      const mockAnalytics = {
        kpis: {
          schoolAverageMarks: 82.5,
          overallPassPercentage: 99.1,
          distinctionCount: 52,
          totalStudentsEvaluated: 150,
        },
        gradePerformance: [
          {
            gradeLevel: 11,
            gradeName: 'Grade 11',
            studentCount: 75,
            averageMarks: 84.1,
            passPercentage: 98.7,
            streamBreakdown: [],
          },
        ],
        streamPerformance: [
          {
            stream: 'Computer Science',
            studentCount: 40,
            averageMarks: 87.2,
            passPercentage: 100.0,
          },
        ],
        subjectPerformance: [
          {
            subjectName: 'Mathematics',
            subjectCode: 'MATH-041',
            averageMarks: 81.0,
            highestMarks: 99.0,
            passPercentage: 97.5,
          },
        ],
        schoolGradeDistribution: [
          { tier: 'A1', count: 45, percentage: 30.0 },
          { tier: 'A2', count: 50, percentage: 33.33 },
        ],
      };

      vi.spyOn(MarksApiService, 'getAcademicAnalytics').mockResolvedValueOnce(mockAnalytics as any);

      const analytics = await PrincipalService.getAcademicAnalytics();

      expect(MarksApiService.getAcademicAnalytics).toHaveBeenCalled();
      expect(analytics.kpis.schoolAverageMarks).toBe(82.5);
      expect(analytics.gradePerformance[0].gradeName).toBe('Grade 11');
      expect(analytics.streamPerformance[0].stream).toBe('Computer Science');
    });

    it('falls back gracefully to institutional baseline when Principal Analytics API fails', async () => {
      vi.spyOn(MarksApiService, 'getAcademicAnalytics').mockRejectedValueOnce(new Error('Server error'));

      const analytics = await PrincipalService.getAcademicAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.kpis.schoolAverageMarks).toBeGreaterThan(70);
      expect(analytics.gradePerformance.length).toBeGreaterThan(0);
    });
  });

  describe('4. Faculty Marks Entry & Absent "AB" Workflow', () => {
    it('synchronizes marks sheet entries with backend preserving "AB" absent scores', async () => {
      const recordBulkSpy = vi.spyOn(FacultyApiService, 'recordBulkMarks').mockResolvedValueOnce({
        saved_count: 3,
      });

      const entries = [
        {
          student_id: 'STU202600001',
          roll_number: '11-A2-01',
          student_name: 'Arun Kumar',
          score: 94,
          derived_percentage: 94,
          derived_grade: 'A1' as const,
          feedback: 'Exceptional proofs',
        },
        {
          student_id: 'STU202600002',
          roll_number: '11-A2-02',
          student_name: 'Priya Sharma',
          score: 'AB' as const,
          derived_percentage: null,
          derived_grade: 'AB' as const,
          feedback: 'Absent with medical cert',
        },
        {
          student_id: 'STU202600003',
          roll_number: '11-A2-03',
          student_name: 'Rohan Gupta',
          score: 72,
          derived_percentage: 72,
          derived_grade: 'B1' as const,
          feedback: 'Good effort',
        },
      ];

      const res = await FacultyService.saveMarksEntrySheet(
        'cls_001_sec_002',
        'MATH-041',
        'Half-Yearly Examination 2026–27',
        entries
      );

      expect(res.success).toBe(true);
      expect(recordBulkSpy).toHaveBeenCalledTimes(1);

      const capturedPayload = recordBulkSpy.mock.calls[0][0];
      expect(capturedPayload.records.length).toBe(3);

      const absentRecord = capturedPayload.records.find((r) => r.student_id === 'STU202600002');
      expect(absentRecord).toBeDefined();
      expect(absentRecord?.marks_obtained).toBe('AB');

      const numericRecord = capturedPayload.records.find((r) => r.student_id === 'STU202600001');
      expect(numericRecord?.marks_obtained).toBe(94);
    });

    it('rejects marks greater than 100 or negative scores during entry validation', async () => {
      const invalidEntries = [
        {
          student_id: 'STU202600001',
          roll_number: '11-A2-01',
          student_name: 'Arun Kumar',
          score: 105, // Invalid > 100
          derived_percentage: null,
          derived_grade: '—' as any,
          feedback: '',
        },
      ];

      await expect(
        FacultyService.saveMarksEntrySheet(
          'cls_001_sec_002',
          'MATH-041',
          'Half-Yearly Examination 2026–27',
          invalidEntries
        )
      ).rejects.toThrow();
    });

    it('populates marks sheet by querying live Marks API before falling back to seeded cache', async () => {
      const liveRecords = [
        {
          id: 'rec-1',
          enrollment: 'enr-1',
          student_id: 'STU202600001',
          student_name: 'Arun Kumar',
          subject: 'sub-1',
          subject_code: 'MATH-041',
          subject_name: 'Mathematics',
          exam_type: 'exam-1',
          exam_type_name: 'Half-Yearly',
          marks_obtained: 98,
          max_marks: 100,
          grade: 'A1',
          remarks: 'Mastery verified',
          evaluated_at: '2026-10-08T10:00:00Z',
          created_at: '2026-10-08T10:00:00Z',
        },
        {
          id: 'rec-2',
          enrollment: 'enr-2',
          student_id: 'STU202600002',
          student_name: 'Priya Sharma',
          subject: 'sub-1',
          subject_code: 'MATH-041',
          subject_name: 'Mathematics',
          exam_type: 'exam-1',
          exam_type_name: 'Half-Yearly',
          marks_obtained: 'AB',
          max_marks: 100,
          grade: 'AB',
          remarks: 'Absent',
          evaluated_at: '2026-10-08T10:00:00Z',
          created_at: '2026-10-08T10:00:00Z',
        },
      ];

      vi.spyOn(MarksApiService, 'getMarksList').mockResolvedValueOnce(liveRecords);

      const sheet = await FacultyService.getMarksEntrySheet(
        'cls_001_sec_002',
        'MATH-041',
        'Half-Yearly Examination 2026–27'
      );

      expect(MarksApiService.getMarksList).toHaveBeenCalledWith({
        subject_code: 'MATH-041',
        exam_type: 'Half-Yearly Examination 2026–27',
      });

      const arunEntry = sheet.entries.find((e) => e.student_id === 'STU202600001');
      expect(arunEntry?.score).toBe(98);
      expect(arunEntry?.derived_grade).toBe('A1');

      const priyaEntry = sheet.entries.find((e) => e.student_id === 'STU202600002');
      expect(priyaEntry?.score).toBe('AB');
      expect(priyaEntry?.derived_grade).toBe('AB');
    });

    it('resolves authoritative database UUID exam_type_id when saving marks sheet', async () => {
      const recordBulkSpy = vi.spyOn(FacultyApiService, 'recordBulkMarks').mockResolvedValueOnce({
        saved_count: 1,
      });

      const entries = [
        {
          student_id: 'STU202600001',
          roll_number: '11-A2-01',
          student_name: 'Arun Kumar',
          score: 88,
          derived_percentage: 88,
          derived_grade: 'A2' as const,
          feedback: 'Solid work',
        },
      ];

      const res = await FacultyService.saveMarksEntrySheet(
        'cls_001_sec_002',
        'MATH-041',
        'Quarterly Examination',
        entries,
        '00000000-0000-0000-0000-000000000002' // Authoritative UUID passed from UI selection
      );

      expect(res.success).toBe(true);
      expect(recordBulkSpy).toHaveBeenCalledTimes(1);

      const capturedPayload = recordBulkSpy.mock.calls[0][0];
      expect(capturedPayload.records[0].exam_type_id).toBe('00000000-0000-0000-0000-000000000002');
    });

    it('rejects silent fallback and surfaces error when live bulk marks submission fails in authenticated session', async () => {
      localStorage.setItem('access_token', 'mock-valid-auth-token');
      vi.spyOn(FacultyApiService, 'recordBulkMarks').mockRejectedValueOnce(
        new Error('Exam type is inactive and cannot accept marks.')
      );

      const entries = [
        {
          student_id: 'STU202600001',
          roll_number: '11-A2-01',
          student_name: 'Arun Kumar',
          score: 88,
          derived_percentage: 88,
          derived_grade: 'A2' as const,
          feedback: 'Solid work',
        },
      ];

      await expect(
        FacultyService.saveMarksEntrySheet(
          'cls_001_sec_002',
          'MATH-041',
          'Cycle Test',
          entries,
          '00000000-0000-0000-0000-000000000001'
        )
      ).rejects.toThrow('Exam type is inactive and cannot accept marks.');
    });
  });

  describe('5. Student & Parent Report Card Live Integration', () => {
    it('loads student exam records via live StudentApiService.getReportCard', async () => {
      const mockReportCard = {
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        roll_number: '11-A2-04',
        class_name: 'Grade 11 - Section A2',
        academic_year: '2026–27',
        total_marks_obtained: 440,
        total_max_marks: 500,
        overall_percentage: 88.0,
        overall_grade: 'A2',
        marks: [
          {
            subject_name: 'Mathematics',
            subject_code: 'MATH-041',
            exam_type: 'Half-Yearly Examination 2026',
            marks_obtained: 92,
            max_marks: 100,
            percentage: 92.0,
            grade: 'A1',
            remarks: 'Superb proofs',
          },
          {
            subject_name: 'Physics',
            subject_code: 'PHY-042',
            exam_type: 'Half-Yearly Examination 2026',
            marks_obtained: 'AB',
            max_marks: 100,
            percentage: null as any,
            grade: 'AB',
            remarks: 'Absent',
          },
        ],
      };

      vi.spyOn(StudentApiService, 'getReportCard').mockResolvedValueOnce(mockReportCard as any);

      const records = await StudentService.getExamRecords('STU202600001');

      expect(StudentApiService.getReportCard).toHaveBeenCalledWith('STU202600001');
      expect(records.length).toBe(2);
      expect(records[0].score).toBe(92);
      expect(records[0].grade).toBe('A1');
      expect(records[1].score).toBe('AB');
      expect(records[1].grade).toBe('AB');
    });

    it('loads parent child report card via live ParentApiService.getChildReportCard', async () => {
      const mockReportCard = {
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        roll_number: '11-A2-04',
        class_name: 'Grade 11 - Section A2',
        academic_year: '2026–27',
        total_marks_obtained: 435,
        total_max_marks: 500,
        overall_percentage: 87.0,
        overall_grade: 'A2',
        marks: [
          {
            subject_name: 'Computer Science',
            subject_code: 'CS-083',
            exam_type: 'Half-Yearly Examination 2026',
            marks_obtained: 96,
            max_marks: 100,
            percentage: 96.0,
            grade: 'A1',
            remarks: 'Highest in section',
          },
        ],
      };

      vi.spyOn(ParentApiService, 'getChildReportCard').mockResolvedValueOnce(mockReportCard as any);

      const summary = await ParentService.getChildAcademicSummary('STU202600001');
      expect(ParentApiService.getChildReportCard).toHaveBeenCalledWith('STU202600001');
      expect(summary.cumulativeMarks).toBe(435);
      expect(summary.overallPercentage).toBe(87.0);
      expect(summary.overallGrade).toBe('A2');
    });
  });

  describe('6. Indian School Standard & Governance Invariants', () => {
    it('strictly does not expose GPA, CGPA, credits, or grade points on marks summary', async () => {
      const summary = await AdminService.getMarksOverview();

      expect((summary as any).gpa).toBeUndefined();
      expect((summary as any).cgpa).toBeUndefined();
      expect((summary as any).credits).toBeUndefined();
      expect((summary as any).credit_hours).toBeUndefined();
      expect((summary as any).grade_points).toBeUndefined();
    });

    it('strictly does not expose faculty rankings, ratings, or teacher performance evaluations', async () => {
      const analytics = await PrincipalService.getAcademicAnalytics();

      expect((analytics as any).faculty_rankings).toBeUndefined();
      expect((analytics as any).teacher_evaluations).toBeUndefined();
      expect((analytics as any).star_ratings).toBeUndefined();
    });
  });
});
