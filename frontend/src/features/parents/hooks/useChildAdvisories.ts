/**
 * Student ERP — useChildAdvisories Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { ParentAdvisory } from '../types';

export function useChildAdvisories(studentId = 'STU202600001') {
  return useQuery<ParentAdvisory[]>({
    queryKey: ['childAdvisories', studentId],
    queryFn: () => ParentService.getChildAdvisories(studentId),
    staleTime: 5 * 60 * 1000,
  });
}
