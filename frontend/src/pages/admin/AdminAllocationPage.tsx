import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AllocationWorkspace } from '@/features/admin';

export const AdminAllocationPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Class & Stream Allocation Engine"
        description="Stream-aware section distribution workspace supporting Merit-based and Random allocation algorithms with verification preview"
      />
      <AllocationWorkspace />
    </PageContainer>
  );
};
