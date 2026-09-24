/**
 * Student ERP — Student Profile Contact Validation Schema
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Note: Core academic credentials (student_id, roll_number, admission_number, stream, class)
 * are strictly permanent and immutable; only contact and emergency details can be updated.
 */

import { z } from 'zod';

export const studentProfileContactSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, 'Contact number must contain at least 10 digits')
    .max(20, 'Contact number must not exceed 20 characters')
    .regex(/^[+0-9\s-]+$/, 'Please enter a valid telephone / mobile number'),
  emergency_contact: z
    .string()
    .trim()
    .min(10, 'Emergency contact number must contain at least 10 digits')
    .max(20, 'Emergency contact number must not exceed 20 characters')
    .regex(/^[+0-9\s-]+$/, 'Please enter a valid telephone / mobile number'),
  address: z
    .string()
    .trim()
    .min(10, 'Residential address must be at least 10 characters')
    .max(250, 'Residential address must not exceed 250 characters'),
});

export type StudentProfileContactFormData = z.infer<typeof studentProfileContactSchema>;
