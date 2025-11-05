"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, logout } = useAuth();
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-[#EEEEEE] shadow-sm">
        <Link href={accessToken ? '/dashboard' : '/auth'} className="text-lg font-semibold tracking-tight text-[#1A1A1A] hover:text-[#FF3366] transition-colors">Slip Salary Portal</Link>
        <nav className="flex items-center gap-6 text-sm">
          {accessToken ? (
            <>
              <Link href="/employees" className="px-3 py-2 rounded-md text-[#4D4D4D] hover:text-[#FF3366] hover:bg-[#FFF0F4] transition-colors">Employees</Link>
              <Link href="/reports" className="px-3 py-2 rounded-md text-[#4D4D4D] hover:text-[#FF3366] hover:bg-[#FFF0F4] transition-colors">Reports</Link>
              <button onClick={logout} className="px-3 py-2 rounded-md text-[#4D4D4D] hover:text-[#FF3366] hover:bg-[#FFF0F4] transition-colors">Logout</button>
            </>
          ) : (
            <Link href="/auth" className="px-4 py-2 rounded-md bg-[#FF3366] text-white text-sm hover:bg-[#FF1F55] transition-colors shadow-sm">Sign In</Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">{children}</main>
    </>
  );
};