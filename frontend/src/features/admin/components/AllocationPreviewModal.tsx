/**
 * Student ERP — Admin Class Allocation Preview Modal
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Preview MUST be shown before publishing allocations.
 * - Shows: Student Name, Student ID, Current Section, Proposed Section, Basis (Merit Score / Random Seeded).
 * - Allows Cancel, Back, and Publish Allocation.
 * - Grades 11–12 allocations strictly stay within selected stream.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { AllocationPreviewRecord, AllocationMethod } from '../types';
import { Check, X, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';

interface AllocationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (publishedBy?: string, notes?: string) => void;
  isPublishing: boolean;
  records: AllocationPreviewRecord[];
  grade: string;
  stream?: string;
  method: AllocationMethod;
}

export const AllocationPreviewModal: React.FC<AllocationPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing,
  records,
  grade,
  stream,
  method,
}) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Allocation Review & Verification Preview
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify proposed section assignments for <strong>{grade}</strong> {stream ? `(${stream})` : ''} before committing to master school records.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method & Stream Banner */}
        <div className="px-5 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500 font-medium">Allocation Method:</span>{' '}
              <Badge variant={method === 'MERIT' ? 'default' : 'secondary'} className="text-[10px] ml-1">
                {method === 'MERIT' ? 'Merit-Based (Marks Ranked)' : 'Random Seeded Distribution'}
              </Badge>
            </div>
            {stream && (
              <div>
                <span className="text-slate-500 font-medium">Stream Boundary:</span>{' '}
                <Badge variant="outline" className="text-[10px] ml-1 font-mono text-blue-800 dark:text-blue-300 border-blue-300">
                  {stream}
                </Badge>
              </div>
            )}
          </div>
          <span className="font-mono font-semibold text-blue-900 dark:text-blue-300">
            {records.length} Students Proposed
          </span>
        </div>

        {/* Preview Records Table */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Qualifying Score</th>
                  <th className="py-2.5 px-3">Current Section</th>
                  <th className="py-2.5 px-3">Proposed Section</th>
                  <th className="py-2.5 px-3">Allocation Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r.student_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {r.student_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {r.student_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.score}%</span>{' '}
                      <span className="text-[10px] text-slate-400">(Rank #{r.merit_rank})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{r.current_section}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{r.proposed_section}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px]">
                        {r.basis}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Allocation Commit Note Input */}
          <div className="mt-4 space-y-1.5">
            <label htmlFor="allocation-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Institutional Allocation Order Notes (Optional)
            </label>
            <input
              id="allocation-notes"
              type="text"
              placeholder="e.g. Session 2026–27 Grade 11 CS section distribution approved by Academic Coordinator"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 rounded-b-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Publishing will update student registers and assign timetables in mock state.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPublishing}
              className="text-xs h-8"
            >
              Cancel / Back
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onConfirmPublish('K. Narayanan (Admin)', notes)}
              disabled={isPublishing || records.length === 0}
              className="text-xs h-8 bg-blue-900 hover:bg-blue-800 font-semibold"
            >
              {isPublishing ? (
                <span>Publishing Allocations...</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Publish Allocation ({records.length} Students)</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
