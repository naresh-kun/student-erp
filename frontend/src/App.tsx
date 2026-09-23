import React from 'react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Server, 
  CheckCircle2, 
  Layers, 
  Terminal,
  FileText
} from 'lucide-react';

const App: React.FC = () => {
  const roles = [
    { title: 'Student', desc: 'Academics, attendance, marks, personal timetable', icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
    { title: 'Parent', desc: 'Child academic progress, attendance alerts, timetable view', icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'Faculty', desc: 'Attendance entry, grading, syllabus, class schedules', icon: BookOpen, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40' },
    { title: 'Admin', desc: 'Institutional configuration, user provisioning, scheduling', icon: ShieldCheck, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
    { title: 'Principal', desc: 'Campus-wide analytics, department oversight, sign-offs', icon: Award, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
  ];

  const techStack = [
    { category: 'Frontend', items: 'React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zod' },
    { category: 'Backend', items: 'Python, Django 5+, Django REST Framework, Django Channels' },
    { category: 'Persistence', items: 'PostgreSQL 16+ (3NF Relational Store), Redis 7+ (Realtime & Cache)' },
    { category: 'Infrastructure', items: 'Docker, Docker Compose, Caddy Reverse Proxy, Auto TLS' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Banner */}
        <header className="border-b border-slate-200 dark:border-slate-800 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <GraduationCap className="w-8 h-8" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Student ERP</h1>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Enterprise Educational Management System</p>
              </div>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
              Phase 1 establishes the authoritative architectural foundation, governance policies, synthetic datasets, and directory structures. Business logic and UI dashboards begin in Phase 2.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Phase 1 Foundation Complete
            </span>
          </div>
        </header>

        {/* 5 System Stakeholder Roles */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold">Five Core Stakeholder Roles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.title} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{role.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">{role.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>RBAC Scoped</span>
                    <span>Phase 2 UI</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Architecture & Tech Stack Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Master Technology Stack */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold">Agreed Master Technology Stack</h2>
            </div>
            <div className="space-y-3 text-sm">
              {techStack.map((tech) => (
                <div key={tech.category} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{tech.category}</div>
                  <div className="mt-1 text-slate-700 dark:text-slate-300 font-mono text-xs">{tech.items}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance & Monorepo Hierarchy */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold">Structural Monorepo Layout</h2>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> frontend/ (React + TypeScript + Vite)
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> backend/ (Django 5+ DRF Modular Monolith)
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> database/ (PostgreSQL 16+ Relational 3NF)
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> infra/ (Caddy TLS + Docker Compose)
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> mock-data/ (10 Synthetic JSON Datasets)
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> docs/ (16 Authoritative Specifications)
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                Read the authoritative specifications in <code className="text-indigo-600 dark:text-indigo-400 font-bold">docs/PROJECT_STRUCTURE.md</code>
              </div>
            </div>
          </div>

        </section>

        {/* Footer info */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>Student ERP &bull; Authoritative Project Architecture</span>
          <span className="flex items-center gap-1 font-mono">
            <Terminal className="w-3.5 h-3.5" /> Next: Phase 2 Kickoff (Frontend Core & Dashboards)
          </span>
        </footer>

      </div>
    </div>
  );
};

export default App;
