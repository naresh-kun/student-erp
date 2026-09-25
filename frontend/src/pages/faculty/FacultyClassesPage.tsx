/**
 * Student ERP — FacultyClassesPage
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Scopes display strictly to authorized assigned classes and students:
 * - Grade 11 — Computer Science A (Sec A2) [Class Teacher: R. Suresh]
 * - Grade 12 — Computer Science A (Sec A1)
 * - Grade 10 — Section A
 * - Excludes unrelated school classes.
 * - Permanent immutable Student ID.
 */

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import {
  useAssignedClasses,
  useAssignedStudents,
  FacultyAssignedClassesGrid,
  FacultyStudentRosterTable,
} from '@/features/faculty';

export const FacultyClassesPage: React.FC = () => {
  const {
    data: classes = [],
    activeClass,
    selectedClassId,
    setSelectedClassId,
    isLoading: classesLoading,
  } = useAssignedClasses();

  const { data: students = [], isLoading: studentsLoading } = useAssignedStudents(selectedClassId);

  if (classesLoading || studentsLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading assigned classes & student roster..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Assigned Classes & Student Directory"
          description="Only classes and students assigned to R. Suresh are accessible. Permanent student IDs and verified academic enrollments."
        />

        {/* 1. Assigned Classes Grid */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Authorized Instructional Assignments ({classes.length} Classes)
          </h2>
          <FacultyAssignedClassesGrid
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={(id) => setSelectedClassId(id)}
          />
        </div>

        {/* 2. Enrolled Students Roster Table */}
        <FacultyStudentRosterTable
          students={students}
          activeClass={activeClass}
        />
      </div>
    </PageContainer>
  );
};
