/**
 * Student ERP — Principal Domain Vitest Test Suite
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * Comprehensive automated verification covering:
 * 1. Executive dashboard summary & institutional KPIs
 * 2. Academic Analytics:
 *    - Grade-wise & stream-wise performance (marks /100, pass rate, 8-tier letter grades)
 *    - Strictly NO GPA, CGPA, credits, or grade points
 * 3. Attendance Analytics & Telemetry:
 *    - Canonical 4-status distribution (PRESENT, ABSENT, ON_DUTY, LEAVE)
 *    - Verification of presence formula: (P + OD) / Total * 100
 * 4. Faculty Directory Oversight:
 *    - Purely descriptive operational staff roster
 *    - Strictly NO ratings, reviews, rankings, or performance scores
 * 5. Institutional Reports & Endorsement Workflow:
 *    - Retrieval of institutional reports
 *    - Status transition (Review / Draft -> Approved)
 *    - Principal approval audit trail (approved_by, timestamp, remarks)
 */

import { describe, it, expect } from 'vitest';
import { PrincipalService } from '../src/features/principal/services/principalService';
import { calculateAttendancePercentage, calculateGrade } from '../src/utils';

describe('Principal Domain — Executive Dashboard & Institutional KPIs', () => {
  it('loads authoritative executive dashboard summary and KPIs', async () => {
    const summary = await PrincipalService.getDashboardSummary();

    expect(summary).toBeDefined();
    expect(summary.kpis.total_students).toBe(1248);
    expect(summary.kpis.total_faculty).toBe(86);
    expect(summary.kpis.school_attendance_rate).toBeGreaterThan(0);
    expect(summary.kpis.academic_year).toBe('2026–27');
    expect(summary.kpis.student_teacher_ratio).toBe('15:1');
    expect(summary.recentEvents.length).toBeGreaterThan(0);
    expect(summary.gradeDistribution.A1).toBeGreaterThan(0);
  });
});

describe('Principal Domain — Academic Analytics', () => {
  it('loads grade-level performance scored out of 100 with 8-tier letter grade derivation', async () => {
    const analytics = await PrincipalService.getAcademicAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.gradePerformance.length).toBeGreaterThan(0);

    analytics.gradePerformance.forEach((gp) => {
      expect(gp.academicAverage).toBeGreaterThanOrEqual(0);
      expect(gp.academicAverage).toBeLessThanOrEqual(100);
      expect(gp.passRate).toBeGreaterThan(0);

      // Verify derived 8-tier letter grade
      const grade = calculateGrade(gp.academicAverage);
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E']).toContain(grade);

      // Ensure no university metrics
      const keys = Object.keys(gp);
      expect(keys).not.toContain('gpa');
      expect(keys).not.toContain('cgpa');
      expect(keys).not.toContain('credits');
      expect(keys).not.toContain('grade_points');
    });
  });

  it('provides stream-specific performance breakdown for Grades 11 and 12', async () => {
    const analytics = await PrincipalService.getAcademicAnalytics();
    expect(analytics.streamPerformance.length).toBeGreaterThan(0);

    analytics.streamPerformance.forEach((sp) => {
      expect(sp.stream).toBeDefined();
      expect(['Computer Science A', 'Bio-Maths B', 'Commerce C', 'Pure Science D']).toContain(sp.stream);
      expect(sp.g11Average).toBeGreaterThan(0);
      expect(sp.g12Average).toBeGreaterThan(0);
    });
  });

  it('provides 8-tier CBSE letter grade distribution across school', async () => {
    const analytics = await PrincipalService.getAcademicAnalytics();
    expect(analytics.schoolGradeDistribution.length).toBe(8);

    const tiers = analytics.schoolGradeDistribution.map((d) => d.tier);
    expect(tiers.some((t) => t.startsWith('A1'))).toBe(true);
    expect(tiers.some((t) => t.startsWith('A2'))).toBe(true);
    expect(tiers.some((t) => t.startsWith('B1'))).toBe(true);
    expect(tiers.some((t) => t.startsWith('E'))).toBe(true);
  });
});

