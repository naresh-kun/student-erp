import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StudentDirectory } from '@/features/admin';

export const AdminStudentsPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Student Master Directory"
        description="Search, inspect, and manage student enrollments, permanent Student IDs, and academic records"
      />
      <StudentDirectory />
    </PageContainer>
  );
};
