/**
 * Student ERP — ParentDashboardPage
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Primary landing overview for parents/guardians, providing instant visibility into:
 * - Permanent Student ID & Enrolled Ward Credentials
 * - Canonical 4-Status Attendance (P, OD, Leave, Absent) & Formula
 * - Half-Yearly Academic Standing (Marks / 100, Cumulative, Percentage, 8-Tier Grade)
 * - Monthly Verified Attendance Trend & Academic Advisories
 * - Assigned Class Teacher Contact & Upcoming PTM Consultation
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { LoadingState } from '@/components/ui/States';
import {
  useParentProfile,
  useLinkedChildren,
  useActiveChild,
  useChildAttendance,
  useChildMarks,
  useChildAdvisories,
  useParentCalendar,
  ParentChildBanner,
  ParentAttendanceCards,
  ParentMarksSummaryCards,
  ParentAttendanceTrendChart,
  ParentAdvisoryCard,
  ParentTeacherContactCard,
  ParentCalendarEventsList,
} from '@/features/parents';

export const ParentDashboardPage: React.FC = () => {
  const { data: parentProfile, isLoading: profileLoading } = useParentProfile();
  const { data: linkedChildren = [], isLoading: childrenLoading } = useLinkedChildren(
    parentProfile?.id
  );
  const { activeChild, activeChildId, selectChild } = useActiveChild(linkedChildren);

  const { summary: attSummary, isLoading: attLoading } = useChildAttendance(activeChildId);
  const { academicSummary: marksSummary, isLoading: marksLoading } = useChildMarks(activeChildId);
  const { data: advisories = [], isLoading: advLoading } = useChildAdvisories(activeChildId);
  const { data: calendarEvents = [] } = useParentCalendar();

  if (profileLoading || childrenLoading || attLoading || marksLoading || advLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading student records & parent dashboard..." />
      </PageContainer>
    );
  }

  // Filter to upcoming 2 events for the dashboard preview
  const upcomingPreviewEvents = calendarEvents.slice(0, 2);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Child & Institutional Identification Banner */}
        <ParentChildBanner
          parentProfile={parentProfile}
          activeChild={activeChild}
          linkedChildren={linkedChildren}
          onSelectChild={selectChild}
          showChildSelector={true}
        />

        {/* Attendance Summary Cards (5 Canonical Statuses) */}
        <ParentAttendanceCards
          summary={attSummary}
          childName={activeChild?.first_name || 'Ward'}
        />

        {/* Academic Marks Summary Cards (CBSE/ICSE 8-Tier Model) */}
        <ParentMarksSummaryCards
          summary={marksSummary}
          childName={activeChild?.first_name || 'Ward'}
        />

        {/* Main Grid: Attendance Trend, Advisories & Class Teacher */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Trend Area Chart */}
            <ParentAttendanceTrendChart
              childName={activeChild?.first_name || 'Ward'}
            />

            {/* Deterministic Academic & Attendance Advisories */}
            <ParentAdvisoryCard
              advisories={advisories}
              childName={activeChild?.first_name || 'Ward'}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Class Teacher Contact Card */}
            <ParentTeacherContactCard activeChild={activeChild} />

            {/* Upcoming School Events Preview */}
            <div className="space-y-2">
              <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Upcoming School Calendar Highlights
              </h2>
              <ParentCalendarEventsList events={upcomingPreviewEvents} />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
