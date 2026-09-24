import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { 
  MockDataService, 
  type StudentAttendanceSessionLog, 
  type StudentExamRecord, 
  type CalendarEventItem 
} from '@/services/mockService';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { getGradeBadgeClass, formatPercentage } from '@/utils';
import { 
  GraduationCap, 
  CalendarCheck, 
  Award, 
  Clock, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  BookOpen, 
  Download, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// ==========================================
// 1. STUDENT DASHBOARD
// ==========================================
export const StudentDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [marksComparison, setMarksComparison] = useState<any[]>([]);
  const [weeklyTimetable, setWeeklyTimetable] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      MockDataService.getMonthlyAttendanceTrend(),
      MockDataService.getSubjectMarksComparison(),
      MockDataService.getWeeklyTimetableGrid(),
    ]).then(([trend, marks, timetable]) => {
      setAttendanceTrend(trend);
      setMarksComparison(marks);
      setWeeklyTimetable(timetable);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading student portal..." />
      </PageContainer>
    );
  }

  const todaySchedule = weeklyTimetable[0]?.periods || [];

  return (
    <PageContainer>
      {/* Student Welcome Banner — Professional Enterprise School Style */}
      <div className="rounded-xl bg-blue-900 border border-blue-950 p-6 md:p-7 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-xs font-semibold text-blue-200 border border-blue-700/60">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{SCHOOL_CONFIG.shortName} • Academic Year {SCHOOL_CONFIG.academicYear}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Good Morning, Arun Kumar</h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-xl">
              Student ID: <code className="font-mono bg-blue-950/80 px-1.5 py-0.5 rounded text-white font-bold">STU202600001</code> • Grade 11 — Computer Science A (Section A2) • Roll No: <strong>11-A2-04</strong>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" className="bg-white text-blue-950 hover:bg-slate-100 text-xs shadow-sm font-semibold">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Student Identity Card
            </Button>
            <Button variant="outline" className="border-blue-400/40 text-white hover:bg-blue-800 text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Syllabus Outline
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards — Approved Indian School Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Attendance */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Attendance</span>
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">94.30%</span>
            <span className="text-xs text-slate-500 font-medium">82/87 Sessions</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Formula: (P + OD) / Total
          </span>
        </Card>

        {/* Cumulative Marks */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cumulative Marks</span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">435 / 500</span>
            <span className="text-xs text-slate-500 font-medium">5 Subjects</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1">Half-Yearly Examination</span>
        </Card>

        {/* Overall Percentage */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Percentage</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">87.00%</span>
            <span className="text-xs text-slate-500 font-medium">Aggregate</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1">Class Standing: Top 10%</span>
        </Card>

        {/* Overall Grade */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Grade</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">A2</span>
            <span className="text-xs text-slate-500 font-medium">Scale: A1 to E</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1">High Distinction (81–&lt;91)</span>
        </Card>
      </div>

      {/* Main Grid: Today's Schedule & Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Classroom Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Today's Class Schedule</CardTitle>
                <CardDescription>Monday • Grade 11-A2 (Room XI-A2)</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium">5 Periods</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {todaySchedule.map((slot: any, idx: number) => (
              <div 
                key={idx} 
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{slot.subject}</span>
                    <Badge variant={slot.type === 'Lab' ? 'info' : 'outline'} className="text-[10px] py-0">
                      {slot.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Teacher: {slot.teacher} • <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 text-right font-medium">{slot.period.split(' ')[1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column: Attendance Progression & Examination Marks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Attendance Progression Trend</CardTitle>
                <CardDescription>Monthly verified classroom presence vs school threshold (85%)</CardDescription>
              </div>
              <Badge variant="success" className="text-xs">Cleared for Exams</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[210px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#attendanceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Half-Yearly Examination Marks</CardTitle>
                <CardDescription>Arun's marks (out of 100) compared against Grade 11-A2 section average</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-900">
                View Report Card <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marksComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        </div>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 2. STUDENT PROFILE PAGE
// ==========================================
export const StudentProfilePage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader 
        title="Student Permanent Record" 
        description="Official institutional profile, admission details, academic stream, and emergency contacts"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: ID Card Profile */}
        <Card className="md:col-span-1 p-6 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm ring-2 ring-slate-200 dark:ring-slate-700">
            AK
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Arun Kumar</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-mono font-bold mt-1">
              ID: STU202600001
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Grade 11 — Section A2 • Roll: 11-A2-04</p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-left space-y-2.5">
            <div className="flex items-center justify-between text-slate-500">
              <span>Admission Number</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">ADM20240091</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Academic Stream</span>
              <span className="font-semibold text-blue-900 dark:text-blue-300">Computer Science A</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Academic Year</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{SCHOOL_CONFIG.academicYear}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Status</span>
              <Badge variant="success" className="text-[10px]">Active Enrolled</Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-left space-y-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>arun.kumar@vidyamandir.edu.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>+91-98400-11205</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>No. 42, Temple View Avenue, Sector 12, RK Puram, New Delhi - 110022</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Detailed Sections */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-900" /> Personal & Demographic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Date of Birth (DD/MM/YYYY)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">14/05/2009</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">Male</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Blood Group</span>
                <span className="font-semibold text-rose-600 mt-0.5 block">O Positive (O+)</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nationality</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">Indian</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">First Language</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">English / Hindi</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Admission Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">10/06/2024</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Parent / Guardian & Class Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Primary Guardian (Parent)</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">S. Ramanathan</p>
                <p className="text-slate-500">Relationship: Father</p>
                <p className="text-slate-500">Mobile: +91-98400-11207</p>
                <p className="text-slate-500">Email: ramanathan@gmail.com</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Class Teacher</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">R. Suresh</p>
                <p className="text-slate-500">Department: Mathematics</p>
                <p className="text-slate-500">Staff Room: Staff Room B, Ramanujan Block</p>
                <p className="text-slate-500">Email: suresh.r@vidyamandir.edu.in</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 3. STUDENT ATTENDANCE PAGE
// ==========================================
export const StudentAttendancePage: React.FC = () => {
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<any[]>([]);
  const [logs, setLogs] = useState<StudentAttendanceSessionLog[]>([]);

  useEffect(() => {
    MockDataService.getMonthlyAttendanceTrend().then(setAttendanceTrend);
    MockDataService.getSubjectAttendance().then(setSubjectAttendance);
    MockDataService.getStudentAttendanceHistory().then(setLogs);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Attendance Records" 
        description="Verified classroom presence logs, canonical 4-status tracking, and subject clearances"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Attendance</span>
          <span className="text-2xl font-black text-blue-700 block mt-1">94.30%</span>
          <span className="text-[11px] text-slate-500">(Present + On Duty) / Total</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Attended Sessions</span>
          <span className="text-2xl font-black text-emerald-700 block mt-1">82</span>
          <span className="text-[11px] text-slate-500">78 Present • 4 On-Duty</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-purple-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Approved Leave</span>
          <span className="text-2xl font-black text-purple-700 block mt-1">3</span>
          <span className="text-[11px] text-slate-500">Sanctioned by Faculty</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-rose-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Unapproved Absent</span>
          <span className="text-2xl font-black text-rose-700 block mt-1">2</span>
          <span className="text-[11px] text-slate-500">Unjustified absence</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Attendance Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject-wise Attendance Clearance</CardTitle>
            <CardDescription>Minimum 85% required for CBSE / ICSE board examination clearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectAttendance.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{s.subject}</span>
                  <span className="text-slate-500">{s.present} / {s.total} Sessions ({s.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${s.percentage >= 90 ? 'bg-emerald-600' : s.percentage >= 85 ? 'bg-blue-600' : 'bg-rose-600'}`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Attendance Progression</CardTitle>
            <CardDescription>Academic Year {SCHOOL_CONFIG.academicYear} Trend vs 85% Benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#1e3a8a" strokeWidth={2} fill="#93c5fd" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Session Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Verified Classroom Attendance Logs</CardTitle>
            <CardDescription>Four-status model entries (Present, On Duty, Approved Leave, Absent)</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filter Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date (DD/MM/YYYY)</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks / Approver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono">{l.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{l.subject}</td>
                    <td className="py-2.5 px-3 text-slate-500">{l.period}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{l.faculty}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        l.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' :
                        l.status === 'ON_DUTY' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' :
                        l.status === 'LEAVE' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' :
                        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}>
                        {l.status === 'PRESENT' ? 'Present' : l.status === 'ON_DUTY' ? 'On Duty' : l.status === 'LEAVE' ? 'Approved Leave' : 'Absent'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{l.note || '—'}</td>
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

// ==========================================
// 4. STUDENT MARKS & REPORT CARD PAGE
// ==========================================
export const StudentMarksPage: React.FC = () => {
  const [marksData, setMarksData] = useState<any[]>([]);
  const [examRecords, setExamRecords] = useState<StudentExamRecord[]>([]);

  useEffect(() => {
    MockDataService.getSubjectMarksComparison().then(setMarksData);
    MockDataService.getStudentExamRecords().then(setExamRecords);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Examination Marks & Report Card" 
        description="Term assessments, subject marks out of 100, cumulative percentage, and CBSE/ICSE grades"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-blue-900 hover:bg-blue-800 text-white shadow-sm font-semibold">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download Report Card (PDF)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Cumulative Marks</span>
          <span className="text-2xl font-black text-blue-900 dark:text-blue-300 block mt-1">435 / 500</span>
          <span className="text-[11px] text-slate-500 font-medium">5 Evaluated Subjects</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Percentage</span>
          <span className="text-2xl font-black text-emerald-700 block mt-1">87.00%</span>
          <span className="text-[11px] text-emerald-600 font-medium">Pass Threshold: 33% Cleared</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Grade</span>
          <span className="text-2xl font-black text-amber-700 block mt-1">A2</span>
          <span className="text-[11px] text-slate-500">High Distinction • Rank #4 in Section</span>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Marks vs Section Benchmark</CardTitle>
          <CardDescription>Arun's Half-Yearly marks (out of 100) compared against Grade 11-A2 averages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* Marks Table — Official Indian School Report Card Register */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Half-Yearly Examination Score Register</CardTitle>
              <CardDescription>{SCHOOL_CONFIG.name} • Academic Year {SCHOOL_CONFIG.academicYear}</CardDescription>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Passing Mark: <strong>33 / 100</strong> per subject
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
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {examRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{r.subject}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{r.code}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.exam}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{r.max}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-blue-900 dark:text-blue-300">{r.score}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{formatPercentage(r.percentage)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(r.grade)}`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td className="py-3 px-3 text-slate-900 dark:text-slate-100" colSpan={3}>
                    Overall Aggregate & Result
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">500</td>
                  <td className="py-3 px-3 font-mono text-blue-900 dark:text-blue-300 text-sm">435</td>
                  <td className="py-3 px-3 font-mono text-emerald-700 text-sm">87.00%</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      A2
                    </span>
                  </td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold">
                    PASSED (FIRST CLASS WITH DISTINCTION)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 5. STUDENT TIMETABLE PAGE
// ==========================================
export const StudentTimetablePage: React.FC = () => {
  const [weeklyGrid, setWeeklyGrid] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    MockDataService.getWeeklyTimetableGrid().then(setWeeklyGrid);
  }, []);

  const activeDaySchedule = weeklyGrid.find((d) => d.day === selectedDay)?.periods || [];

  return (
    <PageContainer>
      <SectionHeader 
        title="Weekly School Timetable" 
        description="Daily period schedule, classroom allocations, and lab workshop timings"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download Timetable (PDF)
          </Button>
        }
      />

      {/* Day Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all shrink-0 ${
              selectedDay === day 
                ? 'bg-blue-900 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {day} {day === 'Monday' && <span className="ml-1 text-[10px] opacity-80">(Today)</span>}
          </button>
        ))}
      </div>

      {/* Selected Day Schedule Cards */}
      <div className="space-y-3">
        {activeDaySchedule.map((slot: any, idx: number) => (
          <Card key={idx} className="p-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  P{idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{slot.subject}</h3>
                  <p className="text-xs text-slate-500">Teacher: <strong className="text-slate-700 dark:text-slate-300">{slot.teacher}</strong> • Room: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <Badge variant={slot.type === 'Lab' ? 'info' : slot.type === 'Evaluation' ? 'warning' : 'outline'} className="text-xs">
                  {slot.type}
                </Badge>
                <span className="font-mono text-xs text-slate-500 font-semibold">{slot.period}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

// ==========================================
// 6. STUDENT CALENDAR PAGE
// ==========================================
export const StudentCalendarPage: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);

  useEffect(() => {
    MockDataService.getAcademicCalendarEvents().then(setEvents);
  }, []);

  const filteredEvents = filter === 'All' ? events : events.filter(e => e.category === filter);

  return (
    <PageContainer>
      <SectionHeader 
        title="School Academic Calendar" 
        description="Term examination schedules, school holidays, exhibitions, and parent-teacher meetings"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Download Calendar
          </Button>
        }
      />

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Examination', 'Holiday', 'Academic', 'Meeting'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat ? 'bg-blue-900 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-sm transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={evt.category === 'Examination' ? 'destructive' : evt.category === 'Holiday' ? 'warning' : evt.category === 'Academic' ? 'default' : 'info'} className="text-[10px]">
                  {evt.category}
                </Badge>
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1 font-mono">
                  <CalendarIcon className="w-3.5 h-3.5" /> {evt.date}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{evt.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{evt.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {evt.time}
              </span>
              <span>{evt.venue}</span>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
