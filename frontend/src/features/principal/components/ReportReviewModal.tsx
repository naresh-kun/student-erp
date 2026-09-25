/**
 * Student ERP — Principal Report Review & Approval Modal
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Mock state workflow: Draft -> Review -> Approved.
 * - Head of Institution review and statutory endorsement.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { InstitutionalReportItem, ReportApprovalState } from '../types';
import { X, Download, ShieldCheck, Check } from 'lucide-react';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: InstitutionalReportItem | null;
  onUpdateStatus: (reportId: string, status: ReportApprovalState, remarks?: string) => void;
  isUpdating: boolean;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateStatus,
  isUpdating,
}) => {
  const [remarks, setRemarks] = useState('');
  const [targetStatus, setTargetStatus] = useState<ReportApprovalState>('Approved');

  if (!isOpen || !report) return null;

  const handleDownloadMock = () => {
    const textContent = `
================================================================================
INSTITUTIONAL GOVERNANCE REPORT
School: Modern Public Senior Secondary School, New Delhi
Academic Session: ${report.academic_year}
Title: ${report.title}
Category: ${report.category}
Generated Date: ${report.generated_date}
Official Status: ${report.status}
Approved By: ${report.approved_by || 'Pending Executive Review'}
Approved At: ${report.approved_at || 'N/A'}
Review Remarks: ${report.review_remarks || 'None'}
================================================================================

SUMMARY METRICS:
${Object.entries(report.summary_metrics || {})
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

DESCRIPTION & SCOPE:
${report.description}

[CONFIDENTIAL EXECUTIVE FILING - VERIFIED BY HEAD OF INSTITUTION]
================================================================================
    `.trim();

    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_Official.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleConfirm = () => {
    onUpdateStatus(report.id, targetStatus, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                Executive Dossier Review
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{report.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Category</span>
            <strong className="text-slate-800 dark:text-slate-200">{report.category}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Session</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{report.academic_year}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Current Status</span>
            <Badge
              variant={report.status === 'Approved' ? 'success' : report.status === 'Review' ? 'warning' : 'outline'}
              className="text-[10px]"
            >
              {report.status}
            </Badge>
          </div>
        </div>

        {/* Summary Metrics */}
        {report.summary_metrics && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Dossier Summary Metrics
            </span>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(report.summary_metrics).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center"
                >
                  <span className="text-[10px] text-slate-400 block truncate">{key}</span>
                  <strong className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400 mt-0.5 block">
                    {val}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {report.description}
        </p>

        {/* Action Controls */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label htmlFor="endorsement-state-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Executive Endorsement Action
            </label>
            <select
              id="endorsement-state-select"
              aria-label="Executive Endorsement Action"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ReportApprovalState)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
            >
              <option value="Approved">Formally Approve & Sign-Off (Official Publication)</option>
              <option value="Review">Mark for Administrative Review (Requires Adjustment)</option>
              <option value="Draft">Return to Draft State</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="principal-endorsement-remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Principal Review Remarks
            </label>
            <input
              id="principal-endorsement-remarks"
              type="text"
              placeholder="e.g. Endorsed for CBSE Department inspection filing"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadMock}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Dossier ({report.format})</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isUpdating}
              onClick={handleConfirm}
              className="text-xs bg-blue-900 hover:bg-blue-800 font-semibold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Endorsement</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
