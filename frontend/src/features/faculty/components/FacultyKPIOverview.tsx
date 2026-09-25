/**
 * Student ERP — FacultyKPIOverview Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Professional academic metrics cards:
 * 1. Assigned Classes & Enrolled Students
 * 2. Today's Teaching Routine (Periods Logged vs Pending)
 * 3. Pending Leave Requests (Class Teacher Review)
 * 4. Weekly Workload (CBSE 24 Periods Norm)
 *
 * STRICT NON-EVALUATIVE GOVERNANCE:
 * - Strictly NO faculty ratings, reviews, rankings, appraisal scores, or teacher comparison metrics.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Users, Clock, AlertCircle, BookCheck } from 'lucide-react';

interface FacultyKPIOverviewProps {
  assignedClassesCount?: number;
  enrolledStudentsCount?: number;
  todayPeriodsCount?: number;
  periodsLoggedCount?: number;
  pendingLeavesCount?: number;
  weeklyWorkload?: number;
  onViewLeaves?: () => void;
}

export const FacultyKPIOverview: React.FC<FacultyKPIOverviewProps> = ({
  assignedClassesCount = 3,
  enrolledStudentsCount = 91,
  todayPeriodsCount = 3,
  periodsLoggedCount = 1,
  pendingLeavesCount = 2,
  weeklyWorkload = 24,
  onViewLeaves,
}) => {
  const pendingPeriods = Math.max(0, todayPeriodsCount - periodsLoggedCount);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Assigned Classes */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Assigned Classes
          </span>
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block mt-1">
          {assignedClassesCount} Classes
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          {enrolledStudentsCount} Enrolled Students
        </span>
      </Card>

      {/* 2. Today's Periods Routine */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Today's Periods
          </span>
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">
          {todayPeriodsCount} Periods
        </span>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
          {periodsLoggedCount} Logged • {pendingPeriods} Pending
        </span>
      </Card>

      {/* 3. Pending Leave Reviews */}
      <Card
        onClick={onViewLeaves}
        className={`p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 shadow-sm ${
          onViewLeaves ? 'cursor-pointer hover:bg-slate-50/80 transition-colors' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Leave Reviews
          </span>
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block mt-1">
          {pendingLeavesCount} Pending
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          Class Teacher Action Required
        </span>
      </Card>

      {/* 4. Weekly Workload */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Weekly Workload
          </span>
          <BookCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">
          {weeklyWorkload} Periods
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          CBSE Senior Secondary Standard
        </span>
      </Card>
    </div>
  );
};
