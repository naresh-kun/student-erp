/**
 * Student ERP — useChildAttendance Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { 
  ParentAttendanceSummary, 
  ParentSubjectAttendance, 
  ParentAttendanceRecord 
} from '../types';

export function useChildAttendance(studentId = 'STU202600001') {
  const summaryQuery = useQuery<ParentAttendanceSummary>({
    queryKey: ['childAttendanceSummary', studentId],
    queryFn: () => ParentService.getChildAttendanceSummary(studentId),
    staleTime: 5 * 60 * 1000,
  });

  const subjectAttendanceQuery = useQuery<ParentSubjectAttendance[]>({
    queryKey: ['childSubjectAttendance', studentId],
    queryFn: () => ParentService.getChildSubjectAttendance(studentId),
    staleTime: 5 * 60 * 1000,
  });

  const historyQuery = useQuery<ParentAttendanceRecord[]>({
    queryKey: ['childAttendanceHistory', studentId],
    queryFn: () => ParentService.getChildAttendanceHistory(studentId),
    staleTime: 5 * 60 * 1000,
  });

  return {
    summary: summaryQuery.data,
    subjectAttendance: subjectAttendanceQuery.data || [],
    history: historyQuery.data || [],
    isLoading: summaryQuery.isLoading || subjectAttendanceQuery.isLoading || historyQuery.isLoading,
    isError: summaryQuery.isError || subjectAttendanceQuery.isError || historyQuery.isError,
    refetch: () => {
      summaryQuery.refetch();
      subjectAttendanceQuery.refetch();
      historyQuery.refetch();
    },
  };
}
