import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { StudentAllocationModal } from './StudentAllocationModal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { AllocationService } from '@/services/allocationService';
import type { StudentAllocationItem } from '@/types';
import { Edit2, Trash2, CheckCircle2, Layers } from 'lucide-react';

export interface StudentAllocationTableProps {
  canManage?: boolean; // True for Admin and Principal; False for Faculty
  title?: string;
  description?: string;
}

export const StudentAllocationTable: React.FC<StudentAllocationTableProps> = ({
  canManage = true,
  title = 'Student Section Allocation Register',
  description = 'Locate students, view section allocations, and manage operational cohort placements',
}) => {
  const [students, setStudents] = useState<StudentAllocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [streamFilter, setStreamFilter] = useState('ALL');
  const [editingStudent, setEditingStudent] = useState<StudentAllocationItem | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentAllocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AllocationService.getStudentAllocations({
        search,
        grade: gradeFilter,
        stream: streamFilter,
      });
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, gradeFilter, streamFilter]);

  const handleUpdate = async (
    studentId: string,
    updates: {
      grade_name: string;
      grade_level: number;
      stream?: string;
      section_name: string;
      section_id?: string;
      roll_number: string;
    }
  ) => {
    await AllocationService.updateStudentAllocation(studentId, updates);
    setNotice(`Successfully updated section allocation for student ${studentId}.`);
    setTimeout(() => setNotice(null), 4000);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await AllocationService.deleteStudentAllocation(deletingStudent.student_id);
      setNotice(`Removed ${deletingStudent.student_name} (${deletingStudent.student_id}) from section allocation.`);
      setTimeout(() => setNotice(null), 4000);
      setDeletingStudent(null);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Non-blocking feedback notice */}
      {notice && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:hover:text-emerald-100 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Toolbar */}
      <Card className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search Student ID, name, section, or grade..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Grade Filter */}
            <select
              aria-label="Filter by Grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Grades</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="Grade 10">Grade 10</option>
            </select>

            {/* Stream Filter */}
            <select
              aria-label="Filter by Stream"
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Streams</option>
              <option value="Computer Science A">Computer Science A</option>
              <option value="Bio-Maths B">Bio-Maths B</option>
              <option value="Commerce C">Commerce C</option>
              <option value="Pure Science D">Pure Science D</option>
            </select>

            <Badge variant="outline" className="text-xs font-mono text-slate-600">
              {students.length} Records
            </Badge>
          </div>
        </div>
      </Card>

      {/* Allocation Table */}
      <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-blue-200 text-blue-800 dark:text-blue-300">
            Session 2026–27
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && students.length === 0 ? (
            <LoadingState message="Loading student section allocation records..." />
          ) : students.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No student allocation records found"
                description="Try clearing your search or adjusting your grade and stream filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Grade</th>
                    <th className="py-2.5 px-4">Stream</th>
                    <th className="py-2.5 px-4">Section</th>
                    <th className="py-2.5 px-4 font-mono">Roll Number</th>
                    <th className="py-2.5 px-4 text-center">Allocation Status</th>
                    {canManage && <th className="py-2.5 px-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* Student ID (Permanent & Immutable) */}
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {student.student_id}
                      </td>

                      {/* Student Name */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {student.student_name}
                      </td>

                      {/* Grade */}
                      <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {student.grade_name}
                      </td>

                      {/* Stream (Grades 11-12) */}
                      <td className="py-2.5 px-4">
                        {student.stream ? (
                          <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-slate-700">
                            {student.stream}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">General (No Stream)</span>
                        )}
                      </td>

                      {/* Section */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {student.section_name}
                      </td>

                      {/* Roll Number */}
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {student.roll_number || '-'}
                      </td>

                      {/* Allocation Status */}
                      <td className="py-2.5 px-4 text-center">
                        <Badge
                          variant={student.allocation_status === 'Allocated' ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {student.allocation_status}
                        </Badge>
                      </td>

                      {/* Authorized Update / Delete Controls */}
                      {canManage && (
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingStudent(student)}
                              className="h-7 px-2 text-[11px] border-blue-200 text-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title="Update Allocation"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              <span>Update</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingStudent(student)}
                              className="h-7 px-2 text-[11px] border-rose-200 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Allocation"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog Form */}
      <StudentAllocationModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingStudent}
        title="Confirm Allocation Removal"
        message={
          deletingStudent
            ? `Remove ${deletingStudent.student_name} (${deletingStudent.student_id}) from ${deletingStudent.grade_name} — ${deletingStudent.section_name}? The student will be marked as Unassigned.`
            : ''
        }
        confirmLabel="Remove Allocation"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingStudent(null)}
      />
    </div>
  );
};
