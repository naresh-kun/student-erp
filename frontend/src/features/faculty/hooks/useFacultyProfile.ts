/**
 * Student ERP — useFacultyProfile Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 */

import { useState, useEffect } from 'react';
import { FacultyService } from '../services/facultyService';
import type { FacultyProfile } from '../types';

export function useFacultyProfile(facultyId = 'fac_001') {
  const [data, setData] = useState<FacultyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    FacultyService.getFacultyProfile(facultyId)
      .then((profile) => {
        if (isMounted) {
          setData(profile);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load faculty profile'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [facultyId]);

  return { data, isLoading, error };
}
