/**
 * Student ERP — FacultyTodayScheduleCard Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Displays today's instructional periods for R. Suresh:
 * - Period timing, subject, room, enrolled count
 * - Live status badge (Register Logged vs Pending Register)
 * - Immediate CTA button to record attendance
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CalendarCheck, CheckCircle2, Clock } from 'lucide-react';
import type { FacultyTodayPeriod } from '../types';

interface FacultyTodayScheduleCardProps {
  periods: FacultyTodayPeriod[];
  onMarkAttendance?: (period: FacultyTodayPeriod) => void;
}

export const FacultyTodayScheduleCard: React.FC<FacultyTodayScheduleCardProps> = ({
  periods,
  onMarkAttendance,
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Today's Teaching Schedule & Classroom Routine
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Verified daily period assignments and register recording status
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            3 Daily Sessions
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {periods.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No teaching periods scheduled today.</p>
        ) : (
          periods.map((p, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-blue-200 dark:hover:border-blue-900"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {p.class_name} — {p.subject}
                  </span>
                  <Badge
                    variant={p.attendance_done ? 'success' : 'warning'}
                    className="text-[10px] font-semibold"
                  >
                    {p.attendance_done ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Register Logged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending Register
                      </span>
                    )}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700 dark:text-slate-300">{p.period_time}</strong> • Classroom:{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{p.room}</strong> • {p.student_count}{' '}
                  Enrolled Students
                </p>
              </div>

              <div className="self-end sm:self-center shrink-0">
                <Button
                  variant={p.attendance_done ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => onMarkAttendance?.(p)}
                  className={`text-xs ${
                    !p.attendance_done ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-sm' : ''
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
                  {p.attendance_done ? 'Review Register' : 'Mark Attendance'}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
