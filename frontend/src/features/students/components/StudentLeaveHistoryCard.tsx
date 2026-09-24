/**
 * Student ERP — StudentLeaveHistoryCard Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Displays historical and pending leave applications with clear status messaging.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { StudentLeaveRequest } from '../types';
import { formatDateIndian } from '@/utils';
import { Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface StudentLeaveHistoryCardProps {
  requests: StudentLeaveRequest[];
  onApplyLeave: () => void;
}

export const StudentLeaveHistoryCard: React.FC<StudentLeaveHistoryCardProps> = ({
  requests,
  onApplyLeave,
}) => {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
            Student Leave Applications &amp; Sanctions
          </CardTitle>
          <CardDescription>
            Official leave requests reviewed and sanctioned by your Class Teacher
          </CardDescription>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={onApplyLeave}
          className="text-xs bg-blue-900 hover:bg-blue-800 text-white shadow-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Apply for Leave
        </Button>
      </CardHeader>

      <CardContent>
        {requests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No active or historical leave requests found.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {req.leave_type} Leave
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatDateIndian(req.start_date)}
                      {req.start_date !== req.end_date && ` — ${formatDateIndian(req.end_date)}`}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Faculty Review
                      </span>
                    )}
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300">
                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                        Approved as Sanctioned Leave
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason & Review Note */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-300 font-semibold">Reason:</strong> {req.reason}
                </p>

                {req.reviewed_by && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 gap-1">
                    <span>
                      Reviewed by: <strong className="text-slate-700 dark:text-slate-300">{req.reviewed_by}</strong>
                      {req.review_note && ` • "${req.review_note}"`}
                    </span>
                    {req.reviewed_at && (
                      <span className="font-mono text-slate-400">
                        {formatDateIndian(req.reviewed_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
