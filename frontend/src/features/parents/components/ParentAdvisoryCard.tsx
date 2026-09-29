/**
 * Student ERP — ParentAdvisoryCard Component
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Renders deterministic academic and attendance advisories
 * derived directly from verified student records and mock data.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CheckCircle2, AlertTriangle, Info, Bell } from 'lucide-react';
import type { ParentAdvisory } from '../types';

interface ParentAdvisoryCardProps {
  advisories: ParentAdvisory[];
  childName?: string;
}

export const ParentAdvisoryCard: React.FC<ParentAdvisoryCardProps> = ({
  advisories = [],
  childName = 'Arun Kumar',
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Academic & Attendance Advisories — {childName}</span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Official institutional observations and guidance for parents
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {advisories.map((adv) => {
          const isSuccess = adv.severity === 'success';
          const isWarning = adv.severity === 'warning';

          return (
            <div
              key={adv.id}
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                isSuccess
                  ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200'
                  : isWarning
                  ? 'border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200'
                  : 'border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {!isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-600" />}
              </div>

              <div className="space-y-1">
                <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">
                  {adv.title}
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {adv.message}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
