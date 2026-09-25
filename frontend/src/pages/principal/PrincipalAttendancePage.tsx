import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AttendanceAnalytics } from '@/features/principal';

export const PrincipalAttendancePage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Institutional Attendance Intelligence"
        description="Longitudinal presence telemetry, cohort trends, and canonical 4-status reconciliations (Master Plan Amendment 2)"
      />
      <AttendanceAnalytics />
    </PageContainer>
  );
};
