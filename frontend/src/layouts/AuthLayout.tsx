import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/25">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Student ERP
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Enterprise Educational Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Outlet />
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Demonstration environment &bull; Synthetic data
      </footer>
    </div>
  );
};
