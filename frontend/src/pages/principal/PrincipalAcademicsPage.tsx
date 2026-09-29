import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AcademicAnalytics } from '@/features/principal';

export const PrincipalAcademicsPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Institutional Academic Analytics"
        description="Comprehensive grade cohort performance, senior secondary stream benchmarks, and CBSE 8-tier grade distributions"
      />
      <AcademicAnalytics />
    </PageContainer>
  );
};
