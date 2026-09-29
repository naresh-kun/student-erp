import React from 'react';
import { cn } from '@/lib/utils';

export const PageContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};
