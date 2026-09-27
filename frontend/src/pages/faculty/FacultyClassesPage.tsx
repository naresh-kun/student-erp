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

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import { StudentAllocationTable } from '@/components/allocation/StudentAllocationTable';
import { ClassTeacherAllocationTable } from '@/components/allocation/ClassTeacherAllocationTable';
import {
  useAssignedClasses,
  useAssignedStudents,
  FacultyAssignedClassesGrid,
  FacultyStudentRosterTable,
} from '@/features/faculty';
import { BookOpen, Users, UserCheck } from 'lucide-react';

export const FacultyClassesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assigned_classes' | 'section_allocations' | 'class_teachers'>('assigned_classes');

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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('assigned_classes')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'assigned_classes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Assigned Classes & Roster
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('section_allocations')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'section_allocations'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Section Allocations (View-Only)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('class_teachers')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'class_teachers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Class Teacher Directory (View-Only)
          </button>
        </div>

        {activeTab === 'assigned_classes' && (
          <div className="space-y-6">
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
        )}

        {activeTab === 'section_allocations' && (
          <StudentAllocationTable canManage={false} />
        )}

        {activeTab === 'class_teachers' && (
          <ClassTeacherAllocationTable canManage={false} />
        )}
      </div>
    </PageContainer>
  );
};
