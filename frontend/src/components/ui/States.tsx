import React from 'react';
import { Loader2, AlertCircle, FileX } from 'lucide-react';
import { Button } from './Button';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading data...',
}) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-500 dark:text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({
  title = 'No records found',
  description = 'There is currently no data available in this view.',
  actionText,
  onAction,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
      {icon || <FileX className="w-6 h-6" />}
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
    </div>
    {actionText && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'An error occurred',
  message = 'Failed to load content. Please verify your connection or try again.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 space-y-3 text-rose-800 dark:text-rose-300">
    <AlertCircle className="w-8 h-8 text-rose-500" />
    <div className="space-y-1">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs sm:text-sm text-rose-600/90 dark:text-rose-400/80 max-w-sm">{message}</p>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300">
        Try Again
      </Button>
    )}
  </div>
);
