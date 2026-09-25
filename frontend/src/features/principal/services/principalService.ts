/**
 * Student ERP — Principal Domain Service Layer
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * Implements service abstraction adapter for Executive School Oversight:
 * - Executive Dashboard & Institutional KPIs
 * - School-Wide Academic Analytics (CBSE 8-tier grade distribution, grade & stream metrics)
 * - Attendance Telemetry & 4-Status Reconciliation ([P + OD] / Total * 100)
 * - Faculty Directory Oversight (Purely descriptive & non-evaluative; NO ratings/rankings)
 * - Official Reports & Accreditation Approval Workflow (Draft -> Review -> Approved)
 */

import { MockDataService } from '@/services/mockService';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import type {
  PrincipalDashboardSummary,
  GradeAcademicPerformance,
  StreamPerformanceItem,
  SubjectPerformanceItem,
  PrincipalAttendanceTelemetry,
  PrincipalFacultyItem,
  InstitutionalReportItem,
  ReportApprovalState,
} from '../types';

const STORAGE_REPORTS_KEY = 'student_erp_principal_reports';

class MemoryStore {
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

const memoryStore = new MemoryStore();

function getStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return memoryStore;
}

const delay = (ms = 35) => new Promise((resolve) => setTimeout(resolve, ms));

export class PrincipalService {
  // ==========================================
  // 1. EXECUTIVE DASHBOARD & SUMMARY
  // ==========================================
  static async getDashboardSummary(): Promise<PrincipalDashboardSummary> {
    await delay();
    const rawKpis = await MockDataService.getSchoolKPIs();
    const attendanceTrend = await MockDataService.getMonthlyAttendanceTrend();
    const reports = await this.getReports();

    const pendingReports = reports.filter((r) => r.status === 'Review' || r.status === 'Draft').length;

    return {
      kpis: {
        total_students: rawKpis.total_students,
        total_faculty: rawKpis.total_faculty,
        total_classes: 6,
        total_sections: 17,
        school_attendance_rate: rawKpis.overall_attendance_rate,
        school_academic_average: 85.6,
        academic_year: SCHOOL_CONFIG.academicYear,
        student_teacher_ratio: rawKpis.student_teacher_ratio,
        pending_reports_count: pendingReports,
        upcoming_events_count: 4,
      },
      gradeDistribution: {
        A1: 340,
        A2: 410,
        B1: 260,
        B2: 120,
        C1: 65,
        C2: 35,
        D: 18,
        E: 0,
      },
      attendanceTrend,
      recentEvents: [
        { title: 'Half-Yearly Examination 2026', category: 'Examination', date: '2026-10-12 to 2026-10-22', location: 'Examination Halls' },
        { title: 'Annual Science & Technology Exhibition', category: 'Academic', date: '2026-10-28', location: 'School Auditorium' },
        { title: 'Parent-Teacher Meeting (Term 1 Review)', category: 'PTM', date: '2026-11-14', location: 'Assigned Classrooms' },
      ],
    };
  }

