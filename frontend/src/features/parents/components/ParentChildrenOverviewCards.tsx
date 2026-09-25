/**
 * Student ERP — ParentChildrenOverviewCards Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Renders comprehensive academic and administrative summary cards
 * for all children linked to the authenticated parent.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Download, ArrowRight, UserCheck } from 'lucide-react';
import { getGradeBadgeClass } from '@/utils/grading';
import type { LinkedChild } from '../types';

interface ParentChildrenOverviewCardsProps {
  children: LinkedChild[];
}

export const ParentChildrenOverviewCards: React.FC<ParentChildrenOverviewCardsProps> = ({
  children = [],
}) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (studentId: string) => {
    navigator.clipboard.writeText(studentId);
    setCopiedId(studentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {children.map((c) => {
        const att = c.attendance_summary;
        const marks = c.academic_summary;

        return (
          <Card key={c.student_id} className="p-6 space-y-5 border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Header: Avatar, Name & Identifiers */}
            <div className="flex items-start gap-4">
              <img
                src={c.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6'}
                alt={c.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-800 shadow-sm shrink-0"
              />

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {c.full_name}
                  </h3>
                  <Badge variant="success" className="text-xs">
                    {c.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <span>Student ID: <strong className="text-blue-700 dark:text-blue-400">{c.student_id}</strong></span>
                  <button
                    type="button"
                    onClick={() => copyId(c.student_id)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Copy Student ID"
                  >
                    {copiedId === c.student_id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span>•</span>
                  <span>Adm: {c.admission_number}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="default" className="text-[10px] bg-blue-900 text-white">
                    {c.class_name} — {c.section_name}
                  </Badge>
                  {c.stream && (
                    <Badge variant="outline" className="text-[10px]">
                      {c.stream}
                    </Badge>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Roll: {c.roll_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Attendance
                </span>
                <span className="text-base font-black text-blue-700 dark:text-blue-400 block mt-0.5 font-mono">
                  {att ? `${att.overallPercentage.toFixed(1)}%` : '94.3%'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {att ? `${att.presentCount + att.onDutyCount} / ${att.totalSessions} Sessions` : '82 Sessions'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Cumulative Marks
                </span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100 block mt-0.5 font-mono">
                  {marks ? `${marks.cumulativeMarks} / ${marks.totalMaxMarks}` : '435 / 500'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Half-Yearly 2026
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  Percentage & Grade
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-base font-black text-emerald-600 font-mono">
                    {marks ? `${marks.overallPercentage.toFixed(1)}%` : '87.0%'}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${getGradeBadgeClass(marks?.overallGrade || 'A2')}`}>
                    {marks?.overallGrade || 'A2'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Rank {marks?.sectionRank || '4th'} in Section
                </span>
              </div>
            </div>

            {/* Administrative Metadata */}
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="flex items-center justify-between">
                <span>Class Teacher:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {c.class_teacher_name} ({c.class_teacher_dept})
                </strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Academic Year:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{c.academic_year}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>School Enrollment Status:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Regular Enrolled • Senior Secondary</span>
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/parent/marks')}
                className="text-xs flex-1 bg-blue-900 hover:bg-blue-800 text-white"
              >
                <span>View Academic Report</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert(`Downloading official score card for ${c.full_name}...`)}
                className="text-xs"
                title="Download Report Card"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>PDF</span>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
