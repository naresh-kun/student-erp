/**
 * Student ERP — useStudentProfile Hook
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '../services/studentService';
import type { StudentProfile } from '../types';
import type { StudentProfileContactFormData } from '../schemas/studentProfileSchema';

export function useStudentProfile(studentId = 'STU202600001') {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudentService.getProfile(studentId);
      setProfile(data);
    } catch (err) {
      setError('Unable to load student profile records.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateContact = async (formData: StudentProfileContactFormData) => {
    try {
      setUpdating(true);
      setError(null);
      const updated = await StudentService.updateContactInfo(studentId, formData);
      setProfile(updated);
      return { success: true };
    } catch (err) {
      const msg = 'Failed to update contact details. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updating,
    refetch: fetchProfile,
    updateContact,
  };
}
