/**
 * Student ERP — Phase 6 Task 6.5 Frontend Verification Suite
 * Faculty Timetable and Attendance Scheduling Integration
 *
 * Covers:
 * 1. TimetableApiService: /api/v1/timetable/ integration and faculty domain transformers
 * 2. CalendarApiService: /api/v1/calendar/events/ integration and faculty role transformers
 * 3. FacultyApiService: typed DRF client bindings for timetable and calendar
 * 4. FacultyService: live API mapping for timetable, today schedule, and calendar events with graceful fallback
 * 5. TeachingAssignment consistency validation and unauthorized period filtering
 * 6. Timetable-to-attendance workflow connection preserving Phase 5 4-status semantics and canonical formula
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient } from '../src/services/api';
import {
  TimetableApiService,
  type BackendTimetableSlot,
} from '../src/services/timetableApiService';
import {
  CalendarApiService,
  type BackendCalendarEvent,
} from '../src/services/calendarApiService';
import { FacultyApiService } from '../src/features/faculty/services/facultyApiService';
import { FacultyService } from '../src/features/faculty/services/facultyService';
import type { FacultyAssignedClass } from '../src/features/faculty/types';
import { calculateAttendancePercentage } from '../src/utils/attendance';

const mockFacultySlots: BackendTimetableSlot[] = [
  {
    id: 'tt_slot_fac_001',
    section: 'sec_uuid_001',
    section_name: 'Section A2',
    class_id: 'cls_uuid_001',
    class_name: 'Grade 11',
    subject: 'sub_uuid_001',
    subject_name: 'Mathematics',
    subject_code: 'MATH11',
    faculty: 'fac_uuid_001',
    faculty_name: 'R. Suresh',
    faculty_employee_code: 'FAC-MATH-001',
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '08:30:00',
    end_time: '09:15:00',
    room_number: 'Room XI-A2',
  },
  {
    id: 'tt_slot_fac_002',
    section: 'sec_uuid_001',
    section_name: 'Section A2',
    class_id: 'cls_uuid_001',
    class_name: 'Grade 11',
    subject: 'sub_uuid_002',
    subject_name: 'Mathematics Lab & Remedial',
    subject_code: 'MATH-LAB',
    faculty: 'fac_uuid_001',
    faculty_name: 'R. Suresh',
    faculty_employee_code: 'FAC-MATH-001',
    day_of_week: 'Monday',
    period_number: 2,
    start_time: '09:15:00',
    end_time: '10:00:00',
    room_number: 'Math Lab 1',
  },
  {
    id: 'tt_slot_fac_003',
    section: 'sec_uuid_002',
    section_name: 'Section A1',
    class_id: 'cls_uuid_002',
    class_name: 'Grade 12',
    subject: 'sub_uuid_001',
    subject_name: 'Mathematics',
    subject_code: 'MATH12',
    faculty: 'fac_uuid_001',
    faculty_name: 'R. Suresh',
    faculty_employee_code: 'FAC-MATH-001',
    day_of_week: 'Tuesday',
    period_number: 1,
    start_time: '08:30:00',
    end_time: '09:15:00',
    room_number: 'Room XII-A1',
  },
  {
    id: 'tt_slot_fac_004',
    section: '',
    section_name: '',
    subject: '',
    subject_name: 'Department Planning & Mentorship',
    faculty: 'fac_uuid_001',
    faculty_name: 'R. Suresh',
    faculty_employee_code: 'FAC-MATH-001',
    day_of_week: 'Wednesday',
    period_number: 4,
    start_time: '11:00:00',
    end_time: '11:45:00',
    room_number: 'Staff Room B',
  },
];

const mockFacultyEvents: BackendCalendarEvent[] = [
  {
    id: 'cal_fac_001',
    title: 'Term 1 Final Examination Invigilation',
    category: 'exam',
    description: 'CBSE examination duty schedule for PGT Faculty.',
    start_date: '2026-10-15T08:30:00Z',
    end_date: '2026-10-25T11:30:00Z',
    target_roles: ['Faculty'],
    location: 'Examination Hall 1',
    is_holiday: false,
    is_published: true,
  },
  {
    id: 'cal_fac_002',
    title: 'Autumn School Holidays',
    category: 'holiday',
    description: 'Campus closed for festive break.',
    start_date: '2026-11-01T00:00:00Z',
    end_date: '2026-11-05T23:59:59Z',
    target_roles: ['Faculty', 'Student', 'Parent'],
    location: 'Campus Closed',
    is_holiday: true,
    is_published: true,
  },
  {
    id: 'cal_fac_003',
    title: 'Faculty Academic Council Review',
    category: 'meeting',
    description: 'Term review meeting with Principal.',
    start_date: '2026-10-30T15:00:00Z',
    end_date: '2026-10-30T16:30:00Z',
    target_roles: ['Faculty', 'Principal'],
    location: 'Conference Room A',
    is_holiday: false,
    is_published: true,
  },
];

const mockTeachingAssignments: FacultyAssignedClass[] = [
  {
    id: 'cls_001_sec_002',
    class_id: 'cls_uuid_001',
    section_id: 'sec_uuid_001',
    grade_level: 11,
    class_name: 'Grade 11',
    section_name: 'Section A2',
    display_name: 'Grade 11 — Section A2',
    subject: 'Mathematics',
    subject_code: 'MATH11',
    room: 'Room XI-A2',
    student_count: 30,
    is_class_teacher: true,
    periods_per_week: 6,
  },
  {
    id: 'cls_002_sec_001',
    class_id: 'cls_uuid_002',
    section_id: 'sec_uuid_002',
    grade_level: 12,
    class_name: 'Grade 12',
    section_name: 'Section A1',
    display_name: 'Grade 12 — Section A1',
    subject: 'Mathematics',
    subject_code: 'MATH12',
    room: 'Room XII-A1',
    student_count: 31,
    is_class_teacher: false,
    periods_per_week: 6,
  },
];

describe('Phase 6 Task 6.5 — Faculty Timetable and Attendance Scheduling Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. TimetableApiService Faculty Transformers
  // =========================================================================
  describe('TimetableApiService Faculty Transformers', () => {
    it('transforms slots into FacultyTimetableEntry array with inferred session types', () => {
      const entries = TimetableApiService.transformSlotsToFacultyTimetable(mockFacultySlots);

      expect(entries).toHaveLength(4);

      // Entry 1: Standard Class Lecture
      const entry1 = entries.find((e) => e.id === 'tt_slot_fac_001')!;
      expect(entry1.day).toBe('Monday');
      expect(entry1.period_number).toBe(1);
      expect(entry1.time).toBe('08:30 - 09:15');
      expect(entry1.subject).toBe('Mathematics');
      expect(entry1.class_name).toBe('Grade 11');
      expect(entry1.section_name).toBe('Section A2');
      expect(entry1.session_type).toBe('Class Lecture');
      expect(entry1.section_id).toBe('sec_uuid_001');

      // Entry 2: Lab / Remedial
      const entry2 = entries.find((e) => e.id === 'tt_slot_fac_002')!;
      expect(entry2.session_type).toBe('Practical / Lab');

      // Entry 4: Faculty Planning
      const entry4 = entries.find((e) => e.id === 'tt_slot_fac_004')!;
      expect(entry4.session_type).toBe('Faculty Planning');
    });

    it('transforms slots into FacultyTodayPeriod array for Monday schedule', () => {
      const todaySchedule = TimetableApiService.transformSlotsToFacultyTodaySchedule(mockFacultySlots, {
        currentDay: 'Monday',
        markedPeriods: ['Period 1 (08:30 - 09:15)'],
      });

      expect(todaySchedule).toHaveLength(2);
      expect(todaySchedule[0].period_number).toBe(1);
      expect(todaySchedule[0].period_time).toBe('08:30 - 09:15');
      expect(todaySchedule[0].class_name).toBe('Grade 11-Section A2');
      expect(todaySchedule[0].attendance_done).toBe(true);

      expect(todaySchedule[1].period_number).toBe(2);
      expect(todaySchedule[1].attendance_done).toBe(false);
    });
  });

  // =========================================================================
  // 2. CalendarApiService Faculty Transformers
  // =========================================================================
  describe('CalendarApiService Faculty Transformers', () => {
    it('transforms BackendCalendarEvent into FacultyCalendarEventItem', () => {
      const item = CalendarApiService.transformEventToFacultyItem(mockFacultyEvents[0]);

      expect(item.id).toBe('cal_fac_001');
      expect(item.title).toBe('Term 1 Final Examination Invigilation');
      expect(item.category).toBe('Examination');
      expect(item.date).toBe('October 15 - October 25, 2026');
      expect(item.time).toBe('08:30 AM - 11:30 AM');
      expect(item.venue).toBe('Examination Hall 1');
      expect(item.is_holiday).toBe(false);
      expect(item.is_published).toBe(true);
      expect(item.target_roles).toEqual(['Faculty']);
    });
  });

  // =========================================================================
  // 3. FacultyApiService Bindings
  // =========================================================================
  describe('FacultyApiService Bindings', () => {
    it('fetches timetable slots via TimetableApiService', async () => {
      const getSpy = vi.spyOn(TimetableApiService, 'getTimetableSlots').mockResolvedValue(mockFacultySlots);

      const slots = await FacultyApiService.getTimetable({ day_of_week: 'Monday' });
      expect(getSpy).toHaveBeenCalledWith({ day_of_week: 'Monday' });
      expect(slots).toEqual(mockFacultySlots);
    });

    it('fetches calendar events with target_role: Faculty via CalendarApiService', async () => {
      const getSpy = vi.spyOn(CalendarApiService, 'getCalendarEvents').mockResolvedValue(mockFacultyEvents);

      const events = await FacultyApiService.getCalendarEvents({ category: 'exam' });
      expect(getSpy).toHaveBeenCalledWith({ category: 'exam', target_role: 'Faculty' });
      expect(events).toEqual(mockFacultyEvents);
    });
  });

  // =========================================================================
  // 4. FacultyService Integration & Graceful Fallback
  // =========================================================================
  describe('FacultyService Live Integration & Fallback', () => {
    it('getFacultyTimetable and getTimetable return live DRF slots transformed to entries', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockResolvedValue(mockFacultySlots);

      const timetable = await FacultyService.getFacultyTimetable();
      expect(timetable).toHaveLength(4);
      expect(timetable[0].subject).toBe('Mathematics');

      // Verify alias
      const alias = await FacultyService.getTimetable();
      expect(alias).toEqual(timetable);
    });

    it('getFacultyTimetable gracefully falls back to mock timetable when API fails', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockRejectedValue(new Error('500 Service Down'));

      const fallback = await FacultyService.getFacultyTimetable();
      expect(fallback.length).toBeGreaterThan(0);
      expect(fallback[0].subject).toBe('Mathematics (Calculus)');
    });

    it('getTodaySchedule returns live DRF slots mapped to today periods with customDay', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockResolvedValue(mockFacultySlots);

      const today = await FacultyService.getTodaySchedule('fac_001', 'Monday');
      expect(today).toHaveLength(2);
      expect(today[0].period_number).toBe(1);
      expect(today[0].subject).toBe('Mathematics');
    });

    it('getTodaySchedule gracefully falls back when API throws', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockRejectedValue(new Error('Network error'));

      const fallback = await FacultyService.getTodaySchedule();
      expect(fallback).toHaveLength(3);
      expect(fallback[0].period_time).toBe('08:30 - 09:15');
    });

    it('getCalendarEvents returns live DRF events scoped to Faculty', async () => {
      const apiSpy = vi.spyOn(CalendarApiService, 'getCalendarEvents').mockResolvedValue(mockFacultyEvents);

      const events = await FacultyService.getCalendarEvents();
      expect(apiSpy).toHaveBeenCalledWith({ target_role: 'Faculty' });
      expect(events).toHaveLength(3);
      expect(events[0].title).toBe('Term 1 Final Examination Invigilation');
      expect(events[0].category).toBe('Examination');
    });

    it('getCalendarEvents gracefully falls back when API fails', async () => {
      vi.spyOn(CalendarApiService, 'getCalendarEvents').mockRejectedValue(new Error('Timeout'));

      const fallbackEvents = await FacultyService.getCalendarEvents();
      expect(fallbackEvents.length).toBeGreaterThan(0);
      expect(fallbackEvents[0].title).toBe('Half-Yearly Written Examinations');
    });
  });

  // =========================================================================
  // 5. TeachingAssignment Consistency & Filtering
  // =========================================================================
  describe('TeachingAssignment Consistency & Filtering', () => {
    it('validates that teaching entries in timetable correspond to assigned sections and subjects', () => {
      const validEntries = TimetableApiService.transformSlotsToFacultyTimetable(mockFacultySlots);
      const isValid = FacultyService.validateTimetableConsistency(validEntries, mockTeachingAssignments);
      expect(isValid).toBe(true);
    });

    it('detects inconsistency when timetable contains teaching entries for unauthorized sections', () => {
      const unauthorizedSlot: BackendTimetableSlot = {
        id: 'tt_slot_unauth',
        section: 'sec_unauthorized_999',
        section_name: 'Section C1',
        class_id: 'cls_uuid_003',
        class_name: 'Grade 9',
        subject: 'sub_uuid_001',
        subject_name: 'Mathematics',
        faculty: 'fac_uuid_001',
        day_of_week: 'Thursday',
        period_number: 1,
        start_time: '08:30:00',
        end_time: '09:15:00',
        room_number: 'Room IX-C1',
      };

      const entries = TimetableApiService.transformSlotsToFacultyTimetable([
        ...mockFacultySlots,
        unauthorizedSlot,
      ]);

      const isValid = FacultyService.validateTimetableConsistency(entries, mockTeachingAssignments);
      expect(isValid).toBe(false);

      // Filtering removes the unauthorized teaching entry while keeping planning slots
      const filtered = FacultyService.filterTimetableByAssignments(entries, mockTeachingAssignments);
      expect(filtered.some((e) => e.id === 'tt_slot_unauth')).toBe(false);
      expect(filtered.some((e) => e.id === 'tt_slot_fac_004')).toBe(true); // Faculty planning is preserved
    });
  });

  // =========================================================================
  // 6. Timetable-to-Attendance Connection & Phase 5 Semantics Preservation
  // =========================================================================
  describe('Attendance Workflow Connection & Formula Preservation', () => {
    it('preserves Phase 5 canonical attendance formula and 4-status model', () => {
      // 10 PRESENT, 2 ON_DUTY, 1 LEAVE, 2 ABSENT => (10 + 2) / (10 + 2 + 1 + 2) * 100 = 12 / 15 * 100 = 80.0%
      const percentage = calculateAttendancePercentage({ present: 10, onDuty: 2, absent: 2, leave: 1 });
      expect(percentage).toBe(80);
    });

    it('attendance roll-call payload records bulk session for timetable period', async () => {
      const postSpy = vi.spyOn(ApiClient, 'post').mockResolvedValue({
        success: true,
        data: { saved_count: 3 },
      });

      const result = await FacultyApiService.recordBulkAttendance({
        date: '2026-10-15',
        session_period: 1,
        section_id: 'sec_uuid_001',
        records: [
          { student_id: 'STU202600001', status: 'PRESENT' },
          { student_id: 'STU202600002', status: 'ON_DUTY', remarks: 'Inter-school Math Olympiad' },
          { student_id: 'STU202600003', status: 'LEAVE', remarks: 'Medical leave approved by Class Teacher' },
        ],
      });

      expect(postSpy).toHaveBeenCalledWith('/api/v1/attendance/bulk/', {
        date: '2026-10-15',
        session_period: 1,
        section_id: 'sec_uuid_001',
        records: [
          { student_id: 'STU202600001', status: 'PRESENT' },
          { student_id: 'STU202600002', status: 'ON_DUTY', remarks: 'Inter-school Math Olympiad' },
          { student_id: 'STU202600003', status: 'LEAVE', remarks: 'Medical leave approved by Class Teacher' },
        ],
      });
      expect(result.saved_count).toBe(3);
    });
  });
});
