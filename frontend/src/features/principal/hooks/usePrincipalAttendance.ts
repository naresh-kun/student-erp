/**
 * Student ERP — Principal Attendance Analytics Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { PrincipalService } from '../services/principalService';
import type { PrincipalAttendanceTelemetry } from '../types';

export function usePrincipalAttendance() {
  const [telemetry, setTelemetry] = useState<PrincipalAttendanceTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PrincipalService.getAttendanceAnalytics();
      setTelemetry(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load institutional attendance analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { telemetry, isLoading, error, refresh: loadData };
}
