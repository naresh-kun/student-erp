import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAVIGATION, ROLE_DEFAULT_ROUTES } from '@/app/navigation';
import type { UserRole } from '@/types';
import { 
  GraduationCap, 
  Menu, 
  X, 
  LogOut, 
  UserCog, 
  Sun, 
  Moon, 
  ShieldCheck, 
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const DashboardLayout: React.FC = () => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!user || !role) {
    return null;
  }

  const navItems = ROLE_NAVIGATION[role] || [];

  const handleRoleSwitch = async (newRole: UserRole) => {
    setRoleSwitcherOpen(false);
    setMobileMenuOpen(false);
    await switchRole(newRole);
    navigate(ROLE_DEFAULT_ROUTES[newRole]);
  };

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
    Student: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    Parent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    Faculty: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    Admin: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Principal: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  const allRoles: UserRole[] = ['Student', 'Parent', 'Faculty', 'Admin', 'Principal'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6" />
            </span>
            <div className="hidden sm:block">
              <span className="font-bold text-lg tracking-tight">Student ERP</span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-1">Enterprise Management</span>
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Demo Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              title="Switch stakeholder role (Demo Simulation)"
            >
              <UserCog className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline text-slate-500 dark:text-slate-400">Role:</span>
              <span className="text-slate-900 dark:text-slate-100">{role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Demo Role</span>
                </div>
                {allRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer ${
                      r === role ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{r}</span>
                    {r === role && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Summary */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 overflow-hidden ring-1 ring-slate-300 dark:ring-slate-700">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                `${user.first_name[0]}${user.last_name[0]}`
              )}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <span className="font-semibold block leading-tight">{user.first_name} {user.last_name}</span>
              <span className="text-[11px] text-slate-400">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 space-y-6 shrink-0">
          {/* Active Role Card */}
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Portal View</span>
              <Badge className={roleColors[role]}>{role}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Role-scoped navigation active</p>
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
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Phase 2 Footer Tag */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Phase 2 Simulation
            </div>
            <p className="text-[10px] leading-tight">Data loaded from mock service abstraction layer.</p>
          </div>
        </aside>

        {/* Mobile Slide-over Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-full bg-white dark:bg-slate-900 h-full p-4 flex flex-col space-y-4 shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  <span className="font-bold text-base">Navigation</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Current Role</span>
                <Badge className={roleColors[role]}>{role}</Badge>
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
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-rose-600">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
