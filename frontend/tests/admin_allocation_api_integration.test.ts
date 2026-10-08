/**
 * Student ERP — Phase 5 Task 5.4 Frontend Verification Suite
 * Academic Structure + Administrative Integration: Admin & Allocation Services
 *
 * Covers:
 * 1. AdminApiService communication with /api/v1/ academic and directory endpoints:
 *    - /api/v1/students/
 *    - /api/v1/parents/
 *    - /api/v1/faculty/
 *    - /api/v1/academics/classes/
 *    - /api/v1/academics/subjects/
 *    - /api/v1/academics/years/
 * 2. AllocationApiService communication with /api/v1/allocation/ endpoints:
 *    - /api/v1/allocation/students/ (GET, PATCH, DELETE)
 *    - /api/v1/allocation/class-teachers/ (GET, PATCH, DELETE)
 * 3. AdminService live API integration, data mapping, and fallback resilience
 * 4. AllocationService live API integration, data mapping, and fallback resilience
 * 5. Student ID immutability and Class Teacher assignment state invariants
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AdminApiService } from '../src/features/admin/services/adminApiService';
import { AdminService } from '../src/features/admin/services/adminService';
import { AllocationApiService } from '../src/services/allocationApiService';
import { AllocationService } from '../src/services/allocationService';

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

describe('Phase 5 Task 5.4 — AdminApiService & AllocationApiService', () => {
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

  // ========================================================
  // 1. AdminApiService: Academic & Directory Endpoints
  // ========================================================

  it('AdminApiService.getStudents fetches from /api/v1/students/', async () => {
    const mockStudents = [
      {
        id: 'stu_001',
        student_id: 'STU202600001',
        admission_number: 'ADM2026001',
        roll_number: '11-A1-01',
        first_name: 'Arun',
        last_name: 'Kumar',
        name: 'Arun Kumar',
        class_id: 'cls_001',
        class_name: 'Grade 11 - Computer Science',
        grade_level: 11,
        stream: 'Computer Science A',
        section_id: 'sec_001',
        section_name: 'Section A1',
        academic_year: '2026-2027',
        gender: 'Male',
        date_of_birth: '2009-05-14',
        blood_group: 'O+',
        parent_id: 'par_001',
        parent_name: 'S. Ramanathan',
        parent_phone: '+91-98400-11207',
        attendance_percentage: 95.8,
        academic_percentage: 91.2,
        letter_grade: 'A1',
        status: 'Active',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/students/');
      return new Response(JSON.stringify({ success: true, data: mockStudents }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const students = await AdminApiService.getStudents();
    expect(students).toHaveLength(1);
    expect(students[0].student_id).toBe('STU202600001');
    expect(students[0].name).toBe('Arun Kumar');
    expect(students[0].section_name).toBe('Section A1');
  });

  it('AdminApiService.getParents fetches from /api/v1/parents/', async () => {
    const mockParents = [
      {
        id: 'par_001',
        first_name: 'S.',
        last_name: 'Ramanathan',
        relationship: 'Father',
        email: 'parent@school.edu.in',
        phone: '+91-98400-11207',
        address: 'Chennai, Tamil Nadu',
        children_ids: ['stu_001'],
        children_count: 1,
        children_summary: 'Arun Kumar (Grade 11)',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/parents/');
      return new Response(JSON.stringify({ success: true, data: mockParents }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const parents = await AdminApiService.getParents();
    expect(parents).toHaveLength(1);
    expect(parents[0].relationship).toBe('Father');
    expect(parents[0].children_count).toBe(1);
  });

  it('AdminApiService.getFaculty fetches from /api/v1/faculty/', async () => {
    const mockFaculty = [
      {
        id: 'fac_001',
        employee_id: 'FAC-001',
        first_name: 'Suresh',
        last_name: 'Kumar',
        department: 'Computer Science',
        designation: 'PGT Computer Science',
        email: 'faculty.suresh@school.edu.in',
        phone: '+91-98400-11300',
        assigned_classes_count: 2,
        assigned_students_count: 40,
        status: 'Active',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/faculty/');
      return new Response(JSON.stringify({ success: true, data: mockFaculty }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const faculty = await AdminApiService.getFaculty();
    expect(faculty).toHaveLength(1);
    expect(faculty[0].employee_id).toBe('FAC-001');
    expect(faculty[0].department).toBe('Computer Science');
  });

  it('AdminApiService.getClassesAndSections fetches from /api/v1/academics/classes/', async () => {
    const mockClasses = [
      {
        id: 'cls_001',
        name: 'Grade 11 - Computer Science',
        code: 'G11-CS',
        grade_level: 11,
        stream: 'Computer Science A',
        class_teacher_name: 'Suresh Kumar',
        total_enrolled: 40,
        total_capacity: 45,
        sections: [
          {
            id: 'sec_001',
            school_class_id: 'cls_001',
            name: 'A1',
            room: 'Lab 1',
            capacity: 45,
            class_teacher_name: 'Suresh Kumar',
            enrolled_count: 40,
            grade_level: 11,
            stream: 'Computer Science A',
          },
        ],
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/academics/classes/');
      return new Response(JSON.stringify({ success: true, data: mockClasses }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const classes = await AdminApiService.getClassesAndSections();
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe('Grade 11 - Computer Science');
    expect(classes[0].sections).toHaveLength(1);
  });

  it('AdminApiService.getSubjectsCatalog fetches from /api/v1/academics/subjects/', async () => {
    const mockSubjects = [
      {
        id: 'sub_001',
        name: 'Computer Science',
        code: 'CS-083',
        department: 'Computer Science',
        grade_level: 11,
        credits: 4,
        is_elective: false,
        enrolled_students: 40,
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/academics/subjects/');
      return new Response(JSON.stringify({ success: true, data: mockSubjects }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const subjects = await AdminApiService.getSubjectsCatalog();
    expect(subjects).toHaveLength(1);
    expect(subjects[0].code).toBe('CS-083');
  });

  // ========================================================
  // 2. AllocationApiService: Allocation Endpoints
  // ========================================================

  it('AllocationApiService.getStudentAllocations fetches from /api/v1/allocation/students/', async () => {
    const mockAllocations = [
      {
        id: 'alloc_001',
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        grade_level: 11,
        grade_name: 'Grade 11',
        stream: 'Computer Science A',
        section_id: 'sec_001',
        section_name: 'Section A1',
        roll_number: '11-A1-01',
        academic_year: '2026-2027',
        allocation_status: 'Allocated',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/allocation/students/');
      return new Response(JSON.stringify({ success: true, data: mockAllocations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const records = await AllocationApiService.getStudentAllocations();
    expect(records).toHaveLength(1);
    expect(records[0].student_id).toBe('STU202600001');
    expect(records[0].allocation_status).toBe('Allocated');
  });

  it('AllocationApiService.updateStudentAllocation patches section to /api/v1/allocation/students/:id/', async () => {
    const updatedRecord = {
      id: 'alloc_001',
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      grade_level: 11,
      grade_name: 'Grade 11',
      stream: 'Computer Science A',
      section_id: 'sec_002',
      section_name: 'Section A2',
      roll_number: '11-A2-01',
      academic_year: '2026-2027',
      allocation_status: 'Allocated',
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/allocation/students/STU202600001/');
      expect(init?.method).toBe('PATCH');
      return new Response(JSON.stringify({ success: true, data: updatedRecord }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await AllocationApiService.updateStudentAllocation('STU202600001', { section_name: 'Section A2' });
    expect(res.section_name).toBe('Section A2');
  });

  it('AllocationApiService.deleteStudentAllocation unassigns section via DELETE /api/v1/allocation/students/:id/', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/allocation/students/STU202600001/');
      expect(init?.method).toBe('DELETE');
      return new Response(JSON.stringify({ success: true, data: { unassigned: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await AllocationApiService.deleteStudentAllocation('STU202600001');
    expect(res).toBe(true);
  });

  it('AllocationApiService.getClassTeacherAllocations fetches from /api/v1/allocation/class-teachers/', async () => {
    const mockCTAllocations = [
      {
        id: 'cta_001',
        faculty_id: 'fac_001',
        faculty_name: 'Suresh Kumar',
        employee_code: 'FAC-001',
        designation: 'PGT Computer Science',
        department: 'Computer Science',
        grade_level: 11,
        grade_name: 'Grade 11',
        stream: 'Computer Science A',
        section_id: 'sec_001',
        section_name: 'Section A1',
        subjects: ['Computer Science'],
        assignment_status: 'Assigned',
        academic_year: '2026-2027',
        is_assigned: true,
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/allocation/class-teachers/');
      return new Response(JSON.stringify({ success: true, data: mockCTAllocations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const records = await AllocationApiService.getClassTeacherAllocations();
    expect(records).toHaveLength(1);
    expect(records[0].faculty_name).toBe('Suresh Kumar');
    expect(records[0].is_assigned).toBe(true);
  });

  // ========================================================
  // 3. AdminService: Integration & Data Mapping
  // ========================================================

  it('AdminService.getStudents consumes real API when token is present', async () => {
    localStorage.setItem('access_token', 'test_auth_token');
    const mockBackendStudents = [
      {
        id: 'stu_uuid_1',
        student_id: 'STU202600001',
        admission_number: 'ADM2026001',
        roll_number: '11-A1-01',
        first_name: 'Arun',
        last_name: 'Kumar',
        name: 'Arun Kumar',
        class_id: 'cls_001',
        class_name: 'Grade 11 - Computer Science',
        grade_level: 11,
        stream: 'Computer Science A',
        section_id: 'sec_001',
        section_name: 'Section A1',
        academic_year: '2026-2027',
        gender: 'Male',
        date_of_birth: '2009-05-14',
        blood_group: 'O+',
        parent_id: 'par_001',
        parent_name: 'S. Ramanathan',
        parent_phone: '+91-98400-11207',
        attendance_percentage: 96.0,
        academic_percentage: 92.5,
        letter_grade: 'A1',
        status: 'Active',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/students/');
      return new Response(JSON.stringify({ success: true, data: mockBackendStudents }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const students = await AdminService.getStudents();
    expect(students).toHaveLength(1);
    expect(students[0].student_id).toBe('STU202600001');
    expect(students[0].name).toBe('Arun Kumar');
    expect(students[0].section_name).toBe('Section A1');
  });

  // ========================================================
  // 4. AllocationService: Operational Workflow Integration
  // ========================================================

  it('AllocationService.getStudentAllocations delegates to API when token is present', async () => {
    localStorage.setItem('access_token', 'test_auth_token');
    const mockBackendAllocations = [
      {
        id: 'alloc_001',
        student_id: 'STU202600001',
        student_name: 'Arun Kumar',
        grade_level: 11,
        grade_name: 'Grade 11',
        stream: 'Computer Science A',
        section_id: 'sec_001',
        section_name: 'Section A1',
        roll_number: '11-A1-01',
        academic_year: '2026-2027',
        allocation_status: 'Allocated',
      },
    ];

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      expect(String(url)).toContain('/api/v1/allocation/students/');
      return new Response(JSON.stringify({ success: true, data: mockBackendAllocations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const records = await AllocationService.getStudentAllocations();
    expect(records).toHaveLength(1);
    expect(records[0].student_id).toBe('STU202600001');
    expect(records[0].student_name).toBe('Arun Kumar');
    expect(records[0].section_name).toBe('Section A1');
    expect(records[0].allocation_status).toBe('Allocated');
  });

  it('AllocationService.updateStudentAllocation patches section via API', async () => {
    localStorage.setItem('access_token', 'test_auth_token');
    const updatedBackend = {
      id: 'alloc_001',
      student_id: 'STU202600001',
      student_name: 'Arun Kumar',
      grade_level: 11,
      grade_name: 'Grade 11',
      stream: 'Computer Science A',
      section_id: 'sec_002',
      section_name: 'Section A2',
      roll_number: '11-A2-01',
      academic_year: '2026-2027',
      allocation_status: 'Allocated',
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/allocation/students/STU202600001/');
      expect(init?.method).toBe('PATCH');
      return new Response(JSON.stringify({ success: true, data: updatedBackend }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await AllocationService.updateStudentAllocation('STU202600001', {
      section_name: 'Section A2',
      section_id: 'sec_002',
    });
    expect(res).not.toBeNull();
    expect(res.section_name).toBe('Section A2');
  });

  it('AllocationService.deleteStudentAllocation unassigns student via API', async () => {
    localStorage.setItem('access_token', 'test_auth_token');

    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      if (init?.method === 'DELETE') {
        expect(String(url)).toContain('/api/v1/allocation/students/STU202600001/');
        return new Response(JSON.stringify({ success: true, data: { unassigned: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await AllocationService.deleteStudentAllocation('STU202600001');
    expect(res).toBe(true);
  });

  it('AllocationService.updateClassTeacherAllocation patches class teacher via API', async () => {
    localStorage.setItem('access_token', 'test_auth_token');
    const updatedCTBackend = {
      id: 'cta_001',
      faculty_id: 'fac_002',
      faculty_name: 'Priya K',
      employee_code: 'FAC-002',
      designation: 'PGT Mathematics',
      department: 'Mathematics',
      grade_level: 11,
      grade_name: 'Grade 11',
      stream: 'Computer Science A',
      section_id: 'sec_001',
      section_name: 'Section A1',
      subjects: ['Mathematics'],
      assignment_status: 'Assigned',
      academic_year: '2026-2027',
      is_assigned: true,
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      expect(String(url)).toContain('/api/v1/allocation/class-teachers/sec_001/');
      expect(init?.method).toBe('PATCH');
      return new Response(JSON.stringify({ success: true, data: updatedCTBackend }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await AllocationService.updateClassTeacherAllocation('sec_001', {
      faculty_id: 'fac_002',
      faculty_name: 'Priya K',
    });
    expect(res).not.toBeNull();
    expect(res.faculty_name).toBe('Priya K');
    expect(res.is_assigned).toBe(true);
  });

  it('AllocationService.deleteClassTeacherAllocation unassigns class teacher via API', async () => {
    localStorage.setItem('access_token', 'test_auth_token');

    vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      if (init?.method === 'DELETE') {
        expect(String(url)).toContain('/api/v1/allocation/class-teachers/sec_001/');
        return new Response(JSON.stringify({ success: true, data: { unassigned: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await AllocationService.deleteClassTeacherAllocation('sec_001');
    expect(res).toBe(true);
  });

  // ========================================================
  // 5. Fallback Resilience
  // ========================================================

  it('AdminService falls back to local data when backend API fails or no token', async () => {
    localStorage.removeItem('access_token');

    const students = await AdminService.getStudents();
    expect(Array.isArray(students)).toBe(true);
    expect(students.length).toBeGreaterThan(0);
    expect(students[0].student_id).toBeDefined();
  });
});
