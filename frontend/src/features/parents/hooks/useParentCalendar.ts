/**
 * Student ERP — useParentCalendar Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useQuery } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { ParentCalendarEvent } from '../types';

export function useParentCalendar() {
  return useQuery<ParentCalendarEvent[]>({
    queryKey: ['parentCalendarEvents'],
    queryFn: () => ParentService.getParentCalendarEvents(),
    staleTime: 10 * 60 * 1000,
  });
}
