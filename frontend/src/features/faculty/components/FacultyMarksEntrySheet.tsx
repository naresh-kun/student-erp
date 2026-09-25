/**
 * Student ERP — FacultyMarksEntrySheet Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the school examination score register:
 * - Mark model: 0–100 or 'AB' (Absent)
 * - Derived Percentage & Letter Grade from authoritative src/utils/grading.ts
 * - Input validation rejects negative, >100, or invalid text
 * - Assessment summary: Class average, highest mark, pass rate, assessed count
 * - STRICT GOVERNANCE: Strictly NO faculty performance scoring or teacher ranking.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  FileCheck2, 
  Save, 
  CheckCircle2, 
  GraduationCap 
} from 'lucide-react';
import { getGradeBadgeClass } from '@/utils/grading';
import type { FacultyMarkEntryItem, FacultyExamSummary } from '../types';

interface FacultyMarksEntrySheetProps {
  entries: FacultyMarkEntryItem[];
  summary: FacultyExamSummary | null;
  examName: string;
  isSaving: boolean;
  isPublished: boolean;
  onScoreChange: (studentId: string, val: string) => void;
  onFeedbackChange: (studentId: string, val: string) => void;
  onSaveMarks: (publish?: boolean) => Promise<unknown>;
  onExamChange?: (exam: string) => void;
  onDismissPublishNotice?: () => void;
}

export const FacultyMarksEntrySheet: React.FC<FacultyMarksEntrySheetProps> = ({
  entries,
  summary,
  examName,
  isSaving,
  isPublished,
  onScoreChange,
  onFeedbackChange,
  onSaveMarks,
  onExamChange,
  onDismissPublishNotice,
}) => {
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSave = async (publish: boolean) => {
    try {
      await onSaveMarks(publish);
      setSaveSuccess(
        publish
          ? 'Examination marks published to Academic Registry, student portals, and parent portals.'
          : 'Marks score draft saved securely to local ledger.'
      );
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch {
      // error handled upstream
    }
  };

  const EXAM_TYPES = [
    'Half-Yearly Examination 2026–27',
    'Quarterly Examination 2026',
    'Cycle Test 1 (Unit Test)',
    'Annual Examination 2026–27',
  ];

  return (
    <div className="space-y-4">
      {/* Published / Save Success Alert */}
      {(isPublished || saveSuccess) && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {isPublished ? 'Examination Marks Officially Published' : 'Marks Draft Saved'}
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                {saveSuccess ||
                  `Marks for Grade 11-A2 Mathematics (${examName}) are published to student and parent accounts.`}
              </p>
            </div>
          </div>
          {onDismissPublishNotice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissPublishNotice}
              className="text-xs h-8 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 self-end sm:self-auto"
            >
              Dismiss
            </Button>
          )}
        </div>
      )}

      {/* Academic Performance Summary KPI Bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Assessed Students</span>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block mt-0.5">
              {summary.assessed_count} / {summary.total_students}
            </span>
            <span className="text-[10px] text-slate-400">{summary.pending_count} Pending Scores</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Class Average</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
              {summary.class_average}%
            </span>
            <span className="text-[10px] text-slate-400">Section 11-A2 Mean</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Highest Score</span>
            <span className="text-2xl font-black text-emerald-600 block mt-0.5">
              {summary.highest_score} / 100
            </span>
            <span className="text-[10px] text-slate-400">Class Distinction</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-teal-500 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Pass Rate</span>
            <span className="text-2xl font-black text-teal-600 block mt-0.5">
              {summary.pass_rate}%
            </span>
            <span className="text-[10px] text-slate-400">Marks ≥ 33 / 100</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-amber-500 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 font-semibold">Top Tier (A1)</span>
            <span className="text-2xl font-black text-amber-600 block mt-0.5">
              {summary.grade_distribution.find((g) => g.grade === 'A1')?.count || 0}
            </span>
            <span className="text-[10px] text-slate-400">Score &gt; 90%</span>
          </Card>
        </div>
      )}

      {/* Main Score Register Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Examination Marks Entry Register
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  Subject: Mathematics (MATH-041)
                </Badge>
              </div>

              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Marks are out of 100. Enter numeric mark (0–100) or 'AB' for absent students. Grade is computed automatically via CBSE 8-tier scale.
              </CardDescription>
            </div>

            {/* Exam Selector & Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={examName}
                onChange={(e) => onExamChange?.(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
              >
                {EXAM_TYPES.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(false)}
                className="text-xs h-8"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Save Draft
              </Button>

              <Button
                variant="default"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(true)}
                className="text-xs h-8 bg-blue-900 hover:bg-blue-800 text-white shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Publishing...' : 'Publish Marks'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Marks Obtained (/100)</th>
                  <th className="py-2.5 px-3">Derived %</th>
                  <th className="py-2.5 px-3">Derived Grade</th>
                  <th className="py-2.5 px-3">Teacher Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((entry) => (
                  <tr key={entry.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {entry.roll_number}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {entry.student_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {entry.student_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={entry.score}
                          onChange={(e) => onScoreChange(entry.student_id, e.target.value)}
                          placeholder="0-100 / AB"
                          className={`w-24 p-1.5 rounded border text-xs font-mono font-bold text-center transition-colors ${
                            entry.error
                              ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        {entry.error && (
                          <span className="text-[10px] text-rose-600 font-semibold block">
                            {entry.error}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {entry.derived_percentage !== null ? `${entry.derived_percentage}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.derived_grade === 'AB' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border border-rose-300 bg-rose-50 text-rose-700">
                          AB (Absent)
                        </span>
                      ) : entry.derived_grade === '—' ? (
                        <span className="text-slate-400 font-mono">—</span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(
                            entry.derived_grade as any
                          )}`}
                        >
                          {entry.derived_grade}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={entry.feedback}
                        onChange={(e) => onFeedbackChange(entry.student_id, e.target.value)}
                        placeholder="Analytical proofs, homework diligence, etc."
                        className="w-full max-w-sm p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                      />
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
