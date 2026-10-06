import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { HomeworkService, type TeachingScopeItem } from '@/services/homeworkService';
import type { HomeworkItem, HomeworkStatus } from '@/types';

interface HomeworkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editHomework?: HomeworkItem | null;
}

export const HomeworkCreateModal: React.FC<HomeworkCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editHomework,
}) => {
  const [scopes, setScopes] = useState<TeachingScopeItem[]>([]);
  const [selectedScopeIndex, setSelectedScopeIndex] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<HomeworkStatus>('PUBLISHED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      // Fetch authorized teaching scopes
      HomeworkService.getTeachingScope()
        .then((data) => {
          setScopes(data);
          if (data.length > 0 && !editHomework) {
            setSelectedScopeIndex(0);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch teaching scope:', err);
        });

      if (editHomework) {
        setTitle(editHomework.title);
        setDescription(editHomework.description || '');
        setAssignedDate(editHomework.assigned_date);
        setDueDate(editHomework.due_date || '');
        setStatus(editHomework.status);
      } else {
        setTitle('');
        setDescription('');
        setAssignedDate(new Date().toISOString().split('T')[0]);
        // Default due date: 3 days ahead
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 3);
        setDueDate(nextDueDate.toISOString().split('T')[0]);
        setStatus('PUBLISHED');
      }
    }
  }, [isOpen, editHomework]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a homework title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editHomework) {
        await HomeworkService.updateHomework(editHomework.id, {
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate || null,
          status,
        });
      } else {
        const activeScope = scopes[selectedScopeIndex];
        if (!activeScope) {
          throw new Error('No authorized teaching assignment selected.');
        }

        await HomeworkService.createHomework({
          title: title.trim(),
          description: description.trim(),
          section_id: activeScope.section_id,
          subject_id: activeScope.subject_id,
          assigned_date: assignedDate,
          due_date: dueDate || null,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save homework assignment.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeScope = scopes[selectedScopeIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editHomework ? 'Edit Homework Assignment' : 'Assign New Homework'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}

        {!editHomework && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Teaching Assignment Scope <span className="text-red-500">*</span>
            </label>
            {scopes.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                Loading authorized teaching assignments...
              </p>
            ) : (
              <select
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                value={selectedScopeIndex}
                onChange={(e) => setSelectedScopeIndex(Number(e.target.value))}
              >
                {scopes.map((s, idx) => (
                  <option key={s.assignment_id || idx} value={idx}>
                    {s.class_name} — Section {s.section_name} : {s.subject_name} ({s.subject_code})
                  </option>
                ))}
              </select>
            )}
            {activeScope && (
              <p className="mt-1 text-xs text-slate-500">
                Verified: Academic Year {activeScope.academic_year_name}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Homework Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            placeholder="e.g. Chapter 4 Practice Problems & Theorem Proofs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Instructions / Problem Set
          </label>
          <textarea
            rows={4}
            className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-mono"
            placeholder="Detailed instructions, textbook page numbers, exercise numbers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Assigned Date
            </label>
            <input
              type="date"
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              disabled={!!editHomework}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Publish Status
          </label>
          <select
            className="w-full text-sm border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            value={status}
            onChange={(e) => setStatus(e.target.value as HomeworkStatus)}
          >
            <option value="PUBLISHED">Published (Visible to Students & Parents)</option>
            <option value="DRAFT">Draft (Saved privately, invisible to Students & Parents)</option>
            <option value="CLOSED">Closed (Completed / Past Deadline)</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editHomework ? 'Update Assignment' : 'Assign Homework'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
