/**
 * Student ERP — usePendingLeaveReviews Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Provides reactive access to pending absence notices from students/parents,
 * enabling Class Teacher R. Suresh to review, approve as LEAVE, or reject.
 */

import { useState, useEffect, useCallback } from 'react';
import { FacultyService } from '../services/facultyService';
import type { FacultyPendingLeaveNotice } from '../types';

export function usePendingLeaveReviews(facultyId = 'fac_001') {
  const [notices, setNotices] = useState<FacultyPendingLeaveNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await FacultyService.getPendingLeaveNotices(facultyId);
      setNotices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load pending leave notices'));
    } finally {
      setIsLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const reviewNotice = async (
    noticeId: string,
    action: 'APPROVE' | 'REJECT',
    note?: string
  ) => {
    const updated = await FacultyService.reviewLeaveNotice(
      noticeId,
      action,
      facultyId,
      'R. Suresh',
      note
    );
    // Reactive local update
    setNotices((prev) =>
      prev.map((n) => (n.id === noticeId ? updated : n))
    );
    return updated;
  };

  const pendingCount = notices.filter((n) => n.status === 'PENDING_FACULTY_REVIEW').length;
  const approvedLeaveCount = notices.filter((n) => n.status === 'LEAVE').length;

  return {
    notices,
    pendingCount,
    approvedLeaveCount,
    reviewNotice,
    refreshNotices: fetchNotices,
    isLoading,
    error,
  };
}
