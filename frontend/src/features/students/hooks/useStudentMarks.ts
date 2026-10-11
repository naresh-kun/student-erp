/**
 * Student ERP — useStudentMarks Hook
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Enforces Indian School Academic Standards (0-100 marks, A1 to E grading, zero GPA/credits).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentService } from '../services/studentService';
import type { StudentExamRecord } from '@/services/mockService';
import { calculateGrade, calculatePercentage } from '@/utils';

export function useStudentMarks(studentId = 'STU202600001') {
  const [examRecords, setExamRecords] = useState<StudentExamRecord[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [backendSummary, setBackendSummary] = useState<{
    cumulativeMarks: number;
    maxMarks: number;
    percentage: number;
    overallGrade: string;
    isPassed: boolean;
    evaluatedSubjectsCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [records, comparisonData, reportCard] = await Promise.all([
        StudentService.getExamRecords(studentId),
        StudentService.getSubjectMarksComparison(studentId),
        StudentService.getReportCard(studentId).catch(() => null),
      ]);
      setExamRecords(records);
      setComparison(comparisonData);

      if (reportCard && typeof reportCard.overall_percentage === 'number') {
        setBackendSummary({
          cumulativeMarks: reportCard.total_marks_obtained,
          maxMarks: reportCard.total_max_marks,
          percentage: reportCard.overall_percentage,
          overallGrade: reportCard.overall_grade,
          isPassed: reportCard.overall_percentage >= 33,
          evaluatedSubjectsCount: reportCard.subject_count ?? (reportCard.marks?.length || 0),
        });
      }
    } catch (err) {
      setError('Unable to load student examination scores.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  const summary = useMemo(() => {
    if (backendSummary) {
      return backendSummary;
    }

    if (!examRecords.length) {
      return {
        cumulativeMarks: 0,
        maxMarks: 0,
        percentage: 0,
        overallGrade: 'E' as const,
        isPassed: false,
        evaluatedSubjectsCount: 0,
      };
    }

    let totalScore = 0;
    let totalMax = 0;

    for (const record of examRecords) {
      const score = typeof record.score === 'number' ? record.score : 0;
      totalScore += score;
      totalMax += record.max || 100;
    }

    const pct = calculatePercentage(totalScore, totalMax);
    const grade = calculateGrade(pct);
    const isPassed = pct >= 33; // Indian school passing threshold

    return {
      cumulativeMarks: totalScore,
      maxMarks: totalMax,
      percentage: pct,
      overallGrade: grade,
      isPassed,
      evaluatedSubjectsCount: examRecords.length,
    };
  }, [backendSummary, examRecords]);

  return {
    examRecords,
    comparison,
    summary,
    loading,
    error,
    refetch: fetchMarks,
  };
}
