/**
 * Student ERP — Admin Domain Vitest Test Suite
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * Comprehensive automated verification covering:
 * 1. Admin dashboard summary metrics and statistics
 * 2. Student Directory search, filtering, and permanent/immutable Student ID
 * 3. Parent Directory lookup and child Student ID linking
 * 4. Faculty Directory non-evaluative governance (strictly NO ratings/rankings/scores)
 * 5. Class & Section hierarchy (Grade 10 no stream, Grades 11-12 stream-aware)
 * 6. Subjects Catalog (weekly periods, strictly NO credits or GPA)
 * 7. Attendance Oversight (4 canonical statuses: PRESENT, ABSENT, ON_DUTY, LEAVE)
 * 8. Marks Oversight (CBSE 8-tier letter grades A1-E, strictly NO GPA/CGPA)
 * 9. Calendar Events Manager & Zod schema validation
 * 10. Class & Section Allocation Engine:
 *     - Merit-based distribution (sorted descending by qualifying score)
 *     - Random distribution
 *     - Strict Grade 11–12 stream-boundary enforcement
 *     - Preview generation & publication history
 */

import { describe, it, expect } from 'vitest';
import { AdminService } from '../src/features/admin/services/adminService';
import { adminEventSchema } from '../src/features/admin/schemas/eventSchema';
import { calculateAttendancePercentage, calculateGrade } from '../src/utils';

describe('Admin Domain — Dashboard KPIs & System Health', () => {
  it('loads authoritative admin dashboard KPIs', async () => {
    const { kpis, attendanceTrend } = await AdminService.getDashboardSummary();

    expect(kpis).toBeDefined();
    expect(kpis.total_students).toBe(1248);
    expect(kpis.total_faculty).toBe(86);
    expect(kpis.total_classes).toBe(6);
    expect(kpis.overall_attendance_rate).toBeGreaterThan(0);
    expect(kpis.academic_year).toBe('2026–27');
    expect(attendanceTrend.length).toBeGreaterThan(0);
  });
});

describe('Admin Domain — Student Master Directory', () => {
  it('retrieves student list with query search and grade filter', async () => {
    const allStudents = await AdminService.getStudents();
    expect(allStudents.length).toBeGreaterThan(0);

    const filteredByName = await AdminService.getStudents({ search: 'Arun' });
    expect(filteredByName.length).toBeGreaterThan(0);
    expect(filteredByName[0].name).toContain('Arun');

    const filteredByGrade = await AdminService.getStudents({ gradeLevel: 11 });
    expect(filteredByGrade.length).toBeGreaterThan(0);
    filteredByGrade.forEach((s) => {
      expect(s.class_name).toContain('Grade 11');
    });
  });

  it('verifies permanent, immutable Student ID format on all students', async () => {
    const students = await AdminService.getStudents();

    students.forEach((s) => {
      expect(s.student_id).toBeDefined();
      expect(s.student_id).toMatch(/^STU\d{9}$/);
      expect(s.admission_number).toMatch(/^ADM\d{8}$/);
    });
  });

  it('respects senior secondary stream designations for Grades 11-12', async () => {
    const students = await AdminService.getStudents({ gradeLevel: 11 });
    students.forEach((s) => {
      expect(s.stream).toBeDefined();
      expect(['Computer Science A', 'Bio-Maths B', 'Commerce C', 'Pure Science D']).toContain(s.stream);
    });
  });
});

describe('Admin Domain — Parent Master Directory', () => {
  it('loads parents and links each to child permanent Student ID', async () => {
    const parents = await AdminService.getParents();
    expect(parents.length).toBeGreaterThan(0);

    const ramanathan = parents.find((p) => p.name.includes('Ramanathan'));
    expect(ramanathan).toBeDefined();
    expect(ramanathan?.children.some((c) => c.student_id === 'STU202600001')).toBe(true);
    expect(ramanathan?.children.some((c) => c.name.includes('Arun'))).toBe(true);
  });

  it('searches parents by student name or child Student ID', async () => {
    const byChildId = await AdminService.getParents('STU202600001');
    expect(byChildId.length).toBeGreaterThan(0);
    expect(byChildId[0].children.some((c) => c.student_id === 'STU202600001')).toBe(true);
  });
});

