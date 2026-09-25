/**
 * Student ERP — Faculty Attendance Roll Call Validation Schema
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Enforces Master Plan Amendment 2:
 * - Exactly 4 canonical statuses: PRESENT, ABSENT, ON_DUTY, LEAVE.
 * - LATE and EXCUSED are rejected.
 * - Sessions require class, section, date, subject, period context.
 */

import { z } from 'zod';

export const CanonicalAttendanceStatusSchema = z.enum([
  'PRESENT',
  'ABSENT',
  'ON_DUTY',
  'LEAVE',
]);

export const AttendanceRollCallItemSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  roll_number: z.string().min(1, 'Roll number is required'),
  name: z.string().min(1, 'Student name is required'),
  status: CanonicalAttendanceStatusSchema,
  leave_reason: z.string().optional(),
  approved_by: z.string().optional(),
  note: z.string().max(200, 'Note cannot exceed 200 characters').optional(),
});

export const AttendanceSessionSubmissionSchema = z.object({
  academic_year: z.string().min(1, 'Academic year is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  class_id: z.string().min(1, 'Class is required'),
  section_id: z.string().min(1, 'Section is required'),
  subject: z.string().min(1, 'Subject is required'),
  period: z.string().min(1, 'Period is required'),
  records: z.array(AttendanceRollCallItemSchema).min(1, 'At least one student record is required'),
});

export type AttendanceRollCallItemInput = z.infer<typeof AttendanceRollCallItemSchema>;
export type AttendanceSessionSubmissionInput = z.infer<typeof AttendanceSessionSubmissionSchema>;
