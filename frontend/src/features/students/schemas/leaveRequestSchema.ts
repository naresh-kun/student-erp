/**
 * Student ERP — Leave Request Validation Schema
 * Phase 2 — Task 2.2: Deep Student Role Experience
 */

import { z } from 'zod';

export const leaveTypes = [
  'Medical',
  'Family Function',
  'Bereavement',
  'Academic / Olympiad',
  'Other',
] as const;

export const leaveRequestSchema = z
  .object({
    leave_type: z.enum(leaveTypes, {
      errorMap: () => ({ message: 'Please select a valid institutional leave category' }),
    }),
    start_date: z
      .string()
      .min(1, 'Commencement date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    end_date: z
      .string()
      .min(1, 'Conclusion date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    reason: z
      .string()
      .trim()
      .min(10, 'Please provide an adequate justification (at least 10 characters)')
      .max(300, 'Reason must not exceed 300 characters'),
  })
  .refine(
    (data) => {
      if (!data.start_date || !data.end_date) return true;
      return new Date(data.start_date) <= new Date(data.end_date);
    },
    {
      message: 'Conclusion date cannot precede the commencement date',
      path: ['end_date'],
    }
  );

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