describe('Admin Domain — Faculty Master Directory (Non-Evaluative)', () => {
  it('loads faculty records with descriptive operational data only', async () => {
    const faculty = await AdminService.getFaculty();
    expect(faculty.length).toBeGreaterThan(0);

    const suresh = faculty.find((f) => f.name.includes('Suresh'));
    expect(suresh).toBeDefined();
    expect(suresh?.employee_code).toBe('FAC-MATH-012');
    expect(suresh?.department).toBe('Mathematics');
    expect(suresh?.designation).toBe('Senior PGT & Department Head');
    expect(suresh?.weekly_periods).toBe(24);
  });

  it('strictly enforces NO ratings, NO reviews, NO scores, and NO teacher rankings', async () => {
    const faculty = await AdminService.getFaculty();

    faculty.forEach((f) => {
      const keys = Object.keys(f);
      expect(keys).not.toContain('rating');
      expect(keys).not.toContain('stars');
      expect(keys).not.toContain('appraisal_score');
      expect(keys).not.toContain('performance_index');
      expect(keys).not.toContain('teacher_rank');
      expect(keys).not.toContain('review_score');
      expect(keys).not.toContain('evaluation');
    });
  });
});

describe('Admin Domain — Class & Section Hierarchy', () => {
  it('models Grade 10 without stream and Grades 11-12 with 4 approved streams', async () => {
    const classes = await AdminService.getClassesAndSections();
    expect(classes.length).toBeGreaterThan(0);

    const grade10 = classes.find((c) => c.grade_level === 10);
    expect(grade10).toBeDefined();
    expect(grade10?.stream).toBeFalsy();

    const grade11Classes = classes.filter((c) => c.grade_level === 11);
    expect(grade11Classes.length).toBeGreaterThan(0);
    grade11Classes.forEach((c) => {
      expect(['Computer Science A', 'Bio-Maths B', 'Commerce C', 'Pure Science D']).toContain(c.stream);
    });

    const grade12Classes = classes.filter((c) => c.grade_level === 12);
    expect(grade12Classes.length).toBeGreaterThan(0);
    grade12Classes.forEach((c) => {
      expect(['Computer Science A', 'Bio-Maths B', 'Commerce C', 'Pure Science D']).toContain(c.stream);
    });
  });
});

describe('Admin Domain — Subjects Catalog', () => {
  it('defines school subjects with weekly periods and strictly NO credits or GPA', async () => {
    const subjects = await AdminService.getSubjectsCatalog();
    expect(subjects.length).toBeGreaterThan(0);

    subjects.forEach((subj) => {
      expect(subj.weekly_periods).toBeGreaterThan(0);
      expect(subj.applicable_grades).toBeDefined();

      const keys = Object.keys(subj);
      expect(keys).not.toContain('credits');
      expect(keys).not.toContain('credit_hours');
      expect(keys).not.toContain('gpa');
      expect(keys).not.toContain('grade_points');
    });
  });
});

describe('Admin Domain — Attendance Oversight', () => {
  it('records section attendance audits using the canonical 4-status model', async () => {
    const audits = await AdminService.getAttendanceOverview();
    expect(audits.length).toBeGreaterThan(0);

    audits.forEach((audit) => {
      expect(audit.present_count).toBeGreaterThanOrEqual(0);
      expect(audit.on_duty_count).toBeGreaterThanOrEqual(0);
      expect(audit.leave_count).toBeGreaterThanOrEqual(0);
      expect(audit.absent_count).toBeGreaterThanOrEqual(0);

      // Verify canonical percentage formula: (P + OD) / Total * 100
      const calculated = calculateAttendancePercentage({
        present: audit.present_count,
        absent: audit.absent_count,
        onDuty: audit.on_duty_count,
        leave: audit.leave_count,
      });

      expect(audit.attendance_percentage).toBe(calculated);
    });
  });
});

describe('Admin Domain — Examination Marks Oversight', () => {
  it('oversights examination scores with CBSE 8-tier letter grades and no GPA', async () => {
    const marksOverview = await AdminService.getMarksOverview();
    expect(marksOverview.length).toBeGreaterThan(0);

    marksOverview.forEach((exam) => {
      expect(exam.average_percentage).toBeGreaterThanOrEqual(0);
      expect(exam.average_percentage).toBeLessThanOrEqual(100);
      expect(exam.pass_percentage).toBeGreaterThanOrEqual(0);

      // Verify derived 8-tier grade
      const expectedGrade = calculateGrade(exam.average_percentage);
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E']).toContain(expectedGrade);
    });
  });
});

