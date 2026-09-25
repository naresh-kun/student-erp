/**
 * Student ERP — ParentTimetablePage
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Weekly school routine and classroom period schedule for enrolled wards:
 * - 5 Scheduled Daily Periods (08:30 AM – 01:15 PM / 02:45 PM)
 * - School hours and room assignments
 * - Monday through Friday daily filters
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
  useChildTimetable,
  ParentChildBanner,
  ParentTimetableSchedule,
} from '@/features/parents';

export const ParentTimetablePage: React.FC = () => {
  const { data: parentProfile, isLoading: profileLoading } = useParentProfile();
  const { data: linkedChildren = [], isLoading: childrenLoading } = useLinkedChildren(
    parentProfile?.id
  );
  const { activeChild, activeChildId, selectChild } = useActiveChild(linkedChildren);

  const { data: timetableDays = [], isLoading: timetableLoading } = useChildTimetable(activeChildId);

  if (profileLoading || childrenLoading || timetableLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading weekly timetable schedule..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Student Timetable & Daily Periods"
          description={`Weekly period routine and classroom schedule for ${activeChild?.full_name || 'your ward'}`}
          actions={
            <Badge variant="outline" className="text-xs font-mono">
              Class: {activeChild?.class_name} — {activeChild?.section_name}
            </Badge>
          }
        />

        {/* Child Selector Strip */}
        <ParentChildBanner
          parentProfile={parentProfile}
          activeChild={activeChild}
          linkedChildren={linkedChildren}
          onSelectChild={selectChild}
          showChildSelector={true}
        />

        {/* Weekly Day Schedule & Period Blocks */}
        <ParentTimetableSchedule
          days={timetableDays}
          childName={activeChild?.first_name || 'Ward'}
          sectionName={`${activeChild?.class_name} - ${activeChild?.section_name}`}
        />
      </div>
    </PageContainer>
  );
};
