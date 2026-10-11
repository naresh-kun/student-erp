/**
 * Student ERP — FacultyKPIOverview Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 * Phase 5 — Task 5.7: Acceptance Correction — Explicit Handling of Genuine Zero vs Missing/Loading/Error
 *
 * Professional academic metrics cards:
 * 1. Assigned Classes & Enrolled Students
 * 2. Today's Teaching Routine (Periods Logged vs Pending)
 * 3. Pending Leave Requests (Class Teacher Review)
 * 4. Weekly Workload (CBSE 24 Periods Norm)
 *
 * STRICT NON-EVALUATIVE GOVERNANCE:
 * - Strictly NO faculty ratings, reviews, rankings, appraisal scores, or teacher comparison metrics.
 * - Genuine zeroes (0 classes, 0 students, 0 periods) are faithfully preserved when confirmed by API.
 * - Missing, loading, or unverified data displays clear unavailable/loading indicators ('—') rather than silent fabricated zeroes.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Users, Clock, AlertCircle, BookCheck } from 'lucide-react';

export interface FacultyKPIOverviewProps {
  assignedClassesCount?: number | null;
  enrolledStudentsCount?: number | null;
  todayPeriodsCount?: number | null;
  periodsLoggedCount?: number | null;
  pendingLeavesCount?: number | null;
  weeklyWorkload?: number | null;
  isLoading?: boolean;
  onViewLeaves?: () => void;
}

const formatCount = (val?: number | null, suffix?: string): string => {
  if (typeof val === 'number' && !Number.isNaN(val)) {
    return suffix ? `${val} ${suffix}` : `${val}`;
  }
  return suffix ? `— ${suffix}` : '—';
};

export const FacultyKPIOverview: React.FC<FacultyKPIOverviewProps> = ({
  assignedClassesCount,
  enrolledStudentsCount,
  todayPeriodsCount,
  periodsLoggedCount,
  pendingLeavesCount,
  weeklyWorkload,
  isLoading = false,
  onViewLeaves,
}) => {
  const isRoutineKnown = typeof todayPeriodsCount === 'number' && typeof periodsLoggedCount === 'number';
  const pendingPeriods = isRoutineKnown
    ? Math.max(0, (todayPeriodsCount as number) - (periodsLoggedCount as number))
    : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="faculty-kpi-overview">
      {/* 1. Assigned Classes */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm" data-testid="kpi-assigned-classes">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Assigned Classes
          </span>
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        {isLoading ? (
          <div className="my-2 h-7 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" data-testid="skeleton-classes" />
        ) : (
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block mt-1" data-testid="stat-classes-count">
            {formatCount(assignedClassesCount, 'Classes')}
          </span>
        )}
        <span className="text-[11px] text-slate-500 font-medium" data-testid="stat-enrolled-count">
          {isLoading ? (
            <span className="inline-block h-3.5 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          ) : (
            formatCount(enrolledStudentsCount, 'Enrolled Students')
          )}
        </span>
      </Card>

      {/* 2. Today's Periods Routine */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 shadow-sm" data-testid="kpi-today-periods">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Today's Periods
          </span>
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        {isLoading ? (
          <div className="my-2 h-7 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" data-testid="skeleton-periods" />
        ) : (
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1" data-testid="stat-periods-count">
            {formatCount(todayPeriodsCount, 'Periods')}
          </span>
        )}
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400" data-testid="stat-routine-status">
          {isLoading ? (
            <span className="inline-block h-3.5 w-28 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          ) : isRoutineKnown ? (
            `${periodsLoggedCount} Logged • ${pendingPeriods} Pending`
          ) : typeof periodsLoggedCount === 'number' ? (
            `${periodsLoggedCount} Logged • — Pending`
          ) : (
            <span className="text-slate-400 font-normal">Schedule Unavailable</span>
          )}
        </span>
      </Card>

      {/* 3. Pending Leave Reviews */}
      <Card
        onClick={onViewLeaves}
        className={`p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 shadow-sm ${
          onViewLeaves ? 'cursor-pointer hover:bg-slate-50/80 transition-colors' : ''
        }`}
        data-testid="kpi-leave-reviews"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Leave Reviews
          </span>
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        {isLoading ? (
          <div className="my-2 h-7 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" data-testid="skeleton-leaves" />
        ) : (
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block mt-1" data-testid="stat-leaves-count">
            {formatCount(pendingLeavesCount, 'Pending')}
          </span>
        )}
        <span className="text-[11px] text-slate-500 font-medium" data-testid="stat-leaves-status">
          {isLoading ? (
            <span className="inline-block h-3.5 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          ) : typeof pendingLeavesCount === 'number' ? (
            pendingLeavesCount === 0 ? 'No pending leave actions' : 'Class Teacher Action Required'
          ) : (
            'Review status unavailable'
          )}
        </span>
      </Card>

      {/* 4. Weekly Workload */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600 shadow-sm" data-testid="kpi-weekly-workload">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Weekly Workload
          </span>
          <BookCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        {isLoading ? (
          <div className="my-2 h-7 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" data-testid="skeleton-workload" />
        ) : (
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1" data-testid="stat-workload-count">
            {formatCount(weeklyWorkload, 'Periods')}
          </span>
        )}
        <span className="text-[11px] text-slate-500 font-medium" data-testid="stat-workload-status">
          {isLoading ? (
            <span className="inline-block h-3.5 w-28 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          ) : typeof weeklyWorkload === 'number' ? (
            'CBSE Senior Secondary Standard'
          ) : (
            'Workload unavailable'
          )}
        </span>
      </Card>
    </div>
  );
};
