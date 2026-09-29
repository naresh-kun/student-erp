/**
 * Student ERP — FacultyGradeDistributionChart Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Visual distribution of student grades across the CBSE 8-tier letter grading scale:
 * A1 (91-100), A2 (81-<91), B1 (71-<81), B2 (61-<71), C1 (51-<61), C2 (41-<51), D (33-<41), E (<33).
 *
 * STRICT GOVERNANCE: Strictly NO faculty ratings, reviews, rankings, or performance scores.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { FacultyExamSummary } from '../types';

interface FacultyGradeDistributionChartProps {
  summary: FacultyExamSummary | null;
}

export const FacultyGradeDistributionChart: React.FC<FacultyGradeDistributionChartProps> = ({
  summary,
}) => {
  if (!summary || summary.grade_distribution.length === 0) return null;

  const data = summary.grade_distribution.map((tier) => ({
    grade: tier.grade,
    count: tier.count,
    percentage: tier.percentage,
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Grade Distribution Snapshot (8-Tier School Grading Scale)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              {summary.class_name} • {summary.subject} ({summary.exam_name}) • Class Mean:{' '}
              <strong className="text-blue-700 dark:text-blue-400">{summary.class_average}%</strong>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[210px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} fontWeight={600} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                formatter={(value: any, _name: any, item: any) => [
                  `${value} Students (${item.payload.percentage}%)`,
                  'Enrollment',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="count" name="Student Count" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
