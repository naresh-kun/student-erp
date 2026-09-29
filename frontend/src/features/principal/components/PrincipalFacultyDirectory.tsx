/**
 * Student ERP — Principal Faculty Directory Oversight Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE & NON-EVALUATIVE ARCHITECTURE:
 * - Institutional faculty visibility for the Head of Institution.
 * - Displays: Employee Code, Designation, Department, Assigned Subjects,
 *   Class Teacher assignments, Assigned Classes & Sections, and Weekly Period Workloads.
 * - STRICTLY NO: Performance ratings, appraisal scores, teacher rankings,
 *   student feedback stars, teaching quality scores, or AI evaluations.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { PrincipalService } from '../services/principalService';
import type { PrincipalFacultyItem } from '../types';
import { Search, ShieldCheck } from 'lucide-react';

export const PrincipalFacultyDirectory: React.FC = () => {
  const [faculty, setFaculty] = useState<PrincipalFacultyItem[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaculty = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PrincipalService.getFacultyDirectory(search, department);
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
    return <LoadingState message="Loading institutional faculty directory..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadFaculty} />;
  }

  return (
    <div className="space-y-5">
      {/* Non-Evaluative Compliance Notice */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Institutional Faculty Registry & Teaching Load Oversight</span>
          </div>
          <p className="text-slate-500">
            Operational workload allocation and departmental assignments. All staff records are strictly non-evaluative without ratings or rankings.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {faculty.length} Academic Staff
        </Badge>
      </Card>

      {/* Control Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty by name, employee code, or department..."
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
          </div>
        </div>
      </Card>

      {/* Faculty Roster Table */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Employee Code</th>
                  <th className="py-3 px-4">Department & Designation</th>
                  <th className="py-3 px-4">Assigned Classes & Sections</th>
                  <th className="py-3 px-4">Teaching Subjects</th>
                  <th className="py-3 px-4 text-center">Weekly Load</th>
                  <th className="py-3 px-4">Official Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{f.name}</div>
                      <span className="text-[10px] text-slate-400">{f.qualification}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {f.employee_code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">{f.designation}</span>
                      <span className="text-[10px] text-slate-400">{f.department}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {f.assigned_classes.map((cls) => (
                          <Badge key={cls} variant="outline" className="text-[10px]">
                            {cls}
                          </Badge>
                        ))}
                      </div>
                      {f.class_teacher_of && (
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block mt-1">
                          Class Teacher: {f.class_teacher_of}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {f.assigned_subjects.map((sub) => (
                          <Badge key={sub} variant="secondary" className="text-[10px]">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {f.weekly_periods} P/wk
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{f.email}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" className="text-[10px]">
                        {f.status}
                      </Badge>
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
