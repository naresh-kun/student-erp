import { describe, it, expect } from 'vitest';
import {
  ATTENDANCE_STATUSES,
  calculateAttendancePercentage,
  calculateAttendanceFromRecords,
  isAttending,
  isAbsence,
  getAttendanceStatusLabel,
  getAttendanceStatusDescription,
  ATTENDANCE_CHART_COLORS,
} from '../src/utils/attendance';
import type { AttendanceStatus } from '../src/types';

describe('Master Plan Amendment 2 — Attendance Four-Status Model & Calculations', () => {
  describe('Canonical Status Set', () => {
    it('defines exactly the four approved statuses: PRESENT, ABSENT, ON_DUTY, LEAVE', () => {
      expect(ATTENDANCE_STATUSES).toHaveLength(4);
      expect(ATTENDANCE_STATUSES).toContain('PRESENT');
      expect(ATTENDANCE_STATUSES).toContain('ABSENT');
      expect(ATTENDANCE_STATUSES).toContain('ON_DUTY');
      expect(ATTENDANCE_STATUSES).toContain('LEAVE');
    });

    it('ensures LATE and EXCUSED are removed and not present in canonical statuses', () => {
      const statuses = ATTENDANCE_STATUSES as unknown as string[];
      expect(statuses).not.toContain('LATE');
      expect(statuses).not.toContain('Late');
      expect(statuses).not.toContain('EXCUSED');
      expect(statuses).not.toContain('Excused');
    });
  });

  describe('Attendance Percentage Formula', () => {
    // Formula: (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100

    it('returns 0 when total sessions is 0', () => {
      const percentage = calculateAttendancePercentage({
        present: 0,
        absent: 0,
        onDuty: 0,
        leave: 0,
      });
      expect(percentage).toBe(0);
    });

    it('returns 100% when only PRESENT sessions exist', () => {
      const percentage = calculateAttendancePercentage({
        present: 50,
        absent: 0,
        onDuty: 0,
        leave: 0,
      });
      expect(percentage).toBe(100);
    });

    it('returns 100% when only ON_DUTY sessions exist (counts as present)', () => {
      const percentage = calculateAttendancePercentage({
        present: 0,
        absent: 0,
        onDuty: 30,
        leave: 0,
      });
      expect(percentage).toBe(100);
    });

    it('returns 0% when only ABSENT sessions exist', () => {
      const percentage = calculateAttendancePercentage({
        present: 0,
        absent: 20,
        onDuty: 0,
        leave: 0,
      });
      expect(percentage).toBe(0);
    });

    it('returns 0% when only LEAVE sessions exist (counts as absence)', () => {
      const percentage = calculateAttendancePercentage({
        present: 0,
        absent: 0,
        onDuty: 0,
        leave: 15,
      });
      expect(percentage).toBe(0);
    });

    it('correctly calculates mixed scenario: 78 Present, 4 On-Duty, 3 Leave, 2 Absent', () => {
      // Total = 78 + 4 + 3 + 2 = 87
      // Numerator = 78 + 4 = 82
      // 82 / 87 * 100 = 94.2528... -> 94.3%
      const percentage = calculateAttendancePercentage({
        present: 78,
        onDuty: 4,
        leave: 3,
        absent: 2,
      });
      expect(percentage).toBe(94.3);
    });

    it('verifies that LEAVE reduces attendance percentage compared to all-present', () => {
      const withoutLeave = calculateAttendancePercentage({
        present: 90,
        onDuty: 0,
        leave: 0,
        absent: 0,
      });
      const withLeave = calculateAttendancePercentage({
        present: 90,
        onDuty: 0,
        leave: 10,
        absent: 0,
      });
      expect(withoutLeave).toBe(100);
      expect(withLeave).toBe(90.0);
      expect(withLeave).toBeLessThan(withoutLeave);
    });

    it('verifies that ON_DUTY increases attendance percentage compared to plain absence', () => {
      const withAbsence = calculateAttendancePercentage({
        present: 80,
        absent: 20,
        onDuty: 0,
        leave: 0,
      });
      const withOnDuty = calculateAttendancePercentage({
        present: 80,
        absent: 10,
        onDuty: 10,
        leave: 0,
      });
      expect(withAbsence).toBe(80.0);
      expect(withOnDuty).toBe(90.0);
    });
  });

  describe('calculateAttendanceFromRecords', () => {
    it('correctly tallies individual records and computes effective present/absent counts', () => {
      const sampleRecords: Array<{ status: AttendanceStatus }> = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ON_DUTY' },
        { status: 'LEAVE' },
        { status: 'ABSENT' },
      ];

      const result = calculateAttendanceFromRecords(sampleRecords);
      expect(result.total).toBe(6);
      expect(result.present).toBe(3);
      expect(result.onDuty).toBe(1);
      expect(result.leave).toBe(1);
      expect(result.absent).toBe(1);
      expect(result.effectivePresent).toBe(4); // 3 + 1
      expect(result.effectiveAbsent).toBe(2);  // 1 + 1
      // (4 / 6) * 100 = 66.666... -> 66.7
      expect(result.percentage).toBe(66.7);
    });
  });

  describe('Semantic Predicates & Business Rules', () => {
    it('identifies attending statuses (PRESENT and ON_DUTY)', () => {
      expect(isAttending('PRESENT')).toBe(true);
      expect(isAttending('ON_DUTY')).toBe(true);
      expect(isAttending('ABSENT')).toBe(false);
      expect(isAttending('LEAVE')).toBe(false);
    });

    it('identifies absence statuses (ABSENT and LEAVE)', () => {
      expect(isAbsence('ABSENT')).toBe(true);
      expect(isAbsence('LEAVE')).toBe(true);
      expect(isAbsence('PRESENT')).toBe(false);
      expect(isAbsence('ON_DUTY')).toBe(false);
    });

    it('provides clear distinction in status labels and descriptions', () => {
      expect(getAttendanceStatusLabel('LEAVE')).toBe('Leave');
      expect(getAttendanceStatusDescription('LEAVE')).toContain('Faculty-approved leave');
      expect(getAttendanceStatusDescription('LEAVE')).toContain('Counts as absence');

      expect(getAttendanceStatusLabel('ON_DUTY')).toBe('On Duty');
      expect(getAttendanceStatusDescription('ON_DUTY')).toContain('Counts as present');
    });

    it('ensures LEAVE chart color is visually distinct from ABSENT and ON_DUTY', () => {
      expect(ATTENDANCE_CHART_COLORS.LEAVE).not.toBe(ATTENDANCE_CHART_COLORS.ABSENT);
      expect(ATTENDANCE_CHART_COLORS.LEAVE).not.toBe(ATTENDANCE_CHART_COLORS.ON_DUTY);
      expect(ATTENDANCE_CHART_COLORS.LEAVE).not.toBe(ATTENDANCE_CHART_COLORS.PRESENT);
    });
  });
});
