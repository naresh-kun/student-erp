/**
 * Student ERP — ParentAttendanceTrendChart Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine 
} from 'recharts';

interface MonthlyTrendItem {
  month: string;
  attendance: number;
}

interface ParentAttendanceTrendChartProps {
  data?: MonthlyTrendItem[];
  childName?: string;
}

export const ParentAttendanceTrendChart: React.FC<ParentAttendanceTrendChartProps> = ({
  data = [],
  childName = 'Ward',
}) => {
  const hasData = Array.isArray(data) && data.length > 0;
  const latestRate = hasData ? data[data.length - 1].attendance : null;

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Monthly Attendance Trend — {childName}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Verified monthly classroom attendance percentage against school standards (75% Minimum, 85% Board Target)
          </CardDescription>
        </div>
        {hasData && latestRate !== null ? (
          <Badge variant={latestRate >= 85 ? 'success' : (latestRate >= 75 ? 'info' : 'warning')} className="text-xs font-mono">
            {latestRate.toFixed(1)}% Current
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs font-mono text-slate-500">
            No Trend Logs
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {hasData ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance %']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.375rem',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" label={{ value: '85% Board Target', position: 'insideTopRight', fill: '#059669', fontSize: 10 }} />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '75% Minimum Requirement', position: 'insideBottomRight', fill: '#d97706', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance %"
                  stroke="#1e3a8a"
                  strokeWidth={2.5}
                  fill="url(#attendanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[240px] w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No verified monthly attendance trends recorded yet for {childName}.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Trends will populate as regular session attendance logs are submitted.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
