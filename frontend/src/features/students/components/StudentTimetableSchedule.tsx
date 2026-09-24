/**
 * Student ERP — StudentTimetableSchedule Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Day-by-day timetable schedule grid with period blocks and laboratory rooms.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';

interface PeriodSlot {
  period: string;
  subject: string;
  teacher: string;
  room: string;
  type: string;
}

interface StudentTimetableScheduleProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  periods: PeriodSlot[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const StudentTimetableSchedule: React.FC<StudentTimetableScheduleProps> = ({
  selectedDay,
  onSelectDay,
  periods,
}) => {
  return (
    <div className="space-y-4">
      {/* Day Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all shrink-0 ${
                selectedDay === day
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {day} {day === 'Monday' && <span className="ml-1 text-[10px] opacity-80">(Today)</span>}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="text-xs shrink-0 hidden sm:inline-flex">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download Timetable
        </Button>
      </div>

      {/* Selected Day Schedule Cards */}
      <div className="space-y-3">
        {periods.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No periods scheduled for {selectedDay}.
          </div>
        ) : (
          periods.map((slot, idx) => (
            <Card
              key={idx}
              className="p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                    P{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {slot.subject}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Teacher: <strong className="text-slate-700 dark:text-slate-300">{slot.teacher}</strong> • Room: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Badge
                    variant={
                      slot.type === 'Lab'
                        ? 'info'
                        : slot.type === 'Mentorship' || slot.type === 'Activity'
                        ? 'warning'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {slot.type}
                  </Badge>
                  <span className="font-mono text-xs text-slate-500 font-semibold">
                    {slot.period.includes('(') ? slot.period.split('(')[1].replace(')', '') : slot.period}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
