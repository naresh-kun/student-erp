/**
 * Student ERP — useStudentTimetable Hook
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentService } from '../services/studentService';

export function useStudentTimetable() {
  const [weeklyGrid, setWeeklyGrid] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const grid = await StudentService.getWeeklyTimetable();
      setWeeklyGrid(grid);
    } catch (err) {
      setError('Unable to load school timetable schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const activeDaySchedule = useMemo(() => {
    const dayData = weeklyGrid.find((d) => d.day === selectedDay);
    return dayData?.periods || [];
  }, [weeklyGrid, selectedDay]);

  const todaySchedule = useMemo(() => {
    // Current day or default Monday
    return weeklyGrid[0]?.periods || [];
  }, [weeklyGrid]);

  return {
    weeklyGrid,
    selectedDay,
    setSelectedDay,
    activeDaySchedule,
    todaySchedule,
    loading,
    error,
    refetch: fetchTimetable,
  };
}
