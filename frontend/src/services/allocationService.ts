/**
 * Student ERP — Operational Allocation, Search & Attendance Visibility Service
 * Phase 2 — Task 2.7 Approved Functional/UI Amendment
 *
 * GOVERNANCE:
 * - Pure frontend / mock service layer.
 * - Simulates in-memory updates/deletions without claiming backend persistence.
 * - Hierarchy: Academic Year -> Grade -> Stream (Grades 11-12) -> Section -> Student.
 * - Immutable Student ID.
 * - Class Teacher assignments reflect Faculty ID, Name, Designation, Subjects, Grade, Stream, Section.
 * - Absentee list contains ONLY status 'ABSENT' (excludes PRESENT, ON_DUTY, LEAVE).
 * - Attendance Not Entered represents unentered timetable sessions (status 'NOT ENTERED').
 * - Role-tailored scoping: School-wide for Admin & Principal; scoped for Faculty.
 */

import type {
  StudentAllocationItem,
  ClassTeacherAllocationItem,
  StudentAbsenteeItem,
  AttendanceNotEnteredItem,
  GlobalSearchResultItem,
  UserRole,
} from '@/types';
import { AllocationApiService } from './allocationApiService';

const delay = (ms = 35) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// INITIAL IN-MEMORY MOCK STATE
// ==========================================

