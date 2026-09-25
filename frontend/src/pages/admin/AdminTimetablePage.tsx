import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TimetableOverview } from '@/features/admin';

export const AdminTimetablePage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Master School Timetable"
        description="Institutional scheduling matrix mapping daily instructional periods, faculty allocations, and classrooms"
      />
      <TimetableOverview />
    </PageContainer>
  );
};
