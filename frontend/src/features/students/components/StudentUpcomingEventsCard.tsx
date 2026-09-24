/**
 * Student ERP — StudentUpcomingEventsCard Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Displays upcoming examinations and institutional calendar events on the student dashboard.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CalendarEventItem } from '@/services/mockService';
import { Calendar as CalendarIcon, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudentUpcomingEventsCardProps {
  events: CalendarEventItem[];
  maxDisplay?: number;
}

export const StudentUpcomingEventsCard: React.FC<StudentUpcomingEventsCardProps> = ({
  events,
  maxDisplay = 3,
}) => {
  const displayEvents = events.slice(0, maxDisplay);

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case 'Examination':
        return 'destructive';
      case 'Holiday':
        return 'warning';
      case 'Academic':
        return 'default';
      default:
        return 'info';
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
            Upcoming Examinations &amp; Events
          </CardTitle>
          <CardDescription>
            Academic calendar key milestones and exam schedules
          </CardDescription>
        </div>
        <Link to="/student/calendar">
          <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-900 hover:text-blue-800">
            Calendar <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">
        {displayEvents.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No upcoming events scheduled.</p>
        ) : (
          displayEvents.map((evt, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                  {evt.title}
                </span>
                <Badge variant={getBadgeVariant(evt.category)} className="text-[10px] shrink-0 py-0">
                  {evt.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-blue-950 dark:text-blue-200 font-semibold">
                  <CalendarIcon className="w-3 h-3 text-blue-800 shrink-0" />
                  {evt.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  {evt.time}
                </span>
                {(evt.venue || evt.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {evt.venue || evt.location}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
