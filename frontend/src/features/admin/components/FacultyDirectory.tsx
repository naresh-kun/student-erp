/**
 * Student ERP — Admin Faculty Master Directory Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE & NON-EVALUATIVE ARCHITECTURE:
 * - Faculty records are purely descriptive and operational.
 * - Displays: Employee Code, Designation, Department, Assigned Subjects,
 *   Class Teacher roles, Assigned Classes, and Weekly Workload Periods.
 * - STRICTLY NO: Performance ratings, review scores, appraisal stars,
 *   teacher rankings, teaching-performance leaderboards, or AI evaluations.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminFacultyItem } from '../types';
import { Search, GraduationCap, Clock } from 'lucide-react';

export const FacultyDirectory: React.FC = () => {
  const [faculty, setFaculty] = useState<AdminFacultyItem[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaculty = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getFaculty(search, department);
      setFaculty(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [search, department]);

  if (isLoading && faculty.length === 0) {
    return <LoadingState message="Loading academic faculty directory..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadFaculty} />;
  }

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty name, employee code, subject, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Departments</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physics">Physics</option>
              <option value="English & Languages">English & Languages</option>
              <option value="Chemistry">Chemistry</option>
            </select>
            <Badge variant="outline" className="text-xs font-mono text-slate-600">
              {faculty.length} Faculty Members
            </Badge>
          </div>
        </div>
      </Card>

      {/* Faculty Cards / Table */}
      {faculty.length === 0 ? (
        <EmptyState title="No faculty members found" description="Try searching with a different staff name, code, or department." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faculty.map((f) => (
            <Card key={f.id} className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Staff Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {f.first_name[0]}{f.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{f.name}</h3>
                      <span className="text-xs text-slate-500 font-medium block">
                        {f.designation} • {f.department}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    {f.status}
                  </Badge>
                </div>

                {/* Qualification & Employee Code */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    Code: {f.employee_code}
                  </span>
                  <span className="text-[11px] text-slate-500">{f.qualification}</span>
                </div>

                {/* Assigned Roles & Class Teacher */}
                <div className="space-y-1.5 text-xs">
                  {f.class_teacher_of ? (
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-semibold flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                      <span>Class Teacher: {f.class_teacher_of}</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-[11px]">
                      General Subject Faculty (No Class Teacher Assignment)
                    </div>
                  )}

                  {/* Assigned Classes */}
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Teaching Allocations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {f.assigned_classes.map((cls) => (
                        <Badge key={cls} variant="outline" className="text-[10px] bg-white dark:bg-slate-900">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workload & Contact */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workload: <strong>{f.weekly_periods} Periods / week</strong></span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{f.email}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
