/**
 * Student ERP — ParentMarksSummaryCards Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Implements authoritative academic summary cards based on the Indian School
 * CBSE/ICSE evaluation pattern: Marks out of 100, Cumulative Marks, Percentage, 8-Tier Grade.
 * University GPA/CGPA/credits are completely purged.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { getGradeBadgeClass } from '@/utils/grading';
import { Award, BookOpen, Percent, TrendingUp } from 'lucide-react';
import type { ParentAcademicSummary } from '../types';

interface ParentMarksSummaryCardsProps {
  summary?: ParentAcademicSummary;
  childName?: string;
}

export const ParentMarksSummaryCards: React.FC<ParentMarksSummaryCardsProps> = ({
  summary,
  childName = 'Arun Kumar',
}) => {
  if (!summary) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
          Half-Yearly Academic Standing — {childName}
        </h2>
        <span className="text-[11px] font-mono text-slate-500">
          CBSE / ICSE 8-Tier Evaluation
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Cumulative Marks */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Cumulative Marks</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {summary.cumulativeMarks}
            </span>
            <span className="text-sm text-slate-400 font-mono font-medium">/ {summary.totalMaxMarks}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {summary.assessmentName}
          </p>
        </Card>

        {/* Card 2: Overall Percentage */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Overall Percentage</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {summary.overallPercentage.toFixed(2)}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Section Average: 79.40%
          </p>
        </Card>

        {/* Card 3: Overall Letter Grade (8-Tier Scale) */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Overall Letter Grade</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
              {summary.overallGrade}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getGradeBadgeClass(summary.overallGrade)}`}>
              {summary.gradeDescription}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Standard 8-Tier School Scale
          </p>
        </Card>

        {/* Card 4: Section Standing / Rank */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Section Standing</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-400 font-mono">
              {summary.sectionRank}
            </span>
            <span className="text-xs text-slate-400 font-medium">Rank</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Out of {summary.totalStudentsInSection} Enrolled Students
          </p>
        </Card>
      </div>
    </div>
  );
};
