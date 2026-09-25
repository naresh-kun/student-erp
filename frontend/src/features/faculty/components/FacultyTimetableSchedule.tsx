/**
 * Student ERP — FacultyTimetableSchedule Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the faculty instructional routine:
 * - Weekly timetable (Monday–Friday)
 * - Period-by-period Indian school structure (Period 1 to Period 8)
 * - Session types: Class Lecture, Faculty Planning, Remedial Support, Practical/Lab
 * - Workload: 24 teaching periods/week
 * - ZERO university credit-hour or GPA concepts.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, MapPin, Layers } from 'lucide-react';
import type { FacultyTimetableEntry } from '../types';

interface FacultyTimetableScheduleProps {
  timetable: FacultyTimetableEntry[];
  selectedDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  onSelectDay: (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday') => void;
  weeklyWorkload?: number;
}

export const FacultyTimetableSchedule: React.FC<FacultyTimetableScheduleProps> = ({
  timetable,
  selectedDay,
  onSelectDay,
  weeklyWorkload = 24,
}) => {
  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const currentSlots = timetable.filter((s) => s.day === selectedDay);

  const getSessionTypeBadge = (type: string) => {
    switch (type) {
      case 'Class Lecture':
        return <Badge variant="default" className="text-[10px] bg-blue-900 text-white font-semibold">Class Lecture</Badge>;
      case 'Faculty Planning':
        return <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-700 dark:text-slate-300">Faculty Planning</Badge>;
      case 'Remedial Support':
        return <Badge variant="warning" className="text-[10px] font-semibold">Remedial Support</Badge>;
      case 'Practical / Lab':
        return <Badge variant="info" className="text-[10px] font-semibold">Math Practical / Lab</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Day Selector Tabs & Workload Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2 overflow-x-auto">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedDay === day
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <Badge variant="outline" className="text-xs font-semibold self-start sm:self-auto border-blue-300 text-blue-800 dark:text-blue-300">
          <Layers className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Weekly Workload: {weeklyWorkload} Teaching Periods
        </Badge>
      </div>

      {/* Period Slots List */}
      <div className="space-y-3">
        {currentSlots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            No instructional periods scheduled for {selectedDay}.
          </div>
        ) : (
          currentSlots.map((slot) => (
            <Card
              key={slot.id}
              className="p-4 hover:border-blue-300 dark:hover:border-blue-900 transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Prd</span>
                    <span className="text-sm font-black leading-none">{slot.period_number}</span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {slot.subject}
                      </h4>
                      {slot.class_name !== '—' && (
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          ({slot.class_name} — {slot.section_name})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Room: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong>
                      </span>
                      {slot.stream && (
                        <span>
                          Stream: <strong className="text-slate-700 dark:text-slate-300">{slot.stream}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {getSessionTypeBadge(slot.session_type)}
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {slot.time}
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
