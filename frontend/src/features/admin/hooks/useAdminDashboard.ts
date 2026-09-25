/**
 * Student ERP — Admin Dashboard Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../services/adminService';
import type { AdminDashboardKPIs } from '../types';

export function useAdminDashboard() {
  const [kpis, setKpis] = useState<AdminDashboardKPIs | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<{ month: string; attendance: number }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await AdminService.getDashboardSummary();
      setKpis(result.kpis);
      setAttendanceTrend(result.attendanceTrend);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { kpis, attendanceTrend, isLoading, error, refresh: loadData };
}
