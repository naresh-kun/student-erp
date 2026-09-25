/**
 * Student ERP — FacultyHeroBanner Component
 * Phase 2 — Task 2.4: Deep Faculty Role Experience
 *
 * Professional academic hero header showcasing:
 * - Faculty Identity: R. Suresh
 * - Designation: Senior PGT Mathematics & Department Head
 * - Class Teacher Assignment: Grade 11 — Section A2
 * - Employee ID, Office Room, Subject Mentorship
 * - Quick Action Buttons (Attendance, Marks, Leave Reviews)
 * - STRICT NON-EVALUATIVE GOVERNANCE: Zero ratings, reviews, rankings, or performance scores.
 */

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  CalendarCheck, 
  FileCheck2, 
  UserCheck, 
  MapPin, 
  Building2, 
  GraduationCap 
} from 'lucide-react';
import type { FacultyProfile } from '../types';

interface FacultyHeroBannerProps {
  profile: FacultyProfile | null;
  pendingLeavesCount?: number;
  onNavigateAttendance?: () => void;
  onNavigateMarks?: () => void;
  onNavigateClasses?: () => void;
}

export const FacultyHeroBanner: React.FC<FacultyHeroBannerProps> = ({
  profile,
  pendingLeavesCount = 0,
  onNavigateAttendance,
  onNavigateMarks,
  onNavigateClasses,
}) => {
  if (!profile) return null;

  return (
    <div className="p-6 md:p-7 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Profile Info */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-blue-300" />
              <span>{profile.department} Department</span>
            </span>
            {profile.class_teacher_of && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Class Teacher: {profile.class_teacher_of.class_name}</span>
              </span>
            )}
            <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs font-mono">
              Emp Code: {profile.employee_code}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {profile.full_name}
          </h1>

          <p className="text-blue-100 text-xs md:text-sm font-medium">
            {profile.designation} • {profile.qualification}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200 pt-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-300" />
              {profile.office_room}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-300" />
              Specialization: {profile.specialization}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNavigateAttendance}
            className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-semibold shadow-sm"
          >
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
            Mark Attendance
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateMarks}
            className="border-blue-400 text-white hover:bg-blue-800 text-xs font-semibold"
          >
            <FileCheck2 className="w-3.5 h-3.5 mr-1.5 text-blue-200" />
            Enter Marks
          </Button>

          {pendingLeavesCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateClasses}
              className="border-amber-400 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-xs font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              <span>Leaves ({pendingLeavesCount})</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
