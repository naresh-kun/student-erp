/**
 * Student ERP — ParentTeacherContactCard Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Phone, Mail, MapPin, MessageSquare, Calendar } from 'lucide-react';
import type { LinkedChild } from '../types';

interface ParentTeacherContactCardProps {
  activeChild?: LinkedChild;
}

export const ParentTeacherContactCard: React.FC<ParentTeacherContactCardProps> = ({
  activeChild,
}) => {
  const teacherName = activeChild?.class_teacher_name || 'R. Suresh';
  const teacherDept = activeChild?.class_teacher_dept || 'Mathematics';
  const teacherPhone = activeChild?.class_teacher_phone || '+91 94441 23456';
  const teacherEmail = activeChild?.class_teacher_email || 'suresh.r@schoolerp.edu.in';
  const teacherRoom = activeChild?.class_teacher_room || 'Staff Room B, Ramanujan Block';

  const handleMessageClick = () => {
    alert(`Messaging interface: In Phase 2 this is a demonstration. To communicate with ${teacherName}, please call ${teacherPhone} or email ${teacherEmail}.`);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Assigned Class Teacher & Mentor</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-xs">
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
              {teacherName}
            </span>
            <span className="text-slate-500 font-medium">
              Senior PGT {teacherDept} • Class Teacher {activeChild?.class_name}-{activeChild?.section_name?.replace('Section ', '')}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">{teacherPhone}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">{teacherEmail}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{teacherRoom}</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleMessageClick}
          className="w-full text-xs font-semibold py-2"
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          <span>Message Class Teacher</span>
        </Button>

        <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
            <Calendar className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Next PTM Consultation</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            November 14, 2026 (09:00 AM – 02:00 PM). One-on-one consultation with {teacherName} to review Half-Yearly answer papers and term marks.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
