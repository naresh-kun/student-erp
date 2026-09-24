/**
 * Student ERP — useStudentCalendar Hook
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentService } from '../services/studentService';
import type { CalendarEventItem } from '@/services/mockService';

export function useStudentCalendar() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudentService.getCalendarEvents();
      setEvents(data);
    } catch (err) {
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