  // ==========================================
  // 2. ACADEMIC ANALYTICS & CURRICULUM
  // ==========================================
  static async getAcademicAnalytics(filters?: {
    gradeLevel?: number;
    stream?: string;
  }): Promise<{
    gradePerformance: GradeAcademicPerformance[];
    streamPerformance: StreamPerformanceItem[];
    subjectPerformance: SubjectPerformanceItem[];
    schoolGradeDistribution: { tier: string; count: number; percentage: number }[];
  }> {
    await delay();

    const gradePerformance: GradeAcademicPerformance[] = [
      { grade: 'Grade 9', gradeLevel: 9, academicAverage: 81.2, passRate: 94.4, highestScore: 96.5, enrolledStudents: 310, sectionsCount: 8 },
      { grade: 'Grade 10', gradeLevel: 10, academicAverage: 83.5, passRate: 96.1, highestScore: 98.0, enrolledStudents: 320, sectionsCount: 8 },
      { grade: 'Grade 11', gradeLevel: 11, academicAverage: 86.8, passRate: 98.2, highestScore: 99.0, enrolledStudents: 308, sectionsCount: 9 },
      { grade: 'Grade 12', gradeLevel: 12, academicAverage: 89.4, passRate: 99.1, highestScore: 100.0, enrolledStudents: 310, sectionsCount: 8 },
    ];

    const streamPerformance: StreamPerformanceItem[] = [
      { stream: 'Computer Science A', g11Average: 88.5, g12Average: 91.2, enrolledStudents: 122, topSubject: 'Computer Science (Python & SQL)' },
      { stream: 'Bio-Maths B', g11Average: 85.8, g12Average: 88.0, enrolledStudents: 120, topSubject: 'Biology & Human Physiology' },
      { stream: 'Commerce C', g11Average: 84.0, g12Average: 87.5, enrolledStudents: 125, topSubject: 'Accountancy & Business Studies' },
      { stream: 'Pure Science D', g11Average: 86.2, g12Average: 89.0, enrolledStudents: 115, topSubject: 'Physics & Higher Mathematics' },
    ];

    const subjectPerformance: SubjectPerformanceItem[] = [
      { subjectName: 'Mathematics', code: 'MATH-041', department: 'Mathematics', schoolAverage: 84.8, passRate: 96.8, evaluatedStudents: 1248 },
      { subjectName: 'Computer Science', code: 'CS-083', department: 'Computer Science', schoolAverage: 90.2, passRate: 100.0, evaluatedStudents: 480 },
      { subjectName: 'Physics', code: 'PHY-042', department: 'Physics', schoolAverage: 83.4, passRate: 95.5, evaluatedStudents: 720 },
      { subjectName: 'English Core', code: 'ENG-301', department: 'English & Languages', schoolAverage: 87.6, passRate: 99.2, evaluatedStudents: 1248 },
      { subjectName: 'Chemistry', code: 'CHEM-043', department: 'Chemistry', schoolAverage: 82.9, passRate: 94.8, evaluatedStudents: 720 },
    ];

    const schoolGradeDistribution = [
      { tier: 'A1 (91–100%)', count: 340, percentage: 27.2 },
      { tier: 'A2 (81–90%)', count: 410, percentage: 32.9 },
      { tier: 'B1 (71–80%)', count: 260, percentage: 20.8 },
      { tier: 'B2 (61–70%)', count: 120, percentage: 9.6 },
      { tier: 'C1 (51–60%)', count: 65, percentage: 5.2 },
      { tier: 'C2 (41–50%)', count: 35, percentage: 2.8 },
      { tier: 'D (33–40%)', count: 18, percentage: 1.5 },
      { tier: 'E (Needs Improvement)', count: 0, percentage: 0.0 },
    ];

    let filteredGrades = gradePerformance;
    if (filters?.gradeLevel) {
      filteredGrades = filteredGrades.filter((g) => g.gradeLevel === filters.gradeLevel);
    }

    let filteredStreams = streamPerformance;
    if (filters?.stream && filters.stream !== 'ALL') {
      filteredStreams = filteredStreams.filter((s) => s.stream === filters.stream);
    }

    return {
      gradePerformance: filteredGrades,
      streamPerformance: filteredStreams,
      subjectPerformance,
      schoolGradeDistribution,
    };
  }

  // ==========================================
  // 3. ATTENDANCE ANALYTICS
  // ==========================================
  static async getAttendanceAnalytics(): Promise<PrincipalAttendanceTelemetry> {
    await delay();
    const distribution = await MockDataService.getPrincipalAttendanceDistribution();
    const trends = await MockDataService.getGradeAttendanceTrends();

    const totalSessions = distribution.reduce((sum, d) => sum + d.count, 0);
    const presentCount = distribution.find((d) => d.status === 'PRESENT')?.count || 0;
    const onDutyCount = distribution.find((d) => d.status === 'ON_DUTY')?.count || 0;

    // (P + OD) / Total * 100
    const presenceRate = totalSessions > 0
      ? Number((((presentCount + onDutyCount) / totalSessions) * 100).toFixed(1))
      : 94.2;

    return {
      overallPresenceRate: presenceRate,
      totalSessions,
      statusDistribution: distribution,
      cohortMonthlyTrends: trends,
    };
  }

  // ==========================================
  // 4. FACULTY DIRECTORY (Non-Evaluative)
  // ==========================================
  static async getFacultyDirectory(search?: string, department?: string): Promise<PrincipalFacultyItem[]> {
    await delay();
    const rawFaculty = await MockDataService.getFaculty();
    const subjects = await MockDataService.getSubjects();

    const list: PrincipalFacultyItem[] = rawFaculty.map((f) => {
      const isMath = f.department.toLowerCase().includes('math');
      const assignedSubNames = (f.assigned_subject_ids || []).map((id) => {
        const sub = subjects.find((s) => s.id === id);
        return sub ? sub.name : id;
      });

      return {
        id: f.id,
        employee_code: f.employee_code,
        name: `${f.first_name} ${f.last_name}`.trim(),
        department: f.department,
        designation: f.designation,
        qualification: f.qualification,
        assigned_subjects: assignedSubNames,
        class_teacher_of: f.class_teacher_of ? 'Grade 11 — Computer Science A (Sec A2)' : null,
        assigned_classes: isMath
          ? ['Grade 11-A2 (Math)', 'Grade 12-A1 (Math)', 'Grade 10-A (Math)']
          : ['Grade 11-A2 (Comp Sci)', 'Grade 12-A1 (Comp Sci)'],
        weekly_periods: isMath ? 24 : 20,
        email: `${f.first_name.toLowerCase().replace('.', '')}.${f.last_name.toLowerCase()}@schoolerp.edu.in`.replace('..', '.'),
        status: 'Active',
      };
    });

    let result = list;
    if (department && department !== 'ALL') {
      result = result.filter((f) => f.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.employee_code.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q)
      );
    }

