import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SubjectsCatalog } from '@/features/admin';

export const AdminSubjectsPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Curriculum Subjects Catalog"
        description="Official school academic courses, departmental allocations, and weekly period schedules (Non-Credit Based)"
      />
      <SubjectsCatalog />
    </PageContainer>
  );
};
