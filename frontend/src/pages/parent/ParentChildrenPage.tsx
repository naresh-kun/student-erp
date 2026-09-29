/**
 * Student ERP — ParentChildrenPage
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Detailed directory of all enrolled wards/children linked to the authenticated parent.
 * Strictly scopes access to genuine linked children only.
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import {
  useParentProfile,
  useLinkedChildren,
  ParentChildrenOverviewCards,
} from '@/features/parents';

export const ParentChildrenPage: React.FC = () => {
  const { data: parentProfile, isLoading: profileLoading } = useParentProfile();
  const { data: linkedChildren = [], isLoading: childrenLoading } = useLinkedChildren(
    parentProfile?.id
  );

  if (profileLoading || childrenLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading linked student records..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Enrolled Wards / Children"
          description={`Comprehensive school records for wards associated with ${parentProfile?.full_name || 'parent'}`}
          actions={
            <Badge variant="outline" className="text-xs font-mono">
              Academic Year 2026–27
            </Badge>
          }
        />

        {/* Directory Cards for all linked children */}
        <ParentChildrenOverviewCards children={linkedChildren} />
      </div>
    </PageContainer>
  );
};
