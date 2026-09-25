/**
 * Student ERP — FacultyTimetablePage
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the faculty instructional timetable:
 * - Weekly instructional routine (Monday through Friday)
 * - Indian school period structure (Period 1 to Period 8)
 * - Class Lectures, Planning Periods, Remedial Support, Math Lab
 * - Workload: 24 Teaching Periods / Week
 * - ZERO university credit-hour or GPA concepts
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import {
  useFacultyTimetable,
  FacultyTimetableSchedule,
} from '@/features/faculty';

export const FacultyTimetablePage: React.FC = () => {
  const {
    timetable = [],
    selectedDay,
    setSelectedDay,
    isLoading,
  } = useFacultyTimetable();

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading weekly instructional routine & classroom timetable..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Faculty Teaching Timetable"
          description="Weekly instructional routine, planning periods, and classroom assignments for Senior PGT Mathematics R. Suresh."
        />

        <FacultyTimetableSchedule
          timetable={timetable}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          weeklyWorkload={24}
        />
      </div>
    </PageContainer>
  );
};
