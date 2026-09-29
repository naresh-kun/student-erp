import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ClassTeacherAllocationModal } from './ClassTeacherAllocationModal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { AllocationService } from '@/services/allocationService';
import type { ClassTeacherAllocationItem } from '@/types';
import { Edit2, Trash2, CheckCircle2, Shield } from 'lucide-react';

export interface ClassTeacherAllocationTableProps {
  canManage?: boolean; // True for Admin & Principal, False for Faculty
  title?: string;
  description?: string;
}

export const ClassTeacherAllocationTable: React.FC<ClassTeacherAllocationTableProps> = ({
  canManage = true,
  title = 'Class Teacher Allocation Register',
  description = 'Assign and manage designated Class Teachers across academic sections and streams',
}) => {
  const [allocations, setAllocations] = useState<ClassTeacherAllocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [streamFilter, setStreamFilter] = useState('ALL');
  const [editingRecord, setEditingRecord] = useState<ClassTeacherAllocationItem | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ClassTeacherAllocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AllocationService.getClassTeacherAllocations({
        search,
        grade: gradeFilter,
        stream: streamFilter,
      });
      setAllocations(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, gradeFilter, streamFilter]);

  const handleUpdate = async (
    sectionId: string,
    faculty: {
      faculty_id: string;
      faculty_name: string;
      employee_code: string;
      designation: string;
      subjects: string[];
    }
  ) => {
    await AllocationService.updateClassTeacherAllocation(sectionId, faculty);
    setNotice(`Assigned ${faculty.faculty_name} as Class Teacher.`);
    setTimeout(() => setNotice(null), 4000);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await AllocationService.deleteClassTeacherAllocation(deletingRecord.section_id);
      setNotice(`Removed Class Teacher assignment for ${deletingRecord.grade_name} — ${deletingRecord.section_name}.`);
      setTimeout(() => setNotice(null), 4000);
      setDeletingRecord(null);
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
              placeholder="Search Faculty ID, name, subject, or section..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              {allocations.length} Class Sections
            </Badge>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-xs border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-blue-200 text-blue-800 dark:text-blue-300">
            Session 2026–27
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && allocations.length === 0 ? (
            <LoadingState message="Loading Class Teacher allocations..." />
          ) : allocations.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No Class Teacher assignments found"
                description="Try clearing your search query or filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Class & Section</th>
                    <th className="py-2.5 px-4">Stream</th>
                    <th className="py-2.5 px-4">Faculty ID / Code</th>
                    <th className="py-2.5 px-4">Class Teacher</th>
                    <th className="py-2.5 px-4">Designation</th>
                    <th className="py-2.5 px-4">Subject(s) Handling</th>
                    <th className="py-2.5 px-4">Academic Year</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    {canManage && <th className="py-2.5 px-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allocations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* Class & Section */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.grade_name} — {item.section_name}
                      </td>

                      {/* Stream */}
                      <td className="py-2.5 px-4">
                        {item.stream ? (
                          <Badge variant="outline" className="text-[10px]">
                            {item.stream}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">Core (No Stream)</span>
                        )}
                      </td>

                      {/* Faculty ID / Code */}
                      <td className="py-2.5 px-4 font-mono font-medium text-blue-700 dark:text-blue-400">
                        {item.is_assigned ? item.employee_code : '-'}
                      </td>

                      {/* Class Teacher Name */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.faculty_name}
                      </td>

                      {/* Designation */}
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {item.designation}
                      </td>

                      {/* Subject(s) Handling */}
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.subjects.length > 0 ? (
                            item.subjects.map((sub) => (
                              <Badge key={sub} variant="secondary" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                                {sub}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Academic Year */}
                      <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.academic_year}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 text-center">
                        <Badge
                          variant={item.is_assigned ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {item.assignment_status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRecord(item)}
                              className="h-7 px-2 text-[11px] border-blue-200 text-blue-800 dark:text-blue-300 hover:bg-blue-50"
                              title="Update Class Teacher"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              <span>Update</span>
                            </Button>
                            {item.is_assigned && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingRecord(item)}
                                className="h-7 px-2 text-[11px] border-rose-200 text-rose-700 dark:text-rose-400 hover:bg-rose-50"
                                title="Remove Class Teacher"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                <span>Delete</span>
                              </Button>
                            )}
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
      <ClassTeacherAllocationModal
        isOpen={!!editingRecord}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingRecord}
        title="Confirm Class Teacher Removal"
        message={
          deletingRecord
            ? `Remove ${deletingRecord.faculty_name} as Class Teacher for ${deletingRecord.grade_name} — ${deletingRecord.section_name}?`
            : ''
        }
        confirmLabel="Remove Class Teacher"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingRecord(null)}
      />
    </div>
  );
};
