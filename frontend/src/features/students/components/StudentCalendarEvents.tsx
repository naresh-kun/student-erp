/**
 * Student ERP — StudentCalendarEvents Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Filterable academic calendar event cards for student term schedule.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { CalendarEventItem } from '@/services/mockService';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

interface StudentCalendarEventsProps {
  events: CalendarEventItem[];
  filter: string;
  onFilterChange: (category: string) => void;
}

const CATEGORIES = ['All', 'Examination', 'Holiday', 'Academic', 'Meeting'];

export const StudentCalendarEvents: React.FC<StudentCalendarEventsProps> = ({
  events,
  filter,
  onFilterChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onFilterChange(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              filter === cat
                ? 'bg-blue-900 text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400 text-xs">
            No events found in this category.
          </div>
        ) : (
          events.map((evt, idx) => (
            <Card
              key={idx}
              className="p-5 flex flex-col justify-between space-y-4 hover:shadow-sm transition-shadow border-slate-200 dark:border-slate-800"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      evt.category === 'Examination'
                        ? 'destructive'
                        : evt.category === 'Holiday'
                        ? 'warning'
                        : evt.category === 'Academic'
                        ? 'default'
                        : 'info'
                    }
                    className="text-[10px]"
                  >
                    {evt.category}
                  </Badge>
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1 font-mono">
                    <CalendarIcon className="w-3.5 h-3.5" /> {evt.date}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {evt.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {evt.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {evt.venue || evt.location}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
