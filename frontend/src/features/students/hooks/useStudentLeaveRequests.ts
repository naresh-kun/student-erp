/**
 * Student ERP — useStudentLeaveRequests Hook
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '../services/studentService';
import type { StudentLeaveRequest, StudentProfile } from '../types';
import type { LeaveRequestFormData } from '../schemas/leaveRequestSchema';

export function useStudentLeaveRequests(studentId = 'STU202600001') {
  const [requests, setRequests] = useState<StudentLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudentService.getLeaveRequests(studentId);
      setRequests(data);
    } catch (err) {
      setError('Unable to load student leave history.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const submitLeave = async (formData: LeaveRequestFormData, student: StudentProfile) => {
    try {
      setSubmitting(true);
      setError(null);
      const newRequest = await StudentService.submitLeaveRequest(formData, student);
      setRequests((prev) => [newRequest, ...prev]);
      return { success: true, request: newRequest };
    } catch (err) {
      const msg = 'Failed to submit leave application. Please check input.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    requests,
    loading,
    submitting,
    error,
    refetch: fetchRequests,
    submitLeave,
  };
}
