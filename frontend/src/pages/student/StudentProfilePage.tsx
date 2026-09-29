/**
 * Student ERP — Student Profile Page
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Displays the authoritative Student Permanent Record and supports verified contact updates.
 */

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { 
  useStudentProfile, 
  StudentProfileCard, 
  StudentProfileEditModal 
} from '@/features/students';

export const StudentProfilePage: React.FC = () => {
  const { profile, loading, updateContact } = useStudentProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (loading || !profile) {
    return (
      <PageContainer>
        <LoadingState message="Loading student permanent record..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Permanent Record" 
        description="Official institutional profile, admission details, academic stream, and emergency contacts"
      />

      <StudentProfileCard
        profile={profile}
        onEditContact={() => setIsEditModalOpen(true)}
      />

      <StudentProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={updateContact}
      />
    </PageContainer>
  );
};
