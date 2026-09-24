/**
 * Student ERP — Indian School Academic Evaluation & Grading System
 * Standard CBSE / ICSE-oriented 8-tier letter grading scale
 *
 * Authoritative Grading Scale:
 * A1 : 91 – 100
 * A2 : 81 – <91
 * B1 : 71 – <81
 * B2 : 61 – <71
 * C1 : 51 – <61
 * C2 : 41 – <51
 * D  : 33 – <41  (Passing Threshold)
 * E  : <33       (Needs Improvement / Remedial)
 */

export type LetterGrade = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E';

export interface GradeScaleTier {
  grade: LetterGrade;
  min: number;
  max: number;
  inclusiveMin: boolean;
  inclusiveMax: boolean;
  description: string;
  pointsRemark: string;
  badgeClass: string;
}

export const GRADE_SCALE_TIERS: GradeScaleTier[] = [
  {
    grade: 'A1',
    min: 91,
    max: 100,
    inclusiveMin: true,
    inclusiveMax: true,
    description: 'Outstanding',
    pointsRemark: 'Top Academic Distinction',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-800',
  },
  {
    grade: 'A2',
    min: 81,
    max: 91,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Excellent',
    pointsRemark: 'High Distinction',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-800',
  },
  {
    grade: 'B1',
    min: 71,
    max: 81,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Very Good',
    pointsRemark: 'Above Average Competence',
    badgeClass: 'bg-sky-500/10 text-sky-700 border-sky-300 dark:border-sky-800',
  },
  {
    grade: 'B2',
    min: 61,
    max: 71,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Good',
    pointsRemark: 'Sound Competence',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-300 dark:border-cyan-800',
  },
  {
    grade: 'C1',
    min: 51,
    max: 61,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Fair',
    pointsRemark: 'Satisfactory Progress',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-800',
  },
  {
    grade: 'C2',
    min: 41,
    max: 51,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Average',
    pointsRemark: 'Basic Passing Competence',
    badgeClass: 'bg-orange-500/10 text-orange-700 border-orange-300 dark:border-orange-800',
  },
  {
    grade: 'D',
    min: 33,
    max: 41,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Passing',
    pointsRemark: 'Marginal Pass Threshold',
    badgeClass: 'bg-yellow-500/10 text-yellow-800 border-yellow-300 dark:border-yellow-800',
  },
  {
    grade: 'E',
    min: 0,
    max: 33,
    inclusiveMin: true,
    inclusiveMax: false,
    description: 'Needs Improvement',
    pointsRemark: 'Remedial Support Required',
    badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:border-rose-800',
  },
];

/**
 * Maps a numerical percentage (0–100) strictly to its authoritative letter grade.
 *
 * Boundary rules:
 * - >= 91: 'A1' (up to 100)
 * - >= 81 and < 91: 'A2'
 * - >= 71 and < 81: 'B1'
 * - >= 61 and < 71: 'B2'
 * - >= 51 and < 61: 'C1'
 * - >= 41 and < 51: 'C2'
 * - >= 33 and < 41: 'D'
 * - < 33: 'E'
 */
export function calculateGrade(percentage: number): LetterGrade {
  if (isNaN(percentage) || percentage < 0) {
    return 'E';
  }
  if (percentage >= 91) {
    return 'A1';
  }
  if (percentage >= 81) {
    return 'A2';
  }
  if (percentage >= 71) {
    return 'B1';
  }
  if (percentage >= 61) {
    return 'B2';
  }
  if (percentage >= 51) {
    return 'C1';
  }
  if (percentage >= 41) {
    return 'C2';
  }
  if (percentage >= 33) {
    return 'D';
  }
  return 'E';
}

/**
 * Calculates academic percentage given marks obtained and maximum marks.
 * Handles 'AB' (Absent) explicitly.
 */
export function calculatePercentage(
  marksObtained: number | 'AB' | null | undefined,
  maxMarks: number = 100
): number {
  if (marksObtained === 'AB' || marksObtained === null || marksObtained === undefined) {
    return 0;
  }
  if (typeof marksObtained !== 'number' || isNaN(marksObtained)) {
    return 0;
  }
  if (maxMarks <= 0) {
    return 0;
  }
  const pct = (marksObtained / maxMarks) * 100;
  // Round to 2 decimal places to avoid floating-point artifacts
  return Math.round(pct * 100) / 100;
}

/**
 * Returns Tailwind CSS badge classes for a given grade
 */
export function getGradeBadgeClass(grade: string): string {
  const tier = GRADE_SCALE_TIERS.find((t) => t.grade === grade);
  return tier?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200';
}

/**
 * Returns descriptive qualitative remarks for a given grade
 */
export function getGradeDescription(grade: string): string {
  const tier = GRADE_SCALE_TIERS.find((t) => t.grade === grade);
  return tier?.description || 'Evaluated';
}
