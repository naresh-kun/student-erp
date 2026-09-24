import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAVIGATION } from '@/app/navigation';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import type { UserRole } from '@/types';
import { 
  GraduationCap, 
  Menu, 
  X, 
  LogOut, 
  Sun, 
  Moon, 
  CalendarDays,
  User as UserIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const DashboardLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!user || !role) {
    return null;
  }

  const navItems = ROLE_NAVIGATION[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const roleColors: Record<UserRole, string> = {
    Student: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    Parent: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    Faculty: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    Admin: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Principal: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header — Authoritative Indian School Header Standard */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-900 text-white shadow-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-blue-950 dark:text-blue-200 block leading-tight">
                {SCHOOL_CONFIG.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <CalendarDays className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                  Academic Year {SCHOOL_CONFIG.academicYear}
                </span>
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="hidden md:inline font-normal text-[11px] text-slate-400">
                  {SCHOOL_CONFIG.boardPattern}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User & Role Information */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <div className="text-left">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block leading-none">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                {role}
              </span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden ring-1 ring-slate-300 dark:ring-slate-700">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                `${user.first_name[0]}${user.last_name[0]}`
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar — Enterprise School Navigation */}
        <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-5 shrink-0">
          {/* Active Portal Header */}
          <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">School Portal</span>
              <Badge className={roleColors[role]}>{role}</Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {SCHOOL_CONFIG.shortName} • {role} Workspace
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            <p className="font-semibold text-slate-600 dark:text-slate-400">{SCHOOL_CONFIG.shortName} ERP</p>
            <p>CBSE / ICSE School Edition</p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                  <span className="font-bold text-sm">{SCHOOL_CONFIG.shortName} ERP</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Logged in as</span>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{user.first_name} {user.last_name}</span>
                <Badge className={`mt-1 text-[10px] ${roleColors[role]}`}>{role}</Badge>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-blue-900 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content View Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
