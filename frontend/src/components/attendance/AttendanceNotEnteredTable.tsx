import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { AllocationService } from '@/services/allocationService';
import type { AttendanceNotEnteredItem, UserRole } from '@/types';
import { Clock, AlertCircle, Calendar } from 'lucide-react';

export interface AttendanceNotEnteredTableProps {
  userRole?: UserRole;
  facultyId?: string;
  title?: string;
  description?: string;
}

export const AttendanceNotEnteredTable: React.FC<AttendanceNotEnteredTableProps> = ({
  userRole = 'Admin',
  facultyId,
  title = 'Attendance Not Entered Sessions',
  description = 'Timetable sessions for which period roll-call has not yet been submitted. Distinct from student absence.',
}) => {
  const [sessions, setSessions] = useState<AttendanceNotEnteredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AllocationService.getAttendanceNotEntered({
        userRole,
        facultyId,
        search,
        grade: gradeFilter,
        date: dateFilter || undefined,
      });
      setSessions(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userRole, facultyId, search, gradeFilter, dateFilter]);

  return (
    <div className="space-y-4">
      {/* Informational Guidance Notice */}
      <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Unmarked Timetable Sessions:</strong> These records denote scheduled teaching periods where roll-call submission remains pending. This is NOT an absentee list.
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-amber-300 text-amber-700 dark:text-amber-300">
          Status: NOT ENTERED
        </Badge>
      </div>

      {/* Control Toolbar */}
      <Card className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search by faculty, subject, or section..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by Grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Grades</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="Grade 10">Grade 10</option>
            </select>

            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by Date"
                className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <Badge variant="outline" className="text-xs font-mono text-slate-600">
              {sessions.length} Unmarked Sessions
            </Badge>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {userRole === 'Faculty' ? 'Assigned Duties Scoped' : 'School-Wide Scope'}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && sessions.length === 0 ? (
            <LoadingState message="Loading unmarked attendance sessions..." />
          ) : sessions.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="All attendance sessions entered"
                description="Zero pending attendance roll-calls found for the specified criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Grade</th>
                    <th className="py-2.5 px-4">Stream</th>
                    <th className="py-2.5 px-4">Section</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Faculty Assigned</th>
                    <th className="py-2.5 px-4 text-center">Session Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* Date */}
                      <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.date}
                      </td>

                      {/* Grade */}
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.grade_name}
                      </td>

                      {/* Stream */}
                      <td className="py-2.5 px-4">
                        {item.stream ? (
                          <Badge variant="outline" className="text-[10px]">
                            {item.stream}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">Core (No Stream)</span>
                        )}
                      </td>

                      {/* Section */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.section_name}
                      </td>

                      {/* Subject */}
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                        {item.subject_name}
                      </td>

                      {/* Period */}
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {item.period}
                      </td>

                      {/* Faculty */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.faculty_name}
                      </td>

                      {/* Session Status */}
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {item.session_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
