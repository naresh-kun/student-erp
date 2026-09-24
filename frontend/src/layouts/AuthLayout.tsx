import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex p-3 rounded-lg bg-blue-900 text-white shadow-sm mb-1">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-950 dark:text-blue-100 tracking-tight leading-tight">
          {SCHOOL_CONFIG.name}
        </h1>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          School ERP Portal &bull; Academic Year {SCHOOL_CONFIG.academicYear}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {SCHOOL_CONFIG.affiliationNotice}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Outlet />
      </div>

      <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
        {SCHOOL_CONFIG.shortName} Institutional Management System &bull; Synthetic Demo Data
      </footer>
    </div>
  );
};