const INITIAL_STUDENT_ALLOCATIONS: StudentAllocationItem[] = [
  {
    id: 'alloc_001',
    student_id: 'STU202600001',
    student_name: 'Arun Kumar',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Computer Science A',
    section_id: 'sec_002',
    section_name: 'Section A2',
    roll_number: '11-A2-04',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_002',
    student_id: 'STU202600002',
    student_name: 'Priya S',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Computer Science A',
    section_id: 'sec_002',
    section_name: 'Section A2',
    roll_number: '11-A2-18',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_003',
    student_id: 'STU202600003',
    student_name: 'Rahul Raj',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Commerce C',
    section_id: 'sec_007',
    section_name: 'Section C1',
    roll_number: '11-C1-09',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_004',
    student_id: 'STU202600004',
    student_name: 'Keerthana M',
    grade_level: 10,
    grade_name: 'Grade 10',
    stream: undefined,
    section_id: 'sec_g10_a',
    section_name: 'Section A',
    roll_number: '10-A-15',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_005',
    student_id: 'STU202600005',
    student_name: 'Aditya Sharma',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Bio-Maths B',
    section_id: 'sec_004',
    section_name: 'Section B1',
    roll_number: '11-B1-02',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_006',
    student_id: 'STU202600006',
    student_name: 'Ananya R',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Pure Science D',
    section_id: 'sec_010',
    section_name: 'Section D1',
    roll_number: '11-D1-14',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_007',
    student_id: 'STU202600007',
    student_name: 'Kavitha Sundaram',
    grade_level: 10,
    grade_name: 'Grade 10',
    stream: undefined,
    section_id: 'sec_g10_b',
    section_name: 'Section B',
    roll_number: '10-B-22',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
  {
    id: 'alloc_008',
    student_id: 'STU202600008',
    student_name: 'Siddharth Iyer',
    grade_level: 12,
    grade_name: 'Grade 12',
    stream: 'Computer Science A',
    section_id: 'sec_12_a1',
    section_name: 'Section A1',
    roll_number: '12-A1-07',
    academic_year: '2026–27',
    allocation_status: 'Allocated',
  },
];

const INITIAL_CLASS_TEACHER_ALLOCATIONS: ClassTeacherAllocationItem[] = [
  {
    id: 'cta_001',
    faculty_id: 'fac_001',
    faculty_name: 'R. Suresh',
    employee_code: 'FAC-MATH-012',
    designation: 'Senior PGT & Department Head',
    subjects: ['Mathematics'],
    academic_year: '2026–27',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Computer Science A',
    section_id: 'sec_002',
    section_name: 'Section A2',
    is_assigned: true,
    assignment_status: 'Assigned',
  },
  {
    id: 'cta_002',
    faculty_id: 'fac_002',
    faculty_name: 'Priya Krishnan',
    employee_code: 'FAC-CS-008',
    designation: 'PGT Computer Science',
    subjects: ['Computer Science'],
    academic_year: '2026–27',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Bio-Maths B',
    section_id: 'sec_004',
    section_name: 'Section B1',
    is_assigned: true,
    assignment_status: 'Assigned',
  },
  {
    id: 'cta_003',
    faculty_id: 'fac_004',
    faculty_name: 'Meena Devi',
    employee_code: 'FAC-ENG-015',
    designation: 'Senior PGT English',
    subjects: ['English Core'],
    academic_year: '2026–27',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Commerce C',
    section_id: 'sec_007',
    section_name: 'Section C1',
    is_assigned: true,
    assignment_status: 'Assigned',
  },
  {
    id: 'cta_004',
    faculty_id: 'fac_003',
    faculty_name: 'Karthik Raman',
    employee_code: 'FAC-PHY-009',
    designation: 'PGT Physics',
    subjects: ['Physics'],
    academic_year: '2026–27',
    grade_level: 11,
    grade_name: 'Grade 11',
    stream: 'Pure Science D',
    section_id: 'sec_010',
    section_name: 'Section D1',
    is_assigned: true,
    assignment_status: 'Assigned',
  },
  {
    id: 'cta_005',
    faculty_id: 'fac_005',
    faculty_name: 'Anitha Joseph',
    employee_code: 'FAC-CHEM-011',
    designation: 'PGT Chemistry',
    subjects: ['Chemistry'],
    academic_year: '2026–27',
    grade_level: 10,
    grade_name: 'Grade 10',
    stream: undefined,
    section_id: 'sec_g10_a',
    section_name: 'Section A',
    is_assigned: true,
    assignment_status: 'Assigned',
  },
  {
    id: 'cta_006',
    faculty_id: '',
    faculty_name: 'Unassigned',
    employee_code: '-',
    designation: '-',
    subjects: [],
    academic_year: '2026–27',
    grade_level: 10,
    grade_name: 'Grade 10',
    stream: undefined,
    section_id: 'sec_g10_b',
    section_name: 'Section B',
    is_assigned: false,
    assignment_status: 'Unassigned',
  },
  {
    id: 'cta_007',
    faculty_id: '',
    faculty_name: 'Unassigned',
    employee_code: '-',
    designation: '-',
    subjects: [],
    academic_year: '2026–27',
    grade_level: 12,
    grade_name: 'Grade 12',
    stream: 'Computer Science A',
    section_id: 'sec_12_a1',
    section_name: 'Section A1',
    is_assigned: false,
    assignment_status: 'Unassigned',
  },
];

const INITIAL_STUDENT_ABSENTEES: StudentAbsenteeItem[] = [
  {
    id: 'abs_001',
    student_id: 'STU202600002',
    student_name: 'Priya S',
    grade_name: 'Grade 11',
    stream: 'Computer Science A',
    section_name: 'Section A2',
    subject_name: 'Mathematics',
    date: '2026-09-22',
    period: 'Period 1',
    status: 'ABSENT',
    faculty_name: 'R. Suresh',
    faculty_id: 'fac_001',
    class_id: 'cls_001',
    section_id: 'sec_002',
  },
  {
    id: 'abs_002',
    student_id: 'STU202600001',
    student_name: 'Arun Kumar',
    grade_name: 'Grade 11',
    stream: 'Computer Science A',
    section_name: 'Section A2',
    subject_name: 'Mathematics',
    date: '2026-09-21',
    period: 'Period 1',
    status: 'ABSENT',
    faculty_name: 'R. Suresh',
    faculty_id: 'fac_001',
    class_id: 'cls_001',
    section_id: 'sec_002',
  },
  {
    id: 'abs_003',
    student_id: 'STU202600004',
    student_name: 'Keerthana M',
    grade_name: 'Grade 10',
    stream: undefined,
    section_name: 'Section A',
    subject_name: 'English Core',
    date: '2026-09-23',
    period: 'Period 2',
    status: 'ABSENT',
    faculty_name: 'Meena Devi',
    faculty_id: 'fac_004',
    class_id: 'cls_000',
    section_id: 'sec_g10_a',
  },
  {
    id: 'abs_004',
    student_id: 'STU202600005',
    student_name: 'Aditya Sharma',
    grade_name: 'Grade 11',
    stream: 'Bio-Maths B',
    section_name: 'Section B1',
    subject_name: 'Physics',
    date: '2026-09-24',
    period: 'Period 3',
    status: 'ABSENT',
    faculty_name: 'Karthik Raman',
    faculty_id: 'fac_003',
    class_id: 'cls_002',
    section_id: 'sec_004',
  },
];

const INITIAL_ATTENDANCE_NOT_ENTERED: AttendanceNotEnteredItem[] = [
  {
    id: 'ane_001',
    date: '2026-09-24',
    grade_name: 'Grade 12',
    stream: 'Computer Science A',
    section_name: 'Section A1',
    subject_name: 'Mathematics',
    period: 'Period 3 (10:15 - 11:00)',
    faculty_name: 'R. Suresh',
    faculty_id: 'fac_001',
    class_id: 'cls_012',
    section_id: 'sec_12_a1',
    session_status: 'NOT ENTERED',
  },
  {
    id: 'ane_002',
    date: '2026-09-24',
    grade_name: 'Grade 10',
    stream: undefined,
    section_name: 'Section A',
    subject_name: 'Mathematics',
    period: 'Period 5 (12:30 - 13:15)',
    faculty_name: 'R. Suresh',
    faculty_id: 'fac_001',
    class_id: 'cls_000',
    section_id: 'sec_g10_a',
    session_status: 'NOT ENTERED',
  },
  {
    id: 'ane_003',
    date: '2026-09-24',
    grade_name: 'Grade 11',
    stream: 'Bio-Maths B',
    section_name: 'Section B2',
    subject_name: 'Chemistry',
    period: 'Period 4 (11:00 - 11:45)',
    faculty_name: 'Anitha Joseph',
    faculty_id: 'fac_005',
    class_id: 'cls_002',
    section_id: 'sec_005',
    session_status: 'NOT ENTERED',
  },
  {
    id: 'ane_004',
    date: '2026-09-24',
    grade_name: 'Grade 11',
    stream: 'Commerce C',
    section_name: 'Section C1',
    subject_name: 'English Core',
    period: 'Period 2 (09:15 - 10:00)',
    faculty_name: 'Meena Devi',
    faculty_id: 'fac_004',
    class_id: 'cls_003',
    section_id: 'sec_007',
    session_status: 'NOT ENTERED',
  },
];

// In-memory mutable arrays representing active state during user session
let studentAllocationsState: StudentAllocationItem[] = INITIAL_STUDENT_ALLOCATIONS.map((s) => ({
  ...s,
  grade: s.grade_name,
  section: s.section_name,
}));

let classTeacherAllocationsState: ClassTeacherAllocationItem[] = INITIAL_CLASS_TEACHER_ALLOCATIONS.map((cta) => ({
  ...cta,
  grade: cta.grade_name,
  section: cta.section_name,
  assigned_subjects: cta.subjects,
  status: cta.assignment_status,
}));

let studentAbsenteesState: StudentAbsenteeItem[] = INITIAL_STUDENT_ABSENTEES.map((a) => ({
  ...a,
  grade: a.grade_name,
  section: a.section_name,
  subject: a.subject_name,
}));

let attendanceNotEnteredState: AttendanceNotEnteredItem[] = INITIAL_ATTENDANCE_NOT_ENTERED.map((u) => ({
  ...u,
  grade: u.grade_name,
  section: u.section_name,
  subject: u.subject_name,
}));

// ==========================================
// ALLOCATION SERVICE IMPLEMENTATION
// ==========================================

export class AllocationService {
  static resetState(): void {
    studentAllocationsState = INITIAL_STUDENT_ALLOCATIONS.map((s) => ({
      ...s,
      grade: s.grade_name,
      section: s.section_name,
    }));
    classTeacherAllocationsState = INITIAL_CLASS_TEACHER_ALLOCATIONS.map((cta) => ({
      ...cta,
      grade: cta.grade_name,
      section: cta.section_name,
      assigned_subjects: cta.subjects,
      status: cta.assignment_status,
    }));
    studentAbsenteesState = INITIAL_STUDENT_ABSENTEES.map((a) => ({
      ...a,
      grade: a.grade_name,
      section: a.section_name,
      subject: a.subject_name,
    }));
    attendanceNotEnteredState = INITIAL_ATTENDANCE_NOT_ENTERED.map((u) => ({
      ...u,
      grade: u.grade_name,
      section: u.section_name,
      subject: u.subject_name,
    }));
  }

  // ----------------------------------------
  // 1. STUDENT SECTION ALLOCATION
  // ----------------------------------------

  static async getStudentAllocations(filters?: {
    search?: string;
    grade?: string;
    stream?: string;
    section?: string;
  }): Promise<StudentAllocationItem[]> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        const live = await AllocationApiService.getStudentAllocations(filters);
        if (live && live.length > 0) {
          studentAllocationsState = live.map((s) => ({
            ...s,
            grade: s.grade_name,
            section: s.section_name,
          }));
          return studentAllocationsState;
        }
      }
    } catch (err) {
      console.warn('[AllocationService] Live student allocations fetch failed, using fallback:', err);
    }
    await delay();
    let records = [...studentAllocationsState];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      records = records.filter(
        (s) =>
          s.student_id.toLowerCase().includes(q) ||
          s.student_name.toLowerCase().includes(q) ||
          s.roll_number.toLowerCase().includes(q) ||
          s.section_name.toLowerCase().includes(q) ||
          s.grade_name.toLowerCase().includes(q)
      );
    }

    if (filters?.grade && filters.grade !== 'ALL') {
      records = records.filter((s) => s.grade_name === filters.grade);
    }

    if (filters?.stream && filters.stream !== 'ALL') {
      records = records.filter((s) => s.stream === filters.stream);
    }

    if (filters?.section && filters.section !== 'ALL') {
      records = records.filter((s) => s.section_name === filters.section);
    }

    return records;
  }

  static async updateStudentAllocation(
    studentId: string,
    updates: {
      grade_name?: string;
      grade?: string;
      grade_level?: number;
      stream?: string;
      section_name?: string;
      section?: string;
      section_id?: string;
      roll_number?: string;
    }
  ): Promise<StudentAllocationItem> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      const liveUpdated = await AllocationApiService.updateStudentAllocation(studentId, updates);
      if (liveUpdated) {
        const idx = studentAllocationsState.findIndex((s) => s.student_id === studentId || s.id === studentId);
        if (idx !== -1) {
          studentAllocationsState[idx] = {
            ...liveUpdated,
            grade: liveUpdated.grade_name,
            section: liveUpdated.section_name,
          };
        }
        return liveUpdated;
      }
    }
    await delay();
    const index = studentAllocationsState.findIndex((s) => s.student_id === studentId || s.id === studentId);
    if (index === -1) {
      throw new Error(`Student ${studentId} not found in section allocation records`);
    }

    const current = studentAllocationsState[index];
    const gradeName = updates.grade_name || updates.grade || current.grade_name;
    const gradeLevel = updates.grade_level || (gradeName.includes('12') ? 12 : gradeName.includes('11') ? 11 : 10);
    const sectionName = updates.section_name || updates.section || current.section_name;
    const streamVal = gradeLevel >= 11 ? (updates.stream !== undefined ? updates.stream : current.stream) : undefined;
    const rollNo = updates.roll_number || current.roll_number;

    const updated: StudentAllocationItem = {
      ...current,
      grade_name: gradeName,
      grade: gradeName,
      grade_level: gradeLevel,
      stream: streamVal,
      section_name: sectionName,
      section: sectionName,
      section_id: updates.section_id || `sec_${sectionName.toLowerCase().replace(/\s+/g, '_')}`,
      roll_number: rollNo,
      allocation_status: 'Allocated',
    };

    studentAllocationsState[index] = updated;
    return updated;
  }

  static async deleteStudentAllocation(studentId: string): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      await AllocationApiService.deleteStudentAllocation(studentId);
      const idx = studentAllocationsState.findIndex((s) => s.student_id === studentId || s.id === studentId);
      if (idx !== -1) {
        const current = studentAllocationsState[idx];
        studentAllocationsState[idx] = {
          ...current,
          section_name: '—',
          section: '—',
          section_id: 'none',
          allocation_status: 'Unassigned',
        };
      }
      return true;
    }
    await delay();
    const index = studentAllocationsState.findIndex((s) => s.student_id === studentId || s.id === studentId);
    if (index === -1) {
      throw new Error(`Student ${studentId} not found in section allocation records`);
    }

    const current = studentAllocationsState[index];
    studentAllocationsState[index] = {
      ...current,
      section_name: '—',
      section: '—',
      section_id: 'none',
      allocation_status: 'Unassigned',
    };

    return true;
  }


  // ----------------------------------------
  // 2. CLASS TEACHER ALLOCATION
  // ----------------------------------------

  static async getClassTeacherAllocations(filters?: {
    search?: string;
    grade?: string;
    stream?: string;
  }): Promise<ClassTeacherAllocationItem[]> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        const live = await AllocationApiService.getClassTeacherAllocations(filters);
        if (live && live.length > 0) {
          classTeacherAllocationsState = live.map((cta) => ({
            ...cta,
            grade: cta.grade_name,
            section: cta.section_name,
            assigned_subjects: cta.subjects,
            status: cta.assignment_status,
          }));
          return classTeacherAllocationsState;
        }
      }
    } catch (err) {
      console.warn('[AllocationService] Live class teacher allocations fetch failed, using fallback:', err);
    }
    await delay();
    let records = [...classTeacherAllocationsState];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      records = records.filter(
        (cta) =>
          cta.faculty_name.toLowerCase().includes(q) ||
          cta.employee_code.toLowerCase().includes(q) ||
          cta.designation.toLowerCase().includes(q) ||
          cta.subjects.some((sub) => sub.toLowerCase().includes(q)) ||
          cta.grade_name.toLowerCase().includes(q) ||
          cta.section_name.toLowerCase().includes(q)
      );
    }

    if (filters?.grade && filters.grade !== 'ALL') {
      records = records.filter((cta) => cta.grade_name === filters.grade);
    }

    if (filters?.stream && filters.stream !== 'ALL') {
      records = records.filter((cta) => cta.stream === filters.stream);
    }

    return records;
  }

  static async updateClassTeacherAllocation(
    sectionOrRecordId: string,
    faculty: {
      faculty_id: string;
      faculty_name: string;
      employee_code?: string;
      designation?: string;
      subjects?: string[];
      assigned_subjects?: string[];
    }
  ): Promise<ClassTeacherAllocationItem> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      const liveUpdated = await AllocationApiService.updateClassTeacherAllocation(sectionOrRecordId, faculty);
      if (liveUpdated) {
        const idx = classTeacherAllocationsState.findIndex(
          (cta) => cta.section_id === sectionOrRecordId || cta.id === sectionOrRecordId
        );
        if (idx !== -1) {
          classTeacherAllocationsState[idx] = {
            ...liveUpdated,
            grade: liveUpdated.grade_name,
            section: liveUpdated.section_name,
            assigned_subjects: liveUpdated.subjects,
            status: liveUpdated.assignment_status,
          };
        }
        return liveUpdated;
      }
    }
    await delay();
    const index = classTeacherAllocationsState.findIndex(
      (cta) => cta.section_id === sectionOrRecordId || cta.id === sectionOrRecordId
    );
    if (index === -1) {
      throw new Error(`Section ${sectionOrRecordId} not found in Class Teacher assignments`);
    }

    const current = classTeacherAllocationsState[index];
    const subList = faculty.assigned_subjects || faculty.subjects || current.subjects || [];
    const updated: ClassTeacherAllocationItem = {
      ...current,
      faculty_id: faculty.faculty_id,
      faculty_name: faculty.faculty_name,
      employee_code: faculty.employee_code || current.employee_code || 'EMP-STAFF',
      designation: faculty.designation || current.designation || 'Faculty',
      subjects: subList,
      assigned_subjects: subList,
      grade: current.grade_name,
      section: current.section_name,
      status: 'Assigned',
      is_assigned: true,
      assignment_status: 'Assigned',
    };

    classTeacherAllocationsState[index] = updated;
    return updated;
  }

  static async deleteClassTeacherAllocation(sectionOrRecordId: string): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      await AllocationApiService.deleteClassTeacherAllocation(sectionOrRecordId);
      const idx = classTeacherAllocationsState.findIndex(
        (cta) => cta.section_id === sectionOrRecordId || cta.id === sectionOrRecordId
      );
      if (idx !== -1) {
        const current = classTeacherAllocationsState[idx];
        classTeacherAllocationsState[idx] = {
          ...current,
          faculty_id: '',
          faculty_name: 'Unassigned',
          employee_code: '-',
          designation: '-',
          subjects: [],
          assigned_subjects: [],
          grade: current.grade_name,
          section: current.section_name,
          status: 'Unassigned',
          is_assigned: false,
          assignment_status: 'Unassigned',
        };
      }
      return true;
    }
    await delay();
    const index = classTeacherAllocationsState.findIndex(
      (cta) => cta.section_id === sectionOrRecordId || cta.id === sectionOrRecordId
    );
    if (index === -1) {
      throw new Error(`Section ${sectionOrRecordId} not found in Class Teacher assignments`);
    }

    const current = classTeacherAllocationsState[index];
    classTeacherAllocationsState[index] = {
      ...current,
      faculty_id: '',
      faculty_name: 'Unassigned',
      employee_code: '-',
      designation: '-',
      subjects: [],
      assigned_subjects: [],
      grade: current.grade_name,
      section: current.section_name,
      status: 'Unassigned',
      is_assigned: false,
      assignment_status: 'Unassigned',
    };

    return true;
  }

  // ----------------------------------------
  // 3. STUDENT ABSENTEES (ONLY ABSENT)
  // ----------------------------------------

  static async getStudentAbsentees(options?: string | {
    facultyId?: string;
    userRole?: UserRole;
    date?: string;
    grade?: string;
    section?: string;
    search?: string;
  }): Promise<StudentAbsenteeItem[]> {
    await delay();
    const opts = typeof options === 'string' ? { facultyId: options } : options;
    let records = [...studentAbsenteesState];

    // Enforce role scoping: Faculty only sees absentees for assigned classes/responsibilities
    if (opts?.userRole === 'Faculty' || (opts?.facultyId && opts?.userRole !== 'Admin' && opts?.userRole !== 'Principal')) {
      const fid = opts.facultyId || 'fac_001';
      records = records.filter((r) => r.faculty_id === fid || r.class_id === 'cls_001' || r.section_id === 'sec_002');
    }

    if (opts?.date) {
      records = records.filter((r) => r.date === opts.date);
    }

    if (opts?.grade && opts.grade !== 'ALL') {
      records = records.filter((r) => r.grade_name === opts.grade || r.grade === opts.grade);
    }

    if (opts?.section && opts.section !== 'ALL') {
      records = records.filter((r) => r.section_name === opts.section || r.section === opts.section);
    }

    if (opts?.search) {
      const q = opts.search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.student_id.toLowerCase().includes(q) ||
          r.student_name.toLowerCase().includes(q) ||
          r.subject_name.toLowerCase().includes(q) ||
          r.section_name.toLowerCase().includes(q)
      );
    }

    // Safety verification: ONLY status ABSENT can ever be returned
    return records.filter((r) => r.status === 'ABSENT');
  }

  // ----------------------------------------
  // 4. ATTENDANCE NOT ENTERED (UNMARKED SESSIONS)
  // ----------------------------------------

  static async getAttendanceNotEntered(options?: string | {
    facultyId?: string;
    userRole?: UserRole;
    date?: string;
    grade?: string;
    search?: string;
  }): Promise<AttendanceNotEnteredItem[]> {
    await delay();
    const opts = typeof options === 'string' ? { facultyId: options } : options;
    let records = [...attendanceNotEnteredState];

    // Role scoping: Faculty only sees sessions assigned to them
    if (opts?.userRole === 'Faculty' || (opts?.facultyId && opts?.userRole !== 'Admin' && opts?.userRole !== 'Principal')) {
      const fid = opts.facultyId || 'fac_001';
      records = records.filter((r) => r.faculty_id === fid);
    }

    if (opts?.date) {
      records = records.filter((r) => r.date === opts.date);
    }

    if (opts?.grade && opts.grade !== 'ALL') {
      records = records.filter((r) => r.grade_name === opts.grade || r.grade === opts.grade);
    }

    if (opts?.search) {
      const q = opts.search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.subject_name.toLowerCase().includes(q) ||
          r.faculty_name.toLowerCase().includes(q) ||
          r.section_name.toLowerCase().includes(q) ||
          r.grade_name.toLowerCase().includes(q)
      );
    }

    return records.filter((r) => r.session_status === 'NOT ENTERED');
  }


  // ----------------------------------------
  // 5. GLOBAL SEARCH (STUDENTS & FACULTY)
  // ----------------------------------------

  static async searchGlobal(
    query: string,
    _userRole: UserRole,
    typeFilter: 'ALL' | 'STUDENT' | 'FACULTY' = 'ALL'
  ): Promise<GlobalSearchResultItem[]> {
    await delay();
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: GlobalSearchResultItem[] = [];

    // Search Students if allowed
    if (typeFilter === 'ALL' || typeFilter === 'STUDENT') {
      for (const s of studentAllocationsState) {
        const matches =
          s.student_id.toLowerCase().includes(q) ||
          s.student_name.toLowerCase().includes(q) ||
          s.roll_number.toLowerCase().includes(q) ||
          s.grade_name.toLowerCase().includes(q) ||
          s.section_name.toLowerCase().includes(q) ||
          (s.stream && s.stream.toLowerCase().includes(q));

        if (matches) {
          results.push({
            type: 'STUDENT',
            id: s.student_id,
            identifier: s.student_id,
            title: s.student_name,
            subtitle: `${s.grade_name} — ${s.section_name}${s.stream ? ` (${s.stream})` : ''}`,
            departmentOrClass: s.section_name,
            allocationRecord: s,
          });
        }
      }
    }

    // Search Faculty
    if (typeFilter === 'ALL' || typeFilter === 'FACULTY') {
      // Known faculty dataset
      const facultyList = [
        {
          id: 'fac_001',
          name: 'R. Suresh',
          code: 'FAC-MATH-012',
          designation: 'Senior PGT & Department Head',
          department: 'Mathematics',
          subjects: ['Mathematics'],
        },
        {
          id: 'fac_002',
          name: 'Priya Krishnan',
          code: 'FAC-CS-008',
          designation: 'PGT Computer Science',
          department: 'Computer Science',
          subjects: ['Computer Science'],
        },
        {
          id: 'fac_003',
          name: 'Karthik Raman',
          code: 'FAC-PHY-009',
          designation: 'PGT Physics',
          department: 'Physics',
          subjects: ['Physics'],
        },
        {
          id: 'fac_004',
          name: 'Meena Devi',
          code: 'FAC-ENG-015',
          designation: 'Senior PGT English',
          department: 'English & Languages',
          subjects: ['English Core'],
        },
        {
          id: 'fac_005',
          name: 'Anitha Joseph',
          code: 'FAC-CHEM-011',
          designation: 'PGT Chemistry',
          department: 'Chemistry',
          subjects: ['Chemistry'],
        },
      ];

      for (const f of facultyList) {
        const matches =
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q) ||
          f.designation.toLowerCase().includes(q) ||
          f.subjects.some((sub) => sub.toLowerCase().includes(q));

        if (matches) {
          // Find matching class teacher record if any
          const cta = classTeacherAllocationsState.find((c) => c.faculty_id === f.id);
          results.push({
            type: 'FACULTY',
            id: f.id,
            identifier: f.code,
            title: f.name,
            subtitle: `${f.designation} • ${f.department}`,
            departmentOrClass: f.department,
            subjects: f.subjects,
            allocationRecord: cta,
          });
        }
      }
    }

    return results;
  }

  static async searchDirectory(
    query: string,
    userRole: UserRole,
    typeFilter: 'ALL' | 'STUDENT' | 'FACULTY' = 'ALL'
  ): Promise<any[]> {
    const rawResults = await this.searchGlobal(query, userRole, typeFilter);
    return rawResults.map((r) => ({
      ...r,
      name: r.title,
      type: r.type === 'STUDENT' ? 'Student' : 'Faculty',
    }));
  }
}
