/**
 * Student ERP — Admin Attendance Oversight Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE & FORMULA ENFORCEMENT:
 * - Canonical 4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * - Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100.
 * - LEAVE counts as absence in the formula denominator.
 * - LEAVE is visually distinct (violet/purple) from unapproved ABSENT (rose/red).
 * - Master Plan Amendment 2 strictly adhered to.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminAttendanceOverviewItem } from '../types';
import { calculateAttendancePercentage } from '@/utils';
import { ShieldCheck } from 'lucide-react';

export const AttendanceOversight: React.FC = () => {
  const [logs, setLogs] = useState<AdminAttendanceOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getAttendanceOverview();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance oversight');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading school attendance oversight logs..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // Aggregate stats across logged sections
  const totalStudents = logs.reduce((sum, l) => sum + l.total_students, 0);
  const totalPresent = logs.reduce((sum, l) => sum + l.present_count, 0);
  const totalOnDuty = logs.reduce((sum, l) => sum + l.on_duty_count, 0);
  const totalLeave = logs.reduce((sum, l) => sum + l.leave_count, 0);
  const totalAbsent = logs.reduce((sum, l) => sum + l.absent_count, 0);

  const aggregateRate = calculateAttendancePercentage({
    present: totalPresent,
    absent: totalAbsent,
    onDuty: totalOnDuty,
    leave: totalLeave,
  });

  return (
    <div className="space-y-6">
      {/* Policy Reconciliation Header */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Master Plan Amendment 2 — Canonical 4-Status Attendance Oversight</span>
          </div>
          <p className="text-slate-500">
            Formula: <strong>(PRESENT + ON_DUTY) / Total Sessions × 100</strong>. LEAVE is approved by Class Teacher and counts in the absence denominator.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Session Date: 2026-09-24
        </Badge>
      </Card>

      {/* Aggregate Presence KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-600 col-span-2 sm:col-span-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">School Aggregate Rate</span>
          <span className="text-xl font-black text-blue-700 dark:text-blue-400 block mt-0.5">{aggregateRate}%</span>
          <span className="text-[10px] text-slate-400">Total: {totalStudents} Students</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">PRESENT</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{totalPresent}</span>
          <span className="text-[10px] text-emerald-700 font-medium">In-class presence</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">ON DUTY</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{totalOnDuty}</span>
          <span className="text-[10px] text-blue-700 font-medium">Institutional duty</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-violet-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">APPROVED LEAVE</span>
          <span className="text-xl font-black text-violet-600 block mt-0.5">{totalLeave}</span>
          <span className="text-[10px] text-violet-700 font-medium">Sanctioned absence</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">UNAPPROVED ABSENT</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{totalAbsent}</span>
          <span className="text-[10px] text-rose-700 font-medium">Unexcused absence</span>
        </Card>
      </div>

      {/* Class & Section Audit Table */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Section Attendance Audit Register
            </CardTitle>
            <CardDescription className="text-xs">
              Daily period roll-calls submitted by assigned class teachers and subject faculty
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono">
            {logs.length} Sections Audited
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">On Duty</th>
                  <th className="py-3 px-4 text-center">Leave</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4">Class Teacher / Verified By</th>
                  <th className="py-3 px-4">Session State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{row.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {row.class_name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{row.total_students}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-600 font-bold">{row.present_count}</td>
                    <td className="py-3 px-4 text-center font-mono text-blue-600 font-bold">{row.on_duty_count}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        {row.leave_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-rose-600 font-bold">{row.absent_count}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold ${row.attendance_percentage >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {row.attendance_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{row.verified_by}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" className="text-[10px]">
                        {row.session_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
