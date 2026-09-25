/**
 * Student ERP — useAssignedClasses Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 */

import { useState, useEffect } from 'react';
import { FacultyService } from '../services/facultyService';
import type { FacultyAssignedClass } from '../types';

export function useAssignedClasses(facultyId = 'fac_001') {
  const [data, setData] = useState<FacultyAssignedClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('cls_001_sec_002');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    FacultyService.getAssignedClasses(facultyId)
      .then((classes) => {
        if (isMounted) {
          setData(classes);
          if (classes.length > 0 && !selectedClassId) {
            setSelectedClassId(classes[0].id);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load assigned classes'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [facultyId]);

  const activeClass = data.find((c) => c.id === selectedClassId) || data[0] || null;

  return {
    data,
    activeClass,
    selectedClassId,
    setSelectedClassId,
    isLoading,
    error,
  };
}
