import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROLE_DEFAULT_ROUTES } from '@/app/navigation';
import { LoadingState } from '@/components/ui/States';

export interface RoleRouteProps {
  allowedRoles?: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their role-appropriate default dashboard
    const fallbackPath = ROLE_DEFAULT_ROUTES[user.role] || '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
