/**
 * Student ERP — StudentAttendanceLogsTable Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Renders verified classroom attendance sessions with four-status filtering.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { StudentAttendanceSessionLog } from '@/services/mockService';
import type { AttendanceStatus } from '@/types';
import { ATTENDANCE_BADGE_CLASSES, formatDateIndian } from '@/utils';
import { Filter } from 'lucide-react';

interface StudentAttendanceLogsTableProps {
  logs: StudentAttendanceSessionLog[];
  statusFilter: AttendanceStatus | 'ALL';
  onFilterChange: (status: AttendanceStatus | 'ALL') => void;
}

export const StudentAttendanceLogsTable: React.FC<StudentAttendanceLogsTableProps> = ({
  logs,
  statusFilter,
  onFilterChange,
}) => {
  const filterOptions: Array<{ key: AttendanceStatus | 'ALL'; label: string }> = [
    { key: 'ALL', label: 'All Sessions' },
    { key: 'PRESENT', label: 'Present' },
    { key: 'ON_DUTY', label: 'On Duty' },
    { key: 'LEAVE', label: 'Approved Leave' },
    { key: 'ABSENT', label: 'Absent' },
  ];

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
            Verified Classroom Attendance Logs
          </CardTitle>
          <CardDescription>
            Official faculty-verified session attendance records across periods
          </CardDescription>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onFilterChange(opt.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
                statusFilter === opt.key
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date (DD/MM/YYYY)</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Subject Teacher</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Remarks / Approver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No session logs found matching the selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {formatDateIndian(log.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {log.subject}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {log.period}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {log.faculty}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ATTENDANCE_BADGE_CLASSES[log.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.status === 'PRESENT'
                          ? 'Present'
                          : log.status === 'ON_DUTY'
                          ? 'On Duty'
                          : log.status === 'LEAVE'
                          ? 'Approved Leave'
                          : 'Absent'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {log.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
