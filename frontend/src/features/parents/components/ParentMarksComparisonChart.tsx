/**
 * Student ERP — ParentMarksComparisonChart Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import type { ParentSubjectMarkRecord } from '../types';

interface ParentMarksComparisonChartProps {
  marks: ParentSubjectMarkRecord[];
  childName?: string;
}

export const ParentMarksComparisonChart: React.FC<ParentMarksComparisonChartProps> = ({
  marks = [],
  childName = 'Arun Kumar',
}) => {
  const chartData = marks.map((m) => ({
    subject: m.subject,
    childScore: typeof m.marksObtained === 'number' ? m.marksObtained : 0,
    classAverage: m.classAverage,
  }));

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Subject Marks vs Section Benchmark (Marks / 100) — {childName}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Comparison of marks obtained across subjects against the Grade 11-A2 class average
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Half-Yearly 2026
        </Badge>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [`${val} / 100`, 'Marks']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="childScore" name={`${childName}'s Marks`} fill="#1e3a8a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="classAverage" name="Section Average" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
