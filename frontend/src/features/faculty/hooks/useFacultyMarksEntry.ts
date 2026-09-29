/**
 * Student ERP — useFacultyMarksEntry Hook
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Manages examination score register state:
 * - Validates scores (0–100 or 'AB')
 * - Automatically derives percentage & letter grade from src/utils/grading.ts
 * - Rejects GPA, CGPA, credits, or performance scores.
 */

import { useState, useEffect, useCallback } from 'react';
import { FacultyService } from '../services/facultyService';
import { calculateGrade, calculatePercentage } from '@/utils';
import { validateMarkInput } from '../schemas/marksSchema';
import type { FacultyMarkEntryItem, FacultyExamSummary } from '../types';

export function useFacultyMarksEntry(
  classId = 'cls_001_sec_002',
  subjectCode = 'MATH-041',
  initialExam = 'Half-Yearly Examination 2026–27'
) {
  const [examName, setExamName] = useState(initialExam);
  const [entries, setEntries] = useState<FacultyMarkEntryItem[]>([]);
  const [summary, setSummary] = useState<FacultyExamSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await FacultyService.getMarksEntrySheet(classId, subjectCode, examName);
      setEntries(res.entries);
      setSummary(res.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load marks entry sheet'));
    } finally {
      setIsLoading(false);
    }
  }, [classId, subjectCode, examName]);

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  const updateEntryScore = (studentId: string, rawValue: string) => {
    const validation = validateMarkInput(rawValue);

    setEntries((prev) =>
      prev.map((item) => {
        if (item.student_id !== studentId) return item;

        if (!validation.valid) {
          return {
            ...item,
            score: rawValue as unknown as number,
            error: validation.error,
          };
        }

        const validVal = validation.value;
        if (validVal === 'AB') {
          return {
            ...item,
            score: 'AB',
            derived_percentage: null,
            derived_grade: 'AB',
            error: undefined,
          };
        }

        if (validVal === '') {
          return {
            ...item,
            score: '',
            derived_percentage: null,
            derived_grade: '—',
            error: undefined,
          };
        }

        const numVal = validVal as number;
        return {
          ...item,
          score: numVal,
          derived_percentage: calculatePercentage(numVal, 100),
          derived_grade: calculateGrade(numVal),
          error: undefined,
        };
      })
    );
  };

  const updateEntryFeedback = (studentId: string, feedback: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.student_id === studentId ? { ...item, feedback } : item))
    );
  };

  const saveMarks = async (publish = false) => {
    try {
      setIsSaving(true);
      const res = await FacultyService.saveMarksEntrySheet(classId, subjectCode, examName, entries);
      setSummary(res.summary);
      if (publish) {
        setIsPublished(true);
      }
      setError(null);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save examination marks'));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    examName,
    setExamName,
    entries,
    summary,
    updateEntryScore,
    updateEntryFeedback,
    saveMarks,
    isPublished,
    setIsPublished,
    isLoading,
    isSaving,
    error,
  };
}
