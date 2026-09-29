/**
 * Student ERP — Student Calendar Page
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Institutional academic calendar, term examinations, and school holidays.
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { 
  useStudentCalendar, 
  StudentCalendarEvents 
} from '@/features/students';

export const StudentCalendarPage: React.FC = () => {
  const { events, filter, setFilter, loading } = useStudentCalendar();

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading academic calendar..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="School Academic Calendar" 
        description="Term examination schedules, school holidays, exhibitions, and parent-teacher meetings"
      />

      <StudentCalendarEvents
        events={events}
        filter={filter}
        onFilterChange={setFilter}
      />
    </PageContainer>
  );
};
