/**
 * Student ERP — Phase 6 Task 6.4 Frontend Verification Suite
 * Student & Parent Timetable and Academic Calendar API Integration
 *
 * Covers:
 * 1. TimetableApiService: /api/v1/timetable/ integration, filtering, pagination, and domain transformers
 * 2. CalendarApiService: /api/v1/calendar/events/ integration, date/time formatting, and category transformers
 * 3. StudentService: live API mapping for weekly timetable and academic calendar with graceful fallback
 * 4. ParentService: live API mapping for ward timetable and parent academic calendar with graceful fallback
 * 5. Role-based scoping invariants for Student and Parent
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
import { StudentService } from '../src/features/students/services/studentService';
import { ParentService } from '../src/features/parents/services/parentService';

const mockSlots: BackendTimetableSlot[] = [
  {
    id: 'tt_slot_001',
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
    id: 'tt_slot_002',
    section: 'sec_uuid_001',
    section_name: 'Section A2',
    class_id: 'cls_uuid_001',
    class_name: 'Grade 11',
    subject: 'sub_uuid_002',
    subject_name: 'Computer Science Lab',
    subject_code: 'CS11',
    faculty: 'fac_uuid_002',
    faculty_name: 'Priya Krishnan',
    faculty_employee_code: 'FAC-CS-002',
    day_of_week: 'Monday',
    period_number: 2,
    start_time: '09:15:00',
    end_time: '10:00:00',
    room_number: 'Computer Lab 2',
  },
  {
    id: 'tt_slot_003',
    section: 'sec_uuid_001',
    section_name: 'Section A2',
    class_id: 'cls_uuid_001',
    class_name: 'Grade 11',
    subject: 'sub_uuid_003',
    subject_name: 'Physics',
    subject_code: 'PHY11',
    faculty: 'fac_uuid_003',
    faculty_name: 'Karthik Raman',
    faculty_employee_code: 'FAC-PHY-003',
    day_of_week: 'Tuesday',
    period_number: 1,
    start_time: '08:30:00',
    end_time: '09:15:00',
    room_number: 'Room XI-A2',
  },
];

const mockEvents: BackendCalendarEvent[] = [
  {
    id: 'cal_evt_001',
    title: 'Half-Yearly Written Examinations',
    category: 'exam',
    description: 'Mandatory CBSE-pattern curriculum evaluations.',
    start_date: '2026-10-12T08:30:00Z',
    end_date: '2026-10-22T11:30:00Z',
    target_roles: ['Student', 'Parent', 'Faculty'],
    location: 'Examination Block 1 & 2',
    is_holiday: false,
    is_published: true,
  },
  {
    id: 'cal_evt_002',
    title: 'Diwali & Autumn School Holidays',
    category: 'holiday',
    description: 'School closed for festive break.',
    start_date: '2026-11-01T00:00:00Z',
    end_date: '2026-11-05T23:59:59Z',
    target_roles: ['Student', 'Parent', 'Faculty'],
    location: 'Campus Closed',
    is_holiday: true,
    is_published: true,
  },
  {
    id: 'cal_evt_003',
    title: 'Parent-Teacher Meeting (Term 1 Review)',
    category: 'meeting',
    description: 'One-on-one consultation with Class Teacher R. Suresh.',
    start_date: '2026-11-14T09:00:00Z',
    end_date: '2026-11-14T14:00:00Z',
    target_roles: ['Parent', 'Faculty'],
    location: 'Room XI-A2',
    is_holiday: false,
    is_published: true,
  },
  {
    id: 'cal_evt_004',
    title: 'Annual Science & Technology Working Model Exhibition',
    category: 'academic',
    description: 'STEM demonstrations and automated robotics exhibits.',
    start_date: '2026-10-28T09:30:00Z',
    end_date: '2026-10-28T15:30:00Z',
    target_roles: ['Student', 'Parent', 'Faculty'],
    location: 'School Main Auditorium',
    is_holiday: false,
    is_published: true,
  },
];

describe('Phase 6 Task 6.4 — Timetable & Calendar API Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. TimetableApiService
  // =========================================================================
  describe('TimetableApiService', () => {
    it('fetches timetable slots with query parameters via GET /api/v1/timetable/', async () => {
      const getSpy = vi.spyOn(ApiClient, 'get').mockResolvedValue({
        success: true,
        data: mockSlots,
      });

      const result = await TimetableApiService.getTimetableSlots({
        section_id: 'sec_uuid_001',
        day_of_week: 'Monday',
      });

      expect(getSpy).toHaveBeenCalledWith('/api/v1/timetable/', {
        section_id: 'sec_uuid_001',
        day_of_week: 'Monday',
      });
      expect(result).toHaveLength(3);
      expect(result[0].subject_name).toBe('Mathematics');
    });

    it('handles paginated response envelope from Django REST Framework', async () => {
      vi.spyOn(ApiClient, 'get').mockResolvedValue({
        success: true,
        data: {
          count: 3,
          next: null,
          previous: null,
          results: mockSlots,
        },
      });

      const result = await TimetableApiService.getTimetableSlots({ page: 1 });
      expect(result).toHaveLength(3);
      expect(result[1].subject_name).toBe('Computer Science Lab');
    });

    it('formats time string correctly removing seconds', () => {
      expect(TimetableApiService.formatTime('08:30:00')).toBe('08:30');
      expect(TimetableApiService.formatTime('14:45:30')).toBe('14:45');
      expect(TimetableApiService.formatTime('09:15')).toBe('09:15');
      expect(TimetableApiService.formatTime('')).toBe('');
    });

    it('transforms slots into 5-day student weekly schedule grid with correct period types', () => {
      const grid = TimetableApiService.transformSlotsToWeeklyGrid(mockSlots);

      expect(grid).toHaveLength(5);
      expect(grid.map((d) => d.day)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

      // Monday has 2 slots
      const monday = grid.find((d) => d.day === 'Monday')!;
      expect(monday.periods).toHaveLength(2);
      expect(monday.periods[0].period).toBe('Period 1 (08:30 - 09:15)');
      expect(monday.periods[0].subject).toBe('Mathematics');
      expect(monday.periods[0].teacher).toBe('R. Suresh');
      expect(monday.periods[0].type).toBe('Class');

      // Slot 2 has 'Lab' in subject/room
      expect(monday.periods[1].subject).toBe('Computer Science Lab');
      expect(monday.periods[1].type).toBe('Lab');

      // Tuesday has 1 slot
      const tuesday = grid.find((d) => d.day === 'Tuesday')!;
      expect(tuesday.periods).toHaveLength(1);
      expect(tuesday.periods[0].period).toBe('Period 1 (08:30 - 09:15)');

      // Wednesday is empty
      const wednesday = grid.find((d) => d.day === 'Wednesday')!;
      expect(wednesday.periods).toHaveLength(0);
    });

    it('transforms slots into parent timetable day structure', () => {
      const parentDays = TimetableApiService.transformSlotsToParentTimetable(mockSlots);

      expect(parentDays).toHaveLength(5);
      const monday = parentDays.find((d) => d.day === 'Monday')!;
      expect(monday.periods).toHaveLength(2);
      expect(monday.periods[0].period).toBe(1);
      expect(monday.periods[0].time).toBe('08:30 - 09:15');
      expect(monday.periods[0].faculty).toBe('R. Suresh');
      expect(monday.periods[0].type).toBe('Lecture');

      expect(monday.periods[1].type).toBe('Lab');
    });
  });

  // =========================================================================
  // 2. CalendarApiService
  // =========================================================================
  describe('CalendarApiService', () => {
    it('fetches calendar events with role and category filters via GET /api/v1/calendar/events/', async () => {
      const getSpy = vi.spyOn(ApiClient, 'get').mockResolvedValue({
        success: true,
        data: mockEvents,
      });

      const result = await CalendarApiService.getCalendarEvents({
        target_role: 'Student',
        category: 'exam',
      });

      expect(getSpy).toHaveBeenCalledWith('/api/v1/calendar/events/', {
        target_role: 'Student',
        category: 'exam',
      });
      expect(result).toHaveLength(4);
    });

    it('formats date ranges correctly for same-day and multi-day spans', () => {
      // Same day event
      const sameDay = CalendarApiService.formatDateRange(
        '2026-10-28T09:30:00Z',
        '2026-10-28T15:30:00Z'
      );
      expect(sameDay).toBe('October 28, 2026');

      // Multi-day span in same month
      const multiDay = CalendarApiService.formatDateRange(
        '2026-10-12T08:30:00Z',
        '2026-10-22T11:30:00Z'
      );
      expect(multiDay).toBe('October 12 - October 22, 2026');
    });

    it('formats time intervals and holiday all-day tags', () => {
      // Timed event
      const timed = CalendarApiService.formatTimeRange(
        '2026-10-12T08:30:00Z',
        '2026-10-12T11:30:00Z',
        false
      );
      expect(timed).toBe('08:30 AM - 11:30 AM');

      // Holiday event
      const holiday = CalendarApiService.formatTimeRange(
        '2026-11-01T00:00:00Z',
        '2026-11-05T23:59:59Z',
        true
      );
      expect(holiday).toBe('All Day');
    });

    it('transforms backend event to student presentation item', () => {
      const studentItem = CalendarApiService.transformEventToStudentItem(mockEvents[0]);
      expect(studentItem.title).toBe('Half-Yearly Written Examinations');
      expect(studentItem.category).toBe('Examination');
      expect(studentItem.venue).toBe('Examination Block 1 & 2');
      expect(studentItem.desc).toBe('Mandatory CBSE-pattern curriculum evaluations.');
    });

    it('transforms backend event to parent presentation item detecting PTM and Holiday categories', () => {
      // PTM event
      const ptmItem = CalendarApiService.transformEventToParentItem(mockEvents[2]);
      expect(ptmItem.title).toBe('Parent-Teacher Meeting (Term 1 Review)');
      expect(ptmItem.category).toBe('PTM');

      // Holiday event
      const holidayItem = CalendarApiService.transformEventToParentItem(mockEvents[1]);
      expect(holidayItem.title).toBe('Diwali & Autumn School Holidays');
      expect(holidayItem.category).toBe('Holiday');
      expect(holidayItem.time).toBe('All Day');
    });
  });

  // =========================================================================
  // 3. StudentService Integration
  // =========================================================================
  describe('StudentService Integration', () => {
    it('getWeeklyTimetable and getTimetable return live DRF slots transformed into weekly grid', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockResolvedValue(mockSlots);

      const grid1 = await StudentService.getWeeklyTimetable();
      expect(grid1).toHaveLength(5);
      const monday = grid1.find((d) => d.day === 'Monday')!;
      expect(monday.periods).toHaveLength(2);
      expect(monday.periods[0].subject).toBe('Mathematics');

      // Verify alias
      const grid2 = await StudentService.getTimetable();
      expect(grid2).toEqual(grid1);
    });

    it('getWeeklyTimetable gracefully falls back to mock grid when API throws', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockRejectedValue(new Error('Network error'));

      const fallbackGrid = await StudentService.getWeeklyTimetable();
      expect(fallbackGrid).toHaveLength(5);
      const monday = fallbackGrid.find((d) => d.day === 'Monday')!;
      expect(monday.periods.length).toBeGreaterThan(0);
      expect(monday.periods[0].subject).toBeDefined();
    });

    it('getCalendarEvents returns live DRF events scoped to Student', async () => {
      const apiSpy = vi.spyOn(CalendarApiService, 'getCalendarEvents').mockResolvedValue(mockEvents);

      const events = await StudentService.getCalendarEvents();
      expect(apiSpy).toHaveBeenCalledWith({ target_role: 'Student' });
      expect(events).toHaveLength(4);
      expect(events[0].title).toBe('Half-Yearly Written Examinations');
      expect(events[0].category).toBe('Examination');
    });

    it('getCalendarEvents gracefully falls back to mock events when API throws', async () => {
      vi.spyOn(CalendarApiService, 'getCalendarEvents').mockRejectedValue(new Error('500 Internal Error'));

      const fallbackEvents = await StudentService.getCalendarEvents();
      expect(fallbackEvents.length).toBeGreaterThan(0);
      expect(fallbackEvents[0].title).toBeDefined();
    });
  });

  // =========================================================================
  // 4. ParentService Integration
  // =========================================================================
  describe('ParentService Integration', () => {
    it('getChildTimetable returns live DRF slots transformed into parent days', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockResolvedValue(mockSlots);

      const days = await ParentService.getChildTimetable('STU202600001');
      expect(days).toHaveLength(5);
      const monday = days.find((d) => d.day === 'Monday')!;
      expect(monday.periods).toHaveLength(2);
      expect(monday.periods[0].subject).toBe('Mathematics');
      expect(monday.periods[0].faculty).toBe('R. Suresh');
    });

    it('getChildTimetable gracefully falls back to mock timetable when API throws', async () => {
      vi.spyOn(TimetableApiService, 'getTimetableSlots').mockRejectedValue(new Error('Service unavailable'));

      const fallbackDays = await ParentService.getChildTimetable('STU202600001');
      expect(fallbackDays).toHaveLength(5);
      const monday = fallbackDays.find((d) => d.day === 'Monday')!;
      expect(monday.periods.length).toBeGreaterThan(0);
      expect(monday.periods[0].subject).toBe('Mathematics');
    });

    it('getParentCalendarEvents and getCalendarEvents return live DRF events scoped to Parent', async () => {
      const apiSpy = vi.spyOn(CalendarApiService, 'getCalendarEvents').mockResolvedValue(mockEvents);

      const events1 = await ParentService.getParentCalendarEvents();
      expect(apiSpy).toHaveBeenCalledWith({ target_role: 'Parent' });
      expect(events1).toHaveLength(4);
      expect(events1[2].category).toBe('PTM');

      // Verify alias
      const events2 = await ParentService.getCalendarEvents();
      expect(events2).toEqual(events1);
    });

    it('getParentCalendarEvents gracefully falls back to mock events when API throws', async () => {
      vi.spyOn(CalendarApiService, 'getCalendarEvents').mockRejectedValue(new Error('Timeout'));

      const fallbackEvents = await ParentService.getParentCalendarEvents();
      expect(fallbackEvents.length).toBeGreaterThan(0);
      expect(fallbackEvents[0].title).toBe('Parent-Teacher Meeting (Term 1 Academic Review)');
    });
  });

  // =========================================================================
  // 5. Section and Role Scoping Invariants
  // =========================================================================
  describe('Role & Section Scoping Invariants', () => {
    it('ensures student calendar events exclude non-student targeted events', async () => {
      const facultyOnlyEvent: BackendCalendarEvent = {
        id: 'cal_fac_only',
        title: 'Department Head Academic Planning',
        category: 'meeting',
        description: 'Internal faculty meeting.',
        start_date: '2026-10-15T14:00:00Z',
        end_date: '2026-10-15T16:00:00Z',
        target_roles: ['Faculty'],
        location: 'Conference Room',
        is_holiday: false,
        is_published: true,
      };

      vi.spyOn(CalendarApiService, 'getCalendarEvents').mockImplementation(async (params) => {
        if (params?.target_role === 'Student') {
          return mockEvents; // Excludes facultyOnlyEvent
        }
        return [...mockEvents, facultyOnlyEvent];
      });

      const studentEvents = await StudentService.getCalendarEvents();
      const hasFacultyMeeting = studentEvents.some((e) => e.title.includes('Department Head'));
      expect(hasFacultyMeeting).toBe(false);
    });

    it('ensures parent calendar events query specifies target_role: Parent', async () => {
      const apiSpy = vi.spyOn(CalendarApiService, 'getCalendarEvents').mockResolvedValue(mockEvents);

      await ParentService.getParentCalendarEvents();
      expect(apiSpy).toHaveBeenCalledWith(
        expect.objectContaining({ target_role: 'Parent' })
      );
    });
  });
});
