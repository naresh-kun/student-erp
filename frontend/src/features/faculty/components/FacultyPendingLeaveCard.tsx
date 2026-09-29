/**
 * Student ERP — FacultyPendingLeaveCard Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the Faculty-Approved LEAVE Workflow:
 * - Authority: Faculty / Class Teacher alone holds authority to approve or mark LEAVE.
 * - Rules: PENDING_FACULTY_REVIEW -> Approve -> LEAVE (counts as absence in denominator)
 * - Rules: PENDING_FACULTY_REVIEW -> Reject -> Rejected / remains non-LEAVE
 * - Audit Trail: Records approving faculty ID, faculty name, and timestamp.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Check, X, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import type { FacultyPendingLeaveNotice } from '../types';

interface FacultyPendingLeaveCardProps {
  notices: FacultyPendingLeaveNotice[];
  onReviewNotice: (noticeId: string, action: 'APPROVE' | 'REJECT', note?: string) => Promise<void>;
}

export const FacultyPendingLeaveCard: React.FC<FacultyPendingLeaveCardProps> = ({
  notices,
  onReviewNotice,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleAction = async (noticeId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setProcessingId(noticeId);
      await onReviewNotice(noticeId, action);
      setActionSuccess(
        action === 'APPROVE'
          ? 'Absence notice approved as sanctioned LEAVE and synchronized to attendance register.'
          : 'Absence notice marked as Rejected.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // error handled by parent hook
    } finally {
      setProcessingId(null);
    }
  };

  const pendingNotices = notices.filter((n) => n.status === 'PENDING_FACULTY_REVIEW');
  const pastNotices = notices.filter((n) => n.status !== 'PENDING_FACULTY_REVIEW');

  return (
    <Card className="shadow-sm border-amber-200 dark:border-amber-900/60">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Class Teacher Leave Approval Register
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Review and sanction student / parent absence advisories. Approved leave becomes <strong>LEAVE</strong> and counts as absence in the denominator.
            </CardDescription>
          </div>
          <Badge
            variant={pendingNotices.length > 0 ? 'warning' : 'outline'}
            className="text-xs self-start sm:self-auto font-semibold"
          >
            {pendingNotices.length} Pending Review
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {actionSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* 1. Pending Notices */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Absence Notices Requiring Decision</span>
          </h3>

          {pendingNotices.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              No pending leave requests awaiting Class Teacher review.
            </div>
          ) : (
            pendingNotices.map((notice) => (
              <div
                key={notice.id}
                className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {notice.student_name}
                      </span>
                      <code className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                        {notice.student_id}
                      </code>
                      <Badge variant="outline" className="text-[10px]">
                        Roll: {notice.roll_number || '11-A2-04'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                        Source: {notice.source === 'PARENT' ? 'Parent Advisory' : 'Student Request'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>Date of Absence:</strong> {notice.date}{notice.end_date ? ` to ${notice.end_date}` : ''} •{' '}
                      <strong>Category:</strong> <span className="text-amber-700 dark:text-amber-400 font-semibold">{notice.category}</span>
                    </p>
                  </div>

                  <Badge variant="warning" className="text-[10px] shrink-0 self-start">
                    Pending Teacher Review
                  </Badge>
                </div>

                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-500 block mb-0.5">Submitted Justification:</span>
                  "{notice.explanation}"
                </div>

                {/* Teacher Action Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Authority: <strong>R. Suresh (Class Teacher XI-A2)</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processingId === notice.id}
                      onClick={() => handleAction(notice.id, 'REJECT')}
                      className="text-xs h-7 text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      disabled={processingId === notice.id}
                      onClick={() => handleAction(notice.id, 'APPROVE')}
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Check className="w-3 h-3 mr-1" /> Approve Leave
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. Previously Reviewed Audit Trail */}
        {pastNotices.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit Log: Reviewed Absence Notices
            </h3>
            <div className="space-y-2">
              {pastNotices.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.student_name} ({item.student_id})
                      </span>
                      <Badge
                        variant={item.status === 'LEAVE' ? 'success' : 'destructive'}
                        className="text-[10px]"
                      >
                        {item.status === 'LEAVE' ? 'Approved Leave' : 'Rejected'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Date: {item.date} • {item.category} • "{item.explanation.slice(0, 50)}..."
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    {item.approved_by_name && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold block">
                        Approved by {item.approved_by_name}
                      </span>
                    )}
                    {item.rejection_reason && (
                      <span className="text-rose-600 font-medium block">
                        Reason: {item.rejection_reason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
