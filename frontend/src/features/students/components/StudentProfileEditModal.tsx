/**
 * Student ERP — StudentProfileEditModal Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Allows updating editable contact records while keeping academic identifiers strictly immutable.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  studentProfileContactSchema, 
  type StudentProfileContactFormData 
} from '../schemas/studentProfileSchema';
import type { StudentProfile } from '../types';
import { Button } from '@/components/ui/Button';
import { Lock, X, AlertCircle } from 'lucide-react';

interface StudentProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (data: StudentProfileContactFormData) => Promise<{ success: boolean; error?: string }>;
}

export const StudentProfileEditModal: React.FC<StudentProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<StudentProfileContactFormData>({
    resolver: zodResolver(studentProfileContactSchema),
    defaultValues: {
      phone: profile.phone,
      emergency_contact: profile.emergency_contact,
      address: profile.address,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: StudentProfileContactFormData) => {
    const res = await onSave(data);
    if (res.success) {
      onClose();
    } else if (res.error) {
      setError('root', { message: res.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 id="profile-edit-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Update Student Contact Information
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your contact and emergency details accurate for institutional communication.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Locked Academic Attributes Notice */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Permanent Institutional Record (Immutable)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 font-mono">
              <div>
                <span>Student ID:</span>
                <span className="block font-bold text-slate-800 dark:text-slate-200">{profile.student_id}</span>
              </div>
              <div>
                <span>Admission No:</span>
                <span className="block font-bold text-slate-800 dark:text-slate-200">{profile.admission_number}</span>
              </div>
              <div>
                <span>Roll No:</span>
                <span className="block font-bold text-slate-800 dark:text-slate-200">{profile.roll_number}</span>
              </div>
            </div>
          </div>

          {errors.root && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.root.message}</span>
            </div>
          )}

          {/* Phone Field */}
          <div className="space-y-1">
            <label htmlFor="student-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Student Mobile Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="student-phone"
              type="text"
              {...register('phone')}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              placeholder="+91-98400-11205"
            />
            {errors.phone && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Emergency Contact Field */}
          <div className="space-y-1">
            <label htmlFor="student-emergency-contact" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Emergency Contact Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="student-emergency-contact"
              type="text"
              {...register('emergency_contact')}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              placeholder="+91-98400-11207"
            />
            {errors.emergency_contact && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.emergency_contact.message}</p>
            )}
          </div>

          {/* Address Field */}
          <div className="space-y-1">
            <label htmlFor="student-address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="student-address"
              rows={3}
              {...register('address')}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              placeholder="Full residential address including city and postal code"
            />
            {errors.address && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.address.message}</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-blue-900 hover:bg-blue-800 text-white font-semibold"
            >
              {isSubmitting ? 'Saving...' : 'Save Contact Details'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
