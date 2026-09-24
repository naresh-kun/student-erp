/**
 * Student ERP — Institutional Configuration
 * Synthetic Indian School Identity (CBSE / ICSE Senior Secondary Model)
 */

export interface SchoolConfig {
  name: string;
  shortName: string;
  tagline: string;
  affiliationNotice: string;
  academicYear: string;
  establishedYear: number;
  campusLocation: string;
  city: string;
  state: string;
  pinCode: string;
  contactEmail: string;
  contactPhone: string;
  boardPattern: string;
}

export const SCHOOL_CONFIG: SchoolConfig = {
  name: 'School ERP',
  shortName: 'School ERP',
  tagline: 'Excellence in Education, Character & Leadership',
  affiliationNotice: 'Affiliated to National Secondary Curriculum Framework (CBSE / ICSE Pattern)',
  academicYear: '2026–27',
  establishedYear: 2000,
  campusLocation: 'K.K. Nagar',
  city: 'Madurai',
  state: 'Tamil Nadu',
  pinCode: '625001',
  contactEmail: 'office@schoolerp.edu.in',
  contactPhone: '+91-452-2618-4001',
  boardPattern: 'Senior Secondary (Grades 1–12)',
};
