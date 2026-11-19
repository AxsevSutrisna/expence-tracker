import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { Loading } from '@shared/ui';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
