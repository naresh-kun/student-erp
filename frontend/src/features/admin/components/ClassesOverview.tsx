/**
 * Student ERP — Admin Classes & Sections Hierarchy Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Academic Year -> Grade/Class -> Stream (Grades 11-12) -> Section -> Students.
 * - Grades below 11: No stream.
 * - Grades 11-12: 4 approved streams (Computer Science A, Bio-Maths B, Commerce C, Pure Science D).
 * - No university department/degree terminology.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminClassHierarchyItem } from '../types';
import { School, Users, DoorOpen } from 'lucide-react';

export const ClassesOverview: React.FC = () => {
  const [classes, setClasses] = useState<AdminClassHierarchyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getClassesAndSections();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load school classes and sections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading school classes, sections, and stream hierarchy..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadClasses} />;
  }

  return (
    <div className="space-y-6">
      {/* Structure Guide Card */}
      <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200">
            <School className="w-4 h-4 text-blue-700" />
            <span>CBSE School Academic Structure (Session 2026–27)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Academic Year → Grade → Stream (Senior Secondary) → Section. Secondary grades follow core common curriculum without stream tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-mono border-blue-300 text-blue-900 dark:text-blue-300">
            4 Approved Streams
          </Badge>
          <Badge variant="outline" className="text-[11px] font-mono border-blue-300 text-blue-900 dark:text-blue-300">
            {classes.length} Class Entities
          </Badge>
        </div>
      </Card>

      {/* Class Hierarchy Cards */}
      <div className="space-y-5">
        {classes.map((cls) => (
          <Card key={cls.id} className="shadow-sm border border-slate-200 dark:border-slate-800">
            <CardHeader className="py-3.5 px-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-base text-slate-900 dark:text-slate-100">{cls.name}</span>
                  {cls.stream ? (
                    <Badge variant="default" className="text-[10px] bg-blue-900 text-white">
                      Stream: {cls.stream}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Secondary Core (No Stream)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Class Code: <strong className="font-mono text-slate-700 dark:text-slate-300">{cls.code}</strong></span>
                  <span>•</span>
                  <span>Class Teacher: <strong className="text-slate-700 dark:text-slate-300">{cls.class_teacher_name}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Enrollment</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {cls.total_enrolled} / {cls.total_capacity} Capacity
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cls.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{sec.name}</span>
                      <Badge
                        variant={sec.enrolled_count >= sec.capacity ? 'warning' : 'outline'}
                        className="text-[10px]"
                      >
                        {sec.enrolled_count}/{sec.capacity} Enrolled
                      </Badge>
                    </div>

                    <div className="space-y-1 text-slate-500 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Classroom: <strong>{sec.room}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Capacity Intake: <strong>{sec.capacity - sec.enrolled_count} seats vacant</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