describe('Principal Domain — Attendance Analytics & Telemetry', () => {
  it('evaluates attendance telemetry across canonical 4 statuses', async () => {
    const telemetry = await PrincipalService.getAttendanceAnalytics();
    expect(telemetry).toBeDefined();

    expect(telemetry.overallPresenceRate).toBeGreaterThan(0);
    expect(telemetry.statusDistribution.length).toBe(4);

    const present = telemetry.statusDistribution.find((d) => d.status === 'PRESENT')?.count || 0;
    const absent = telemetry.statusDistribution.find((d) => d.status === 'ABSENT')?.count || 0;
    const onDuty = telemetry.statusDistribution.find((d) => d.status === 'ON_DUTY')?.count || 0;
    const leave = telemetry.statusDistribution.find((d) => d.status === 'LEAVE')?.count || 0;

    expect(present).toBeGreaterThan(0);
    expect(absent).toBeGreaterThanOrEqual(0);
    expect(onDuty).toBeGreaterThanOrEqual(0);
    expect(leave).toBeGreaterThanOrEqual(0);

    // Verify canonical calculation matches telemetry
    const computedRate = calculateAttendancePercentage({
      present,
      absent,
      onDuty,
      leave,
    });

    expect(telemetry.overallPresenceRate).toBe(computedRate);
  });

  it('tracks monthly attendance trends by grade cohort', async () => {
    const telemetry = await PrincipalService.getAttendanceAnalytics();
    expect(telemetry.cohortMonthlyTrends.length).toBeGreaterThan(0);

    telemetry.cohortMonthlyTrends.forEach((m) => {
      expect(m.month).toBeDefined();
      expect(m.gr10).toBeGreaterThan(0);
      expect(m.gr11).toBeGreaterThan(0);
      expect(m.gr12).toBeGreaterThan(0);
    });
  });
});

describe('Principal Domain — Faculty Directory Oversight (Non-Evaluative)', () => {
  it('loads faculty roster with qualifications and workload periods', async () => {
    const faculty = await PrincipalService.getFacultyDirectory();
    expect(faculty.length).toBeGreaterThan(0);

    const suresh = faculty.find((f) => f.name.includes('Suresh'));
    expect(suresh).toBeDefined();
    expect(suresh?.employee_code).toBe('FAC-MATH-012');
    expect(suresh?.qualification).toBeDefined();
    expect(suresh?.department).toBe('Mathematics');
    expect(suresh?.designation).toBe('Senior PGT & Department Head');
    expect(suresh?.weekly_periods).toBe(24);
  });

  it('strictly enforces absence of teacher ratings, scores, stars, or rankings', async () => {
    const faculty = await PrincipalService.getFacultyDirectory();

    faculty.forEach((member) => {
      const keys = Object.keys(member);
      expect(keys).not.toContain('rating');
      expect(keys).not.toContain('stars');
      expect(keys).not.toContain('appraisal_grade');
      expect(keys).not.toContain('performance_score');
      expect(keys).not.toContain('rank');
      expect(keys).not.toContain('feedback_score');
      expect(keys).not.toContain('teacher_ranking');
    });
  });
});

describe('Principal Domain — Institutional Reports & Endorsement Workflow', () => {
  it('retrieves institutional reports registry', async () => {
    const reports = await PrincipalService.getReports();
    expect(reports.length).toBeGreaterThan(0);

    const annualReport = reports.find((r) => r.id === 'rep_001');
    expect(annualReport).toBeDefined();
    expect(annualReport?.title).toContain('Annual School Academic Performance');
    expect(['Draft', 'Review', 'Approved']).toContain(annualReport?.status);
  });

  it('endorses and approves a report updating status and audit remarks', async () => {
    const initialReports = await PrincipalService.getReports();
    const targetReport = initialReports.find((r) => r.status === 'Review' || r.status === 'Draft') || initialReports[0];

    const updated = await PrincipalService.updateReportStatus(
      targetReport.id,
      'Approved',
      'Endorsed for official submission to CBSE Regional Directorate.'
    );

    expect(updated.status).toBe('Approved');
    expect(updated.approved_by).toContain('Dr. K. Radhakrishnan (Principal)');
    expect(updated.approved_at).toBeDefined();
    expect(updated.review_remarks).toContain('CBSE Regional Directorate');
  });
});
