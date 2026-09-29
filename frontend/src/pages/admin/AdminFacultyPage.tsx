import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FacultyDirectory } from '@/features/admin';

export const AdminFacultyPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Faculty Master Register"
        description="Academic staff directories, subject allocations, class teacher assignments, and weekly workloads (Non-Evaluative)"
      />
      <FacultyDirectory />
    </PageContainer>
  );
};
