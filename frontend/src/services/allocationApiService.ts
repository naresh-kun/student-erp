/**
 * Student ERP — Operational Allocation API Service
 * Authoritative DRF HTTP integration under /api/v1/allocation/
 *
 * Provides live backend communication for:
 * - Student Section Allocation table & updates (/api/v1/allocation/students/)
 * - Class Teacher Allocation table & updates (/api/v1/allocation/class-teachers/)
 *
 * RBAC Rules:
 * - Admin: Full Update / Delete permissions
 * - Principal: Full Update / Delete permissions
 * - Faculty: View-Only (Mutations return 403 Forbidden)
 * - Student / Parent: Forbidden (403)
 */

import { ApiClient } from '@/services/api';
import type {
  StudentAllocationItem,
  ClassTeacherAllocationItem,
} from '@/types';

export class AllocationApiService {
  /**
   * GET /api/v1/allocation/students/
   */
  static async getStudentAllocations(filters?: {
    search?: string;
    grade?: string;
    stream?: string;
    section?: string;
    academic_year?: string;
  }): Promise<StudentAllocationItem[]> {
    const params: Record<string, any> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.grade && filters.grade !== 'ALL') params.grade = filters.grade;
    if (filters?.stream && filters.stream !== 'ALL') params.stream = filters.stream;
    if (filters?.section && filters.section !== 'ALL') params.section = filters.section;
    if (filters?.academic_year) params.academic_year = filters.academic_year;

    const res = await ApiClient.get<StudentAllocationItem[]>('/api/v1/allocation/students/', params);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * PATCH /api/v1/allocation/students/{student_id}/
   */
  static async updateStudentAllocation(
    studentId: string,
    updates: {
      section_id?: string;
      roll_number?: string;
      grade_name?: string;
      grade?: string;
      stream?: string;
      section_name?: string;
      section?: string;
    }
  ): Promise<StudentAllocationItem> {
    const payload: Record<string, any> = {};
    if (updates.section_id) payload.section_id = updates.section_id;
    if (updates.roll_number) payload.roll_number = updates.roll_number;

    const res = await ApiClient.patch<StudentAllocationItem>(
      `/api/v1/allocation/students/${encodeURIComponent(studentId)}/`,
      payload
    );
    return res.data;
  }

  /**
   * DELETE /api/v1/allocation/students/{student_id}/
   */
  static async deleteStudentAllocation(studentId: string): Promise<boolean> {
    await ApiClient.delete(`/api/v1/allocation/students/${encodeURIComponent(studentId)}/`);
    return true;
  }

  /**
   * GET /api/v1/allocation/class-teachers/
   */
  static async getClassTeacherAllocations(filters?: {
    search?: string;
    grade?: string;
    stream?: string;
    academic_year?: string;
  }): Promise<ClassTeacherAllocationItem[]> {
    const params: Record<string, any> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.grade && filters.grade !== 'ALL') params.grade = filters.grade;
    if (filters?.stream && filters.stream !== 'ALL') params.stream = filters.stream;
    if (filters?.academic_year) params.academic_year = filters.academic_year;

    const res = await ApiClient.get<ClassTeacherAllocationItem[]>('/api/v1/allocation/class-teachers/', params);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * PATCH /api/v1/allocation/class-teachers/{section_id}/
   */
  static async updateClassTeacherAllocation(
    sectionOrRecordId: string,
    faculty: {
      faculty_id: string;
      faculty_name?: string;
      employee_code?: string;
      designation?: string;
      subjects?: string[];
      assigned_subjects?: string[];
    }
  ): Promise<ClassTeacherAllocationItem> {
    const payload = {
      faculty_id: faculty.faculty_id,
    };

    const res = await ApiClient.patch<ClassTeacherAllocationItem>(
      `/api/v1/allocation/class-teachers/${encodeURIComponent(sectionOrRecordId)}/`,
      payload
    );
    return res.data;
  }

  /**
   * DELETE /api/v1/allocation/class-teachers/{section_id}/
   */
  static async deleteClassTeacherAllocation(sectionOrRecordId: string): Promise<boolean> {
    await ApiClient.delete(
      `/api/v1/allocation/class-teachers/${encodeURIComponent(sectionOrRecordId)}/`
    );
    return true;
  }
}
