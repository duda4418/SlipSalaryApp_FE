"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from './Spinner';

export const Protected: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => {
  const { accessToken, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center p-8"><Spinner /></div>;
  if (!accessToken) return <>{fallback || <div className="p-8 text-center">Please log in.</div>}</>;
  return <>{children}</>;
};

export const ManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => {
  const { isManager, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center p-8"><Spinner /></div>;
  if (!isManager) return <>{fallback || <div className="p-4 text-[#FF5641]">Manager access required.</div>}</>;
  return <>{children}</>;
};
