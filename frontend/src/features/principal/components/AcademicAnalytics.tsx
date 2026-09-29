/**
 * Student ERP — Principal Academic Analytics Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Grade-wise and stream-wise academic performance metrics.
 * - Assessment evaluations scored out of 100 marks and CBSE 8-tier letter grades.
 * - STRICTLY NO: GPA, CGPA, credits, or faculty performance rankings.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { usePrincipalAcademics } from '../hooks/usePrincipalAcademics';
import { Award, Layers } from 'lucide-react';

export const AcademicAnalytics: React.FC = () => {
  const {
    gradePerformance,
    streamPerformance,
    subjectPerformance,
    schoolGradeDistribution,
    gradeFilter,
    setGradeFilter,
    streamFilter,
    setStreamFilter,
    isLoading,
    error,
    refresh,
  } = usePrincipalAcademics();

  if (isLoading && gradePerformance.length === 0) {
    return <LoadingState message="Loading school-wide academic performance intelligence..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Institutional Academic Analytics Console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by Cohort"
              value={gradeFilter !== undefined ? gradeFilter.toString() : 'ALL'}
              onChange={(e) => setGradeFilter(e.target.value === 'ALL' ? undefined : Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Grade Cohorts</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>

            <select
              aria-label="Filter by Stream"
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Senior Streams</option>
              <option value="Computer Science A">Computer Science A</option>
              <option value="Bio-Maths B">Bio-Maths B</option>
              <option value="Commerce C">Commerce C</option>
              <option value="Pure Science D">Pure Science D</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Cohort Grade Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gradePerformance.map((gp) => (
          <Card key={gp.grade} className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{gp.grade}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {gp.enrolledStudents} Students
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
                {gp.academicAverage}%
              </span>
              <span className="text-xs text-slate-500 font-medium">Batch Average</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Pass Rate: <strong className="text-emerald-600">{gp.passRate}%</strong></span>
              <span>Top: <strong className="font-mono text-slate-700 dark:text-slate-300">{gp.highestScore}%</strong></span>
            </div>
          </Card>
        ))}
      </div>

      {/* Senior Secondary Stream Performance & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream Performance (Grades 11 & 12) */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>Senior Secondary Stream Comparison (Grades 11 & 12)</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                4 Approved Streams
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {streamPerformance.map((sp) => (
              <div
                key={sp.stream}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{sp.stream}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {sp.enrolledStudents} Enrolled
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block">Grade 11 Average</span>
                    <strong className="text-blue-700 dark:text-blue-400 font-mono text-sm">{sp.g11Average}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Grade 12 Average</span>
                    <strong className="text-indigo-700 dark:text-indigo-400 font-mono text-sm">{sp.g12Average}%</strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 pt-0.5">
                  Leading Subject: <strong className="text-slate-700 dark:text-slate-300">{sp.topSubject}</strong>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 8-Tier CBSE Grade Spread Register */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>CBSE 8-Tier Letter Grade Distribution</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Institutional Scale
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {schoolGradeDistribution.map((item) => (
              <div
                key={item.tier}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.tier}</span>
                  <div className="w-44 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${item.percentage * 2}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <strong className="text-sm font-mono text-slate-900 dark:text-slate-100 font-black">
                    {item.count}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Oversight */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Departmental Subject Quality & Pass Rate Overview
            </CardTitle>
            <CardDescription className="text-xs">
              Subject outcomes across Term 1 Half-Yearly examinations (Non-Credit Model)
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {subjectPerformance.length} Core Subjects
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Evaluated Candidates</th>
                  <th className="py-3 px-4 text-center">School Average (%)</th>
                  <th className="py-3 px-4 text-center">Pass Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectPerformance.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{sub.subjectName}</td>
                    <td className="py-3 px-4 font-mono text-blue-700 dark:text-blue-400 font-bold">{sub.code}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{sub.department}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{sub.evaluatedStudents}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                      {sub.schoolAverage}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                      {sub.passRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
