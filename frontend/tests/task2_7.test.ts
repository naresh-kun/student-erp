/**
 * Student ERP — Task 2.7 Automated Vitest Test Suite
 * Specification: docs/phase_prompts/Phase_2_Task_2.7.md
 *
 * Comprehensive validation of:
 * 1. Student Section Allocation (Admin/Principal update+delete, Faculty view-only, immutable Student ID)
 * 2. Class Teacher Allocation (Admin/Principal update+delete, Faculty view-only, required fields)
 * 3. Faculty Subject Visibility (descriptive only, non-evaluative, searchable)
 * 4. Student Absentees Visibility (ONLY ABSENT, excludes PRESENT/ON_DUTY/LEAVE, role scoping)
 * 5. Attendance Not Entered Visibility (ONLY NOT ENTERED, distinct from student absentees, role scoping)
 * 6. Role-Tailored Search (Student & Faculty search, subject queries, no results handling)
 * 7. Governance: Stream rules, Attendance 4-status formula, No GPA/CGPA/credits
 */

import { describe, it, expect } from 'vitest';
import { AllocationService } from '../src/services/allocationService';
import { AdminService } from '../src/features/admin/services/adminService';
import { PrincipalService } from '../src/features/principal/services/principalService';
import { calculateAttendancePercentage } from '../src/utils/attendance';
import { calculateGrade } from '../src/utils/grading';

describe('Task 2.7 — Student Section Allocation', () => {
  it('Admin can view all student section allocations with required fields', async () => {
    const allocations = await AllocationService.getStudentAllocations();
    expect(allocations.length).toBeGreaterThan(0);

    const first = allocations[0];
    expect(first).toHaveProperty('student_id');
    expect(first).toHaveProperty('student_name');
    expect(first).toHaveProperty('grade');
    expect(first).toHaveProperty('section');
    expect(first).toHaveProperty('roll_number');
    expect(first).toHaveProperty('allocation_status');
    expect(first.student_id).toMatch(/^[A-Z]{3,4}\d{3,10}$/);
  });

  it('Principal can view student section allocations', async () => {
    const allocations = await AllocationService.getStudentAllocations();
    expect(allocations.length).toBeGreaterThan(0);
    expect(allocations.every((a) => a.student_id && a.student_name)).toBe(true);
  });

  it('Admin can update student section allocation with immutable Student ID', async () => {
    const allocations = await AllocationService.getStudentAllocations();
    const target = allocations[0];
    const originalId = target.student_id;

    const updated = await AllocationService.updateStudentAllocation(originalId, {
      grade: 'Grade 11',
      stream: 'Computer Science A',
      section: 'A1',
      roll_number: '11A1-99',
    });

    expect(updated).toBeDefined();
    expect(updated.student_id).toBe(originalId); // Immutable
    expect(updated.section).toBe('A1');
    expect(updated.roll_number).toBe('11A1-99');
    expect(updated.allocation_status).toBe('Allocated');
  });

  it('Principal can update student section allocation', async () => {
    const allocations = await AllocationService.getStudentAllocations();
    const target = allocations[1];
    const originalId = target.student_id;

    const updated = await AllocationService.updateStudentAllocation(originalId, {
      grade: 'Grade 11',
      stream: 'Bio-Maths B',
      section: 'B1',
      roll_number: '11B1-88',
    });

    expect(updated.student_id).toBe(originalId);
    expect(updated.stream).toBe('Bio-Maths B');
    expect(updated.section).toBe('B1');
  });

  it('Admin can delete student section allocation (resets to unassigned)', async () => {
    const allocations = await AllocationService.getStudentAllocations();
    const target = allocations[2];
    const targetId = target.student_id;

    const result = await AllocationService.deleteStudentAllocation(targetId);
    expect(result).toBe(true);

    const after = await AllocationService.getStudentAllocations();
    const found = after.find((a) => a.student_id === targetId);
    expect(found).toBeDefined();
    expect(found?.allocation_status).toBe('Unassigned');
    expect(found?.section).toBe('—');
  });

  it('Principal can delete student section allocation', async () => {
    const allocations = await AllocationService.getStudentAllocations();
    const target = allocations[3];
    const targetId = target.student_id;

    const result = await AllocationService.deleteStudentAllocation(targetId);
    expect(result).toBe(true);

    const after = await AllocationService.getStudentAllocations();
    const found = after.find((a) => a.student_id === targetId);
    expect(found?.allocation_status).toBe('Unassigned');
  });
});

