/**
 * Student ERP — Admin Class Allocation Zod Schema
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { z } from 'zod';

export const allocationExecutionSchema = z.object({
  academicYear: z.string().min(1, 'Academic Year is required'),
  grade: z.enum(['Grade 10', 'Grade 11', 'Grade 12'], {
    required_error: 'Please select a target Grade',
  }),
  stream: z
    .enum(['Computer Science A', 'Bio-Maths B', 'Commerce C', 'Pure Science D', 'None'])
    .optional(),
  method: z.enum(['MERIT', 'RANDOM'], {
    required_error: 'Please select an allocation method (Merit or Random)',
  }),
  targetSections: z
    .array(z.string())
    .min(1, 'Select at least one target section for allocation'),
}).refine(
  (data) => {
    // If Grade 11 or 12, stream must be selected and cannot be 'None'
    if (data.grade === 'Grade 11' || data.grade === 'Grade 12') {
      return !!data.stream && data.stream !== 'None';
    }
    return true;
  },
  {
    message: 'Senior Secondary (Grade 11 & 12) allocations require an approved Stream selection',
    path: ['stream'],
  }
);

export type AllocationExecutionInput = z.infer<typeof allocationExecutionSchema>;
