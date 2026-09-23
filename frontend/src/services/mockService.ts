/**
 * Student ERP — Mock Service Abstraction Layer
 * Provides clean async interfaces that load from synthetic mock-data datasets.
 * In future phases, these same interfaces are fulfilled by Django REST API clients.
 */

import type {
  User,
  Student,
  Parent,
  Faculty,
  ClassEntity,
  Subject,
  AttendanceRecord,
  MarkRecord,
  TimetableSlot,
  CalendarEvent,
} from '@/types';

// Mock datasets (imported dynamically or resolved from mock-data)
export class MockDataService {
  private static async fetchMock<T>(resource: string): Promise<T> {
    // In browser/Vite dev environment, mock files can be fetched or imported
    const response = await fetch(`/mock-data/${resource}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load mock dataset: ${resource}`);
    }
    return response.json();
  }

  // 1. User & Identity Service
  static async getUsers(): Promise<User[]> {
    return this.fetchMock<User[]>('users');
  }

  // 2. Students Service
  static async getStudents(): Promise<Student[]> {
    return this.fetchMock<Student[]>('students');
  }

  static async getStudentById(id: string): Promise<Student | undefined> {
    const students = await this.getStudents();
    return students.find((s) => s.id === id);
  }

  // 3. Parents Service
  static async getParents(): Promise<Parent[]> {
    return this.fetchMock<Parent[]>('parents');
  }

  // 4. Faculty Service
  static async getFaculty(): Promise<Faculty[]> {
    return this.fetchMock<Faculty[]>('faculty');
  }

  // 5. Classes & Curriculum Service
  static async getClasses(): Promise<ClassEntity[]> {
    return this.fetchMock<ClassEntity[]>('classes');
  }

  static async getSubjects(): Promise<Subject[]> {
    return this.fetchMock<Subject[]>('subjects');
  }

  // 6. Attendance Service
  static async getAttendance(studentId?: string): Promise<AttendanceRecord[]> {
    const records = await this.fetchMock<AttendanceRecord[]>('attendance');
    if (studentId) {
      return records.filter((r) => r.student_id === studentId);
    }
    return records;
  }

  // 7. Marks & Grades Service
  static async getMarks(studentId?: string): Promise<MarkRecord[]> {
    const marks = await this.fetchMock<MarkRecord[]>('marks');
    if (studentId) {
      return marks.filter((m) => m.student_id === studentId);
    }
    return marks;
  }

  // 8. Timetable Service
  static async getTimetable(classId?: string): Promise<TimetableSlot[]> {
    const slots = await this.fetchMock<TimetableSlot[]>('timetable');
    if (classId) {
      return slots.filter((t) => t.class_id === classId);
    }
    return slots;
  }

  // 9. Calendar Events Service
  static async getEvents(): Promise<CalendarEvent[]> {
    return this.fetchMock<CalendarEvent[]>('events');
  }
}
