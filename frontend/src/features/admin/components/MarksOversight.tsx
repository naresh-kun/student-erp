/**
 * Student ERP — Admin Examination Marks Oversight Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Academic scoring uses Marks /100, %, and CBSE 8-tier letter grades (A1 to E).
 * - STRICTLY NO: GPA, CGPA, credits, or grade points.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminMarksOverviewItem } from '../types';
import { Award } from 'lucide-react';

export const MarksOversight: React.FC = () => {
  const [examSummaries, setExamSummaries] = useState<AdminMarksOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getMarksOverview();
      setExamSummaries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load examination marks oversight');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading examination marks oversight..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Assessment Standard Notice */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Award className="w-4 h-4 text-blue-700" />
            <span>CBSE Senior Secondary Examination Assessment Oversight</span>
          </div>
          <p className="text-slate-500">
            All evaluations scored out of 100 marks per subject. Letter grades derived from the standard 8-tier scale (A1, A2, B1, B2, C1, C2, D, E).
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Half-Yearly Examination 2026
        </Badge>
      </Card>

      {/* Exam Summaries Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examSummaries.map((exam, idx) => (
          <Card key={idx} className="shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] bg-blue-900">
                    {exam.subject_name}
                  </Badge>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{exam.class_name}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  {exam.section_name} • {exam.exam_type} ({exam.academic_year})
                </span>
              </div>
              <Badge variant="success" className="text-[10px]">
                {exam.status}
              </Badge>
            </div>

            {/* Performance Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Batch Average</span>
                <strong className="text-sm font-mono text-blue-700 dark:text-blue-400 font-black block mt-0.5">
                  {exam.average_percentage}%
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Highest Mark</span>
                <strong className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-black block mt-0.5">
                  {exam.highest_marks} / 100
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Pass Percentage</span>
                <strong className="text-sm font-mono text-slate-800 dark:text-slate-200 font-black block mt-0.5">
                  {exam.pass_percentage}%
                </strong>
              </div>
            </div>

            {/* CBSE 8-Tier Grade Distribution */}
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">
                CBSE 8-Tier Grade Spread (Total: {exam.total_students} Students)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
                {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'] as const).map((gradeTier) => {
                  const count = exam.grade_distribution[gradeTier] || 0;
                  return (
                    <div
                      key={gradeTier}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <span className="text-[10px] font-bold text-slate-500 block">{gradeTier}</span>
                      <strong className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 block">
                        {count}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