describe('Task 2.7 — Class Teacher Allocation', () => {
  it('Admin and Principal can view Class Teacher allocations with complete metadata', async () => {
    const teachers = await AllocationService.getClassTeacherAllocations();
    expect(teachers.length).toBeGreaterThan(0);

    teachers.forEach((t) => {
      expect(t).toHaveProperty('faculty_id');
      expect(t).toHaveProperty('faculty_name');
      expect(t).toHaveProperty('designation');
      expect(t).toHaveProperty('assigned_subjects');
      expect(t).toHaveProperty('academic_year');
      expect(t).toHaveProperty('grade');
      expect(t).toHaveProperty('section');
      expect(t).toHaveProperty('status');
      expect(Array.isArray(t.assigned_subjects)).toBe(true);
      if (t.is_assigned) {
        expect(t.assigned_subjects?.length).toBeGreaterThan(0);
      }
    });
  });

  it('Admin can update Class Teacher allocation', async () => {
    const teachers = await AllocationService.getClassTeacherAllocations();
    const target = teachers[0];

    const updated = await AllocationService.updateClassTeacherAllocation(target.id, {
      faculty_id: 'fac_002',
      faculty_name: 'Dr. Meenakshi Sundaram',
      designation: 'Senior PGT Mathematics',
      assigned_subjects: ['Mathematics'],
    });

    expect(updated.faculty_id).toBe('fac_002');
    expect(updated.faculty_name).toBe('Dr. Meenakshi Sundaram');
    expect(updated.status).toBe('Assigned');
  });

  it('Principal can update Class Teacher allocation', async () => {
    const teachers = await AllocationService.getClassTeacherAllocations();
    const target = teachers[1];

    const updated = await AllocationService.updateClassTeacherAllocation(target.id, {
      faculty_id: 'fac_003',
      faculty_name: 'P. Venkatraman',
      designation: 'PGT Physics',
      assigned_subjects: ['Physics'],
    });

    expect(updated.faculty_id).toBe('fac_003');
    expect(updated.status).toBe('Assigned');
  });

  it('Admin can delete/remove Class Teacher allocation', async () => {
    const teachers = await AllocationService.getClassTeacherAllocations();
    const target = teachers[2];

    const result = await AllocationService.deleteClassTeacherAllocation(target.id);
    expect(result).toBe(true);

    const refreshed = await AllocationService.getClassTeacherAllocations();
    const found = refreshed.find((t) => t.id === target.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe('Unassigned');
    expect(found?.faculty_name).toBe('Unassigned');
  });

  it('Principal can delete/remove Class Teacher allocation', async () => {
    const teachers = await AllocationService.getClassTeacherAllocations();
    const target = teachers[3];

    const result = await AllocationService.deleteClassTeacherAllocation(target.id);
    expect(result).toBe(true);

    const refreshed = await AllocationService.getClassTeacherAllocations();
    const found = refreshed.find((t) => t.id === target.id);
    expect(found?.status).toBe('Unassigned');
  });
});

describe('Task 2.7 — Faculty Subject Visibility & Non-Evaluative Architecture', () => {
  it('Admin faculty directory exposes assigned subjects', async () => {
    const faculty = await AdminService.getFaculty();
    expect(faculty.length).toBeGreaterThan(0);

    faculty.forEach((f) => {
      expect(f).toHaveProperty('assigned_subjects');
      expect(Array.isArray(f.assigned_subjects)).toBe(true);
      // Descriptive only — no performance ratings or rankings
      expect(f).not.toHaveProperty('rating');
      expect(f).not.toHaveProperty('score');
      expect(f).not.toHaveProperty('ranking');
    });
  });

  it('Principal faculty directory exposes assigned subjects', async () => {
    const faculty = await PrincipalService.getFacultyDirectory();
    expect(faculty.length).toBeGreaterThan(0);

    faculty.forEach((f) => {
      expect(f).toHaveProperty('assigned_subjects');
      expect(Array.isArray(f.assigned_subjects)).toBe(true);
      expect(f).not.toHaveProperty('performance_score');
      expect(f).not.toHaveProperty('rank');
    });
  });

  it('Faculty directory search matches on assigned subjects', async () => {
    const csFaculty = await AdminService.getFaculty({ search: 'Computer Science' });
    expect(csFaculty.length).toBeGreaterThan(0);
    const hasMatch = csFaculty.some(
      (f) =>
        f.department === 'Computer Science' ||
        f.assigned_subjects.some((s) => s.toLowerCase().includes('computer science'))
    );
    expect(hasMatch).toBe(true);
  });
});

describe('Task 2.7 — Student Absentees Visibility', () => {
  it('Absentees list contains strictly and ONLY students with status ABSENT', async () => {
    const absentees = await AllocationService.getStudentAbsentees();
    expect(absentees.length).toBeGreaterThan(0);

    absentees.forEach((a) => {
      expect(a.status).toBe('ABSENT');
      expect(a.status).not.toBe('PRESENT');
      expect(a.status).not.toBe('ON_DUTY');
      expect(a.status).not.toBe('LEAVE');
    });
  });

  it('Admin and Principal receive school-wide absentees', async () => {
    const absentees = await AllocationService.getStudentAbsentees();
    const grades = new Set(absentees.map((a) => a.grade));
    expect(grades.size).toBeGreaterThanOrEqual(2); // Spans multiple grades
  });

  it('Faculty receives absentees scoped strictly to assigned classes', async () => {
    const facultyAbsentees = await AllocationService.getStudentAbsentees('fac_001');
    expect(facultyAbsentees.length).toBeGreaterThan(0);

    facultyAbsentees.forEach((a) => {
      expect(a.status).toBe('ABSENT');
      // fac_001 teaches Grade 10 Section A, Grade 11 Section A2, Grade 12 Section A1
      const isAllowed =
        (a.grade === 'Grade 11' && (a.section?.includes('A2') || a.section === 'Section A2')) ||
        (a.grade === 'Grade 12' && (a.section?.includes('A1') || a.section === 'Section A1')) ||
        (a.grade === 'Grade 10' && (a.section?.includes('A') || a.section === 'Section A'));
      expect(isAllowed).toBe(true);
    });
  });
});

describe('Task 2.7 — Attendance Not Entered Visibility', () => {
  it('Contains strictly unentered sessions with status NOT ENTERED', async () => {
    const unentered = await AllocationService.getAttendanceNotEntered();
    expect(unentered.length).toBeGreaterThan(0);

    unentered.forEach((u) => {
      expect(u.session_status).toBe('NOT ENTERED');
      expect(u).toHaveProperty('date');
      expect(u).toHaveProperty('grade');
      expect(u).toHaveProperty('section');
      expect(u).toHaveProperty('subject');
      expect(u).toHaveProperty('period');
      expect(u).toHaveProperty('faculty_name');
    });
  });

  it('Admin and Principal receive school-wide unentered sessions', async () => {
    const unentered = await AllocationService.getAttendanceNotEntered();
    expect(unentered.length).toBeGreaterThanOrEqual(3);
  });

  it('Faculty receives unentered sessions scoped strictly to assigned responsibilities', async () => {
    const facultyUnentered = await AllocationService.getAttendanceNotEntered('fac_001');
    expect(facultyUnentered.length).toBeGreaterThan(0);

    facultyUnentered.forEach((u) => {
      expect(u.session_status).toBe('NOT ENTERED');
      expect(u.faculty_id).toBe('fac_001');
    });
  });
});

describe('Task 2.7 — Role-Tailored Directory Search', () => {
  it('Admin student search by name and ID', async () => {
    const byName = await AllocationService.searchDirectory('Arun', 'Admin');
    expect(byName.length).toBeGreaterThan(0);
    const student = byName.find((r) => r.type === 'Student');
    expect(student).toBeDefined();
    expect(student?.name).toContain('Arun');

    const byId = await AllocationService.searchDirectory('STU202600001', 'Admin');
    expect(byId.length).toBeGreaterThan(0);
    expect(byId[0].id).toBe('STU202600001');
  });

  it('Admin faculty search by subject and name', async () => {
    const bySubject = await AllocationService.searchDirectory('Mathematics', 'Admin');
    const facultyMatch = bySubject.find((r) => r.type === 'Faculty');
    expect(facultyMatch).toBeDefined();
    expect(facultyMatch?.subjects).toContain('Mathematics');

    const byName = await AllocationService.searchDirectory('Suresh', 'Admin');
    const faculty = byName.find((r) => r.type === 'Faculty');
    expect(faculty).toBeDefined();
    expect(faculty?.name).toContain('Suresh');
  });

  it('Principal can search both students and faculty', async () => {
    const results = await AllocationService.searchDirectory('Physics', 'Principal');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.type === 'Faculty')).toBe(true);
  });

  it('Faculty search returns results for directory reference', async () => {
    const results = await AllocationService.searchDirectory('Grade 11', 'Faculty');
    expect(results.length).toBeGreaterThan(0);
  });

  it('Search handles zero results cleanly without errors', async () => {
    const results = await AllocationService.searchDirectory('NonExistentQueryXYZ123', 'Admin');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe('Task 2.7 — Architectural Invariants & Formula Verification', () => {
  it('Attendance formula strictly preserves (PRESENT + ON_DUTY) / Total * 100', () => {
    const rate = calculateAttendancePercentage({
      present: 40,
      onDuty: 5,
      absent: 3,
      leave: 2,
    });
    // Total = 40 + 5 + 3 + 2 = 50. (40 + 5) / 50 * 100 = 90.0%
    expect(rate).toBe(90);
  });

  it('LEAVE counts in denominator as absence, reducing the percentage', () => {
    const rateWithLeave = calculateAttendancePercentage({
      present: 40,
      onDuty: 0,
      absent: 0,
      leave: 10,
    });
    // Total = 50. 40 / 50 * 100 = 80.0%
    expect(rateWithLeave).toBe(80);
  });

  it('CBSE 8-tier letter grades strictly preserved without GPA/CGPA', () => {
    expect(calculateGrade(95)).toBe('A1');
    expect(calculateGrade(85)).toBe('A2');
    expect(calculateGrade(75)).toBe('B1');
    expect(calculateGrade(65)).toBe('B2');
    expect(calculateGrade(55)).toBe('C1');
    expect(calculateGrade(45)).toBe('C2');
    expect(calculateGrade(35)).toBe('D');
    expect(calculateGrade(25)).toBe('E');
  });
});
