/**
 * Student ERP — FacultyAssignedClassesGrid Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Scopes display strictly to authorized assigned classes:
 * - Grade 11 — Computer Science A (Sec A2) [Class Teacher: R. Suresh]
 * - Grade 12 — Computer Science A (Sec A1)
 * - Grade 10 — Section A
 *
 * Prevents exposure of unrelated school classes (Commerce, Bio-Maths, etc.).
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Clock, MapPin, GraduationCap, BookOpen } from 'lucide-react';
import type { FacultyAssignedClass } from '../types';

interface FacultyAssignedClassesGridProps {
  classes: FacultyAssignedClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
}

export const FacultyAssignedClassesGrid: React.FC<FacultyAssignedClassesGridProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {classes.map((cls) => {
        const isSelected = cls.id === selectedClassId;
        return (
          <Card
            key={cls.id}
            onClick={() => onSelectClass(cls.id)}
            className={`p-4 cursor-pointer transition-all border-2 text-left relative ${
              isSelected
                ? 'border-blue-900 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {cls.class_name} — {cls.section_name}
                  </h3>
                  {cls.stream && (
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                      Stream: {cls.stream}
                    </p>
                  )}
                </div>
                {cls.is_class_teacher && (
                  <Badge variant="warning" className="text-[10px] font-bold shrink-0">
                    <GraduationCap className="w-3 h-3 mr-1" /> Class Teacher
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Subject: <strong>{cls.subject}</strong> ({cls.subject_code})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Room: <strong>{cls.room}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Workload: <strong>{cls.periods_per_week} Periods / Week</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {cls.student_count} Enrolled
                </span>
                {cls.avg_score && (
                  <span className="text-blue-700 dark:text-blue-400">
                    Class Avg: {cls.avg_score}
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
