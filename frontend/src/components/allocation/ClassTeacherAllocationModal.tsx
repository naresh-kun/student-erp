import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ClassTeacherAllocationItem } from '@/types';

export interface ClassTeacherAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ClassTeacherAllocationItem | null;
  onSave: (
    sectionId: string,
    faculty: {
      faculty_id: string;
      faculty_name: string;
      employee_code: string;
      designation: string;
      subjects: string[];
    }
  ) => Promise<void>;
}

const AVAILABLE_FACULTY = [
  {
    id: 'fac_001',
    name: 'R. Suresh',
    code: 'FAC-MATH-012',
    designation: 'Senior PGT & Department Head',
    subjects: ['Mathematics'],
  },
  {
    id: 'fac_002',
    name: 'Priya Krishnan',
    code: 'FAC-CS-008',
    designation: 'PGT Computer Science',
    subjects: ['Computer Science'],
  },
  {
    id: 'fac_003',
    name: 'Karthik Raman',
    code: 'FAC-PHY-009',
    designation: 'PGT Physics',
    subjects: ['Physics'],
  },
  {
    id: 'fac_004',
    name: 'Meena Devi',
    code: 'FAC-ENG-015',
    designation: 'Senior PGT English',
    subjects: ['English Core'],
  },
  {
    id: 'fac_005',
    name: 'Anitha Joseph',
    code: 'FAC-CHEM-011',
    designation: 'PGT Chemistry',
    subjects: ['Chemistry'],
  },
];

export const ClassTeacherAllocationModal: React.FC<ClassTeacherAllocationModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('fac_001');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setSelectedFacultyId(record.faculty_id || 'fac_001');
      setError(null);
    }
  }, [record, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    const matchedFaculty = AVAILABLE_FACULTY.find((f) => f.id === selectedFacultyId);
    if (!matchedFaculty) {
      setError('Please select a valid faculty member.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(record.section_id, {
        faculty_id: matchedFaculty.id,
        faculty_name: matchedFaculty.name,
        employee_code: matchedFaculty.code,
        designation: matchedFaculty.designation,
        subjects: matchedFaculty.subjects,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update Class Teacher allocation');
    } finally {
      setIsSaving(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign / Update Class Teacher"
      subtitle={`Configure the designated Class Teacher for ${record.grade_name} — ${record.section_name}`}
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs h-8 border-slate-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="text-xs h-8 bg-blue-900 hover:bg-blue-800 font-semibold"
          >
            {isSaving ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Section Metadata Card */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Class & Section:</span>
            <strong className="text-slate-900 dark:text-slate-100">
              {record.grade_name} — {record.section_name}
            </strong>
          </div>
          {record.stream && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Senior Stream:</span>
              <Badge variant="outline" className="text-[10px]">
                {record.stream}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Academic Year:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{record.academic_year}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Current Status:</span>
            <Badge variant={record.is_assigned ? 'success' : 'warning'} className="text-[10px]">
              {record.assignment_status} {record.faculty_name !== 'Unassigned' ? `(${record.faculty_name})` : ''}
            </Badge>
          </div>
        </div>

        {/* Faculty Selector */}
        <div className="space-y-1.5">
          <label htmlFor="class-teacher-select" className="font-semibold text-slate-700 dark:text-slate-300 block">
            Select Faculty Member
          </label>
          <select
            id="class-teacher-select"
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600"
          >
            {AVAILABLE_FACULTY.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code}) — {f.designation} • {f.subjects.join(', ')}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            Designating this faculty as Class Teacher assigns attendance leave approval and pastoral oversight.
          </p>
        </div>
      </form>
    </Modal>
  );
};
