/**
 * Student ERP — useAbsenceNotices Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParentService } from '../services/parentService';
import type { ParentProfile, AbsenceNoticeSubmission } from '../types';
import type { ParentAbsenceNoticeFormData } from '../schemas/absenceNoticeSchema';

export function useAbsenceNotices(studentId = 'STU202600001', parentProfile?: ParentProfile) {
  const queryClient = useQueryClient();
  const [lastSubmission, setLastSubmission] = useState<AbsenceNoticeSubmission | null>(null);

  const noticesQuery = useQuery<AbsenceNoticeSubmission[]>({
    queryKey: ['absenceNotices', studentId],
    queryFn: () => ParentService.getAbsenceNotices(studentId),
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: ParentAbsenceNoticeFormData) => {
      const profile = parentProfile || (await ParentService.getParentProfile());
      return ParentService.submitAbsenceNotice(formData, profile);
    },
    onSuccess: (data) => {
      setLastSubmission(data);
      queryClient.invalidateQueries({ queryKey: ['absenceNotices', studentId] });
    },
  });

  return {
    notices: noticesQuery.data || [],
    isLoading: noticesQuery.isLoading,
    submitNotice: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submissionError: submitMutation.error,
    lastSubmission,
    clearLastSubmission: () => setLastSubmission(null),
  };
}
