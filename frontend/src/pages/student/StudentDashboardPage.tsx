/**
 * Student ERP — Student Dashboard Page
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Consumes reusable student domain hooks and components.
 */

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  useStudentProfile, 
  useStudentAttendance, 
  useStudentMarks, 
  useStudentTimetable, 
  useStudentCalendar,
  useStudentLeaveRequests,
  StudentMarksSummaryCards,
  StudentUpcomingEventsCard,
  StudentLeaveApplicationModal,
} from '@/features/students';
import { 
  GraduationCap, 
  FileText, 
  ArrowUpRight, 
  Plus 
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
import { Link } from 'react-router-dom';

export const StudentDashboardPage: React.FC = () => {
  const { profile, loading: profileLoading } = useStudentProfile();
  const { stats, trend, loading: attendanceLoading } = useStudentAttendance();
  const { summary, comparison, loading: marksLoading } = useStudentMarks();
  const { todaySchedule, loading: timetableLoading } = useStudentTimetable();
  const { events: calendarEvents, loading: calendarLoading } = useStudentCalendar();
  const { submitLeave } = useStudentLeaveRequests();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const isLoading = profileLoading || attendanceLoading || marksLoading || timetableLoading || calendarLoading;

  if (isLoading || !profile) {
    return (
      <PageContainer>
        <LoadingState message="Loading student portal..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Student Welcome Banner — Professional Enterprise Indian School Style */}
      <div className="rounded-xl bg-blue-900 border border-blue-950 p-6 md:p-7 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-xs font-semibold text-blue-200 border border-blue-700/60">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{SCHOOL_CONFIG.shortName} • Academic Year {SCHOOL_CONFIG.academicYear}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Good Morning, {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-xl">
              Student ID: <code className="font-mono bg-blue-950/80 px-1.5 py-0.5 rounded text-white font-bold">{profile.student_id}</code> • {profile.class_name} — {profile.stream} ({profile.section_name}) • Roll No: <strong>{profile.roll_number}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => setIsLeaveModalOpen(true)}
              className="bg-white text-blue-950 hover:bg-slate-100 text-xs shadow-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Apply for Leave
            </Button>
            <Link to="/student/marks">
              <Button variant="outline" className="border-blue-400/40 text-white hover:bg-blue-800 text-xs">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> View Report Card
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards — Approved Indian School Metrics with Attendance Integration */}
      <StudentMarksSummaryCards summary={summary} attendanceStats={stats} />

      {/* Main Grid: Today's Schedule, Upcoming Events & Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Classroom Schedule & Upcoming Events */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                    Today's Class Schedule
                  </CardTitle>
                  <CardDescription>
                    Monday • {profile.class_name}-{profile.section_name.split(' ')[1] || 'A2'} (Room XI-A2)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  {todaySchedule.length} Periods
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {todaySchedule.map((slot: any, idx: number) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {slot.subject}
                      </span>
                      <Badge variant={slot.type === 'Lab' ? 'info' : 'outline'} className="text-[10px] py-0">
                        {slot.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Teacher: {slot.teacher} • <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 text-right font-medium">
                    {slot.period.includes('(') ? slot.period.split('(')[1].replace(')', '') : slot.period}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Examinations & Academic Events */}
          <StudentUpcomingEventsCard events={calendarEvents} maxDisplay={3} />
        </div>

        {/* Right Column: Attendance Progression & Examination Marks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                  Attendance Progression Trend
                </CardTitle>
                <CardDescription>
                  Monthly verified classroom presence vs school threshold (85%)
                </CardDescription>
                {stats && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex-wrap">
                    <span className="font-semibold text-slate-500">Status Summary:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      Present: {stats.presentCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                      On Duty: {stats.onDutyCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                      Leave: {stats.leaveCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                      Absent: {stats.absentCount}
                    </span>
                  </div>
                )}
              </div>
              <Badge variant={stats?.clearedForExams ? 'success' : 'warning'} className="text-xs">
                {stats?.clearedForExams ? 'Cleared for Exams' : 'Under Review'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="h-[200px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Attendance Rate']} />
                    <Area 
                      type="monotone" 
                      dataKey="attendance" 
                      name="Attendance %" 
                      stroke="#1e3a8a" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#attendanceGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                  Half-Yearly Examination Marks
                </CardTitle>
                <CardDescription>
                  Arun&apos;s marks (out of 100) compared against Grade 11-A2 section average
                </CardDescription>
              </div>
              <Link to="/student/marks">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-900 hover:text-blue-800">
                  Score Register <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="h-[200px] w-full pt-2">
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
        </div>
      </div>

      {/* Leave Request Modal */}
      <StudentLeaveApplicationModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        student={profile}
        onSubmit={(data) => submitLeave(data, profile)}
      />
    </PageContainer>
  );
};
