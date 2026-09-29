import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CalendarEventsManager } from '@/features/admin';

export const AdminCalendarPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="School Calendar & Events Management"
        description="Publish, schedule, and oversee institutional examinations, holidays, parent-teacher meetings, and academic showcases"
      />
      <CalendarEventsManager />
    </PageContainer>
  );
};
