/**
 * Student ERP — Student Marks Page
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Enforces Indian School Academic Model: Marks out of 100, cumulative marks, percentage, and 8-tier letter grade.
 * Strictly zero GPA, CGPA, credits, or grade points.
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/States';
import { 
  useStudentMarks, 
  StudentMarksSummaryCards, 
  StudentReportCardTable 
} from '@/features/students';
import { GRADE_SCALE_TIERS, getGradeBadgeClass } from '@/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export const StudentMarksPage: React.FC = () => {
  const { examRecords, comparison, summary, loading } = useStudentMarks();

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading examination marks..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Examination Marks & Report Card" 
        description="Term assessments, subject marks out of 100, cumulative percentage, and CBSE/ICSE grades"
      />

      {/* KPI Cards: Cumulative, Percentage, Grade, Standing */}
      <StudentMarksSummaryCards summary={summary} />

      {/* Subject Marks Comparison Chart */}
      <Card className="shadow-xs">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
            Subject Marks vs Section Benchmark
          </CardTitle>
          <CardDescription>
            Arun&apos;s Half-Yearly marks (out of 100) compared against Grade 11-A2 averages
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(val: any) => [`${val} / 100`, 'Marks']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="studentScore" name="Arun's Marks" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="classAverage" name="Section Average" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Official Score Register Table */}
      <StudentReportCardTable
        examRecords={examRecords}
        summary={summary}
      />

      {/* Indian School 8-Tier Grading Key Reference */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
            CBSE / ICSE Senior Secondary 8-Tier Grading Scale Reference
          </CardTitle>
          <CardDescription>
            Standard percentage score to letter grade conversion rubric (Passing threshold: 33%)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3">Grade</th>
                  <th className="py-2 px-3">Mark Range</th>
                  <th className="py-2 px-3">Qualitative Remark</th>
                  <th className="py-2 px-3">Academic Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {GRADE_SCALE_TIERS.map((tier) => (
                  <tr key={tier.grade} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(tier.grade)}`}>
                        {tier.grade}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {tier.min} – {tier.inclusiveMax ? tier.max : `<${tier.max}`}%
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {tier.description}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {tier.pointsRemark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};
