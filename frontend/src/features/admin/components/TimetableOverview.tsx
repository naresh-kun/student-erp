/**
 * Student ERP — Admin Timetable Overview Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminTimetableSlotItem } from '../types';
import { Clock } from 'lucide-react';

export const TimetableOverview: React.FC = () => {
  const [slots, setSlots] = useState<AdminTimetableSlotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getMasterTimetable();
      setSlots(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load master timetable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading master institutional timetable..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Clock className="w-4 h-4 text-blue-700" />
            <span>Master Institutional Schedule (Periods 1 through 5)</span>
          </div>
          <p className="text-slate-500">
            Daily 45-minute instruction blocks, classroom allocations, and faculty lecture assignments.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Session 2026–27
        </Badge>
      </Card>

      {/* Timetable Table */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Master Timetable Matrix
          </CardTitle>
          <Badge variant="outline" className="text-[11px] font-mono">
            {slots.length} Scheduled Periods
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                  <th className="py-3 px-4">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {slots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      Period {s.period_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {s.class_name} ({s.section_name})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.start_time} - {s.end_time}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {s.subject_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {s.faculty_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.room_number}
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
