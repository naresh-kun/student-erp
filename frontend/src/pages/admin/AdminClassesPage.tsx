import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ClassesOverview } from '@/features/admin';

export const AdminClassesPage: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Classes & Sections Hierarchy"
        description="Comprehensive school academic structure across Grade Levels, Senior Secondary Streams, and Classroom Sections"
      />
      <ClassesOverview />
    </PageContainer>
  );
};
