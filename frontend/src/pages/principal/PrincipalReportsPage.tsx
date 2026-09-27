import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ReportsOverview } from '@/features/principal';

export const PrincipalReportsPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Executive Reports & Accreditation Archive"
        description="Executive school performance dossiers, term examination summaries, and formal approval sign-offs"
      />
      <ReportsOverview />
    </PageContainer>
  );
};
