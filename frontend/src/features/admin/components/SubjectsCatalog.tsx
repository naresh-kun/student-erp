/**
 * Student ERP — Admin Subjects Catalog Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - School curriculum subject catalog with Weekly Periods.
 * - STRICTLY NO: Credits, Credit Hours, or GPA weighting.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminSubjectCatalogItem } from '../types';
import { BookOpen, Clock } from 'lucide-react';

export const SubjectsCatalog: React.FC = () => {
  const [subjects, setSubjects] = useState<AdminSubjectCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getSubjectsCatalog();
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subject catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading school subjects catalog..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSubjects} />;
  }

  return (
    <div className="space-y-5">
      {/* Policy Notice */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <BookOpen className="w-4 h-4 text-blue-700" />
          <span>Curriculum Subject Matrix • Weekly Period Allocations (Non-Credit Based Indian School Model)</span>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {subjects.length} Subjects
        </Badge>
      </Card>

      {/* Catalog Table */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Academic Department</th>
                  <th className="py-3 px-4">Weekly Workload</th>
                  <th className="py-3 px-4">Applicable Grades</th>
                  <th className="py-3 px-4">Stream Applicability</th>
                  <th className="py-3 px-4">Assigned Teachers</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {sub.code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{sub.name}</span>
                      <span className="text-[11px] text-slate-400 max-w-xs block truncate mt-0.5">
                        {sub.description}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{sub.department}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sub.weekly_periods} Periods / wk</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{sub.applicable_grades}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {sub.applicable_streams}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sub.assigned_faculty_names.map((name) => (
                        <Badge key={name} variant="outline" className="text-[10px] mr-1">
                          {name}
                        </Badge>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success" className="text-[10px]">
                        {sub.status}
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
