/**
 * Student ERP — FacultyStudentRosterTable Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the school classroom register roster for assigned students.
 * - Permanent, unique, immutable Student ID (e.g. STU202600001)
 * - Roll Number, Admission Number, Enrolled Ward name
 * - Attendance Rate & Academic 8-Tier Grade (A1 to E)
 * - Search filter & CSV export
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, Search } from 'lucide-react';
import { getGradeBadgeClass } from '@/utils/grading';
import type { FacultyAssignedStudent, FacultyAssignedClass } from '../types';

interface FacultyStudentRosterTableProps {
  students: FacultyAssignedStudent[];
  activeClass: FacultyAssignedClass | null;
}

export const FacultyStudentRosterTable: React.FC<FacultyStudentRosterTableProps> = ({
  students,
  activeClass,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(term) ||
      s.student_id.toLowerCase().includes(term) ||
      s.roll_number.toLowerCase().includes(term) ||
      s.admission_number.toLowerCase().includes(term)
    );
  });

  const handleExportCSV = () => {
    const headers = [
      'Roll No',
      'Student ID',
      'Admission No',
      'Student Name',
      'Gender',
      'Class',
      'Section',
      'Attendance %',
      'Academic %',
      'Grade',
      'Parent Contact',
      'Status',
    ];
    const rows = filtered.map((s) => [
      s.roll_number,
      s.student_id,
      s.admission_number,
      `"${s.full_name}"`,
      s.gender,
      s.class_name,
      s.section_name,
      `${s.attendance_rate}%`,
      `${s.academic_percentage}%`,
      s.grade,
      `"${s.parent_name} (${s.parent_contact})"`,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Class_Roster_${activeClass?.class_name || 'Class'}_${activeClass?.section_name || 'Section'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activeClass?.display_name || 'Class'} — Student Enrolled Roster
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filtered.length} Students
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Assigned Subject: <strong>{activeClass?.subject || 'Mathematics'}</strong> (Code:{' '}
              {activeClass?.subject_code || 'MATH-041'}) • Room: {activeClass?.room}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, roll, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs h-8 shrink-0"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No students found matching "{searchTerm}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Admission No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Academic %</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Parent / Guardian Contact</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {s.roll_number}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {s.student_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{s.admission_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {s.full_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{s.gender}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {s.attendance_rate}%
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                      {s.academic_percentage}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(
                          s.grade
                        )}`}
                      >
                        {s.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {s.parent_name} ({s.parent_contact})
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
