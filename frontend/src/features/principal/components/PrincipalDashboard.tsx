/**
 * Student ERP — Principal Executive Dashboard Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Executive institutional oversight console.
 * - Displays: Total Students, Faculty, Classes, Sections, Overall Attendance,
 *   Academic Performance, Grade Distributions, and Longitudinal Trends.
 * - STRICTLY NO: Teacher ratings, appraisals, reviews, or faculty rankings.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { usePrincipalDashboard } from '../hooks/usePrincipalDashboard';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  Award, 
  Users, 
  GraduationCap, 
  FileText, 
  Calendar, 
  ArrowRight, 
  BarChart3, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';

const GRADE_TIER_COLORS: Record<string, string> = {
  A1: '#1d4ed8',
  A2: '#3b82f6',
  B1: '#059669',
  B2: '#10b981',
  C1: '#d97706',
  C2: '#f59e0b',
  D: '#dc2626',
  E: '#64748b',
};

export const PrincipalDashboard: React.FC = () => {
  const { data, isLoading, error, refresh } = usePrincipalDashboard();

  if (isLoading) {
    return <LoadingState message="Loading institutional executive oversight console..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load executive dashboard'} onRetry={refresh} />;
  }

  const { kpis, gradeDistribution, attendanceTrend, recentEvents } = data;

  const gradeChartData = Object.entries(gradeDistribution).map(([tier, count]) => ({
    tier,
    count,
    color: GRADE_TIER_COLORS[tier] || '#3b82f6',
  }));

  return (
    <div className="space-y-6">
      {/* Executive Institutional Header */}
      <div className="p-6 md:p-7 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>Head of Institution Executive Console • Session {kpis.academic_year}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{SCHOOL_CONFIG.name}</h1>
          <p className="text-blue-200 text-xs md:text-sm max-w-2xl leading-relaxed">
            School-wide academic quality assurance, cohort retention telemetry, board examinations oversight, and departmental governance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/principal/academics">
            <Button variant="secondary" className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-semibold shadow-sm">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
              Academic Performance
            </Button>
          </Link>
          <Link to="/principal/reports">
            <Button variant="outline" className="border-blue-700 text-white hover:bg-blue-800 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Institutional Reports ({kpis.pending_reports_count})
            </Button>
          </Link>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Enrollment</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">
            {kpis.total_students.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">Grades 9 through 12</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Academic Faculty</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 block mt-1">
            {kpis.total_faculty}
          </span>
          <span className="text-[11px] text-slate-500">Student-Teacher: {kpis.student_teacher_ratio}</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">School Presence Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {kpis.school_attendance_rate}%
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">Verified (P + OD) / Total</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Academic Quality Avg</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">
            {kpis.school_academic_average}%
          </span>
          <span className="text-[11px] text-teal-700 font-medium">Half-Yearly Composite</span>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CBSE 8-Tier Grade Spread */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  CBSE 8-Tier Letter Grade Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Institutional academic outcomes across all secondary & senior secondary cohorts
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Marks / 100 Scale
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tier" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(val) => [`${val} Students`, 'Candidate Count']} />
                  <Bar dataKey="count" name="Students" radius={[3, 3, 0, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Top tiers (A1 + A2): <strong>60.1% of student body</strong></span>
              <Link to="/principal/academics" className="text-blue-700 font-semibold hover:underline flex items-center gap-1">
                <span>Detailed Academic View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Longitudinal Attendance Trend */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Longitudinal School Attendance Progression
                </CardTitle>
                <CardDescription className="text-xs">
                  Session 2026–27 monthly presence rate (P + OD verified)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 border-emerald-200">
                Above 90% Benchmark
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip formatter={(val) => [`${val}%`, 'Attendance Rate']} />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance %"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="#a7f3d0"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Canonical Model: 4-status reconciliation active</span>
              <Link to="/principal/attendance" className="text-emerald-700 font-semibold hover:underline flex items-center gap-1">
                <span>Inspect Attendance Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events & Executive Governance Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Institutional Calendar & Milestone Events</span>
            </CardTitle>
            <Link to="/principal/reports" className="text-xs text-blue-700 hover:underline">
              View All Filings
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentEvents.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">{evt.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{evt.date} • {evt.location}</span>
                </div>
                <Badge variant={evt.category === 'Examination' ? 'destructive' : 'outline'} className="text-[10px]">
                  {evt.category}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Executive Action Console */}
        <Card className="lg:col-span-1 shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Oversight & Sign-Off</span>
            </CardTitle>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official annual dossiers and examination returns requiring Head of Institution endorsement before statutory submission.
            </p>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-semibold block">Pending Principal Sign-Off:</span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Term 1 Examination Analysis dossier is ready for executive review.
              </span>
            </div>
          </div>
          <Link to="/principal/reports" className="w-full block">
            <Button variant="default" className="w-full text-xs bg-blue-900 hover:bg-blue-800 font-semibold">
              Open Reports Archive
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
