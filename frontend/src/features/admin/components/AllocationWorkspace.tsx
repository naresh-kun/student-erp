/**
 * Student ERP — Admin Class Allocation Workspace Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Stream-Aware Allocation: Grades 11–12 allocation MUST stay strictly within the selected stream.
 * - Methods supported:
 *   1. Merit-Based: Ordered by qualifying marks from highest to lowest and distributed round-robin.
 *   2. Random: Balanced seeded pseudo-random distribution.
 * - Enforces preview before publishing (no silent overwriting).
 * - Displays complete mock allocation history.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { useAdminAllocation } from '../hooks/useAdminAllocation';
import { AllocationPreviewModal } from './AllocationPreviewModal';
import { 
  Sparkles, 
  CheckCircle2, 
  History, 
  AlertCircle
} from 'lucide-react';

export const AllocationWorkspace: React.FC = () => {
  const {
    grade,
    setGrade,
    stream,
    setStream,
    method,
    setMethod,
    selectedSectionIds,
    toggleTargetSection,
    sourceStudents,
    targetSections,
    previewRecords,
    history,
    isLoading,
    isPublishing,
    isPreviewOpen,
    setIsPreviewOpen,
    publishSuccessMessage,
    setPublishSuccessMessage,
    error,
    handleGeneratePreview,
    handlePublishAllocation,
  } = useAdminAllocation();

  if (isLoading && sourceStudents.length === 0) {
    return <LoadingState message="Loading class and section allocation workspace..." />;
  }

  const isSeniorSecondary = grade === 'Grade 11' || grade === 'Grade 12';

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {publishSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium leading-relaxed">{publishSuccessMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPublishSuccessMessage(null)}
            className="text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Allocation Parameters Card */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>Class & Section Allocation Workspace (Session 2026–27)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Configure student cohorts, verify stream boundary rules, and allocate sections via Merit or Random distribution
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-blue-200 text-blue-700">
              Institutional Allocation Engine
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Academic Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Academic Year</label>
              <input
                type="text"
                disabled
                value="2026–27 (Current Term)"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 font-medium"
              />
            </div>

            {/* 2. Grade Selection */}
            <div className="space-y-1.5">
              <label htmlFor="target-grade-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Grade</label>
              <select
                id="target-grade-select"
                aria-label="Target Grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-blue-600"
              >
                <option value="Grade 11">Grade 11 (Senior Secondary)</option>
                <option value="Grade 12">Grade 12 (Senior Secondary)</option>
                <option value="Grade 10">Grade 10 (Secondary Core)</option>
              </select>
            </div>

            {/* 3. Stream Selection (Stream-Aware for Grades 11–12) */}
            <div className="space-y-1.5">
              <label htmlFor="stream-boundary-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Stream Boundary</span>
                {!isSeniorSecondary && <span className="text-[10px] text-slate-400 font-normal">Not Applicable</span>}
              </label>
              <select
                id="stream-boundary-select"
                aria-label="Stream Boundary"
                disabled={!isSeniorSecondary}
                value={isSeniorSecondary ? stream : ''}
                onChange={(e) => setStream(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-md border ${
                  isSeniorSecondary
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isSeniorSecondary ? (
                  <>
                    <option value="Computer Science A">Computer Science A (A1, A2, A3)</option>
                    <option value="Bio-Maths B">Bio-Maths B (B1, B2, B3)</option>
                    <option value="Commerce C">Commerce C (C1, C2, C3)</option>
                    <option value="Pure Science D">Pure Science D (D1, D2, D3)</option>
                  </>
                ) : (
                  <option value="">No Stream (Secondary General)</option>
                )}
              </select>
            </div>

            {/* 4. Allocation Method */}
            <div className="space-y-1.5">
              <label htmlFor="allocation-method-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allocation Method</label>
              <select
                id="allocation-method-select"
                aria-label="Allocation Method"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:ring-1 focus:ring-blue-600"
              >
                <option value="MERIT">Merit-Based (Marks Ranked)</option>
                <option value="RANDOM">Random Seeded Distribution</option>
              </select>
            </div>
          </div>

          {/* Target Sections Multi-Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Target Sections for Distribution ({selectedSectionIds.length} of {targetSections.length} Selected)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {targetSections.map((sec) => {
                const isSelected = selectedSectionIds.includes(sec.section_name);
                return (
                  <div
                    key={sec.section_id}
                    onClick={() => toggleTargetSection(sec.section_name)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>{sec.section_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block font-normal">
                        Room: {sec.room} • Cap: {sec.capacity}
                      </span>
                    </div>
                    <Badge variant={isSelected ? 'default' : 'outline'} className="text-[10px]">
                      {sec.current_enrolled}/{sec.capacity}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Students List */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Eligible Cohort Pool ({sourceStudents.length} Candidate Students)
            </CardTitle>
            <CardDescription className="text-xs">
              Students eligible for allocation in {grade} {isSeniorSecondary ? `— ${stream}` : ''}
            </CardDescription>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleGeneratePreview}
            className="text-xs bg-blue-900 hover:bg-blue-800 font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Allocation Preview</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Merit Rank</th>
                  <th className="py-2.5 px-4">Student ID</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Qualifying Score</th>
                  <th className="py-2.5 px-4">Gender</th>
                  <th className="py-2.5 px-4">Current Section</th>
                  <th className="py-2.5 px-4">Eligibility Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sourceStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      #{s.merit_rank}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {s.student_id}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {s.student_name}
                    </td>
                    <td className="py-2.5 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {s.qualifying_marks}%
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{s.gender}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{s.current_section}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40">
                        Eligible for {isSeniorSecondary ? stream : grade}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Allocation History Ledger */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Institutional Allocation History Ledger
            </CardTitle>
          </div>
          <span className="text-xs text-slate-400 font-mono">Mock Audit Trail</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Batch Date</th>
                  <th className="py-2.5 px-4">Academic Year</th>
                  <th className="py-2.5 px-4">Grade & Stream</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Students</th>
                  <th className="py-2.5 px-4">Published By</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">{h.date}</td>
                    <td className="py-2.5 px-4 font-mono">{h.academic_year}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {h.grade} {h.stream ? `— ${h.stream}` : ''}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={h.allocation_method === 'MERIT' ? 'default' : 'secondary'} className="text-[10px]">
                        {h.allocation_method}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold">{h.student_count}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{h.published_by}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="success" className="text-[10px]">
                        {h.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">{h.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Preview Modal */}
      <AllocationPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirmPublish={handlePublishAllocation}
        isPublishing={isPublishing}
        records={previewRecords}
        grade={grade}
        stream={isSeniorSecondary ? stream : undefined}
        method={method}
      />
    </div>
  );
};
