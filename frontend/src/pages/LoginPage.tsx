import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROLE_DEFAULT_ROUTES } from '@/app/navigation';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Award, 
  ArrowRight, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, loginWithEmail, mockUsers } = useAuth();
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleMeta: Record<UserRole, { icon: React.ComponentType<{ className?: string }>; color: string; desc: string }> = {
    Student: { icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900', desc: 'Academics & Timetables' },
    Parent: { icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900', desc: 'Children Tracking' },
    Faculty: { icon: BookOpen, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900', desc: 'Grading & Attendance' },
    Admin: { icon: ShieldCheck, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900', desc: 'System Administration' },
    Principal: { icon: Award, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900', desc: 'Executive Analytics' },
  };

  const handleQuickLogin = async (role: UserRole, userId?: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await login(role, userId);
      navigate(ROLE_DEFAULT_ROUTES[role]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setErrorMsg('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginWithEmail(emailInput);
      navigate(ROLE_DEFAULT_ROUTES[user.role]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check your email or use 1-click login.');
    } finally {
      setLoading(false);
    }
  };

  // Group mock users to display one primary per role
  const sampleUsers = (['Student', 'Parent', 'Faculty', 'Admin', 'Principal'] as UserRole[]).map((r) => {
    return mockUsers.find((u) => u.role === r);
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Institutional Portal Access Notice */}
      <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">Institutional Demonstration Portal</p>
          <p className="text-indigo-700 dark:text-indigo-300">
            Select any stakeholder account below or sign in using institutional credentials to access your personalized workspace.
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Sign in to your Portal</CardTitle>
          <CardDescription>
            Choose a profile below or enter your institutional email to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Role Selectors */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Quick Stakeholder Profiles
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sampleUsers.map((u) => {
                if (!u) return null;
                const meta = roleMeta[u.role];
                const Icon = meta.icon;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.role, u.id)}
                    disabled={loading}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{u.role}</span>
                          <span className="text-[11px] font-normal text-slate-400">({u.first_name})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{meta.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider">
              Or sign in with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. alex.morgan@studenterp.edu"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="•••••••• (Any password accepted in mock mode)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
