import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PrincipalFacultyDirectory } from '@/features/principal';

export const PrincipalFacultyPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Faculty Workload & Departmental Oversight"
        description="Institutional academic staff assignments, teaching loads, and class teacher allocations (Non-Evaluative)"
      />
      <PrincipalFacultyDirectory />
    </PageContainer>
  );
};
