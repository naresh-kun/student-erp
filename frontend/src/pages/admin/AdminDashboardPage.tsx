import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { AdminDashboard } from '@/features/admin';

export const AdminDashboardPage: React.FC = () => {
  return (
    <PageContainer>
      <AdminDashboard />
    </PageContainer>
  );
};
