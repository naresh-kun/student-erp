/**
 * Student ERP — Parent Absence Notice Validation Schema
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Enforces strict validation for absence notifications sent to class faculty.
 * Note: Absence notifications are submitted strictly in PENDING state;
 * parents CANNOT self-approve or directly mutate attendance records into LEAVE.
 */

import { z } from 'zod';

export const ABSENCE_CATEGORIES = [
  'Medical / Illness',
  'Family Event / Function',
  'Religious Observance',
  'Educational Competition / Exam',
  'Other',
] as const;

export type AbsenceCategory = (typeof ABSENCE_CATEGORIES)[number];

export const parentAbsenceNoticeSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  date: z
    .string()
    .min(1, 'Date of absence is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must follow YYYY-MM-DD format'),
  category: z.enum(ABSENCE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid absence reason category' }),
  }),
  explanation: z
    .string()
    .min(10, 'Please provide an explanation of at least 10 characters')
    .max(300, 'Explanation cannot exceed 300 characters'),
});

export type ParentAbsenceNoticeFormData = z.infer<typeof parentAbsenceNoticeSchema>;
