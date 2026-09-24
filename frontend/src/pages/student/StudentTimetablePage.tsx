/**
 * Student ERP — Student Timetable Page
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Daily period schedule, classroom allocations, and lab workshop timings.
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { 
  useStudentTimetable, 
  StudentTimetableSchedule 
} from '@/features/students';

export const StudentTimetablePage: React.FC = () => {
  const { 
    selectedDay, 
    setSelectedDay, 
    activeDaySchedule, 
    loading 
  } = useStudentTimetable();

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading weekly timetable..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Weekly School Timetable" 
        description="Daily period schedule, classroom allocations, and lab workshop timings"
      />

      <StudentTimetableSchedule
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        periods={activeDaySchedule}
      />
    </PageContainer>
  );
};
