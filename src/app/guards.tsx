import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '@/components/ui';
import { ROLE_HOME, useMe } from '@/hooks/useAuth';
import type { Role } from '@/types/api';

/**
 * Client-side route guard. This is a UX convenience only — every API endpoint
 * independently enforces authentication and role permissions on the server.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { data: user, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

export function HomeRedirect() {
  const { data: user, isLoading } = useMe();
  if (isLoading) return <Spinner className="min-h-screen" />;
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}
