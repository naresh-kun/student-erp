import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MarksOversight } from '@/features/admin';

export const AdminMarksPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Examination & Marks Oversight"
        description="Term examination evaluation tracking, section score averages, and CBSE 8-tier grade distributions"
      />
      <MarksOversight />
    </PageContainer>
  );
};
