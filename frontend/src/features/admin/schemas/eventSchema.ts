/**
 * Student ERP — Admin Calendar Event Zod Schema
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import { z } from 'zod';

export const adminEventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  category: z.enum(['Examination', 'Academic', 'Holiday', 'PTM', 'Sports', 'Cultural'], {
    required_error: 'Please select a valid event category',
  }),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().min(2, 'Venue/Location is required'),
  description: z.string().min(5, 'Event description must be at least 5 characters'),
  target_audience: z.string().min(2, 'Target audience is required'),
  academic_relevance: z.string().optional().default('General Institutional'),
  od_eligible: z.boolean().default(false),
  is_holiday: z.boolean().default(false),
});

export type AdminEventInput = z.infer<typeof adminEventSchema>;
