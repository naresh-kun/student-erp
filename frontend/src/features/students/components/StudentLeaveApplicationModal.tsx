/**
 * Student ERP — StudentLeaveApplicationModal Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Enforces institutional workflow: Submissions are created strictly in PENDING state.
 * Student cannot self-approve. Faculty/Class Teacher remains the sole sanctioning authority.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  leaveRequestSchema, 
  leaveTypes, 
  type LeaveRequestFormData 
} from '../schemas/leaveRequestSchema';
import type { StudentProfile } from '../types';
import { Button } from '@/components/ui/Button';
import { X, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface StudentLeaveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSubmit: (data: LeaveRequestFormData) => Promise<{ success: boolean; error?: string }>;
}

export const StudentLeaveApplicationModal: React.FC<StudentLeaveApplicationModalProps> = ({
  isOpen,
  onClose,
  student,
  onSubmit,
}) => {
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type: 'Medical',
      start_date: todayStr,
      end_date: todayStr,
      reason: '',
    },
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data: LeaveRequestFormData) => {
    const result = await onSubmit(data);
    if (result.success) {
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        reset();
        onClose();
      }, 1800);
    } else if (result.error) {
      setError('root', { message: result.error });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmittedSuccess(false);
      reset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 id="leave-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Submit Leave Application
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Route institutional absence request to Class Teacher ({student.class_teacher_name})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Leave Application Submitted
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your request is now in <strong className="text-amber-700 dark:text-amber-400 font-semibold">PENDING</strong> review by your Class Teacher (<strong>{student.class_teacher_name}</strong>). You will be notified once formal approval is granted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
            {/* Institutional Review Notice */}
            <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 flex gap-2.5">
              <Info className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  Institutional Approval Policy
                </p>
                <p className="text-[11px] text-blue-800/90 dark:text-blue-300 leading-relaxed">
                  Students cannot self-approve leave. Submissions enter a pending state awaiting formal verification by your assigned Class Teacher. Approved requests are officially categorized as &quot;LEAVE&quot; in attendance logs.
                </p>
              </div>
            </div>

            {errors.root && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.root.message}</span>
              </div>
            )}

            {/* Leave Type / Category */}
            <div className="space-y-1">
              <label htmlFor="leave-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Leave Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="leave-category"
                {...register('leave_type')}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              >
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.leave_type && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.leave_type.message}</p>
              )}
            </div>

            {/* Date Range Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="leave-start-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Commencement Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="leave-start-date"
                  type="date"
                  {...register('start_date')}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
                {errors.start_date && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="leave-end-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Conclusion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="leave-end-date"
                  type="date"
                  {...register('end_date')}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
                {errors.end_date && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Reason Text Area */}
            <div className="space-y-1">
              <label htmlFor="leave-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason &amp; Parental Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="leave-reason"
                rows={3}
                {...register('reason')}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                placeholder="State specific reason for absence (minimum 10 characters)..."
              />
              {errors.reason && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.reason.message}</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-blue-900 hover:bg-blue-800 text-white font-semibold"
              >
                {isSubmitting ? 'Routing to Faculty...' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
