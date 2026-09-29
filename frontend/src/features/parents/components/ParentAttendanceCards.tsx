/**
 * Student ERP — ParentAttendanceCards Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Implements the 5 canonical attendance cards adhering to Master Plan Amendment 2:
 * (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 * LEAVE is faculty-sanctioned and counts as an absence in the denominator.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Clock, CalendarX, UserX } from 'lucide-react';
import type { ParentAttendanceSummary } from '../types';

interface ParentAttendanceCardsProps {
  summary?: ParentAttendanceSummary;
  childName?: string;
}

export const ParentAttendanceCards: React.FC<ParentAttendanceCardsProps> = ({
  summary,
  childName = 'Arun Kumar',
}) => {
  if (!summary) return null;

  const isCleared = summary.clearedForExams;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
          Classroom Attendance Standing — {childName}
        </h2>
        <span className="text-[11px] font-mono text-slate-500">
          Formula: (P + OD) / Total × 100
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Overall Percentage */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Overall Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400">
              {summary.overallPercentage.toFixed(2)}%
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              {summary.presentCount + summary.onDutyCount} of {summary.totalSessions} Sessions
            </span>
            <span className={`font-semibold ${isCleared ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isCleared ? '✓ Board Clear' : '⚠ Warning'}
            </span>
          </div>
        </Card>

        {/* Card 2: Present Count */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {summary.presentCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">periods</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Physical classroom attendance
          </p>
        </Card>

        {/* Card 3: On Duty Count */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-sky-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">On Duty (OD)</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-400">
              {summary.onDutyCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">periods</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            School activities & Olympiads (counts as P)
          </p>
        </Card>

        {/* Card 4: Approved Leave (Purple/Violet Tokens) */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-purple-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase">
              Approved Leave
            </span>
            <CalendarX className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-400">
              {summary.leaveCount}
            </span>
            <span className="text-xs text-purple-500 font-medium">sanctioned</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-700 dark:text-purple-300 truncate">
            Faculty sanctioned (counts as absence)
          </p>
        </Card>

        {/* Card 5: Unapproved Absent (Rose Tokens) */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase">
              Absent
            </span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {summary.absentCount}
            </span>
            <span className="text-xs text-rose-500 font-medium">unapproved</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300 truncate">
            Unexcused absences recorded
          </p>
        </Card>
      </div>
    </div>
  );
};
