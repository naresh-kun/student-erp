/**
 * Student ERP — ParentSubjectAttendanceTable Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Subject-wise breakdown of attendance adhering to:
 * (Present + On Duty) / Total * 100
 * Displays clear status against CBSE/ICSE 85% clearance benchmark.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ParentSubjectAttendance } from '../types';

interface ParentSubjectAttendanceTableProps {
  subjectData: ParentSubjectAttendance[];
  childName?: string;
}

export const ParentSubjectAttendanceTable: React.FC<ParentSubjectAttendanceTableProps> = ({
  subjectData = [],
  childName = 'Arun Kumar',
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Subject-Wise Attendance Breakdown — {childName}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Classroom presence across subjects evaluated against the 85% board exam clearance requirement
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs self-start sm:self-auto font-mono">
            85% Clearance Rule
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Present (P)</th>
                <th className="py-2.5 px-3 text-center">On Duty (OD)</th>
                <th className="py-2.5 px-3 text-center text-purple-700 dark:text-purple-300">
                  Approved Leave
                </th>
                <th className="py-2.5 px-3 text-center text-rose-600">Absent</th>
                <th className="py-2.5 px-3 text-center">Total Sessions</th>
                <th className="py-2.5 px-3 text-center">Attendance %</th>
                <th className="py-2.5 px-3">Clearance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectData.map((s, idx) => {
                const isCleared = s.percentage >= 85.0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {s.subject}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-800 dark:text-slate-200">
                      {s.present}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-sky-700 dark:text-sky-400">
                      {s.onDuty}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-purple-700 dark:text-purple-300">
                      {s.leave}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {s.absent}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {s.total}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {s.percentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700 hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              isCleared ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, s.percentage))}%` }}
                          />
                        </div>
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cleared</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
          * Note: Formula: (Present + On Duty) / Total Sessions × 100. Approved Leave is sanctioned by faculty with institutional permission and counted as absence in the denominator.
        </p>
      </CardContent>
    </Card>
  );
};
