import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AttendanceOversight } from '@/features/admin';

export const AdminAttendancePage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Institutional Attendance Oversight"
        description="Comprehensive daily roll-call audit across sections, verifying canonical 4-status compliance (Master Plan Amendment 2)"
      />
      <AttendanceOversight />
    </PageContainer>
  );
};
