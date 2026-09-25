/**
 * Student ERP — Principal Reports & Oversight Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { usePrincipalReports } from '../hooks/usePrincipalReports';
import { ReportReviewModal } from './ReportReviewModal';
import { 
  FileText, 
  CheckCircle2, 
  Eye, 
  Filter 
} from 'lucide-react';

export const ReportsOverview: React.FC = () => {
  const {
    reports,
    categoryFilter,
    setCategoryFilter,
    selectedReport,
    setSelectedReport,
    isLoading,
    isUpdating,
    successMessage,
    setSuccessMessage,
    error,
    handleUpdateStatus,
    refresh,
  } = usePrincipalReports();

  if (isLoading && reports.length === 0) {
    return <LoadingState message="Loading institutional reports and filings archive..." />;
  }

  if (error && reports.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Executive Reports & Official Dossiers
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              {reports.length} Filings
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Report Categories</option>
              <option value="Academic">Academic Benchmarks</option>
              <option value="Attendance">Attendance Telemetry</option>
              <option value="Faculty">Faculty & Workloads</option>
              <option value="Governance">Institutional Governance</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {report.category}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {report.format} • {report.file_size}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{report.title}</h3>
                </div>
                <Badge
                  variant={report.status === 'Approved' ? 'success' : report.status === 'Review' ? 'warning' : 'outline'}
                  className="text-[10px]"
                >
                  {report.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {report.description}
              </p>

              {/* Summary Metrics Strip */}
              {report.summary_metrics && (
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center text-xs">
                  {Object.entries(report.summary_metrics).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[9px] text-slate-400 block uppercase font-medium truncate">{k}</span>
                      <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {v}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Status details */}
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>Generated: <span className="font-mono text-slate-600 dark:text-slate-300">{report.generated_date}</span></div>
                {report.approved_by && (
                  <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Signed off by: {report.approved_by}
                  </div>
                )}
                {report.review_remarks && (
                  <div className="italic text-slate-500">
                    "{report.review_remarks}"
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(report)}
                className="text-xs flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-blue-700" />
                <span>Inspect & Endorse</span>
              </Button>

              <Badge variant="outline" className="text-[10px] font-mono text-slate-400">
                Session {report.academic_year}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Review Modal */}
      <ReportReviewModal
        isOpen={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdating}
      />
    </div>
  );
};
