/**
 * Student ERP — Principal Attendance Analytics Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE & FORMULA ENFORCEMENT:
 * - Canonical 4-status model: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * - Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100.
 * - LEAVE counts as absence in the formula denominator.
 * - LEAVE is visually distinct (violet/purple) from unapproved ABSENT (rose/red).
 * - Master Plan Amendment 2 strictly adhered to.
 * - STRICTLY NO faculty performance rankings.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { usePrincipalAttendance } from '../hooks/usePrincipalAttendance';
import { ShieldCheck } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  Cell 
} from 'recharts';

export const AttendanceAnalytics: React.FC = () => {
  const { telemetry, isLoading, error, refresh } = usePrincipalAttendance();

  if (isLoading || !telemetry) {
    return <LoadingState message="Loading institutional attendance analytics telemetry..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const { overallPresenceRate, totalSessions, statusDistribution, cohortMonthlyTrends } = telemetry;

  const presentItem = statusDistribution.find((d) => d.status === 'PRESENT');
  const onDutyItem = statusDistribution.find((d) => d.status === 'ON_DUTY');
  const leaveItem = statusDistribution.find((d) => d.status === 'LEAVE');
  const absentItem = statusDistribution.find((d) => d.status === 'ABSENT');

  return (
    <div className="space-y-6">
      {/* Policy Reconciliation Header */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Master Plan Amendment 2 — Institutional Presence Telemetry</span>
          </div>
          <p className="text-slate-500">
            Official Calculation: <strong>(PRESENT + ON_DUTY) / Total Sessions × 100</strong>. Faculty-approved LEAVE is counted in the total sessions denominator as absence.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Total: {totalSessions.toLocaleString()} Recorded Sessions
        </Badge>
      </Card>

      {/* 4-Status Reconciliation KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-600 col-span-2 sm:col-span-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Composite Rate</span>
          <span className="text-xl font-black text-blue-700 dark:text-blue-400 block mt-0.5">{overallPresenceRate}%</span>
          <span className="text-[10px] text-slate-400">([P + OD] / Total)</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">PRESENT</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{presentItem?.count.toLocaleString() || 0}</span>
          <span className="text-[10px] text-emerald-700 font-medium">{presentItem?.percentage}% presence</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">ON DUTY</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{onDutyItem?.count || 0}</span>
          <span className="text-[10px] text-blue-700 font-medium">Sanctioned representation</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-violet-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">APPROVED LEAVE</span>
          <span className="text-xl font-black text-violet-600 block mt-0.5">{leaveItem?.count || 0}</span>
          <span className="text-[10px] text-violet-700 font-medium">Faculty sanctioned (Absence)</span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">UNAPPROVED ABSENT</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{absentItem?.count || 0}</span>
          <span className="text-[10px] text-rose-700 font-medium">Unexcused absence</span>
        </Card>
      </div>

      {/* 4-Status Visual Reconciliation & Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Institutional Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution across canonical attendance states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(val: any, _name: any, item: any) => [
                      `${val} sessions (${item.payload.percentage}%)`,
                      `${item.payload.label} [${item.payload.countsAs}]`
                    ]}
                  />
                  <Bar dataKey="count" name="Sessions" radius={[3, 3, 0, 0]}>
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Canonical Status Classification Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Master Plan Amendment 2 Business Rules and formula impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {statusDistribution.map((item) => (
              <div
                key={item.status}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block">{item.description}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={item.countsAs === 'Presence' ? 'success' : item.status === 'LEAVE' ? 'warning' : 'outline'}
                    className="text-[10px]"
                  >
                    {item.countsAs}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {item.count} sessions ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cohort Longitudinal Trends */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Cohort Longitudinal Progression (Grades 9 through 12)
          </CardTitle>
          <CardDescription className="text-xs">
            Monthly academic cohort presence telemetry (Calculated as [Present + On Duty] / Total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cohortMonthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[88, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, 'Attendance Rate']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="gr12" name="Grade 12" stroke="#1d4ed8" strokeWidth={2} />
                <Line type="monotone" dataKey="gr11" name="Grade 11" stroke="#4f46e5" strokeWidth={2} />
                <Line type="monotone" dataKey="gr10" name="Grade 10" stroke="#059669" strokeWidth={2} />
                <Line type="monotone" dataKey="gr9" name="Grade 9" stroke="#d97706" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
