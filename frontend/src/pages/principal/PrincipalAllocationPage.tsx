/**
 * Student ERP — PrincipalAllocationPage
 * Phase 2 — Task 2.7: Operational Allocation, Search & Attendance Visibility
 *
 * Executive Allocation Workspace for Principal:
 * - Student Section Allocation: View, Update, and Delete permissions.
 * - Class Teacher Allocation: View, Update, and Delete permissions.
 * - Enforces immutable Student ID and non-blocking confirmation dialogs.
 * - No dependency on Admin feature internals; uses shared domain allocation primitives.
 */

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StudentAllocationTable } from '@/components/allocation/StudentAllocationTable';
import { ClassTeacherAllocationTable } from '@/components/allocation/ClassTeacherAllocationTable';
import { Users, UserCheck } from 'lucide-react';

export const PrincipalAllocationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student_sections' | 'class_teachers'>('student_sections');

  return (
    <PageContainer>
      <SectionHeader
        title="Section & Staff Allocation Governance"
        description="Executive oversight and operational governance of student section distributions and Class Teacher appointments"
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('student_sections')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'student_sections'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Section Allocation
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
          Class Teacher Allocation
        </button>
      </div>

      {activeTab === 'student_sections' && (
        <StudentAllocationTable canManage={true} />
      )}

      {activeTab === 'class_teachers' && (
        <ClassTeacherAllocationTable canManage={true} />
      )}
    </PageContainer>
  );
};
