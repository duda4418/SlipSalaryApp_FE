"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

export default function Home() {
  const { accessToken, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      router.replace(accessToken ? '/dashboard' : '/login');
    }
  }, [loading, accessToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
