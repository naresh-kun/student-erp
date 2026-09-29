/**
 * Student ERP — StudentAttendanceSummary Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Master Plan Amendment 2 — Canonical Four-Status Attendance Summary
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { StudentAttendanceStatSummary } from '../types';
import { 
  CalendarCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  XCircle 
} from 'lucide-react';

interface StudentAttendanceSummaryProps {
  stats: StudentAttendanceStatSummary;
}

export const StudentAttendanceSummary: React.FC<StudentAttendanceSummaryProps> = ({ stats }) => {
  return (
    <div className="space-y-4">
      {/* Canonical Attendance Status Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Overall Attendance */}
        <Card className="p-3.5 bg-white dark:bg-slate-900 border-l-4 border-l-blue-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Overall Attendance
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-950 dark:text-blue-100">
              {stats.overallPercentage.toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            {stats.presentCount + stats.onDutyCount} / {stats.totalSessions} Sessions
          </span>
          <span className="text-[10px] text-blue-800 dark:text-blue-300 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> (P + OD) / Total
          </span>
        </Card>

        {/* 2. Present */}
        <Card className="p-3.5 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Present
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
              {stats.presentCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Sessions</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Regular Classroom
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Counts as attendance
          </span>
        </Card>

        {/* 3. On Duty */}
        <Card className="p-3.5 bg-white dark:bg-slate-900 border-l-4 border-l-sky-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              On Duty (OD)
            </span>
            <div className="w-7 h-7 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-800 dark:text-sky-300">
              {stats.onDutyCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Sessions</span>
          </div>
          <span className="text-[11px] text-sky-700 font-medium mt-1 block">
            Official School Duty
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Counts as attendance
          </span>
        </Card>

        {/* 4. Approved Leave */}
        <Card className="p-3.5 bg-white dark:bg-slate-900 border-l-4 border-l-purple-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Approved Leave
            </span>
            <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-800 dark:text-purple-300">
              {stats.leaveCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Sessions</span>
          </div>
          <span className="text-[11px] text-purple-700 font-medium mt-1 block">
            Sanctioned by Teacher
          </span>
          <span className="text-[10px] text-purple-600/80 mt-1 block">
            Sanctioned absence
          </span>
        </Card>

        {/* 5. Absent */}
        <Card className="p-3.5 bg-white dark:bg-slate-900 border-l-4 border-l-rose-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Absent
            </span>
            <div className="w-7 h-7 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {stats.absentCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Sessions</span>
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block">
            Unexcused Absence
          </span>
          <span className="text-[10px] text-rose-500/80 mt-1 block">
            Unsanctioned absence
          </span>
        </Card>
      </div>

      {/* Institutional Clearance Notice Banner */}
      <div className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
        stats.clearedForExams 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200' 
          : 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          {stats.clearedForExams ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          )}
          <span>
            {stats.clearedForExams 
              ? 'Institutional Board Examination Clearance: CLEARED (Attendance exceeds the mandatory 85% requirement).'
              : 'Institutional Warning: Attendance is below 85%. Remedial attendances required for board examination hall ticket clearance.'
            }
          </span>
        </div>
        <Badge variant={stats.clearedForExams ? 'success' : 'warning'} className="self-start sm:self-center text-[10px]">
          {stats.clearedForExams ? 'Hall Ticket Cleared' : 'Action Required'}
        </Badge>
      </div>
    </div>
  );
};
