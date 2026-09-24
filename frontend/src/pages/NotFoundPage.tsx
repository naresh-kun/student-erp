import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_DEFAULT_ROUTES } from '@/app/navigation';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (isAuthenticated && user) {
      navigate(ROLE_DEFAULT_ROUTES[user.role]);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">404 — Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
        The requested path does not exist in the Student ERP routing contract or you may lack appropriate permissions.
      </p>
      <div className="mt-6">
        <Button onClick={handleReturn} className="inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
