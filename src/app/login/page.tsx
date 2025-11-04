"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LegacyLoginRedirect() {
  const router = useRouter();
  const { accessToken } = useAuth();
  React.useEffect(() => {
    if (accessToken) router.replace('/dashboard');
    else router.replace('/auth');
  }, [accessToken, router]);
  return <div className="p-6 text-center text-sm text-[--color-muted]">Redirecting…</div>;
}
