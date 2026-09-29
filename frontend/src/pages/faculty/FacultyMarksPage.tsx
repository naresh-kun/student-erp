/**
 * Student ERP — FacultyMarksPage
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the examination marks entry register and grading sheet:
 * - Mark model: 0–100 or 'AB' (Absent)
 * - Derived Letter Grade from src/utils/grading.ts
 * - Zero GPA/CGPA/credits
 * - Strictly NO faculty performance scoring or teacher comparison metrics
 * - CBSE 8-tier Grade Distribution visual chart
 */

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import {
  useAssignedClasses,
  useFacultyMarksEntry,
  FacultyMarksEntrySheet,
  FacultyGradeDistributionChart,
} from '@/features/faculty';

export const FacultyMarksPage: React.FC = () => {
  const { data: classes = [], isLoading: classesLoading } = useAssignedClasses();
  const [selectedClassId, setSelectedClassId] = useState('cls_001_sec_002');

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const {
    examName,
    setExamName,
    entries,
    summary,
    updateEntryScore,
    updateEntryFeedback,
    saveMarks,
    isPublished,
    setIsPublished,
    isLoading: marksLoading,
    isSaving,
  } = useFacultyMarksEntry(
    activeClass?.id || 'cls_001_sec_002',
    activeClass?.subject_code || 'MATH-041',
    'Half-Yearly Examination 2026–27'
  );

  if (classesLoading || marksLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading examination marks register & grade distribution..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Examination Marks Entry & Grade Book"
          description="Enter marks out of 100 or 'AB' for absent students. Derive standard CBSE 8-tier letter grades (A1 to E). Zero GPA or CGPA."
        />

        {/* Class Selection Pill Bar */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedClassId === cls.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cls.display_name} ({cls.student_count} Students)
            </button>
          ))}
        </div>

        {/* Grade Distribution Bar Chart */}
        <FacultyGradeDistributionChart summary={summary} />

        {/* Examination Marks Score Sheet */}
        <FacultyMarksEntrySheet
          entries={entries}
          summary={summary}
          examName={examName}
          isSaving={isSaving}
          isPublished={isPublished}
          onScoreChange={updateEntryScore}
          onFeedbackChange={updateEntryFeedback}
          onSaveMarks={saveMarks}
          onExamChange={setExamName}
          onDismissPublishNotice={() => setIsPublished(false)}
        />
      </div>
    </PageContainer>
  );
};
