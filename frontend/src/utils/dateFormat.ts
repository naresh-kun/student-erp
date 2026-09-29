/**
 * Student ERP — Indian School Date & Number Presentation Formatter
 * Standard Indian format: DD/MM/YYYY
 * Academic year format: 2026–27
 */

export function formatDateIndian(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

export function formatAcademicYear(year: string): string {
  if (!year) return '2026–27';
  if (year.includes('–') || year.includes('-')) {
    // Normalise '2025-2026' or '2026-2027' to '2026–27'
    const parts = year.split(/[-–]/);
    if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 4) {
      return `${parts[0]}–${parts[1].slice(2)}`;
    }
  }
  return year;
}

export function formatPercentage(val: number): string {
  if (isNaN(val)) return '0.00%';
  return `${val.toFixed(2)}%`;
}

export function formatMarks(obtained: number | 'AB', max: number = 100): string {
  if (obtained === 'AB') return 'AB / 100';
  return `${obtained} / ${max}`;
}
