import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { StudentAllocationModal } from '@/components/allocation/StudentAllocationModal';
import { ClassTeacherAllocationModal } from '@/components/allocation/ClassTeacherAllocationModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AllocationService } from '@/services/allocationService';
import type {
  GlobalSearchResultItem,
  UserRole,
  StudentAllocationItem,
  ClassTeacherAllocationItem,
} from '@/types';
import { Search, User, GraduationCap, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  userRole,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Allocation management states for Admin / Principal
  const canManage = userRole === 'Admin' || userRole === 'Principal';
  const [editingStudent, setEditingStudent] = useState<StudentAllocationItem | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentAllocationItem | null>(null);
  const [editingClassTeacher, setEditingClassTeacher] = useState<ClassTeacherAllocationItem | null>(null);
  const [deletingClassTeacher, setDeletingClassTeacher] = useState<ClassTeacherAllocationItem | null>(null);

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await AllocationService.searchGlobal(query, userRole, activeTab);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performSearch();
    } else {
      setQuery('');
      setResults([]);
      setNotice(null);
    }
  }, [isOpen, query, activeTab]);

  const handleUpdateStudent = async (studentId: string, updates: any) => {
    await AllocationService.updateStudentAllocation(studentId, updates);
    setNotice(`Updated section allocation for student ${studentId}.`);
    setEditingStudent(null);
    await performSearch();
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    await AllocationService.deleteStudentAllocation(deletingStudent.student_id);
    setNotice(`Removed ${deletingStudent.student_name} (${deletingStudent.student_id}) from section allocation.`);
    setDeletingStudent(null);
    await performSearch();
    setTimeout(() => setNotice(null), 4000);
  };

  const handleUpdateClassTeacher = async (sectionId: string, faculty: any) => {
    await AllocationService.updateClassTeacherAllocation(sectionId, faculty);
    setNotice(`Updated Class Teacher assignment for section.`);
    setEditingClassTeacher(null);
    await performSearch();
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeleteClassTeacher = async () => {
    if (!deletingClassTeacher) return;
    await AllocationService.deleteClassTeacherAllocation(deletingClassTeacher.section_id);
    setNotice(`Removed Class Teacher assignment for ${deletingClassTeacher.section_name}.`);
    setDeletingClassTeacher(null);
    await performSearch();
    setTimeout(() => setNotice(null), 4000);
  };

  const placeholderText =
    userRole === 'Faculty'
      ? 'Search students or faculty by ID, name, or subject...'
      : 'Search Student ID, faculty code, name, class, or subject...';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Institutional Directory Search"
        subtitle={`Role: ${userRole} • ${canManage ? 'Authorized for Allocation Update/Delete' : 'View-Only Operational Scope'}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Notification Alert */}
          {notice && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {notice}
              </span>
              <button onClick={() => setNotice(null)} className="text-emerald-700 font-semibold">
                Dismiss
              </button>
            </div>
          )}

          {/* Search Input Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput
                value={query}
                onValueChange={setQuery}
                placeholder={placeholderText}
                autoFocus
              />
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('STUDENT')}
                className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'STUDENT'
                    ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FACULTY')}
                className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                  activeTab === 'FACULTY'
                    ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Faculty
              </button>
            </div>
          </div>

          {/* Result Content */}
          <div className="min-h-[260px] max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <LoadingState message="Searching institutional directory..." />
            ) : !query.trim() ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-600 dark:text-slate-300">
                  Enter search terms to locate students or faculty
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try "Arun", "STU202600001", "Mathematics", "Suresh", "FAC-CS-008", or "Section A2"
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No results found"
                  description={`Zero records match "${query}". Try searching with a different ID, name, subject, or section.`}
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-slate-400 px-1">
                  Found {results.length} matching {results.length === 1 ? 'record' : 'records'}:
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  {results.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            item.type === 'STUDENT'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {item.type === 'STUDENT' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <GraduationCap className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {item.title}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {item.identifier}
                            </Badge>
                            <Badge
                              variant={item.type === 'STUDENT' ? 'default' : 'secondary'}
                              className="text-[9px] uppercase tracking-wider"
                            >
                              {item.type}
                            </Badge>
                          </div>

                          <p className="text-slate-500 text-xs">{item.subtitle}</p>

                          {/* Faculty Subject Visibility in Search Results */}
                          {item.type === 'FACULTY' && item.subjects && item.subjects.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                Subjects:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.subjects.map((sub) => (
                                  <Badge key={sub} variant="secondary" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                                    {sub}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Allocation Info for Students */}
                          {item.type === 'STUDENT' && item.allocationRecord && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              Allocation: {(item.allocationRecord as StudentAllocationItem).section_name} • Roll: {(item.allocationRecord as StudentAllocationItem).roll_number}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Controls for Admin and Principal */}
                      {canManage && item.allocationRecord && (
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {item.type === 'STUDENT' ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStudent(item.allocationRecord as StudentAllocationItem)}
                                className="h-7 px-2 text-[11px] border-blue-200 text-blue-800 hover:bg-blue-50"
                                title="Update Student Allocation"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                <span>Update</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingStudent(item.allocationRecord as StudentAllocationItem)}
                                className="h-7 px-2 text-[11px] border-rose-200 text-rose-700 hover:bg-rose-50"
                                title="Delete Student Allocation"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                <span>Delete</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingClassTeacher(item.allocationRecord as ClassTeacherAllocationItem)}
                                className="h-7 px-2 text-[11px] border-blue-200 text-blue-800 hover:bg-blue-50"
                                title="Update Class Teacher Allocation"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                <span>Update</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingClassTeacher(item.allocationRecord as ClassTeacherAllocationItem)}
                                className="h-7 px-2 text-[11px] border-rose-200 text-rose-700 hover:bg-rose-50"
                                title="Delete Class Teacher Allocation"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                <span>Delete</span>
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Student Update Modal */}
      <StudentAllocationModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={handleUpdateStudent}
      />

      {/* Student Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingStudent}
        title="Confirm Student Allocation Removal"
        message={
          deletingStudent
            ? `Remove ${deletingStudent.student_name} (${deletingStudent.student_id}) from ${deletingStudent.grade_name} — ${deletingStudent.section_name}?`
            : ''
        }
        confirmLabel="Remove Allocation"
        variant="danger"
        onConfirm={handleDeleteStudent}
        onClose={() => setDeletingStudent(null)}
      />

      {/* Class Teacher Update Modal */}
      <ClassTeacherAllocationModal
        isOpen={!!editingClassTeacher}
        record={editingClassTeacher}
        onClose={() => setEditingClassTeacher(null)}
        onSave={handleUpdateClassTeacher}
      />

      {/* Class Teacher Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingClassTeacher}
        title="Confirm Class Teacher Removal"
        message={
          deletingClassTeacher
            ? `Remove ${deletingClassTeacher.faculty_name} as Class Teacher for ${deletingClassTeacher.grade_name} — ${deletingClassTeacher.section_name}?`
            : ''
        }
        confirmLabel="Remove Class Teacher"
        variant="danger"
        onConfirm={handleDeleteClassTeacher}
        onClose={() => setDeletingClassTeacher(null)}
      />
    </>
  );
};
