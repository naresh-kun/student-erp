/**
 * Student ERP — useFacultyTimetable Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 */

import { useState, useEffect } from 'react';
import { FacultyService } from '../services/facultyService';
import type { FacultyTimetableEntry, FacultyTodayPeriod } from '../types';

export function useFacultyTimetable(facultyId = 'fac_001') {
  const [timetable, setTimetable] = useState<FacultyTimetableEntry[]>([]);
  const [todayPeriods, setTodayPeriods] = useState<FacultyTodayPeriod[]>([]);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      FacultyService.getFacultyTimetable(facultyId),
      FacultyService.getTodaySchedule(facultyId),
    ])
      .then(([tt, today]) => {
        if (isMounted) {
          setTimetable(tt);
          setTodayPeriods(today);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load faculty timetable'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [facultyId]);

  const dayPeriods = timetable.filter((slot) => slot.day === selectedDay);

  return {
    timetable,
    todayPeriods,
    selectedDay,
    setSelectedDay,
    dayPeriods,
    isLoading,
    error,
  };
}
