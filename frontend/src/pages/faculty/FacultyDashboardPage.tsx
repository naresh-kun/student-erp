/**
 * Student ERP — FacultyDashboardPage
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Primary landing overview for Senior PGT Faculty & Class Teacher R. Suresh:
 * - Faculty Hero Banner & Identity Credentials
 * - KPI Metrics: Assigned Classes, Today's Routine, Pending Leave Reviews, Workload
 * - Today's Teaching Schedule with direct Attendance Recording actions
 * - Pending Leave Requests Widget (Class Teacher Authority Workflow)
 * - Assigned Classes & Workload Overview
 *
 * STRICT GOVERNANCE: Strictly NO faculty performance scoring, ratings, or rankings.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/ui/PageContainer';
import { LoadingState } from '@/components/ui/States';
import { Card, CardTitle } from '@/components/ui/Card';
import {
  useFacultyProfile,
  useAssignedClasses,
  useFacultyTimetable,
  usePendingLeaveReviews,
  FacultyHeroBanner,
  FacultyKPIOverview,
  FacultyTodayScheduleCard,
  FacultyPendingLeaveCard,
} from '@/features/faculty';

export const FacultyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useFacultyProfile();
  const { data: assignedClasses = [], isLoading: classesLoading } = useAssignedClasses();
  const { todayPeriods = [], isLoading: timetableLoading } = useFacultyTimetable();
  const {
    notices = [],
    pendingCount,
    reviewNotice,
    isLoading: leavesLoading,
  } = usePendingLeaveReviews();

  if (profileLoading || classesLoading || timetableLoading || leavesLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading faculty portal & academic registers..." />
      </PageContainer>
    );
  }

  const periodsLoggedCount = todayPeriods.filter((p) => p.attendance_done).length;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 1. Faculty Profile Hero Banner */}
        <FacultyHeroBanner
          profile={profile}
          pendingLeavesCount={pendingCount}
          onNavigateAttendance={() => navigate('/faculty/attendance')}
          onNavigateMarks={() => navigate('/faculty/marks')}
          onNavigateClasses={() => navigate('/faculty/classes')}
        />

        {/* 2. Key Performance Indicators (Non-Evaluative) */}
        <FacultyKPIOverview
          assignedClassesCount={profile?.assigned_classes_count || assignedClasses.length}
          enrolledStudentsCount={profile?.assigned_students_count || 91}
          todayPeriodsCount={todayPeriods.length}
          periodsLoggedCount={periodsLoggedCount}
          pendingLeavesCount={pendingCount}
          weeklyWorkload={profile?.weekly_periods || 24}
        />

        {/* 3. Main Operational Grid: Today's Routine & Class Teacher Leave Approval */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Period Routine */}
            <FacultyTodayScheduleCard
              periods={todayPeriods}
              onMarkAttendance={(_period) => navigate('/faculty/attendance')}
            />

            {/* Class Teacher Leave Review Workflow */}
            <FacultyPendingLeaveCard
              notices={notices}
              onReviewNotice={async (noticeId, action, note) => {
                await reviewNotice(noticeId, action, note);
              }}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Assigned Sections & Workload Card */}
            <Card className="p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Assigned Sections & Workload
                </CardTitle>
                <button
                  type="button"
                  onClick={() => navigate('/faculty/classes')}
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {assignedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => navigate('/faculty/classes')}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>{cls.class_name} — {cls.section_name}</span>
                      {cls.avg_score && (
                        <span className="text-blue-700 dark:text-blue-400">Avg: {cls.avg_score}</span>
                      )}
                    </div>
                    {cls.stream && (
                      <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium mt-0.5">
                        Stream: {cls.stream}
                      </p>
                    )}
                    <p className="text-slate-500 mt-1">
                      {cls.student_count} Enrolled • {cls.periods_per_week} Periods / Week • Room: {cls.room}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="p-5 space-y-3 shadow-sm bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Instructional Quick Actions
              </CardTitle>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => navigate('/faculty/attendance')}
                  className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Mark Session Attendance</span>
                  <span className="text-slate-400 font-mono">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/faculty/marks')}
                  className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Enter Examination Scores</span>
                  <span className="text-slate-400 font-mono">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/faculty/timetable')}
                  className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>View Weekly Timetable</span>
                  <span className="text-slate-400 font-mono">→</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