    return result;
  }

  // ==========================================
  // 5. INSTITUTIONAL REPORTS & APPROVAL
  // ==========================================
  static async getReports(categoryFilter?: string): Promise<InstitutionalReportItem[]> {
    await delay();
    const storage = getStorage();
    const saved = storage.getItem(STORAGE_REPORTS_KEY);
    let reports: InstitutionalReportItem[];

    if (saved) {
      try {
        reports = JSON.parse(saved);
      } catch {
        reports = this.getDefaultReports();
      }
    } else {
      reports = this.getDefaultReports();
      storage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      return reports.filter((r) => r.category === categoryFilter);
    }

    return reports;
  }

  static async updateReportStatus(
    reportId: string,
    status: ReportApprovalState,
    remarks?: string
  ): Promise<InstitutionalReportItem> {
    await delay();
    const storage = getStorage();
    const reports = await this.getReports();

    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      throw new Error(`Report with id ${reportId} not found`);
    }

    const updated: InstitutionalReportItem = {
      ...reports[idx],
      status,
      review_remarks: remarks || reports[idx].review_remarks,
      approved_by: status === 'Approved' ? 'Dr. K. Radhakrishnan (Principal)' : undefined,
      approved_at: status === 'Approved' ? new Date().toISOString() : undefined,
    };

    reports[idx] = updated;
    storage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
    return updated;
  }

  private static getDefaultReports(): InstitutionalReportItem[] {
    return [
      {
        id: 'rep_001',
        title: 'Annual School Academic Performance & CBSE Benchmark Dossier',
        category: 'Academic',
        academic_year: '2026–27',
        generated_date: '2026-09-20',
        format: 'PDF',
        file_size: '3.8 MB',
        description: 'Comprehensive institutional governance filing summarizing curriculum delivery, board examination trends, and student learning outcomes.',
        status: 'Approved',
        approved_by: 'Dr. K. Radhakrishnan (Principal)',
        approved_at: '2026-09-22T10:00:00Z',
        review_remarks: 'Reviewed and formally endorsed for Department of Education annual compliance.',
        summary_metrics: {
          'School Pass Rate': '98.6%',
          'Distinction Rate': '60.1%',
          'Total Candidates': 1248,
        },
      },
      {
        id: 'rep_002',
        title: 'Term 1 Examination Analysis & Section Benchmarking',
        category: 'Academic',
        academic_year: '2026–27',
        generated_date: '2026-09-23',
        format: 'PDF',
        file_size: '2.1 MB',
        description: 'Comparative performance analysis across Grade 11 & 12 sections, stream distributions, and subject-wise score benchmarks.',
        status: 'Review',
        review_remarks: 'Pending Principal final sign-off following department head review meeting.',
        summary_metrics: {
          'Term Average': '85.6%',
          'A1 / A2 Proportion': '60.1%',
          'Sections Benchmarked': 17,
        },
      },
      {
        id: 'rep_003',
        title: 'School-Wide Attendance & Leave Registry Audit',
        category: 'Attendance',
        academic_year: '2026–27',
        generated_date: '2026-09-24',
        format: 'XLSX',
        file_size: '750 KB',
        description: 'Monthly longitudinal telemetry covering canonical 4-status reconciliations (P, OD, Leave, Absent) and retention benchmarks.',
        status: 'Approved',
        approved_by: 'Dr. K. Radhakrishnan (Principal)',
        approved_at: '2026-09-24T16:30:00Z',
        review_remarks: 'Verified adherence to Master Plan Amendment 2 attendance formula.',
        summary_metrics: {
          'Aggregate Presence': '94.2%',
          'Faculty Approved Leave': 42,
          'Unapproved Absence': 30,
        },
      },
      {
        id: 'rep_004',
        title: 'Faculty Teaching Load & Timetable Allocation Summary',
        category: 'Faculty',
        academic_year: '2026–27',
        generated_date: '2026-09-18',
        format: 'PDF',
        file_size: '1.4 MB',
        description: 'Academic staff period allocations, weekly teaching hours, and Class Teacher assignments across school blocks (Non-Evaluative).',
        status: 'Approved',
        approved_by: 'Dr. K. Radhakrishnan (Principal)',
        approved_at: '2026-09-19T09:15:00Z',
        review_remarks: 'Workload distribution confirmed equitable across senior PGT faculty.',
        summary_metrics: {
          'Total Staff': 64,
          'Average Workload': '22 Periods / wk',
          'Assigned Class Teachers': 17,
        },
      },
      {
        id: 'rep_005',
        title: 'Senior Secondary Stream Allocation & Enrollment Census',
        category: 'Governance',
        academic_year: '2026–27',
        generated_date: '2026-09-25',
        format: 'PDF',
        file_size: '1.2 MB',
        description: 'Official intake report for Grade 11 streams (Computer Science A, Bio-Maths B, Commerce C, Pure Science D) following merit allocation.',
        status: 'Draft',
        review_remarks: 'Awaiting allocation engine publish verification from Admin office.',
        summary_metrics: {
          'Allocated Students': 308,
          'Streams Activated': 4,
          'Target Sections': 12,
        },
      },
    ];
  }
}
