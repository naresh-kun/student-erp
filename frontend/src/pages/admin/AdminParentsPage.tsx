import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ParentDirectory } from '@/features/admin';

export const AdminParentsPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Parent & Guardian Directory"
        description="Master directory of family sponsors, registered guardians, and linked child student accounts"
      />
      <ParentDirectory />
    </PageContainer>
  );
};
