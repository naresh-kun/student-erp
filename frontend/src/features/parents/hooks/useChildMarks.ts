/**
 * Student ERP — useChildMarks Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { ParentAcademicSummary, ParentSubjectMarkRecord } from '../types';

export function useChildMarks(studentId = 'STU202600001') {
  const academicSummaryQuery = useQuery<ParentAcademicSummary>({
    queryKey: ['childAcademicSummary', studentId],
    queryFn: () => ParentService.getChildAcademicSummary(studentId),
    staleTime: 5 * 60 * 1000,
  });

  const subjectMarksQuery = useQuery<ParentSubjectMarkRecord[]>({
    queryKey: ['childSubjectMarks', studentId],
    queryFn: () => ParentService.getChildSubjectMarks(studentId),
    staleTime: 5 * 60 * 1000,
  });

  return {
    academicSummary: academicSummaryQuery.data,
    subjectMarks: subjectMarksQuery.data || [],
    isLoading: academicSummaryQuery.isLoading || subjectMarksQuery.isLoading,
    isError: academicSummaryQuery.isError || subjectMarksQuery.isError,
    refetch: () => {
      academicSummaryQuery.refetch();
      subjectMarksQuery.refetch();
    },
  };
}
