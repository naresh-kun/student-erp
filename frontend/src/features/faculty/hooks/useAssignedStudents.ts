/**
 * Student ERP — useAssignedStudents Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 */

import { useState, useEffect } from 'react';
import { FacultyService } from '../services/facultyService';
import type { FacultyAssignedStudent } from '../types';

export function useAssignedStudents(assignedClassId?: string) {
  const [data, setData] = useState<FacultyAssignedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    FacultyService.getAssignedStudents(assignedClassId)
      .then((students) => {
        if (isMounted) {
          setData(students);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load students'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assignedClassId]);

  return { data, isLoading, error };
}
