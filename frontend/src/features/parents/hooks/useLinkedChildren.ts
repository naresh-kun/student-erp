/**
 * Student ERP — useLinkedChildren Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { LinkedChild } from '../types';

export function useLinkedChildren(parentId = 'par_001') {
  return useQuery<LinkedChild[]>({
    queryKey: ['linkedChildren', parentId],
    queryFn: () => ParentService.getLinkedChildren(parentId),
    staleTime: 5 * 60 * 1000,
  });
}
