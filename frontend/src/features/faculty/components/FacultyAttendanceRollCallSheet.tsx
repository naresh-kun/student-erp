/**
 * Student ERP — FacultyAttendanceRollCallSheet Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the session roll call sheet across Master Plan Amendment 2 rules:
 * - 4 Canonical Statuses: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * - LEAVE: Approved absence by Class Teacher / Faculty (counts in denominator as absence).
 * - ON_DUTY: Authorized institutional duty (counts in numerator & denominator as present).
 * - Formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 * - Shared utility: calculateAttendancePercentage from src/utils/attendance.ts
 * - "Mark All Present" canonical action
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Check, 
  Save, 
  CheckCircle2, 
  CalendarCheck, 
  AlertCircle 
} from 'lucide-react';
import type { AttendanceStatus } from '@/types';
import type { AttendanceRollCallItem, AttendanceSessionContext } from '../types';

interface FacultyAttendanceRollCallSheetProps {
  context: AttendanceSessionContext;
  records: AttendanceRollCallItem[];
  counts: { present: number; onDuty: number; leave: number; absent: number; total: number };
  attendancePercentage: number;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onSubmitSession: () => void;
  onEditSession?: () => void;
}

export const FacultyAttendanceRollCallSheet: React.FC<FacultyAttendanceRollCallSheetProps> = ({
  context,
  records,
  counts,
  attendancePercentage,
  isSubmitting,
  isSubmitted,
  onStatusChange,
  onMarkAllPresent,
  onSubmitSession,
  onEditSession,
}) => {
  const statusButtons: Array<{
    status: AttendanceStatus;
    label: string;
    activeClass: string;
    badgeVariant: 'success' | 'info' | 'warning' | 'destructive';
  }> = [
    { status: 'PRESENT', label: 'Present', activeClass: 'bg-emerald-600 text-white shadow-sm', badgeVariant: 'success' },
    { status: 'ON_DUTY', label: 'On Duty', activeClass: 'bg-blue-600 text-white shadow-sm', badgeVariant: 'info' },
    { status: 'LEAVE', label: 'Approved Leave', activeClass: 'bg-amber-600 text-white shadow-sm', badgeVariant: 'warning' },
    { status: 'ABSENT', label: 'Absent', activeClass: 'bg-rose-600 text-white shadow-sm', badgeVariant: 'destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* Session State Banner */}
      {isSubmitted && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Attendance Register Formally Recorded & Submitted</p>
              <p className="text-emerald-700 dark:text-emerald-400">
                Session: <strong>{context.class_display}</strong> • Period: <strong>{context.period}</strong> • Date: <strong>{context.date}</strong>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditSession}
            className="text-xs h-8 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900 self-end sm:self-auto"
          >
            Edit Recorded Register
          </Button>
        </div>
      )}

      {/* KPI Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Present</span>
          <span className="text-2xl font-black text-emerald-600 block mt-0.5">{counts.present}</span>
          <span className="text-[10px] text-slate-400">Attended Classroom</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">On Duty</span>
          <span className="text-2xl font-black text-blue-600 block mt-0.5">{counts.onDuty}</span>
          <span className="text-[10px] text-slate-400">Sanctioned Duty (Present)</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-amber-500 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Approved Leave</span>
          <span className="text-2xl font-black text-amber-600 block mt-0.5">{counts.leave}</span>
          <span className="text-[10px] text-slate-400">Faculty-approved (Absence)</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Absent</span>
          <span className="text-2xl font-black text-rose-600 block mt-0.5">{counts.absent}</span>
          <span className="text-[10px] text-slate-400">Unapproved absence</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-semibold">Attendance Rate</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
            {attendancePercentage}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({counts.present + counts.onDuty}/{counts.total})
          </span>
        </Card>
      </div>

      {/* Main Roll Call Sheet Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {context.class_display} — {context.period}
                </CardTitle>
                <Badge
                  variant={
                    context.session_state === 'Marked'
                      ? 'success'
                      : context.session_state === 'In Progress'
                      ? 'warning'
                      : 'outline'
                  }
                  className="text-xs"
                >
                  {context.session_state}
                </Badge>
              </div>

              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Date: <strong>{context.date}</strong> • Academic Year: <strong>{context.academic_year}</strong> • Subject:{' '}
                <strong>{context.subject}</strong>
              </CardDescription>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllPresent}
                className="text-xs h-8 border-slate-300 dark:border-slate-700"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Mark All Present
              </Button>

              <Button
                variant="default"
                size="sm"
                disabled={isSubmitting}
                onClick={onSubmitSession}
                className="text-xs h-8 bg-blue-900 hover:bg-blue-800 text-white shadow-sm"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSubmitting ? 'Submitting...' : 'Submit Register'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Historical Attendance</th>
                  <th className="py-2.5 px-3">Sanction Note</th>
                  <th className="py-2.5 px-3 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((student) => (
                  <tr key={student.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {student.roll_number}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {student.student_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {student.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {student.historical_rate}%
                    </td>
                    <td className="py-2.5 px-3">
                      {student.status === 'LEAVE' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{student.leave_reason || 'Approved Medical Leave'}</span>
                        </span>
                      ) : student.status === 'ON_DUTY' ? (
                        <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                          Authorized School Duty
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {statusButtons.map((btn) => {
                          const isSelected = student.status === btn.status;
                          return (
                            <button
                              key={btn.status}
                              type="button"
                              onClick={() => onStatusChange(student.student_id, btn.status)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? btn.activeClass
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
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
