/**
 * Student ERP — useFacultyCalendar Hook
 * Phase 6 — Task 6.5: Faculty Timetable and Attendance Scheduling Integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FacultyService } from '../services/facultyService';
import type { FacultyCalendarEventItem } from '@/services/calendarApiService';

export function useFacultyCalendar() {
  const [events, setEvents] = useState<FacultyCalendarEventItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FacultyService.getCalendarEvents();
      setEvents(data);
    } catch {
      setError('Unable to load institutional calendar events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (filter === 'All') return events;
    return events.filter((e) => e.category === filter);
  }, [events, filter]);

  return {
    events: filteredEvents,
    rawEventsCount: events.length,
    filter,
    setFilter,
    loading,
    error,
    refetch: fetchEvents,
  };
}
