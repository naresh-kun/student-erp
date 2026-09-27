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
import { StudentAbsenteesTable } from '@/components/attendance/StudentAbsenteesTable';
import { AttendanceNotEnteredTable } from '@/components/attendance/AttendanceNotEnteredTable';
import {
  useAssignedClasses,
  useFacultyAttendanceSession,
  FacultyAttendanceRollCallSheet,
} from '@/features/faculty';
import { ClipboardCheck, UserX, Clock } from 'lucide-react';

export const FacultyAttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roll_call' | 'absentees' | 'not_entered'>('roll_call');
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('roll_call')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'roll_call'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Session Roll Call
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('absentees')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'absentees'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserX className="w-4 h-4" />
            Assigned Section Absentees
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('not_entered')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'not_entered'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            My Unentered Sessions
          </button>
        </div>

        {activeTab === 'roll_call' && (
          <div className="space-y-6">
            {/* Filter Controls Bar */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Class Selector */}
                <div>
                  <label htmlFor="assigned-class-select" className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Assigned Class
                  </label>
                  <select
                    id="assigned-class-select"
                    aria-label="Assigned Class"
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
                  <label htmlFor="timetable-period-select" className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Timetable Period
                  </label>
                  <select
                    id="timetable-period-select"
                    aria-label="Timetable Period"
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
                  <label htmlFor="session-date-input" className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Session Date
                  </label>
                  <input
                    id="session-date-input"
                    aria-label="Session Date"
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
        )}

        {activeTab === 'absentees' && (
          <StudentAbsenteesTable userRole="Faculty" facultyId="fac_001" />
        )}

        {activeTab === 'not_entered' && (
          <AttendanceNotEnteredTable userRole="Faculty" facultyId="fac_001" />
        )}
      </div>
    </PageContainer>
  );
};
