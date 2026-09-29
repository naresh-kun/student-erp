/**
 * Student ERP — Faculty Leave Review Schema
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Rules:
 * - Only authorized Faculty/Class Teacher can approve student leave requests or parent absence notices.
 * - Actions: 'APPROVE' (converts to LEAVE) or 'REJECT' (remains non-leave).
 */

import { z } from 'zod';

export const LeaveReviewActionSchema = z.enum(['APPROVE', 'REJECT']);

export const LeaveReviewSubmissionSchema = z.object({
  notice_id: z.string().min(1, 'Notice ID is required'),
  action: LeaveReviewActionSchema,
  faculty_id: z.string().min(1, 'Faculty ID is required'),
  faculty_name: z.string().min(1, 'Faculty name is required'),
  note: z.string().max(300, 'Review remark cannot exceed 300 characters').optional(),
});

export type LeaveReviewSubmissionInput = z.infer<typeof LeaveReviewSubmissionSchema>;
