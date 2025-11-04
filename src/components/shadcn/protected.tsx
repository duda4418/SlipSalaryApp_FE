"use client";
import * as React from 'react';
import { useAuth } from '@/context/AuthContext';

export interface ProtectedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Protected: React.FC<ProtectedProps> = ({ children, fallback = null }) => {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>;
  }

  if (!accessToken) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
