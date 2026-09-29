/**
 * Student ERP — Principal Academics Analytics Hook
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { useState, useEffect, useCallback } from 'react';
import { PrincipalService } from '../services/principalService';
import type {
  GradeAcademicPerformance,
  StreamPerformanceItem,
  SubjectPerformanceItem,
} from '../types';

export function usePrincipalAcademics() {
  const [gradePerformance, setGradePerformance] = useState<GradeAcademicPerformance[]>([]);
  const [streamPerformance, setStreamPerformance] = useState<StreamPerformanceItem[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceItem[]>([]);
  const [schoolGradeDistribution, setSchoolGradeDistribution] = useState<{ tier: string; count: number; percentage: number }[]>([]);

  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined);
  const [streamFilter, setStreamFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await PrincipalService.getAcademicAnalytics({
        gradeLevel: gradeFilter,
        stream: streamFilter,
      });
      setGradePerformance(result.gradePerformance);
      setStreamPerformance(result.streamPerformance);
      setSubjectPerformance(result.subjectPerformance);
      setSchoolGradeDistribution(result.schoolGradeDistribution);
    } catch (err: any) {
      setError(err.message || 'Failed to load school academic analytics');
    } finally {
      setIsLoading(false);
    }
  }, [gradeFilter, streamFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    gradePerformance,
    streamPerformance,
    subjectPerformance,
    schoolGradeDistribution,
    gradeFilter,
    setGradeFilter,
    streamFilter,
    setStreamFilter,
    isLoading,
    error,
    refresh: loadData,
  };
}
