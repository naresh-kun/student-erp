/**
 * Student ERP — ParentMarksPage
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Official academic performance portal for parents:
 * - Half-Yearly Score Register with Marks / 100, Cumulative totals, 8-Tier Grades
 * - Performance Benchmark Chart comparing ward scores against section averages
 * - CBSE/ICSE 8-Tier Grading System Reference
 * - Downloadable Official PDF Report Card action
 * - Zero GPA/CGPA/credits
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
  useChildMarks,
  useChildAdvisories,
  ParentChildBanner,
  ParentMarksSummaryCards,
  ParentMarksComparisonChart,
  ParentReportCardTable,
  ParentAdvisoryCard,
} from '@/features/parents';

export const ParentMarksPage: React.FC = () => {
  const { data: parentProfile, isLoading: profileLoading } = useParentProfile();
  const { data: linkedChildren = [], isLoading: childrenLoading } = useLinkedChildren(
    parentProfile?.id
  );
  const { activeChild, activeChildId, selectChild } = useActiveChild(linkedChildren);

  const {
    academicSummary: marksSummary,
    subjectMarks,
    isLoading: marksLoading,
  } = useChildMarks(activeChildId);

  const { data: advisories = [] } = useChildAdvisories(activeChildId);

  if (profileLoading || childrenLoading || marksLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading academic reports & term marks..." />
      </PageContainer>
    );
  }

  // Filter to academic advisories
  const academicAdvisories = advisories.filter((a) => a.type === 'academic');

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Academic Marks & Progress Report"
          description={`Half-Yearly Examination 2026 performance register for ${activeChild?.full_name || 'your ward'}`}
          actions={
            <Badge variant="outline" className="text-xs font-mono">
              Student ID: {activeChild?.student_id || 'STU202600001'}
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

        {/* 4 Academic Summary Cards (Cumulative, Percentage, Grade, Rank) */}
        <ParentMarksSummaryCards
          summary={marksSummary}
          childName={activeChild?.first_name || 'Ward'}
        />

        {/* Subject Comparison Bar Chart vs Section Average */}
        <ParentMarksComparisonChart
          marks={subjectMarks}
          childName={activeChild?.first_name || 'Ward'}
        />

        {/* Academic Guidance Advisory */}
        {academicAdvisories.length > 0 && (
          <ParentAdvisoryCard
            advisories={academicAdvisories}
            childName={activeChild?.first_name || 'Ward'}
          />
        )}

        {/* Official Report Card Score Register & Grading Scale Reference */}
        <ParentReportCardTable
          marks={subjectMarks}
          summary={marksSummary}
          childName={activeChild?.full_name || 'Arun Kumar'}
        />
      </div>
    </PageContainer>
  );
};
