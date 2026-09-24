/**
 * Student ERP — Student Attendance Page
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Master Plan Amendment 2: Four-Status Model (PRESENT, ABSENT, ON_DUTY, LEAVE)
 * Includes student leave request workflows routed to Class Teacher for review.
 */

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/States';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  useStudentAttendance, 
  useStudentLeaveRequests, 
  useStudentProfile,
  StudentAttendanceSummary,
  StudentAttendanceLogsTable,
  StudentLeaveHistoryCard,
  StudentLeaveApplicationModal,
} from '@/features/students';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

export const StudentAttendancePage: React.FC = () => {
  const { profile } = useStudentProfile();
  const { 
    stats, 
    subjectAttendance, 
    logs, 
    trend, 
    loading: attendanceLoading,
    statusFilter, 
    setStatusFilter 
  } = useStudentAttendance();

  const { 
    requests, 
    loading: leaveLoading, 
    submitLeave 
  } = useStudentLeaveRequests();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  if (attendanceLoading || leaveLoading || !stats || !profile) {
    return (
      <PageContainer>
        <LoadingState message="Loading attendance records..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Attendance Records" 
        description="Verified classroom presence logs, canonical 4-status tracking, and subject clearances"
      />

      {/* 4-Status Stat Cards */}
      <StudentAttendanceSummary stats={stats} />

      {/* Subject-Wise Clearance & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Attendance Progress */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Subject-wise Attendance Clearance
            </CardTitle>
            <CardDescription>
              Minimum 85% required for CBSE / ICSE board examination clearance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {subjectAttendance.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {s.subject}
                  </span>
                  <span className="text-slate-500">
                    {s.present} / {s.total} Sessions ({s.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      s.percentage >= 90 
                        ? 'bg-emerald-600' 
                        : s.percentage >= 85 
                        ? 'bg-blue-600' 
                        : 'bg-rose-600'
                    }`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Monthly Attendance Progression
            </CardTitle>
            <CardDescription>
              Academic Year {SCHOOL_CONFIG.academicYear} Trend vs 85% Benchmark
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    fill="#93c5fd" 
                    fillOpacity={0.4} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verified Classroom Attendance Logs */}
      <StudentAttendanceLogsTable
        logs={logs}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Student Leave Management Section */}
      <StudentLeaveHistoryCard
        requests={requests}
        onApplyLeave={() => setIsLeaveModalOpen(true)}
      />

      {/* Leave Application Modal */}
      <StudentLeaveApplicationModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        student={profile}
        onSubmit={(data) => submitLeave(data, profile)}
      />
    </PageContainer>
  );
};
