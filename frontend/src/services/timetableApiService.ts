/**
 * Student ERP — Timetable API Service
 * Authoritative DRF HTTP integration under /api/v1/timetable/
 *
 * Implements Phase 6 Task 6.4 (and foundation for 6.5 & 6.6):
 * - REST API CRUD operations for TimetableSlot
 * - Filtering by section_id, day_of_week, faculty_id, subject_id
 * - Scoping per caller role (Student: enrolled section; Parent: linked child sections)
 * - Domain formatting and weekly schedule grid transformations
 */

import { ApiClient } from '@/services/api';
import type { ParentTimetableDay } from '@/features/parents/types';
import type { FacultyTimetableEntry, FacultyTodayPeriod, FacultySessionType } from '@/features/faculty/types';

export interface BackendTimetableSlot {
  id: string;
  section: string;
  section_name?: string;
  class_id?: string;
  class_name?: string;
  academic_year_id?: string;
  academic_year_name?: string;
  subject: string;
  subject_name?: string;
  subject_code?: string;
  faculty: string;
  faculty_name?: string;
  faculty_employee_code?: string;
  day_of_week: string;
  period_number: number;
  start_time: string; // '08:30:00' or '08:30'
  end_time: string;   // '09:15:00' or '09:15'
  room_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentTimetablePeriodItem {
  period: string; // e.g. "Period 1 (08:30 - 09:15)"
  subject: string;
  teacher: string;
  room: string;
  type: string; // 'Class' | 'Lab' | 'Activity' | 'Mentorship'
}

export interface StudentTimetableDayGrid {
  day: string;
  periods: StudentTimetablePeriodItem[];
}

export class TimetableApiService {
  /**
   * Helper: Trims HH:MM:SS down to HH:MM format.
   */
  static formatTime(timeStr?: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  }

  /**
   * Helper: Formats a single BackendTimetableSlot into StudentTimetablePeriodItem.
   */
  static formatStudentPeriod(slot: BackendTimetableSlot): StudentTimetablePeriodItem {
    const startTime = this.formatTime(slot.start_time);
    const endTime = this.formatTime(slot.end_time);
    const periodLabel = `Period ${slot.period_number} (${startTime} - ${endTime})`;
    const subject = slot.subject_name || 'Subject';
    const teacher = slot.faculty_name || 'Staff';
    const room = slot.room_number || 'Classroom';

    let type = 'Class';
    const lowerSub = subject.toLowerCase();
    const lowerRoom = room.toLowerCase();
    if (lowerSub.includes('lab') || lowerRoom.includes('lab')) {
      type = 'Lab';
    } else if (lowerSub.includes('games') || lowerSub.includes('physical') || lowerSub.includes('activity')) {
      type = 'Activity';
    } else if (lowerSub.includes('remedial') || lowerSub.includes('guidance') || lowerSub.includes('mentor')) {
      type = 'Mentorship';
    }

    return {
      period: periodLabel,
      subject,
      teacher,
      room,
      type,
    };
  }

  /**
   * Transforms an array of backend slots into a 5-day weekly grid for Student.
   */
  static transformSlotsToWeeklyGrid(slots: BackendTimetableSlot[]): StudentTimetableDayGrid[] {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return DAYS.map((day) => {
      const daySlots = slots
        .filter((s) => s.day_of_week?.toLowerCase() === day.toLowerCase())
        .sort((a, b) => a.period_number - b.period_number);

      return {
        day,
        periods: daySlots.map((s) => this.formatStudentPeriod(s)),
      };
    });
  }

  /**
   * Transforms an array of backend slots into ParentTimetableDay[] for Parent.
   */
  static transformSlotsToParentTimetable(slots: BackendTimetableSlot[]): ParentTimetableDay[] {
    const DAYS: Array<ParentTimetableDay['day']> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return DAYS.map((day) => {
      const daySlots = slots
        .filter((s) => s.day_of_week?.toLowerCase() === day.toLowerCase())
        .sort((a, b) => a.period_number - b.period_number);

      return {
        day,
        periods: daySlots.map((s) => {
          const startTime = this.formatTime(s.start_time);
          const endTime = this.formatTime(s.end_time);
          const isLab = (s.subject_name || '').toLowerCase().includes('lab') || (s.room_number || '').toLowerCase().includes('lab');

          return {
            period: s.period_number,
            time: `${startTime} - ${endTime}`,
            subject: s.subject_name || 'Subject',
            faculty: s.faculty_name || 'Staff',
            room: s.room_number || 'Room',
            type: isLab ? 'Lab' : 'Lecture',
          };
        }),
      };
    });
  }

  /**
   * Transforms an array of backend slots into FacultyTimetableEntry[] for Faculty.
   */
  static transformSlotsToFacultyTimetable(slots: BackendTimetableSlot[]): FacultyTimetableEntry[] {
    const validDays: Array<FacultyTimetableEntry['day']> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayOrder: Record<string, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
    };

