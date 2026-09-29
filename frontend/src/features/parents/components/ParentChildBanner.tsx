/**
 * Student ERP — ParentChildBanner Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import React, { useState } from 'react';
import type { ParentProfile, LinkedChild } from '../types';
import { Badge } from '@/components/ui/Badge';
import { Shield, Copy, Check } from 'lucide-react';

interface ParentChildBannerProps {
  parentProfile?: ParentProfile;
  activeChild?: LinkedChild;
  linkedChildren?: LinkedChild[];
  onSelectChild?: (studentId: string) => void;
  showChildSelector?: boolean;
}

export const ParentChildBanner: React.FC<ParentChildBannerProps> = ({
  parentProfile,
  activeChild,
  linkedChildren = [],
  onSelectChild,
  showChildSelector = true,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const copyStudentId = () => {
    if (activeChild?.student_id) {
      navigator.clipboard.writeText(activeChild.student_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const hasMultiple = linkedChildren.length > 1;

  return (
    <div className="space-y-3">
      {/* Top Banner: Navy Institutional Header */}
      <div className="p-5 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold border border-blue-700/60">
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                <span>Parent / Guardian Portal</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-200 font-mono border border-blue-800">
                Academic Year {activeChild?.academic_year || '2026–27'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {parentProfile ? `${parentProfile.full_name}’s Ward Portal` : 'Parent Portal'}
            </h1>

            <p className="text-xs text-blue-200 flex items-center gap-2 flex-wrap">
              <span>Parent: <strong>{parentProfile?.full_name || 'S. Ramanathan'}</strong> ({parentProfile?.relation || 'Father'})</span>
              <span>•</span>
              <span>
                Enrolled Ward: <strong>{activeChild?.full_name || 'Arun Kumar'}</strong>
              </span>
            </p>
          </div>

          {/* Child Switcher (Only if parent has multiple children) */}
          {showChildSelector && hasMultiple && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-950/70 border border-blue-700/60 self-start md:self-center">
              <span className="text-[11px] text-blue-300 font-medium px-2">Switch Ward:</span>
              {linkedChildren.map((c) => {
                const isSelected = c.student_id === activeChild?.student_id;
                return (
                  <button
                    key={c.student_id}
                    type="button"
                    onClick={() => onSelectChild?.(c.student_id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-blue-950 shadow-sm'
                        : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
                    }`}
                  >
                    {c.first_name} • {c.class_name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Child Academic Metadata Strip */}
      {activeChild && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Student Name
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {activeChild.full_name}
              </span>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Permanent Student ID (Parent Username)
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                  {activeChild.student_id}
                </span>
                <button
                  type="button"
                  onClick={copyStudentId}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Copy Student ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Class & Section
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activeChild.class_name} — {activeChild.section_name}
              </span>
            </div>

            {activeChild.stream && (
              <div className="border-l border-slate-200 dark:border-slate-800 pl-4 hidden sm:block">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Senior Stream
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeChild.stream}
                </span>
              </div>
            )}

            <div className="border-l border-slate-200 dark:border-slate-800 pl-4 hidden md:block">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Roll Number
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {activeChild.roll_number}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              Adm: {activeChild.admission_number}
            </Badge>
            <Badge variant="success" className="text-xs">
              {activeChild.status} Enrolled
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};
