/**
 * Student ERP — Attendance Utilities
 * Master Plan Amendment 2: Attendance Four-Status Model (PRESENT, ABSENT, ON_DUTY, LEAVE)
 * 
 * Business Rules:
 * 1. LEAVE represents an absence with permission approved by faculty/school.
 * 2. Faculty is responsible for approving/marking LEAVE within their authorized scope.
 * 3. LEAVE counts as an absence in attendance percentage calculations (in the denominator only).
 * 4. ON_DUTY represents authorized institutional duty and counts as present (in numerator and denominator).
 * 5. Formula:
 *      Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 * 6. LATE and EXCUSED are deprecated/removed and must NOT be used.
 */

import type { AttendanceStatus } from '@/types';

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  'PRESENT',
  'ABSENT',
  'ON_DUTY',
  'LEAVE',
] as const;

export interface AttendanceCounts {
  present: number;
  absent: number;
  onDuty: number;
  leave: number;
}

export interface AttendanceSummary extends AttendanceCounts {
  total: number;
  effectivePresent: number; // PRESENT + ON_DUTY
  effectiveAbsent: number;  // ABSENT + LEAVE
  percentage: number;
}

/**
 * Calculates attendance percentage according to Master Plan Amendment 2 rule:
 * Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
 */
export function calculateAttendancePercentage(counts: AttendanceCounts): number {
  const { present = 0, absent = 0, onDuty = 0, leave = 0 } = counts;
  const total = present + absent + onDuty + leave;
  if (total <= 0) return 0;
  const percentage = ((present + onDuty) / total) * 100;
  return Number(percentage.toFixed(1));
}

/**
 * Aggregates a list of attendance records into categorized counts and percentage
 */
export function calculateAttendanceFromRecords(
  records: Array<{ status: AttendanceStatus }>
): AttendanceSummary {
  let present = 0;
  let absent = 0;
  let onDuty = 0;
  let leave = 0;

  for (const record of records) {
    switch (record.status) {
      case 'PRESENT':
        present++;
        break;
      case 'ON_DUTY':
        onDuty++;
        break;
      case 'ABSENT':
        absent++;
        break;
      case 'LEAVE':
        leave++;
        break;
    }
  }

  const total = present + absent + onDuty + leave;
  const effectivePresent = present + onDuty;
  const effectiveAbsent = absent + leave;
  const percentage = total === 0 ? 0 : Number(((effectivePresent / total) * 100).toFixed(1));

  return {
    present,
    absent,
    onDuty,
    leave,
    total,
    effectivePresent,
    effectiveAbsent,
    percentage,
  };
}

/**
 * Returns true if status contributes to attendance presence (PRESENT or ON_DUTY)
 */
export function isAttending(status: AttendanceStatus): boolean {
  return status === 'PRESENT' || status === 'ON_DUTY';
}

/**
 * Returns true if status contributes to absence in percentage calculation (ABSENT or LEAVE)
 */
export function isAbsence(status: AttendanceStatus): boolean {
  return status === 'ABSENT' || status === 'LEAVE';
}

/**
 * Human-readable display label for attendance statuses
 */
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'ABSENT':
      return 'Absent';
    case 'ON_DUTY':
      return 'On Duty';
    case 'LEAVE':
      return 'Leave';
  }
}

/**
 * Full descriptive label distinguishing Approved Leave and Institutional On-Duty
 */
export function getAttendanceStatusDescription(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT':
      return 'Present in lecture';
    case 'ABSENT':
      return 'Unapproved absence';
    case 'ON_DUTY':
      return 'Authorized institutional duty (Counts as present)';
    case 'LEAVE':
      return 'Faculty-approved leave (Counts as absence)';
  }
}

/**
 * Semantic Badge variant for UI components
 */
export function getAttendanceBadgeVariant(
  status: AttendanceStatus
): 'success' | 'destructive' | 'info' | 'warning' | 'outline' {
  switch (status) {
    case 'PRESENT':
      return 'success';
    case 'ON_DUTY':
      return 'info';
    case 'ABSENT':
      return 'destructive';
    case 'LEAVE':
      return 'warning';
  }
}

/**
 * Hex colors for Recharts visualization ensuring LEAVE is visually distinct
 * from ABSENT (rose/red) and ON_DUTY (blue/sky).
 */
export const ATTENDANCE_CHART_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: '#10b981', // Emerald green
  ON_DUTY: '#3b82f6', // Bright Blue
  ABSENT: '#f43f5e',  // Rose / Coral Red
  LEAVE: '#8b5cf6',   // Distinct Violet / Purple
};

/**
 * Tailored CSS classes for badges/pills ensuring high visual contrast
 */
export const ATTENDANCE_BADGE_CLASSES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  ON_DUTY: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  ABSENT: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  LEAVE: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};
