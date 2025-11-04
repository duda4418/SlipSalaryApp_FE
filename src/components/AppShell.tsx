"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, logout } = useAuth();
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 backdrop-blur bg-[--color-surface]/90 border-b border-[--color-border] shadow-sm">
        <Link href={accessToken ? '/dashboard' : '/auth'} className="text-lg font-semibold tracking-tight text-[--neutral-800]">Slip Salary Portal</Link>
        <nav className="flex items-center gap-4 text-sm text-[--neutral-600]">
          {accessToken ? (
            <>
              <Link href="/employees" className="px-2 py-1 rounded-md hover:bg-[--neutral-100] hover:text-[--neutral-800] transition-colors">Employees</Link>
              <Link href="/reports" className="px-2 py-1 rounded-md hover:bg-[--neutral-100] hover:text-[--neutral-800] transition-colors">Reports</Link>
              <button onClick={logout} className="px-2 py-1 rounded-md text-[--neutral-700] hover:bg-[--neutral-100] transition-colors">Logout</button>
            </>
          ) : (
            <Link href="/auth" className="px-3 py-1 rounded-md bg-[--color-primary] text-white text-sm hover:bg-[--color-primary-600] transition-colors">Sign In</Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">{children}</main>
    </>
  );
};