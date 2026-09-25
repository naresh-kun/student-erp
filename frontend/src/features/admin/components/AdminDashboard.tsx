/**
 * Student ERP — Admin Dashboard Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  School, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ClipboardList,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { kpis, attendanceTrend, isLoading, error, refresh } = useAdminDashboard();

  if (isLoading) {
    return <LoadingState message="Loading school administration operations console..." />;
  }

  if (error || !kpis) {
    return <ErrorState message={error || 'Failed to load administrative overview'} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Enterprise Institutional Header */}
      <div className="p-6 md:p-7 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>School Administration Office • Academic Year {kpis.academic_year}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{SCHOOL_CONFIG.name}</h1>
          <p className="text-blue-200 text-xs md:text-sm max-w-2xl leading-relaxed">
            Institutional admissions, student directories, faculty records, senior secondary stream allocation, and CBSE academic governance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/allocation">
            <Button variant="secondary" className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
              Class Allocation Engine
            </Button>
          </Link>
          <Link to="/admin/students">
            <Button variant="outline" className="border-blue-700 text-white hover:bg-blue-800 text-xs font-medium">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Student Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Enrollment</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">
            {kpis.total_students.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Grades 9 through 12</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Teaching Faculty</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 block mt-1">
            {kpis.total_faculty}
          </span>
          <span className="text-[11px] text-slate-500">Ratio: {kpis.student_teacher_ratio}</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Classes & Sections</span>
            <School className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">
            {kpis.total_classes} Classes • {kpis.total_sections} Sec
          </span>
          <span className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">4 Senior Streams</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">School Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {kpis.overall_attendance_rate}%
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">Canonical (P + OD) / Total</span>
        </Card>
      </div>

      {/* Main Trends & Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Institutional Attendance Pattern (Session {kpis.academic_year})
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly school-wide presence telemetry verified under Master Plan Amendment 2
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono text-blue-700 border-blue-200">
                P + OD Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip formatter={(val) => [`${val}%`, 'Attendance Rate']} />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    name="School Attendance %"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    fill="#bfdbfe"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Attendance Formula: (PRESENT + ON_DUTY) / Total Sessions × 100</span>
              <Link to="/admin/attendance" className="text-blue-700 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
                <span>View Full Attendance Oversight</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Operational Status & Fast Navigation */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col justify-between p-5 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <ClipboardList className="w-4 h-4 text-blue-700" />
                <span>Administrative Actions</span>
              </CardTitle>
              <Badge variant="warning" className="text-[10px]">
                {kpis.pending_operational_actions} Pending
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Class & Stream Allocation</span>
                  <span className="text-[11px] text-slate-500">Grade 11 Admissions active</span>
                </div>
                <Link to="/admin/allocation">
                  <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5">
                    Launch
                  </Button>
                </Link>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Half-Yearly Examination</span>
                  <span className="text-[11px] text-slate-500">Marks reconciliation in progress</span>
                </div>
                <Link to="/admin/marks">
                  <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5">
                    Review
                  </Button>
                </Link>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Upcoming School Events</span>
                  <span className="text-[11px] text-slate-500">{kpis.upcoming_events_count} events on calendar</span>
                </div>
                <Link to="/admin/calendar">
                  <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5">
                    Calendar
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link to="/admin/classes" className="w-full block">
              <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>Inspect School Hierarchy (Grades 10–12)</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
