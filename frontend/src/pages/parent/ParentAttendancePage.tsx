/**
 * Student ERP — ParentAttendancePage
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Comprehensive classroom attendance and absence advisory portal:
 * - 5 Canonical Status summary cards
 * - Detailed Subject-Wise attendance breakdown
 * - Verified absence and faculty-approved leave audit log
 * - Parent absence notice dispatch workflow (PENDING status; no self-approval)
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import {
  useParentProfile,
  useLinkedChildren,
  useActiveChild,
  useChildAttendance,
  ParentChildBanner,
  ParentAttendanceCards,
  ParentSubjectAttendanceTable,
  ParentAbsenceLogTable,
  ParentAbsenceNoticeCard,
  ParentAttendanceTrendChart,
} from '@/features/parents';

export const ParentAttendancePage: React.FC = () => {
  const { data: parentProfile, isLoading: profileLoading } = useParentProfile();
  const { data: linkedChildren = [], isLoading: childrenLoading } = useLinkedChildren(
    parentProfile?.id
  );
  const { activeChild, activeChildId, selectChild } = useActiveChild(linkedChildren);

  const {
    summary: attSummary,
    subjectAttendance,
    history,
    isLoading: attLoading,
  } = useChildAttendance(activeChildId);

  if (profileLoading || childrenLoading || attLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading attendance logs & records..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Classroom Attendance & Absence Advisory"
          description={`Verified session presence and absence records for ${activeChild?.full_name || 'your ward'}`}
          actions={
            <Badge variant="outline" className="text-xs font-mono">
              Student ID: {activeChild?.student_id || 'STU202600001'}
            </Badge>
          }
        />

        {/* Child Selector Strip if multiple children exist */}
        <ParentChildBanner
          parentProfile={parentProfile}
          activeChild={activeChild}
          linkedChildren={linkedChildren}
          onSelectChild={selectChild}
          showChildSelector={true}
        />

        {/* 5-Card Canonical Attendance Summary */}
        <ParentAttendanceCards
          summary={attSummary}
          childName={activeChild?.first_name || 'Ward'}
        />

        {/* Main Grid: Subject Table & Absence Notice Submission */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Subject-Wise Attendance Breakdown */}
            <ParentSubjectAttendanceTable
              subjectData={subjectAttendance}
              childName={activeChild?.first_name || 'Ward'}
            />

            {/* Official Absence & Approved Leave History */}
            <ParentAbsenceLogTable
              records={history}
              childName={activeChild?.first_name || 'Ward'}
            />

            {/* Monthly Trend Area Chart */}
            <ParentAttendanceTrendChart
              childName={activeChild?.first_name || 'Ward'}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Parent Absence Notice Submission Card */}
            <ParentAbsenceNoticeCard
              activeChild={activeChild}
              parentProfile={parentProfile}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
