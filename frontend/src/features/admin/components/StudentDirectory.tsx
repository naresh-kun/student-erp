/**
 * Student ERP — Admin Student Master Directory Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * CRITICAL GOVERNANCE:
 * - Student ID (e.g. STU202600001) is permanent, unique, and immutable.
 * - Editing of the Student ID is strictly prohibited.
 * - Senior secondary students reflect their approved Stream (Computer Science A, Bio-Maths B, Commerce C, Pure Science D).
 * - Grades below 11 have no stream.
 * - Academic scoring uses Marks /100, %, and CBSE 8-tier letter grades (A1 to E).
 * - Strictly NO GPA or CGPA.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { useAdminStudents } from '../hooks/useAdminStudents';
import type { AdminStudentItem } from '../types';
import { getGradeBadgeClass } from '@/utils/grading';
import { 
  Search, 
  Eye, 
  X, 
  Phone, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export const StudentDirectory: React.FC = () => {
  const {
    students,
    isLoading,
    error,
    search,
    setSearch,
    gradeFilter,
    setGradeFilter,
    streamFilter,
    setStreamFilter,
    statusFilter,
    setStatusFilter,
    refresh,
  } = useAdminStudents();

  const [selectedStudent, setSelectedStudent] = useState<AdminStudentItem | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportCSV = () => {
    const headers = [
      'Student ID',
      'Admission No',
      'Roll No',
      'Student Name',
      'Grade',
      'Stream',
      'Section',
      'Parent Name',
      'Parent Contact',
      'Attendance %',
      'Academic %',
      'Letter Grade',
      'Status',
    ];

    const rows = students.map((s) => [
      s.student_id,
      s.admission_number,
      s.roll_number,
      `"${s.name}"`,
      s.grade_level,
      `"${s.stream || 'None'}"`,
      s.section_name,
      `"${s.parent_name}"`,
      s.parent_phone,
      `${s.attendance_percentage}%`,
      `${s.academic_percentage}%`,
      s.letter_grade,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Master_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${students.length} student records to CSV.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (isLoading && students.length === 0) {
    return <LoadingState message="Loading student master register from directory..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-5">
      {/* Export / Notification Alert */}
      {exportNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </span>
          <button onClick={() => setExportNotice(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Student ID, Name, Roll No, or Admission No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Filter Dropdowns & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grade Filter */}
            <select
              aria-label="Filter by Grade"
              value={gradeFilter !== undefined ? gradeFilter.toString() : 'ALL'}
              onChange={(e) => setGradeFilter(e.target.value === 'ALL' ? undefined : Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Grades</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>

            {/* Stream Filter */}
            <select
              aria-label="Filter by Stream"
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Streams</option>
              <option value="Computer Science A">Computer Science A</option>
              <option value="Bio-Maths B">Bio-Maths B</option>
              <option value="Commerce C">Commerce C</option>
              <option value="Pure Science D">Pure Science D</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs h-8 flex items-center gap-1.5 border-slate-300"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Student Master Table */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Student Master Register ({students.length} Records)
            </CardTitle>
            <CardDescription className="text-xs">
              System-generated permanent Student IDs and official enrollment profiles
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono">
            Session 2026–27
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No matching students found" description="Try adjusting your search query or filter criteria." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class & Stream</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Academic %</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Parent / Contact</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Permanent Student ID */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {student.student_id}
                      </td>

                      {/* Admission No */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {student.admission_number}
                      </td>

                      {/* Name & Roll No */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {student.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Roll: {student.roll_number}
                        </span>
                      </td>

                      {/* Class & Stream */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          Grade {student.grade_level}
                        </span>
                        {student.stream ? (
                          <Badge variant="outline" className="text-[10px] font-normal bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                            {student.stream}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-slate-400">General Core</span>
                        )}
                      </td>

                      {/* Section */}
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {student.section_name}
                      </td>

                      {/* Attendance % */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold font-mono ${
                            student.attendance_percentage >= 85
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : student.attendance_percentage >= 75
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {student.attendance_percentage}%
                        </span>
                      </td>

                      {/* Academic % */}
                      <td className="py-3 px-4 font-bold font-mono text-slate-800 dark:text-slate-200">
                        {student.academic_percentage}%
                      </td>

                      {/* Letter Grade */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${getGradeBadgeClass(student.letter_grade)}`}>
                          {student.letter_grade}
                        </span>
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {student.parent_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {student.parent_phone}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          className="h-7 px-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                  Permanent Student Record
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedStudent.name}</h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block">Permanent Student ID</span>
                <strong className="text-sm font-mono text-blue-800 dark:text-blue-300 font-black">
                  {selectedStudent.student_id}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Immutable institutional key</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block">Admission & Roll No</span>
                <strong className="text-sm font-mono text-slate-800 dark:text-slate-200">
                  {selectedStudent.admission_number}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Roll: {selectedStudent.roll_number}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block">Academic Placement</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  Grade {selectedStudent.grade_level} • {selectedStudent.section_name}
                </strong>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 block mt-0.5">
                  {selectedStudent.stream || 'Secondary Core Curriculum'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block">Parent / Guardian</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {selectedStudent.parent_name}
                </strong>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  {selectedStudent.parent_phone}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block">Attendance Score (P + OD)</span>
                <strong className="text-sm font-mono text-emerald-600 font-bold">
                  {selectedStudent.attendance_percentage}%
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Cleared CBSE 85% requirement</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block">Half-Yearly Evaluation</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <strong className="text-sm font-mono text-slate-900 dark:text-slate-100 font-bold">
                    {selectedStudent.academic_percentage}%
                  </strong>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${getGradeBadgeClass(selectedStudent.letter_grade)}`}>
                    Grade {selectedStudent.letter_grade}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Evaluation Marks out of 100</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedStudent(null)} className="text-xs">
                Close Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
