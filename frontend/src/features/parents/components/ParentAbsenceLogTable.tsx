/**
 * Student ERP — ParentAbsenceLogTable Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Official institutional absence and approved leave audit records
 * marked and sanctioned by school faculty.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { ParentAttendanceRecord } from '../types';

interface ParentAbsenceLogTableProps {
  records: ParentAttendanceRecord[];
  childName?: string;
}

export const ParentAbsenceLogTable: React.FC<ParentAbsenceLogTableProps> = ({
  records = [],
  childName = 'Arun Kumar',
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
          Official Absence & Sanctioned Leave Log — {childName}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Verified session entries recorded by class teachers and subject faculty
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Period & Subject</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sanctioning Faculty</th>
                <th className="py-2.5 px-3">Official Remarks & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No absence records found for this student. Perfect attendance recorded.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isLeave = r.status === 'LEAVE';
                  const isOD = r.status === 'ON_DUTY';
                  const isAbsent = r.status === 'ABSENT';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {r.date}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {r.period}
                      </td>
                      <td className="py-3 px-3">
                        {isLeave && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300">
                            Approved Leave
                          </span>
                        )}
                        {isOD && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 dark:bg-sky-950/40 dark:text-sky-300">
                            On Duty (OD)
                          </span>
                        )}
                        {isAbsent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                            Unapproved Absent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {r.faculty}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs">
                        {r.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
