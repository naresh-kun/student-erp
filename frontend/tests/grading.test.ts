import { describe, it, expect } from 'vitest';
import { 
  calculateGrade, 
  calculatePercentage, 
  getGradeBadgeClass, 
  getGradeDescription,
  GRADE_SCALE_TIERS 
} from '../src/utils/grading';
import { formatDateIndian, formatAcademicYear, formatPercentage, formatMarks } from '../src/utils/dateFormat';

describe('Indian School Letter Grading System (CBSE / ICSE Pattern)', () => {
  describe('calculateGrade — Boundary Tests (Mandatory Specifications)', () => {
    it('evaluates 32.99 as E (< 33)', () => {
      expect(calculateGrade(32.99)).toBe('E');
    });

    it('evaluates 33 as D (>= 33 and < 41 passing threshold)', () => {
      expect(calculateGrade(33)).toBe('D');
    });

    it('evaluates 40.99 as D (just below 41)', () => {
      expect(calculateGrade(40.99)).toBe('D');
    });

    it('evaluates 41 as C2 (>= 41 and < 51)', () => {
      expect(calculateGrade(41)).toBe('C2');
    });

    it('evaluates 90.99 as A2 (just below 91)', () => {
      expect(calculateGrade(90.99)).toBe('A2');
    });

    it('evaluates 91 as A1 (>= 91)', () => {
      expect(calculateGrade(91)).toBe('A1');
    });

    it('evaluates 100 as A1 (maximum score)', () => {
      expect(calculateGrade(100)).toBe('A1');
    });
  });

  describe('calculateGrade — Complete 8-Tier Scale Verification', () => {
    it('correctly maps all 8 grade tiers within valid intervals', () => {
      expect(calculateGrade(95)).toBe('A1');   // 91-100
      expect(calculateGrade(85)).toBe('A2');   // 81-<91
      expect(calculateGrade(75)).toBe('B1');   // 71-<81
      expect(calculateGrade(65)).toBe('B2');   // 61-<71
      expect(calculateGrade(55)).toBe('C1');   // 51-<61
      expect(calculateGrade(45)).toBe('C2');   // 41-<51
      expect(calculateGrade(35)).toBe('D');    // 33-<41
      expect(calculateGrade(20)).toBe('E');    // <33
    });

    it('handles negative or invalid values gracefully by returning E', () => {
      expect(calculateGrade(-5)).toBe('E');
      expect(calculateGrade(NaN)).toBe('E');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates standard percentages accurately out of 100', () => {
      expect(calculatePercentage(88, 100)).toBe(88);
      expect(calculatePercentage(92.5, 100)).toBe(92.5);
    });

    it('handles non-100 maximum marks', () => {
      expect(calculatePercentage(45, 50)).toBe(90);
      expect(calculatePercentage(17, 20)).toBe(85);
    });

    it('handles absent ("AB") evaluation safely as 0', () => {
      expect(calculatePercentage('AB', 100)).toBe(0);
      expect(calculatePercentage(null, 100)).toBe(0);
      expect(calculatePercentage(undefined, 100)).toBe(0);
    });

    it('handles invalid maxMarks', () => {
      expect(calculatePercentage(80, 0)).toBe(0);
      expect(calculatePercentage(80, -10)).toBe(0);
    });
  });

  describe('Grade Metadata & Helpers', () => {
    it('contains exactly 8 scale tiers in descending order', () => {
      expect(GRADE_SCALE_TIERS.length).toBe(8);
      expect(GRADE_SCALE_TIERS.map(t => t.grade)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E']);
    });

    it('provides badge classes and descriptions for all grades', () => {
      ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'].forEach(g => {
        expect(getGradeBadgeClass(g)).toContain('border');
        expect(getGradeDescription(g)).toBeTruthy();
      });
    });
  });

  describe('Indian Date & Number Formatters', () => {
    it('formats ISO date to DD/MM/YYYY', () => {
      expect(formatDateIndian('2026-09-24')).toBe('24/09/2026');
      expect(formatDateIndian('2026-05-14T09:00:00Z')).toBe('14/05/2026');
    });

    it('normalizes academic year to 2026–27 style', () => {
      expect(formatAcademicYear('2026-2027')).toBe('2026–27');
      expect(formatAcademicYear('2026–27')).toBe('2026–27');
    });

    it('formats percentage with exactly 2 decimal places', () => {
      expect(formatPercentage(87)).toBe('87.00%');
      expect(formatPercentage(94.25)).toBe('94.25%');
    });

    it('formats marks string cleanly', () => {
      expect(formatMarks(88, 100)).toBe('88 / 100');
      expect(formatMarks('AB', 100)).toBe('AB / 100');
    });
  });
});
