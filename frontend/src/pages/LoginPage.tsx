import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_DEFAULT_ROUTES } from '@/app/navigation';
import { SYNTHETIC_DEMO_ACCOUNTS } from '@/services/authService';
import type { UserRole } from '@/types';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  Shield,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Development testing mode: activated ONLY via ?dev=true URL param or Alt+Shift+D shortcut
  // NOT visible in normal demo UI
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return searchParams.get('dev') === 'true';
  });

  // Listen for developer shortcut (Alt+Shift+D) to toggle dev helper if needed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDevMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Expose developer console helpers for headless simulation
  useEffect(() => {
    (window as any).__erpRoleLogin = async (role: UserRole) => {
      const user = await login(role);
      navigate(ROLE_DEFAULT_ROUTES[user.role]);
      return user;
    };
    (window as any).__erpFillCredentials = (emailOrUsername: string, pass = 'demo123') => {
      setIdentifier(emailOrUsername);
      setPassword(pass);
    };
  }, [login, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your User ID or institutional email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Credential verification and mock user record lookup
      const authenticatedUser = await loginWithCredentials(identifier, password);

      // Route directly to the authenticated user's assigned role dashboard
      const targetDashboard = ROLE_DEFAULT_ROUTES[authenticatedUser.role];
      navigate(targetDashboard);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDevAccount = (accIdentifier: string, accPass: string) => {
    setIdentifier(accIdentifier);
    setPassword(accPass);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Institutional Login Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
        <CardHeader className="text-center pb-4 pt-6 space-y-1">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 w-fit mx-auto mb-2 border border-slate-200 dark:border-slate-700/60">
            <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Institutional Access Portal</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sign In
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Enter your institutional User ID or email address and password to access your role-scoped workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Authentication Error</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Institutional Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID / Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="identifier" 
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>User ID / Institutional Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. alex.morgan@studenterp.edu or user ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your institutional password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full py-2.5 font-semibold text-sm shadow-md shadow-indigo-500/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Institutional Compliance Notice */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Authorized access only. All authentication attempts are logged for audit compliance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Development-Only Testing Panel */}
      {/* STRICTLY HIDDEN in normal demo UI unless ?dev=true or Alt+Shift+D is pressed */}
      {isDevMode && (
        <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Developer Testing Tool — Synthetic Credentials</span>
            </div>
            <button
              onClick={() => setIsDevMode(false)}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Hide (Alt+Shift+D)
            </button>
          </div>

          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
            Click any synthetic account below to automatically fill the login form inputs for testing. Normal login lookup and route assignment will be executed on submit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SYNTHETIC_DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillDevAccount(acc.identifier, acc.password)}
                className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-left transition-all cursor-pointer flex items-center justify-between group text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{acc.role}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({acc.name})</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
                    {acc.identifier}
                  </div>
                </div>
                <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Fill</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
