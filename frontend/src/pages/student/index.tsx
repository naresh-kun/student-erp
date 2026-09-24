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
        <LoadingState message="Loading academic dashboard..." />
      </PageContainer>
    );
  }

  const todaySchedule = weeklyTimetable[0]?.periods || [];

  return (
    <PageContainer>
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm border border-white/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Year 2025-2026 • Term 1</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome back, Alex Morgan</h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Grade 11 — Section A (Science & Technology Stream) • Roll No: <code className="font-mono text-white font-semibold">CS2026-042</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="bg-white text-indigo-900 hover:bg-blue-50 text-xs shadow-sm">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Student ID Card
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Term Syllabus
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cumulative GPA</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">3.85</span>
            <span className="text-xs text-slate-500 font-medium">/ 4.0 Scale</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top 10% in Class
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Attendance</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">94.3%</span>
            <span className="text-xs text-slate-500 font-medium">82/87 Sessions (P + OD)</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Minimum 85% Clearance Met
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled Courses</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">5</span>
            <span className="text-xs text-slate-500 font-medium">Subjects</span>
          </div>
          <span className="text-[11px] text-purple-600 font-medium mt-1">16 Total Credits</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class Standing</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">4th</span>
            <span className="text-xs text-slate-500 font-medium">of 32 Students</span>
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1">Dean's Honor List</span>
        </Card>
      </div>

      {/* Main Grid: Today's Schedule & Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Timetable */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Today's Class Schedule</CardTitle>
                <CardDescription>Monday • Grade 11-A</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium">5 Periods</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.map((slot: any, idx: number) => (
              <div 
                key={idx} 
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{slot.subject}</span>
                    <Badge variant={slot.type === 'Lab' ? 'info' : 'outline'} className="text-[10px] py-0">
                      {slot.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{slot.teacher} • <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 text-right">{slot.period.split(' ')[1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column: Attendance Trend & Performance Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Attendance Trend & Threshold</CardTitle>
                <CardDescription>Monthly attendance percentage vs institutional benchmark (90%)</CardDescription>
              </div>
              <Badge variant="success" className="text-xs">Healthy Standing</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="attendance" name="My Attendance %" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Midterm Examination Scores</CardTitle>
                <CardDescription>Your score compared to class section average</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-8">
                View All Marks <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marksComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="studentScore" name="My Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="classAverage" name="Class Average" fill="#94a3b8" radius={[4, 4, 0, 0]} />
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
        title="Student Profile & Enrollment Record" 
        description="Official biographical details, admission credentials, and emergency records"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Profile PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: ID Card Summary */}
        <Card className="md:col-span-1 p-6 text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-1 shadow-md">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb" 
              alt="Alex Morgan" 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Alex Morgan</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ADM-2024-0091 • Roll: CS2026-042</p>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="success" className="text-xs">Enrolled (Active)</Badge>
              <Badge variant="outline" className="text-xs">Grade 11-A</Badge>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>alex.morgan@studenterp.edu</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>+1-555-0104</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>742 Evergreen Terrace, Springfield</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Detailed Sections */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Personal & Demographic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">May 14, 2008</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">Non-Binary</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Blood Group</span>
                <span className="font-semibold text-rose-600 mt-0.5 block">O Positive (O+)</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nationality</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">United States</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">First Language</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">English</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Enrollment Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">August 1, 2024</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Parent, Guardian & Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Guardian</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Robert Morgan</p>
                <p className="text-slate-500">Relationship: Father</p>
                <p className="text-slate-500">Phone: +1-555-0106</p>
                <p className="text-slate-500">Email: robert.morgan@gmail.com</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Academic Mentor</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Dr. Anita Desai</p>
                <p className="text-slate-500">Department: Mathematics</p>
                <p className="text-slate-500">Office: Room 101-B</p>
                <p className="text-slate-500">Email: anita.desai@studenterp.edu</p>
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
        title="Attendance Records & Analytics" 
        description="Comprehensive daily presence tracking, monthly trends, and subject breakdowns"
        actions={
          <Button variant="default" size="sm" className="text-xs">
            Apply for Leave
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Presence</span>
          <span className="text-2xl font-black text-blue-600 block mt-1">94.3%</span>
          <span className="text-[11px] text-slate-400">(Present + On Duty) / Total</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-semibold uppercase">Attended Sessions</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">82</span>
          <span className="text-[11px] text-slate-400">78 Present • 4 On-Duty</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-purple-500">
          <span className="text-xs text-slate-500 font-semibold uppercase">Approved Leave</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">3</span>
          <span className="text-[11px] text-slate-400">Faculty-approved absence</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-500 font-semibold uppercase">Unapproved Absent</span>
          <span className="text-2xl font-black text-rose-600 block mt-1">2</span>
          <span className="text-[11px] text-slate-400">Unjustified absence</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Attendance Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject Attendance Breakdown</CardTitle>
            <CardDescription>Minimum 85% attendance required for examination clearance (Formula: [P + OD] / Total)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectAttendance.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{s.subject}</span>
                  <span className="text-slate-500">{s.present}/{s.total} Sessions ({s.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${s.percentage >= 90 ? 'bg-emerald-500' : s.percentage >= 85 ? 'bg-blue-500' : 'bg-rose-500'}`}
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
            <CardDescription>Academic Year 2025-2026 Trend vs Benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#3b82f6" strokeWidth={2} fill="#93c5fd" fillOpacity={0.4} />
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
            <CardTitle className="text-base">Recent Attendance Logs</CardTitle>
            <CardDescription>Verified session entries across Present, On Duty, Leave, and Absent</CardDescription>
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
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Instructor</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks / Verification</th>
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
                        {l.status === 'PRESENT' ? 'Present' : l.status === 'ON_DUTY' ? 'On Duty' : l.status === 'LEAVE' ? 'Leave (Approved)' : 'Absent'}
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
// 4. STUDENT MARKS & TRANSCRIPTS PAGE
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
        title="Examination Results & Academic Grades" 
        description="Term assessments, score comparisons, grade cards, and official transcripts"
        actions={
          <Button variant="default" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download Transcript (PDF)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Cumulative GPA</span>
          <span className="text-2xl font-black text-indigo-600 block mt-1">3.85 / 4.0</span>
          <span className="text-[11px] text-emerald-600 font-medium">Grade A+ Equivalent</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Earned Credits</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">16 Credits</span>
          <span className="text-[11px] text-slate-400">Term 1 Completed</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Academic Standing</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">Exemplary</span>
          <span className="text-[11px] text-slate-400">Class Rank #4</span>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Performance vs Section Benchmark</CardTitle>
          <CardDescription>Your midterm marks compared against Grade 11-A section averages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="studentScore" name="Alex's Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="classAverage" name="Class Average" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Marks Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base">Term 1 Examination Score Register</CardTitle>
          <CardDescription>Verified by Office of the Registrar and Academic Evaluation Board</CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Assessment</th>
                  <th className="py-2.5 px-3">Max Marks</th>
                  <th className="py-2.5 px-3">Obtained</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Credits</th>
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
                    <td className="py-2.5 px-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">{r.score}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">{r.grade}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{r.credits}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-medium">{r.remarks}</td>
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
        title="Weekly Academic Timetable" 
        description="Structured schedule of lectures, laboratory workshops, and classroom allocations"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Timetable PDF
          </Button>
        }
      />

      {/* Day Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedDay === day 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {day} {day === 'Monday' && <span className="ml-1 text-[10px] opacity-80">(Today)</span>}
          </button>
        ))}
      </div>

      {/* Selected Day Schedule Cards */}
      <div className="space-y-3">
        {activeDaySchedule.map((slot: any, idx: number) => (
          <Card key={idx} className="p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{slot.subject}</h3>
                  <p className="text-xs text-slate-500">Instructor: <strong className="text-slate-700 dark:text-slate-300">{slot.teacher}</strong> • Room: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></p>
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
        title="Institutional Academic Calendar" 
        description="Term dates, examination windows, school holidays, and campus events"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Sync Calendar
          </Button>
        }
      />

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Examination', 'Holiday', 'Academic', 'Extracurricular'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={evt.category === 'Examination' ? 'destructive' : evt.category === 'Holiday' ? 'warning' : evt.category === 'Academic' ? 'default' : 'info'} className="text-[10px]">
                  {evt.category}
                </Badge>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono">
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
