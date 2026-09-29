/**
 * Student ERP — ParentCalendarPage
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Institutional school calendar for parents and guardians:
 * - Parent-Teacher Meetings (PTM)
 * - Examinations & Term Review Sessions
 * - School Holidays & Festive Breaks
 * - Science Exhibitions & Sports Day Activities
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import {
  useParentCalendar,
  ParentCalendarEventsList,
} from '@/features/parents';

export const ParentCalendarPage: React.FC = () => {
  const { data: events = [], isLoading } = useParentCalendar();

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading institutional calendar..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="School Academic Calendar & Events"
          description="Official schedule of term examinations, parent-teacher meetings, holidays, and school exhibitions"
          actions={
            <Badge variant="outline" className="text-xs font-mono">
              Academic Year 2026–27
            </Badge>
          }
        />

        {/* Institutional Events Grid */}
        <ParentCalendarEventsList events={events} />
      </div>
    </PageContainer>
  );
};
