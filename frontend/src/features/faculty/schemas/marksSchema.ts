/**
 * Student ERP — Faculty Marks Entry Validation Schema
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Rules:
 * - Mark obtained must be a number between 0 and 100 inclusive, or 'AB' for absent.
 * - GPA, CGPA, credits, and grade points are strictly forbidden.
 */

import { z } from 'zod';

export const MarkScoreSchema = z.union([
  z.number().min(0, 'Marks cannot be negative').max(100, 'Marks cannot exceed 100'),
  z.literal('AB'),
  z.literal(''),
]);

export const FacultyMarkEntryItemSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  roll_number: z.string().min(1, 'Roll number is required'),
  student_name: z.string().min(1, 'Student name is required'),
  score: MarkScoreSchema,
  derived_percentage: z.number().nullable(),
  derived_grade: z.string(),
  feedback: z.string().max(300, 'Teacher remark cannot exceed 300 characters').optional().default(''),
});

export const FacultyMarksBatchSchema = z.object({
  exam_name: z.string().min(1, 'Examination name is required'),
  class_id: z.string().min(1, 'Class selection is required'),
  subject_code: z.string().min(1, 'Subject is required'),
  entries: z.array(FacultyMarkEntryItemSchema).min(1, 'At least one student record is required'),
});

export type MarkScoreValue = z.infer<typeof MarkScoreSchema>;
export type FacultyMarkEntryItemInput = z.infer<typeof FacultyMarkEntryItemSchema>;
export type FacultyMarksBatchInput = z.infer<typeof FacultyMarksBatchSchema>;

/**
 * Validates a single score string or number input from the marks sheet.
 * Returns either parsed valid value ({ valid: true, value }) or error message ({ valid: false, error }).
 */
export function validateMarkInput(raw: string | number): { valid: boolean; value?: number | 'AB' | ''; error?: string } {
  if (raw === '' || raw === null || raw === undefined) {
    return { valid: true, value: '' };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return { valid: true, value: '' };
    if (trimmed.toUpperCase() === 'AB') {
      return { valid: true, value: 'AB' };
    }
    const num = Number(trimmed);
    if (isNaN(num)) {
      return { valid: false, error: "Must be a number (0–100) or 'AB'" };
    }
    if (num < 0) {
      return { valid: false, error: 'Marks cannot be negative' };
    }
    if (num > 100) {
      return { valid: false, error: 'Marks cannot exceed 100' };
    }
    return { valid: true, value: num };
  }

  if (typeof raw === 'number') {
    if (isNaN(raw)) return { valid: false, error: 'Invalid numeric value' };
    if (raw < 0) return { valid: false, error: 'Marks cannot be negative' };
    if (raw > 100) return { valid: false, error: 'Marks cannot exceed 100' };
    return { valid: true, value: raw };
  }

  return { valid: false, error: "Must be a number (0–100) or 'AB'" };
}
