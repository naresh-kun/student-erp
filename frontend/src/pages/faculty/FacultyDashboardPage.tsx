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
  const { data: profile, isLoading: profileLoading, error: profileError } = useFacultyProfile();
  const { data: assignedClasses, isLoading: classesLoading, error: classesError } = useAssignedClasses();
  const { todayPeriods, isLoading: timetableLoading, error: timetableError } = useFacultyTimetable();
  const {
    notices = [],
    pendingCount,
    reviewNotice,
    isLoading: leavesLoading,
    error: leavesError,
  } = usePendingLeaveReviews();

  if (profileLoading || classesLoading || timetableLoading || leavesLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading faculty portal & academic registers..." />
      </PageContainer>
    );
  }

  const hasAnySyncError = Boolean(profileError || classesError || timetableError || leavesError);

  // Compute metrics distinguishing confirmed zero from missing/error state
  const assignedClassesCount = classesError
    ? undefined
    : typeof profile?.assigned_classes_count === 'number'
    ? profile.assigned_classes_count
    : Array.isArray(assignedClasses)
    ? assignedClasses.length
    : undefined;

  const enrolledStudentsCount = classesError
    ? undefined
    : typeof profile?.assigned_students_count === 'number'
    ? profile.assigned_students_count
    : Array.isArray(assignedClasses)
    ? (assignedClasses.length === 0 ? 0 : assignedClasses.reduce((acc, c) => acc + (c.student_count || 0), 0))
    : undefined;

  const todayPeriodsCount = timetableError
    ? undefined
    : Array.isArray(todayPeriods)
    ? todayPeriods.length
    : undefined;

  const periodsLoggedCount = timetableError
    ? undefined
    : Array.isArray(todayPeriods)
    ? todayPeriods.filter((p) => p.attendance_done).length
    : undefined;

  const pendingLeavesCount = leavesError
    ? undefined
    : typeof pendingCount === 'number'
    ? pendingCount
    : undefined;

  const weeklyWorkload = classesError
    ? undefined
    : typeof profile?.weekly_periods === 'number'
    ? profile.weekly_periods
    : Array.isArray(assignedClasses)
    ? (assignedClasses.length === 0 ? 0 : assignedClasses.reduce((acc, c) => acc + (c.periods_per_week || 0), 0))
    : undefined;

  const safeClasses = Array.isArray(assignedClasses) ? assignedClasses : [];
  const safeTodayPeriods = Array.isArray(todayPeriods) ? todayPeriods : [];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Error / Offline Synchronization Banner */}
        {hasAnySyncError && (
          <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
            <span>Some academic registers could not be synchronized with the server. Verified local records are displayed; unverified metrics are indicated as unavailable.</span>
          </div>
        )}

        {/* 1. Faculty Profile Hero Banner */}
        <FacultyHeroBanner
          profile={profile}
          pendingLeavesCount={pendingLeavesCount ?? 0}
          onNavigateAttendance={() => navigate('/faculty/attendance')}
          onNavigateMarks={() => navigate('/faculty/marks')}
          onNavigateClasses={() => navigate('/faculty/classes')}
        />

        {/* 2. Key Performance Indicators (Non-Evaluative) */}
        <FacultyKPIOverview
          assignedClassesCount={assignedClassesCount}
          enrolledStudentsCount={enrolledStudentsCount}
          todayPeriodsCount={todayPeriodsCount}
          periodsLoggedCount={periodsLoggedCount}
          pendingLeavesCount={pendingLeavesCount}
          weeklyWorkload={weeklyWorkload}
        />

        {/* 3. Main Operational Grid: Today's Routine & Class Teacher Leave Approval */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Period Routine */}
            <FacultyTodayScheduleCard
              periods={safeTodayPeriods}
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
                {classesError ? (
                  <p className="text-xs text-rose-500 py-2">Unable to load assigned sections from server.</p>
                ) : safeClasses.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No assigned sections registered for this academic term.</p>
                ) : (
                  safeClasses.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => navigate('/faculty/classes')}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                        <span>{cls.class_name} — {cls.section_name}</span>
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
                  ))
                )}
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
