/**
 * Student ERP — useStudentAttendance Hook
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentService } from '../services/studentService';
import { MockDataService, type StudentAttendanceSessionLog } from '@/services/mockService';
import type { StudentAttendanceStatSummary, StudentSubjectAttendance } from '../types';
import type { AttendanceStatus } from '@/types';

export function useStudentAttendance(studentId = 'STU202600001') {
  const [stats, setStats] = useState<StudentAttendanceStatSummary | null>(null);
  const [subjectAttendance, setSubjectAttendance] = useState<StudentSubjectAttendance[]>([]);
  const [logs, setLogs] = useState<StudentAttendanceSessionLog[]>([]);
  const [trend, setTrend] = useState<{ month: string; attendance: number; target: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'ALL'>('ALL');

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, subjectsData, logsData, trendData] = await Promise.all([
        StudentService.getAttendanceSummary(studentId),
        StudentService.getSubjectAttendance(),
        StudentService.getAttendanceLogs(),
        MockDataService.getMonthlyAttendanceTrend(),
      ]);
      setStats(statsData);
      setSubjectAttendance(subjectsData);
      setLogs(logsData);
      setTrend(trendData);
    } catch (err) {
      setError('Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredLogs = useMemo(() => {
    if (statusFilter === 'ALL') return logs;
    return logs.filter((l) => l.status === statusFilter);
  }, [logs, statusFilter]);

  return {
    stats,
    subjectAttendance,
    logs: filteredLogs,
    rawLogsCount: logs.length,
    trend,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch: fetchAttendance,
  };
}
