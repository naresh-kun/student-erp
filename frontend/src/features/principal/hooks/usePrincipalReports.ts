/**
 * Student ERP — Principal Institutional Reports & Oversight Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { PrincipalService } from '../services/principalService';
import type { InstitutionalReportItem, ReportApprovalState } from '../types';

export function usePrincipalReports() {
  const [reports, setReports] = useState<InstitutionalReportItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<InstitutionalReportItem | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PrincipalService.getReports(categoryFilter);
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load institutional reports');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: ReportApprovalState,
    remarks?: string
  ) => {
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await PrincipalService.updateReportStatus(reportId, newStatus, remarks);
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(updated);
      }
      setSuccessMessage(`Updated report "${updated.title}" status to "${newStatus}".`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update report status');
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    reports,
    categoryFilter,
    setCategoryFilter,
    selectedReport,
    setSelectedReport,
    isLoading,
    isUpdating,
    successMessage,
    setSuccessMessage,
    error,
    handleUpdateStatus,
    refresh: loadReports,
  };
}
