/**
 * Student ERP — Admin Class Allocation Workspace Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../services/adminService';
import type {
  AllocationSourceStudent,
  AllocationTargetSection,
  AllocationPreviewRecord,
  AllocationHistoryRecord,
  AllocationMethod,
} from '../types';

export function useAdminAllocation() {
  const [grade, setGrade] = useState<string>('Grade 11');
  const [stream, setStream] = useState<string>('Computer Science A');
  const [method, setMethod] = useState<AllocationMethod>('MERIT');
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

  const [sourceStudents, setSourceStudents] = useState<AllocationSourceStudent[]>([]);
  const [targetSections, setTargetSections] = useState<AllocationTargetSection[]>([]);
  const [previewRecords, setPreviewRecords] = useState<AllocationPreviewRecord[]>([]);
  const [history, setHistory] = useState<AllocationHistoryRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load workspace data when grade or stream changes
  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const actualStream = grade === 'Grade 10' ? undefined : stream;
      const [workspaceData, historyData] = await Promise.all([
        AdminService.getAllocationWorkspace(grade, actualStream),
        AdminService.getAllocationHistory(),
      ]);

      setSourceStudents(workspaceData.sourceStudents);
      setTargetSections(workspaceData.targetSections);
      setHistory(historyData);

      // Default select all target section names
      setSelectedSectionIds(workspaceData.targetSections.map((s) => s.section_name));
    } catch (err: any) {
      setError(err.message || 'Failed to load allocation workspace');
    } finally {
      setIsLoading(false);
    }
  }, [grade, stream]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Generate allocation preview
  const handleGeneratePreview = () => {
    setError(null);
    if (selectedSectionIds.length === 0) {
      setError('Please select at least one target section for allocation');
      return;
    }

    if (sourceStudents.length === 0) {
      setError('No eligible candidate students found in current pool');
      return;
    }

    const actualStream = grade === 'Grade 10' ? undefined : stream;
    const records = AdminService.generateAllocationPreview({
      grade,
      stream: actualStream,
      method,
      targetSections: selectedSectionIds,
      students: sourceStudents,
    });

    setPreviewRecords(records);
    setIsPreviewOpen(true);
  };

  // Commit and publish allocation
  const handlePublishAllocation = async (publishedBy = 'K. Narayanan (Admin)', notes?: string) => {
    if (previewRecords.length === 0) {
      setError('No allocation preview records to publish');
      return;
    }

    setIsPublishing(true);
    setError(null);
    try {
      const actualStream = grade === 'Grade 10' ? undefined : stream;
      const historyEntry = await AdminService.publishAllocation({
        academicYear: '2026–27',
        grade,
        stream: actualStream,
        method,
        publishedBy,
        notes,
        previewRecords,
      });

      setHistory((prev) => [historyEntry, ...prev]);
      setPublishSuccessMessage(
        `Successfully published section allocation for ${previewRecords.length} students via ${method === 'MERIT' ? 'Merit-Based' : 'Random Seeded'} method.`
      );
      setIsPreviewOpen(false);
      setPreviewRecords([]);
      // Reload workspace to refresh student states
      await loadWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to commit allocation');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleTargetSection = (secName: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(secName) ? prev.filter((s) => s !== secName) : [...prev, secName]
    );
  };

  return {
    grade,
    setGrade,
    stream,
    setStream,
    method,
    setMethod,
    selectedSectionIds,
    toggleTargetSection,
    sourceStudents,
    targetSections,
    previewRecords,
    history,
    isLoading,
    isPublishing,
    isPreviewOpen,
    setIsPreviewOpen,
    publishSuccessMessage,
    setPublishSuccessMessage,
    error,
    handleGeneratePreview,
    handlePublishAllocation,
    refresh: loadWorkspace,
  };
}
