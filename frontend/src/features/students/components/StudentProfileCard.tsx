/**
 * Student ERP — StudentProfileCard Component
 * Phase 2 — Task 2.2: Deep Student Role Experience
 * Displays comprehensive official institutional record.
 * Student ID is explicitly flagged as permanent, unique, and immutable.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { StudentProfile } from '../types';
import { formatDateIndian } from '@/utils';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldAlert, 
  GraduationCap, 
  Lock, 
  Copy, 
  Check, 
  Edit3,
  HeartHandshake
} from 'lucide-react';

interface StudentProfileCardProps {
  profile: StudentProfile;
  onEditContact?: () => void;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  profile,
  onEditContact,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(profile.student_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1: Identity & Credentials Summary */}
      <Card className="md:col-span-1 p-6 text-center space-y-4 relative border-t-4 border-t-blue-900 shadow-sm">
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-blue-50 dark:ring-slate-800">
            {profile.first_name[0]}{profile.last_name[0]}
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Active Enrolled" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {profile.class_name} • {profile.section_name} • Roll: <strong>{profile.roll_number}</strong>
          </p>
        </div>

        {/* Permanent Student ID Box */}
        <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-900 dark:text-blue-300">
            <Lock className="w-3 h-3 text-blue-700" />
            <span>Permanent Institutional Identifier</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <code className="font-mono text-sm font-black text-blue-950 dark:text-blue-100 bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
              {profile.student_id}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              className="h-7 px-2 text-[11px] border-blue-300 dark:border-blue-700"
              title="Copy Student ID"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-[10px] text-blue-700 dark:text-blue-300">
            Used as the primary username for the Parent Portal
          </p>
        </div>

        {/* Academic Meta Ledger */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-left space-y-2.5">
          <div className="flex items-center justify-between text-slate-500">
            <span>Admission Number</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {profile.admission_number}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Academic Stream</span>
            <span className="font-semibold text-blue-900 dark:text-blue-300">
              {profile.stream || 'Secondary Core'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Academic Year</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {profile.academic_year}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Enrollment Status</span>
            <Badge variant="success" className="text-[10px] py-0">
              {profile.status}
            </Badge>
          </div>
        </div>

        {/* Contact info card with edit trigger */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-left space-y-2 text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Student Contact
            </span>
            {onEditContact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditContact}
                className="h-6 text-[11px] text-blue-900 hover:text-blue-800 px-1.5"
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{profile.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono">{profile.phone}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{profile.address}</span>
          </div>
        </div>
      </Card>

      {/* Column 2 & 3: Detailed Sections */}
      <div className="md:col-span-2 space-y-6">
        {/* Personal & Demographic Details */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <User className="w-4 h-4 text-blue-900" />
              <span>Personal & Demographic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Date of Birth (DD/MM/YYYY)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono text-sm">
                {formatDateIndian(profile.date_of_birth)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Gender</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {profile.gender}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Blood Group</span>
              <span className="font-semibold text-rose-600 mt-0.5 block">
                {profile.blood_group || 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Nationality</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {profile.nationality}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Primary Languages</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {profile.first_language}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Admission Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                {formatDateIndian(profile.admission_date)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Parent / Guardian Information */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              <span>Parent / Guardian & Emergency Contact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Primary Guardian
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {profile.parent_name}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Relationship: <strong className="text-slate-800 dark:text-slate-200">{profile.parent_relation}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Telephone: <strong className="font-mono text-slate-800 dark:text-slate-200">{profile.parent_phone}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Email: {profile.parent_email}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Emergency Contact Number
              </span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  {profile.emergency_contact}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                Contacted in the event of an urgent medical situation or unscheduled campus early closure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Class Teacher Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <GraduationCap className="w-4 h-4 text-blue-900" />
              <span>Assigned Class Teacher & Academic Mentor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Class Teacher Name</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {profile.class_teacher_name}
              </p>
              <p className="text-slate-500">
                Department: {profile.class_teacher_dept}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 block font-medium">Faculty Office / Room</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {profile.class_teacher_room}
              </p>
              <p className="text-slate-500">
                Institutional Email: {profile.class_teacher_email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