    return slots
      .filter((s) => validDays.includes(s.day_of_week as any))
      .sort((a, b) => {
        const dDiff = (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0);
        if (dDiff !== 0) return dDiff;
        return a.period_number - b.period_number;
      })
      .map((s) => {
        const startTime = this.formatTime(s.start_time);
        const endTime = this.formatTime(s.end_time);
        const subject = s.subject_name || 'Subject';
        const room = s.room_number || 'Room';
        const lowerSub = subject.toLowerCase();
        const lowerRoom = room.toLowerCase();

        let session_type: FacultySessionType = 'Class Lecture';
        if (lowerSub.includes('lab') || lowerRoom.includes('lab') || lowerSub.includes('practical')) {
          session_type = 'Practical / Lab';
        } else if (lowerSub.includes('remedial') || lowerSub.includes('doubt')) {
          session_type = 'Remedial Support';
        } else if (lowerSub.includes('planning') || lowerSub.includes('review') || lowerSub.includes('mentorship') || lowerSub.includes('assembly')) {
          session_type = 'Faculty Planning';
        }

        return {
          id: s.id,
          day: s.day_of_week as FacultyTimetableEntry['day'],
          period_number: s.period_number,
          time: `${startTime} - ${endTime}`,
          subject,
          class_name: s.class_name || 'Class',
          section_name: s.section_name || 'Section',
          room,
          session_type,
          class_id: s.class_id,
          section_id: s.section,
        };
      });
  }

  /**
   * Transforms an array of backend slots into FacultyTodayPeriod[] for Faculty dashboard.
   */
  static transformSlotsToFacultyTodaySchedule(
    slots: BackendTimetableSlot[],
    options?: { currentDay?: string; markedPeriods?: string[] }
  ): FacultyTodayPeriod[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaultDay = days[new Date().getDay()];
    const activeDay = options?.currentDay || (defaultDay === 'Saturday' || defaultDay === 'Sunday' ? 'Monday' : defaultDay);
    const marked = options?.markedPeriods || [];

    const todaySlots = slots
      .filter((s) => s.day_of_week?.toLowerCase() === activeDay.toLowerCase())
      .sort((a, b) => a.period_number - b.period_number);

    return todaySlots.map((s) => {
      const startTime = this.formatTime(s.start_time);
      const endTime = this.formatTime(s.end_time);
      const attendanceDone = marked.some((m) => m.includes(`Period ${s.period_number}`));

      const classDisplay = s.class_name && s.section_name
        ? `${s.class_name}-${s.section_name}`
        : s.class_name || s.section_name || 'Class';

      return {
        period_number: s.period_number,
        period_time: `${startTime} - ${endTime}`,
        class_name: classDisplay,
        subject: s.subject_name || 'Subject',
        room: s.room_number || 'Classroom',
        student_count: 30,
        attendance_done: attendanceDone,
        attendance_session_id: undefined,
      };
    });
  }

  /**
   * GET /api/v1/timetable/
   * Retrieves timetable slots scoped to caller role with optional filters.
   */
  static async getTimetableSlots(params?: {
    section_id?: string;
    day_of_week?: string;
    faculty_id?: string;
    subject_id?: string;
    academic_year_id?: string;
    page?: number;
  }): Promise<BackendTimetableSlot[]> {
    const query: Record<string, any> = {};
    if (params?.section_id) query.section_id = params.section_id;
    if (params?.day_of_week) query.day_of_week = params.day_of_week;
    if (params?.faculty_id) query.faculty_id = params.faculty_id;
    if (params?.subject_id) query.subject_id = params.subject_id;
    if (params?.academic_year_id) query.academic_year_id = params.academic_year_id;
    if (params?.page !== undefined) query.page = params.page;

    const res = await ApiClient.get<any>('/api/v1/timetable/', query);
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (res.data && Array.isArray(res.data.results)) {
      return res.data.results;
    }
    return [];
  }

  /**
   * GET /api/v1/timetable/{id}/
   * Retrieves single timetable slot detail.
   */
  static async getTimetableSlot(id: string): Promise<BackendTimetableSlot> {
    const res = await ApiClient.get<BackendTimetableSlot>(`/api/v1/timetable/${id}/`);
    return res.data;
  }

  /**
   * POST /api/v1/timetable/
   * Creates a timetable slot (Admin/Principal only).
   */
  static async createTimetableSlot(payload: Partial<BackendTimetableSlot>): Promise<BackendTimetableSlot> {
    const res = await ApiClient.post<BackendTimetableSlot>('/api/v1/timetable/', payload);
    return res.data;
  }

  /**
   * PATCH /api/v1/timetable/{id}/
   * Updates an existing timetable slot.
   */
  static async updateTimetableSlot(id: string, payload: Partial<BackendTimetableSlot>): Promise<BackendTimetableSlot> {
    const res = await ApiClient.patch<BackendTimetableSlot>(`/api/v1/timetable/${id}/`, payload);
    return res.data;
  }

  /**
   * DELETE /api/v1/timetable/{id}/
   * Deletes a timetable slot (Admin only).
   */
  static async deleteTimetableSlot(id: string): Promise<void> {
    await ApiClient.delete(`/api/v1/timetable/${id}/`);
  }
}
