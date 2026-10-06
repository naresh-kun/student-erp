/**
 * Student ERP — FacultyHomeworkPage (MOD_001)
 * Authoritative Faculty Homework Management Surface
 * Allows Faculty to list, assign, update, and delete homework records
 * within their verified Subject Faculty Teaching Assignments.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { HomeworkCreateModal } from '@/features/faculty/components/HomeworkCreateModal';
import { HomeworkService } from '@/services/homeworkService';
import type { HomeworkItem } from '@/types';
import { Plus, Edit2, Trash2, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';

export const FacultyHomeworkPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkItem | null>(null);
  const [deletingHomework, setDeletingHomework] = useState<HomeworkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchHomework = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const filters: Record<string, string> = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const items = await HomeworkService.getHomeworkList(filters);
      setHomeworkList(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load homework assignments.';
      setActionError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const handleEdit = (hw: HomeworkItem) => {
    setEditingHomework(hw);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHomework) return;
    setIsDeleting(true);
    try {
      await HomeworkService.deleteHomework(deletingHomework.id);
      setDeletingHomework(null);
      fetchHomework();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete homework.';
      setActionError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'CLOSED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SectionHeader
            title="Homework & Assignment Management"
            description="Create and manage academic coursework for sections where you hold an authorized Teaching Assignment."
          />
          <Button
            variant="default"
            onClick={() => {
              setEditingHomework(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Assign Homework
          </Button>
        </div>

        {actionError && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Filters bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-600 uppercase">Status:</span>
              <div className="flex gap-1">
                {(['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      statusFilter === st
                        ? 'bg-blue-900 text-white border-blue-900 font-medium'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'ALL' ? 'All Assignments' : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by title, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </Card>

        {/* Content table or loading / empty state */}
        {isLoading ? (
          <LoadingState message="Loading homework assignments from institutional server..." />
        ) : homeworkList.length === 0 ? (
          <EmptyState
            title="No Homework Assignments Found"
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'No homework matches the selected filter criteria.'
                : 'No homework has been assigned yet. Click "Assign Homework" to post coursework for your assigned classes.'
            }
          />
        ) : (
          <div className="space-y-4">
            {homeworkList.map((hw) => (
              <Card key={hw.id} className="p-5 hover:border-slate-300 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                        {hw.class_name} — Section {hw.section_name}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {hw.subject_name} ({hw.subject_code})
                      </span>
                      <Badge variant={getStatusBadgeVariant(hw.status)}>
                        {hw.status}
                      </Badge>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">{hw.title}</h3>

                    {hw.description && (
                      <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded border border-slate-100 font-mono">
                        {hw.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Assigned: {hw.assigned_date}
                      </span>
                      {hw.due_date ? (
                        <span className="flex items-center gap-1 font-medium text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Due: {hw.due_date}
                        </span>
                      ) : (
                        <span className="text-slate-400">No deadline</span>
                      )}
                      {hw.faculty_name && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          Teacher: {hw.faculty_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-start flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(hw)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingHomework(hw)}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <HomeworkCreateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingHomework(null);
          }}
          onSuccess={fetchHomework}
          editHomework={editingHomework}
        />

        <ConfirmationDialog
          isOpen={!!deletingHomework}
          onClose={() => setDeletingHomework(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Homework Assignment"
          message={`Are you sure you want to delete "${deletingHomework?.title}"? This coursework record will be permanently removed.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Assignment'}
          cancelLabel="Cancel"
          variant="danger"
        />
      </div>
    </PageContainer>
  );
};
export default FacultyHomeworkPage;
