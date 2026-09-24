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
  name: 'Vidya Mandir Senior Secondary School',
  shortName: 'Vidya Mandir',
  tagline: 'Excellence in Education, Character & Leadership',
  affiliationNotice: 'Affiliated to National Secondary Curriculum Framework (CBSE / ICSE Pattern)',
  academicYear: '2026–27',
  establishedYear: 1988,
  campusLocation: 'Institutional Area, Sector 12, RK Puram',
  city: 'New Delhi',
  state: 'Delhi',
  pinCode: '110022',
  contactEmail: 'office@vidyamandir.edu.in',
  contactPhone: '+91-11-2618-4001',
  boardPattern: 'Senior Secondary (Grades 1–12)',
};
