import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { PrincipalDashboard } from '@/features/principal';

export const PrincipalDashboardPage: React.FC = () => {
  return (
    <PageContainer>
      <PrincipalDashboard />
    </PageContainer>
  );
};
