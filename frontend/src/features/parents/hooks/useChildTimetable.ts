/**
 * Student ERP — useChildTimetable Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { ParentTimetableDay } from '../types';

export function useChildTimetable(studentId = 'STU202600001') {
  return useQuery<ParentTimetableDay[]>({
    queryKey: ['childTimetable', studentId],
    queryFn: () => ParentService.getChildTimetable(studentId),
    staleTime: 10 * 60 * 1000,
  });
}
