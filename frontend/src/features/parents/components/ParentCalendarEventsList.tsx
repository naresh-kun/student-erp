/**
 * Student ERP — ParentCalendarEventsList Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { ParentCalendarEvent } from '../types';

interface ParentCalendarEventsListProps {
  events: ParentCalendarEvent[];
}

export const ParentCalendarEventsList: React.FC<ParentCalendarEventsListProps> = ({
  events = [],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((e) => {
        const isPtm = e.category === 'PTM';
        const isExam = e.category === 'Examination';
        const isHoliday = e.category === 'Holiday';

        return (
          <Card
            key={e.id}
            className={`p-5 flex flex-col justify-between space-y-3.5 border shadow-sm transition-all hover:shadow-md ${
              isPtm
                ? 'border-blue-300 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/10'
                : isExam
                ? 'border-indigo-300 dark:border-indigo-900'
                : isHoliday
                ? 'border-amber-300 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  variant={isPtm ? 'default' : isHoliday ? 'warning' : isExam ? 'destructive' : 'info'}
                  className="text-[10px]"
                >
                  {e.category}
                </Badge>

                <span className="text-xs font-mono font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{e.date}</span>
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {e.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {e.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{e.time}</span>
              </span>

              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{e.location}</span>
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
