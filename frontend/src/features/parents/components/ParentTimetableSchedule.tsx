/**
 * Student ERP — ParentTimetableSchedule Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, MapPin, User } from 'lucide-react';
import type { ParentTimetableDay } from '../types';

interface ParentTimetableScheduleProps {
  days: ParentTimetableDay[];
  childName?: string;
  sectionName?: string;
}

export const ParentTimetableSchedule: React.FC<ParentTimetableScheduleProps> = ({
  days = [],
  childName: _childName = 'Arun Kumar',
  sectionName = 'Grade 11 - Section A2',
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const activeDay = days.find((d) => d.day === selectedDay) || days[0];

  return (
    <div className="space-y-4">
      {/* Day Selector Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            School Hours: 08:30 AM – 02:45 PM
          </Badge>
          <Badge variant="default" className="text-xs bg-blue-900 text-white">
            {sectionName}
          </Badge>
        </div>
      </div>

      {/* Periods Grid */}
      <div className="space-y-3">
        {!activeDay || activeDay.periods.length === 0 ? (
          <Card className="p-6 text-center text-slate-400">
            No periods scheduled for {selectedDay}.
          </Card>
        ) : (
          activeDay.periods.map((slot) => {
            const isLab = slot.type === 'Lab';
            return (
              <Card
                key={slot.period}
                className="p-4 hover:border-blue-400 dark:hover:border-blue-800 transition-colors shadow-sm bg-white dark:bg-slate-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Period Number Box */}
                    <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 flex flex-col items-center justify-center font-bold shrink-0 border border-blue-200 dark:border-blue-900">
                      <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400">Prd</span>
                      <span className="text-base leading-none">{slot.period}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {slot.subject}
                        </h3>
                        <Badge
                          variant={isLab ? 'info' : 'outline'}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {slot.type}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Faculty: <strong>{slot.faculty}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Room: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{slot.time}</span>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
