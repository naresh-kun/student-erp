/**
 * Student ERP — Admin Students Directory Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../services/adminService';
import type { AdminStudentItem } from '../types';

export function useAdminStudents() {
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined);
  const [streamFilter, setStreamFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getStudents({
        search,
        gradeLevel: gradeFilter,
        stream: streamFilter,
        status: statusFilter,
      });
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load student directory');
    } finally {
      setIsLoading(false);
    }
  }, [search, gradeFilter, streamFilter, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  return {
    students,
    isLoading,
    error,
    search,
    setSearch,
    gradeFilter,
    setGradeFilter,
    streamFilter,
    setStreamFilter,
    statusFilter,
    setStatusFilter,
    refresh: loadStudents,
  };
}
