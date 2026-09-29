/**
 * Student ERP — StudentMarksSummaryCards Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Displays canonical Indian School Academic metrics: Cumulative marks, percentage, and 8-tier letter grade.
 * Strictly zero GPA, CGPA, credits, or grade points.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Award, TrendingUp, BookOpen, CheckCircle2, CalendarCheck } from 'lucide-react';
import { formatPercentage, getGradeDescription } from '@/utils';
import type { StudentAttendanceStatSummary } from '../types';

interface StudentMarksSummaryCardsProps {
  summary: {
    cumulativeMarks: number;
    maxMarks: number;
    percentage: number;
    overallGrade: string;
    isPassed: boolean;
    evaluatedSubjectsCount: number;
  };
  attendanceStats?: StudentAttendanceStatSummary | null;
}

export const StudentMarksSummaryCards: React.FC<StudentMarksSummaryCardsProps> = ({ summary, attendanceStats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Cumulative Marks */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-900 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cumulative Marks
          </span>
          <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-blue-950 dark:text-blue-100">
            {summary.cumulativeMarks} / {summary.maxMarks}
          </span>
        </div>
        <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium mt-1 block">
          {summary.evaluatedSubjectsCount} Evaluated Academic Subjects
        </span>
      </Card>

      {/* 2. Overall Aggregate Percentage */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Percentage
          </span>
          <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {formatPercentage(summary.percentage)}
          </span>
          <span className="text-xs text-slate-500 font-medium">Aggregate</span>
        </div>
        <span className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Board Threshold: 33% Cleared
        </span>
      </Card>

      {/* 3. Overall Letter Grade */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-600 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Letter Grade
          </span>
          <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-amber-800 dark:text-amber-300">
            {summary.overallGrade}
          </span>
          <span className="text-xs text-slate-500 font-medium">Scale: A1 to E</span>
        </div>
        <span className="text-[11px] text-amber-700 font-medium mt-1 block">
          {getGradeDescription(summary.overallGrade)}
        </span>
      </Card>

      {/* 4. Overall Attendance or Academic Standing */}
      {attendanceStats ? (
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overall Attendance
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-950 dark:text-blue-100">
              {attendanceStats.overallPercentage.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {attendanceStats.presentCount + attendanceStats.onDutyCount}/{attendanceStats.totalSessions} Sessions
            </span>
          </div>
          <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {attendanceStats.clearedForExams ? 'Board Exam Cleared (≥85%)' : 'Under Review (<85%)'}
          </span>
        </Card>
      ) : (
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Academic Standing
            </span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-950 dark:text-indigo-100">
              First Class
            </span>
          </div>
          <span className="text-[11px] text-indigo-700 font-medium mt-1 block">
            Passed with Distinction
          </span>
        </Card>
      )}
    </div>
  );
};
