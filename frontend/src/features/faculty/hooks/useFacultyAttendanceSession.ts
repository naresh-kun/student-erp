/**
 * Student ERP — useFacultyAttendanceSession Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements roll call state management across the canonical 4-status model:
 * PRESENT, ABSENT, ON_DUTY, LEAVE.
 * Live recalculation using calculateAttendancePercentage:
 * (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 */

import { useState, useEffect, useCallback } from 'react';
import { FacultyService } from '../services/facultyService';
import { calculateAttendancePercentage } from '@/utils';
import type { AttendanceStatus } from '@/types';
import type { AttendanceSessionContext, AttendanceRollCallItem } from '../types';

export function useFacultyAttendanceSession(initialContext?: Partial<AttendanceSessionContext>) {
  const [context, setContext] = useState<AttendanceSessionContext>({
    academic_year: '2026–27',
    date: new Date().toISOString().split('T')[0],
    class_id: 'cls_001',
    section_id: 'sec_002',
    class_display: 'Grade 11 — Section A2',
    subject: 'Mathematics',
    period: 'Period 1 (08:30 - 09:15)',
    session_state: 'Not Marked',
    ...initialContext,
  });

  const [records, setRecords] = useState<AttendanceRollCallItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await FacultyService.getAttendanceRollCall(context);
      setContext(res.context);
      setRecords(res.records);
      setIsSubmitted(res.context.session_state === 'Marked');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load attendance session'));
    } finally {
      setIsLoading(false);
    }
  }, [context.academic_year, context.date, context.class_id, context.section_id, context.period]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Status updates
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
    if (context.session_state === 'Not Marked') {
      setContext((prev) => ({ ...prev, session_state: 'In Progress' }));
    }
  };

  // "Mark All Present" canonical action
  const markAllPresent = () => {
    setRecords((prev) =>
      prev.map((r) => ({ ...r, status: 'PRESENT' as const }))
    );
    setContext((prev) => ({ ...prev, session_state: 'In Progress' }));
  };

  // Live Counts & Canonical Percentage
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const onDutyCount = records.filter((r) => r.status === 'ON_DUTY').length;
  const leaveCount = records.filter((r) => r.status === 'LEAVE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalCount = records.length;

  const attendancePercentage = calculateAttendancePercentage({
    present: presentCount,
    absent: absentCount,
    onDuty: onDutyCount,
    leave: leaveCount,
  });

  // Submit live session to registry
  const submitSession = async () => {
    try {
      setIsSubmitting(true);
      await FacultyService.submitAttendanceRollCall(context, records, 'R. Suresh');
      setContext((prev) => ({ ...prev, session_state: 'Marked' }));
      setIsSubmitted(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit attendance register'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    context,
    setContext,
    records,
    setStudentStatus,
    markAllPresent,
    submitSession,
    counts: {
      present: presentCount,
      onDuty: onDutyCount,
      leave: leaveCount,
      absent: absentCount,
      total: totalCount,
    },
    attendancePercentage,
    isLoading,
    isSubmitting,
    isSubmitted,
    setIsSubmitted,
    error,
  };
}
