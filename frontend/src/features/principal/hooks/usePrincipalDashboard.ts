/**
 * Student ERP — Principal Executive Dashboard Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { PrincipalService } from '../services/principalService';
import type { PrincipalDashboardSummary } from '../types';

export function usePrincipalDashboard() {
  const [data, setData] = useState<PrincipalDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await PrincipalService.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive dashboard summary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, refresh: loadData };
}
