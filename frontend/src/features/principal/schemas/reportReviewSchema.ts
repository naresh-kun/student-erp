/**
 * Student ERP — Principal Report Review & Oversight Zod Schema
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { z } from 'zod';

export const reportReviewSchema = z.object({
  status: z.enum(['Approved', 'Review', 'Draft'], {
    required_error: 'Please select an approval state',
  }),
  approved_by: z.string().default('Dr. K. Radhakrishnan (Principal)'),
  remarks: z.string().optional().default('Approved for official institutional filing.'),
});

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
