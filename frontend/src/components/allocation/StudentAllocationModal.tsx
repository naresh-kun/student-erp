import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { StudentAllocationItem } from '@/types';
import { Lock } from 'lucide-react';

export interface StudentAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAllocationItem | null;
  onSave: (
    studentId: string,
    updates: {
      grade_name: string;
      grade_level: number;
      stream?: string;
      section_name: string;
      section_id?: string;
      roll_number: string;
    }
  ) => Promise<void>;
}

const SECTIONS_BY_STREAM: Record<string, string[]> = {
  'Computer Science A': ['Section A1', 'Section A2', 'Section A3'],
  'Bio-Maths B': ['Section B1', 'Section B2', 'Section B3'],
  'Commerce C': ['Section C1', 'Section C2', 'Section C3'],
  'Pure Science D': ['Section D1', 'Section D2', 'Section D3'],
};

const GRADE_10_SECTIONS = ['Section A', 'Section B'];

export const StudentAllocationModal: React.FC<StudentAllocationModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
}) => {
  const [grade, setGrade] = useState<string>('Grade 11');
  const [stream, setStream] = useState<string>('Computer Science A');
  const [section, setSection] = useState<string>('Section A2');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setGrade(student.grade_name || 'Grade 11');
      setStream(student.stream || 'Computer Science A');
      setSection(student.section_name === 'Unallocated' ? 'Section A2' : student.section_name);
      setRollNumber(student.roll_number || '');
      setError(null);
    }
  }, [student, isOpen]);

  const isSenior = grade === 'Grade 11' || grade === 'Grade 12';

  // Handle grade change
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    if (newGrade === 'Grade 10') {
      setStream('');
      setSection(GRADE_10_SECTIONS[0]);
    } else {
      const defaultStream = stream || 'Computer Science A';
      setStream(defaultStream);
      setSection(SECTIONS_BY_STREAM[defaultStream]?.[0] || 'Section A1');
    }
  };

  // Handle stream change
  const handleStreamChange = (newStream: string) => {
    setStream(newStream);
    const availableSections = SECTIONS_BY_STREAM[newStream] || [];
    setSection(availableSections[0] || 'Section A1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (!rollNumber.trim()) {
      setError('Roll number is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const gradeLevel = grade === 'Grade 12' ? 12 : grade === 'Grade 11' ? 11 : 10;
      await onSave(student.student_id, {
        grade_name: grade,
        grade_level: gradeLevel,
        stream: isSenior ? stream : undefined,
        section_name: section,
        roll_number: rollNumber.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update student allocation');
    } finally {
      setIsSaving(false);
    }
  };

  if (!student) return null;

  const availableSections = isSenior
    ? SECTIONS_BY_STREAM[stream] || ['Section A1', 'Section A2']
    : GRADE_10_SECTIONS;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Student Section Allocation"
      subtitle="Reassign academic grade, stream, section, and roll number for this student"
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
            {isSaving ? 'Updating...' : 'Save Allocation'}
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

        {/* Student Immutable ID & Name */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Student Name:</span>
            <strong className="text-slate-900 dark:text-slate-100">{student.student_name}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Student ID (Immutable):</span>
            </span>
            <Badge variant="outline" className="font-mono text-blue-700 dark:text-blue-400 border-blue-200">
              {student.student_id}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Academic Year:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{student.academic_year}</span>
          </div>
        </div>

        {/* Grade Selection */}
        <div className="space-y-1">
          <label htmlFor="student-grade-select" className="font-semibold text-slate-700 dark:text-slate-300 block">
            Target Grade Level
          </label>
          <select
            id="student-grade-select"
            value={grade}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600"
          >
            <option value="Grade 11">Grade 11 (Senior Secondary)</option>
            <option value="Grade 12">Grade 12 (Senior Secondary)</option>
            <option value="Grade 10">Grade 10 (Secondary Core)</option>
          </select>
        </div>

        {/* Stream Selection (Stream-Aware for Grades 11-12) */}
        <div className="space-y-1">
          <label htmlFor="student-stream-select" className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Senior Secondary Stream</span>
            {!isSenior && <span className="text-[10px] text-slate-400 font-normal">Not Applicable for Grade 10</span>}
          </label>
          <select
            id="student-stream-select"
            disabled={!isSenior}
            value={isSenior ? stream : ''}
            onChange={(e) => handleStreamChange(e.target.value)}
            className={`w-full px-3 py-2 text-xs rounded-md border ${
              isSenior
                ? 'border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {isSenior ? (
              <>
                <option value="Computer Science A">Computer Science A (A1, A2, A3)</option>
                <option value="Bio-Maths B">Bio-Maths B (B1, B2, B3)</option>
                <option value="Commerce C">Commerce C (C1, C2, C3)</option>
                <option value="Pure Science D">Pure Science D (D1, D2, D3)</option>
              </>
            ) : (
              <option value="">No Stream (General Core)</option>
            )}
          </select>
        </div>

        {/* Section Selection */}
        <div className="space-y-1">
          <label htmlFor="student-section-select" className="font-semibold text-slate-700 dark:text-slate-300 block">
            Target Section
          </label>
          <select
            id="student-section-select"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-600"
          >
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Roll Number */}
        <div className="space-y-1">
          <label htmlFor="student-roll-input" className="font-semibold text-slate-700 dark:text-slate-300 block">
            Roll Number (Allocation-Owned)
          </label>
          <input
            id="student-roll-input"
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. 11-A2-04"
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </form>
    </Modal>
  );
};
