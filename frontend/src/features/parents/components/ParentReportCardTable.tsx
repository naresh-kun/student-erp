/**
 * Student ERP — ParentReportCardTable Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Official Half-Yearly Score Register and Report Card view
 * adhering to the Indian School 8-Tier Grading System.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, FileText } from 'lucide-react';
import { getGradeBadgeClass } from '@/utils/grading';
import type { ParentSubjectMarkRecord, ParentAcademicSummary } from '../types';

interface ParentReportCardTableProps {
  marks: ParentSubjectMarkRecord[];
  summary?: ParentAcademicSummary;
  childName?: string;
  className?: string;
}

export const ParentReportCardTable: React.FC<ParentReportCardTableProps> = ({
  marks = [],
  summary,
  childName = 'Arun Kumar',
}) => {
  const handleDownloadPdf = () => {
    alert(`Generating official PDF report card for ${childName} (Half-Yearly Examination 2026)...`);
  };

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Official Score Register — {childName}</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Official marks out of 100, subject teacher evaluations, and term progress remarks
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              className="text-xs bg-blue-900 hover:bg-blue-800 text-white self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Download Report Card (PDF)</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Subject Faculty</th>
                  <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                  <th className="py-2.5 px-3 text-center">Max Marks</th>
                  <th className="py-2.5 px-3 text-center">Percentage</th>
                  <th className="py-2.5 px-3 text-center">Letter Grade</th>
                  <th className="py-2.5 px-3">Teacher Remarks & Recommendations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marks.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {m.subject}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {m.faculty}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {m.marksObtained}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {m.maxMarks}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {m.percentage.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs border ${getGradeBadgeClass(m.grade)}`}>
                        {m.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-sm">
                      {m.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
              {summary && (
                <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                      Grand Total & Overall Standing
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-sm text-blue-900 dark:text-blue-300">
                      {summary.cumulativeMarks}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {summary.totalMaxMarks}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {summary.overallPercentage.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded font-mono font-black text-xs border ${getGradeBadgeClass(summary.overallGrade)}`}>
                        {summary.overallGrade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-normal text-xs">
                      Overall Result: <strong>PASS (Division 1 with Distinction)</strong> • Rank: {summary.sectionRank}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 8-Tier CBSE/ICSE Grading Scale Reference Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/60 dark:bg-slate-900/40">
        <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider">
            Institutional 8-Tier Grading System Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block font-mono">A1</span>
              <span className="text-[10px] text-slate-500 block">91–100%</span>
              <span className="text-[9px] text-slate-400 block">Outstanding</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-blue-700 dark:text-blue-400 block font-mono">A2</span>
              <span className="text-[10px] text-slate-500 block">81–90%</span>
              <span className="text-[9px] text-slate-400 block">Very Good</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block font-mono">B1</span>
              <span className="text-[10px] text-slate-500 block">71–80%</span>
              <span className="text-[9px] text-slate-400 block">Good</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-purple-700 dark:text-purple-400 block font-mono">B2</span>
              <span className="text-[10px] text-slate-500 block">61–70%</span>
              <span className="text-[9px] text-slate-400 block">Above Avg</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 block font-mono">C1</span>
              <span className="text-[10px] text-slate-500 block">51–60%</span>
              <span className="text-[9px] text-slate-400 block">Average</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-amber-700 dark:text-amber-400 block font-mono">C2</span>
              <span className="text-[10px] text-slate-500 block">41–50%</span>
              <span className="text-[9px] text-slate-400 block">Fair</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-orange-700 dark:text-orange-400 block font-mono">D</span>
              <span className="text-[10px] text-slate-500 block">33–40%</span>
              <span className="text-[9px] text-slate-400 block">Passing</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-rose-700 dark:text-rose-400 block font-mono">E</span>
              <span className="text-[10px] text-slate-500 block">&lt;33%</span>
              <span className="text-[9px] text-slate-400 block">Needs Imp.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
