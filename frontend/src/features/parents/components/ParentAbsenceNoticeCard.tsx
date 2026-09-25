/**
 * Student ERP — ParentAbsenceNoticeCard Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Implements parent absence justification / notice workflow.
 * Note: Submissions are created strictly in PENDING_FACULTY_REVIEW state;
 * parents CANNOT self-approve or convert absences to LEAVE.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { 
  parentAbsenceNoticeSchema, 
  ABSENCE_CATEGORIES, 
  type ParentAbsenceNoticeFormData 
} from '../schemas/absenceNoticeSchema';
import { useAbsenceNotices } from '../hooks/useAbsenceNotices';
import type { LinkedChild, ParentProfile } from '../types';

interface ParentAbsenceNoticeCardProps {
  activeChild?: LinkedChild;
  parentProfile?: ParentProfile;
}

export const ParentAbsenceNoticeCard: React.FC<ParentAbsenceNoticeCardProps> = ({
  activeChild,
  parentProfile,
}) => {
  const studentId = activeChild?.student_id || 'STU202600001';
  const teacherName = activeChild?.class_teacher_name || 'R. Suresh';

  const { notices, submitNotice, isSubmitting } = useAbsenceNotices(studentId, parentProfile);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParentAbsenceNoticeFormData>({
    resolver: zodResolver(parentAbsenceNoticeSchema),
    defaultValues: {
      student_id: studentId,
      date: new Date().toISOString().split('T')[0],
      category: 'Medical / Illness',
      explanation: '',
    },
  });

  const onSubmit = async (data: ParentAbsenceNoticeFormData) => {
    try {
      await submitNotice(data);
      setSuccessMessage(
        `Absence notification dispatched to Class Teacher (${teacherName}). It will be marked as Approved Leave once reviewed by the teacher.`
      );
      reset({
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
        category: 'Medical / Illness',
        explanation: '',
      });
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (e: any) {
      console.error('Failed to submit absence notice:', e);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Submit Absence Notice to School</span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Notify Class Teacher {teacherName} of an upcoming illness or sanctioned absence for {activeChild?.full_name || 'your ward'}.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Notice Dispatched Successfully</span>
            </div>
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs">
          <input type="hidden" {...register('student_id')} value={studentId} />

          {/* Date of Absence */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Date of Absence <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />
            {errors.date && (
              <span className="text-[11px] text-rose-600 dark:text-rose-400">{errors.date.message}</span>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Reason Category <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
            >
              {ABSENCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                {errors.category.message}
              </span>
            )}
          </div>

          {/* Explanation / Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Detailed Explanation / Physician Advice <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register('explanation')}
              placeholder="e.g. Arun has severe viral fever and physician has advised rest for 2 days. Prescription attached."
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />
            {errors.explanation && (
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                {errors.explanation.message}
              </span>
            )}
          </div>

          {/* Policy Compliance Reminder */}
          <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              School Policy: Submitting this notice informs faculty in advance. It will remain in <strong>PENDING</strong> status until verified and marked as <strong>Approved Leave</strong> by Class Teacher {teacherName}.
            </span>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-xs font-semibold py-2 bg-blue-900 hover:bg-blue-800 text-white"
          >
            {isSubmitting ? 'Transmitting Notice...' : 'Submit Absence Notice'}
          </Button>
        </form>

        {/* Recently Submitted Notices List */}
        {notices.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Pending Dispatched Notices
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{n.category}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Clock className="w-3 h-3" />
                      <span>Pending Review</span>
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px]">Date: {n.date}</p>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{n.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