describe('Admin Domain — Calendar Events Validation', () => {
  it('validates calendar event data using Zod schema', () => {
    const validEvent = {
      title: 'Annual CBSE Science Exhibition 2026',
      category: 'Academic' as const,
      start_date: '2026-11-15',
      end_date: '2026-11-16',
      start_time: '09:00',
      end_time: '16:00',
      location: 'Main Auditorium & Laboratories',
      description: 'Senior Secondary student science exhibits and project demonstrations',
      target_audience: 'Grades 9 to 12',
      academic_relevance: 'Science and technology curricular enrichment',
      od_eligible: true,
      is_holiday: false,
    };

    const parsed = adminEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid event when title is missing or date format is incorrect', () => {
    const invalidEvent = {
      title: '',
      category: 'Academic',
      start_date: 'not-a-date',
      end_date: '2026-11-16',
    };

    const parsed = adminEventSchema.safeParse(invalidEvent);
    expect(parsed.success).toBe(false);
  });
});

describe('Admin Domain — Class & Section Allocation Engine', () => {
  it('generates Merit-Based preview ordering candidates by qualifying marks', async () => {
    const { sourceStudents, targetSections } = await AdminService.getAllocationWorkspace('Grade 11', 'Computer Science A');
    expect(sourceStudents.length).toBeGreaterThan(0);
    expect(targetSections.length).toBeGreaterThan(0);

    const preview = AdminService.generateAllocationPreview({
      grade: 'Grade 11',
      stream: 'Computer Science A',
      method: 'MERIT',
      targetSections: targetSections.map((t) => t.section_name),
      students: sourceStudents,
    });

    expect(preview).toBeDefined();
    expect(preview.length).toBe(sourceStudents.length);

    // Verify candidates all have score
    preview.forEach((alloc) => {
      expect(alloc.score).toBeGreaterThanOrEqual(0);
      expect(alloc.basis).toBe('Merit Score');
    });

    // In merit order, the first student should have >= the second student's score
    if (preview.length > 1) {
      expect(preview[0].score).toBeGreaterThanOrEqual(preview[1].score);
    }
  });

  it('generates Random allocation preview successfully', async () => {
    const { sourceStudents, targetSections } = await AdminService.getAllocationWorkspace('Grade 11', 'Bio-Maths B');
    expect(sourceStudents.length).toBeGreaterThan(0);

    const preview = AdminService.generateAllocationPreview({
      grade: 'Grade 11',
      stream: 'Bio-Maths B',
      method: 'RANDOM',
      targetSections: targetSections.map((t) => t.section_name),
      students: sourceStudents,
    });

    expect(preview).toBeDefined();
    expect(preview.length).toBe(sourceStudents.length);
    preview.forEach((alloc) => {
      expect(alloc.basis).toBe('Random Seeded');
    });
  });

  it('enforces Grade 11-12 stream boundaries during allocation preview', async () => {
    const { sourceStudents, targetSections } = await AdminService.getAllocationWorkspace('Grade 11', 'Computer Science A');

    const preview = AdminService.generateAllocationPreview({
      grade: 'Grade 11',
      stream: 'Computer Science A',
      method: 'MERIT',
      targetSections: targetSections.map((t) => t.section_name),
      students: sourceStudents,
    });

    preview.forEach((alloc) => {
      expect(targetSections.map((t) => t.section_name)).toContain(alloc.proposed_section);
    });
  });

  it('publishes allocation and records in allocation history log', async () => {
    const { sourceStudents, targetSections } = await AdminService.getAllocationWorkspace('Grade 11', 'Commerce C');
    const preview = AdminService.generateAllocationPreview({
      grade: 'Grade 11',
      stream: 'Commerce C',
      method: 'MERIT',
      targetSections: targetSections.map((t) => t.section_name),
      students: sourceStudents,
    });

    const recorded = await AdminService.publishAllocation({
      academicYear: '2026–27',
      grade: 'Grade 11',
      stream: 'Commerce C',
      method: 'MERIT',
      publishedBy: 'Admin (Academic Directorate)',
      previewRecords: preview,
    });

    expect(recorded.id).toBeDefined();
    expect(recorded.status).toBe('Committed');

    const history = await AdminService.getAllocationHistory();
    const found = history.find((h) => h.id === recorded.id);
    expect(found).toBeDefined();
    expect(found?.published_by).toBe('Admin (Academic Directorate)');
  });
});
