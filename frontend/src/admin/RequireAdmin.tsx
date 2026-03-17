import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to='/' replace state={{ openAuth: 'login' as const }} />;
  if (user.role !== 'admin') return <Navigate to='/' replace />;

  return <>{children}</>;
}

