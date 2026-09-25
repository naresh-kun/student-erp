/**
 * Student ERP — useParentProfile Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { ParentProfile } from '../types';

export function useParentProfile(userIdOrParentId?: string) {
  return useQuery<ParentProfile>({
    queryKey: ['parentProfile', userIdOrParentId || 'default'],
    queryFn: () => ParentService.getParentProfile(userIdOrParentId),
    staleTime: 5 * 60 * 1000,
  });
}
