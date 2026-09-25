import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ReportsOverview } from '@/features/principal';

export const PrincipalReportsPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Executive Reports & Accreditation Archive"
        description="Official school performance dossiers, board examination filings, and statutory approval sign-offs"
      />
      <ReportsOverview />
    </PageContainer>
  );
};
