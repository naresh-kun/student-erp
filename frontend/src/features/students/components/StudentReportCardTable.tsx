/**
 * Student ERP — StudentReportCardTable Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Official CBSE / ICSE-oriented Score Register Table.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { StudentExamRecord } from '@/services/mockService';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  getGradeBadgeClass, 
  formatPercentage 
} from '@/utils';
import { Download, Check } from 'lucide-react';

interface StudentReportCardTableProps {
  examRecords: StudentExamRecord[];
  summary: {
    cumulativeMarks: number;
    maxMarks: number;
    percentage: number;
    overallGrade: string;
    isPassed: boolean;
  };
}

export const StudentReportCardTable: React.FC<StudentReportCardTableProps> = ({
  examRecords,
  summary,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    }, 800);
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Half-Yearly Examination Official Score Register
            </CardTitle>
            <CardDescription>
              {SCHOOL_CONFIG.name} • Academic Year {SCHOOL_CONFIG.academicYear} • Term 1 Assessment
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Passing Mark: <strong>33 / 100</strong>
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="text-xs bg-blue-900 hover:bg-blue-800 text-white shadow-xs font-semibold"
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-300" /> Report Card Ready
                </>
              ) : downloading ? (
                'Generating PDF...'
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Report Card (PDF)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Subject Code</th>
                <th className="py-2.5 px-3">Assessment</th>
                <th className="py-2.5 px-3">Max Marks</th>
                <th className="py-2.5 px-3">Marks Obtained</th>
                <th className="py-2.5 px-3">Percentage</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Faculty Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {examRecords.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                    {r.subject}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{r.code}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{r.exam}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{r.max}</td>
                  <td className="py-2.5 px-3 font-bold font-mono text-blue-900 dark:text-blue-300 text-sm">
                    {r.score}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatPercentage(r.percentage)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(
                        r.grade
                      )}`}
                    >
                      {r.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                    {r.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
              <tr>
                <td className="py-3 px-3 text-slate-900 dark:text-slate-100" colSpan={3}>
                  Overall Aggregate &amp; Result
                </td>
                <td className="py-3 px-3 font-mono text-slate-500">{summary.maxMarks}</td>
                <td className="py-3 px-3 font-mono text-blue-900 dark:text-blue-300 text-sm font-black">
                  {summary.cumulativeMarks}
                </td>
                <td className="py-3 px-3 font-mono text-emerald-700 dark:text-emerald-400 text-sm font-black">
                  {formatPercentage(summary.percentage)}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                    {summary.overallGrade}
                  </span>
                </td>
                <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-bold">
                  PASSED (FIRST CLASS WITH DISTINCTION)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
