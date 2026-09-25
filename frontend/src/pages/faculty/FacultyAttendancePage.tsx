/**
 * Student ERP — FacultyAttendancePage
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Implements the session attendance recording register:
 * - Scoped exclusively to assigned classes & sections
 * - 4 Canonical Statuses: PRESENT, ABSENT, ON_DUTY, LEAVE
 * - "Mark All Present" live action
 * - Canonical formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 * - Shared utility: src/utils/attendance.ts (calculateAttendancePercentage)
 * - Auto-reflects Class Teacher approved leaves
 */

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/States';
import {
  useAssignedClasses,
  useFacultyAttendanceSession,
  FacultyAttendanceRollCallSheet,
} from '@/features/faculty';

export const FacultyAttendancePage: React.FC = () => {
  const { data: classes = [], isLoading: classesLoading } = useAssignedClasses();

  const [selectedClassId, setSelectedClassId] = useState('cls_001_sec_002');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (08:30 - 09:15)');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const {
    context,
    records,
    setStudentStatus,
    markAllPresent,
    submitSession,
    counts,
    attendancePercentage,
    isLoading: sessionLoading,
    isSubmitting,
    isSubmitted,
    setIsSubmitted,
  } = useFacultyAttendanceSession({
    class_id: activeClass?.class_id || 'cls_001',
    section_id: activeClass?.section_id || 'sec_002',
    class_display: activeClass?.display_name || 'Grade 11 — Section A2',
    subject: activeClass?.subject || 'Mathematics',
    period: selectedPeriod,
    date: selectedDate,
  });

  if (classesLoading || sessionLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading attendance session & class register..." />
      </PageContainer>
    );
  }

  const PERIODS = [
    'Period 1 (08:30 - 09:15)',
    'Period 3 (10:15 - 11:00)',
    'Period 5 (12:30 - 13:15)',
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Session Attendance Recording Register"
          description="Mark and submit session registers across the 4 canonical statuses: Present, On Duty, Leave, and Absent. Leave counts as absence in the denominator."
        />

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Assigned Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.display_name} ({cls.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Period Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Timetable Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
              >
                {PERIODS.map((prd) => (
                  <option key={prd} value={prd}>
                    {prd}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <span>Class Teacher: </span>
            <strong className="text-slate-800 dark:text-slate-200">
              {activeClass?.is_class_teacher ? 'R. Suresh (Self)' : 'Designated Teacher'}
            </strong>
          </div>
        </div>

        {/* Roll Call Sheet Component */}
        <FacultyAttendanceRollCallSheet
          context={context}
          records={records}
          counts={counts}
          attendancePercentage={attendancePercentage}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          onStatusChange={setStudentStatus}
          onMarkAllPresent={markAllPresent}
          onSubmitSession={submitSession}
          onEditSession={() => setIsSubmitted(false)}
        />
      </div>
    </PageContainer>
  );
};
