"use client";
import React from 'react';
import { Protected } from '@/components/shadcn/protected';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { decoded, logout } = useAuth();

  return (
    <Protected fallback={<div className="p-6 text-center text-[--color-muted]">Please sign in to view the dashboard.</div>}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[--neutral-800]">Dashboard</h1>
        <Button variant="secondary" onClick={logout}>Logout</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/employees" className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm hover:shadow-md hover:border-[--color-border-strong] transition">
          <h2 className="font-medium text-[--neutral-800]">Employees</h2>
          <p className="text-xs text-[--color-muted]">Manage employee records</p>
        </Link>
        <Link
          href="/reports"
          className={`rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm transition ${decoded?.is_manager ? 'hover:shadow-md hover:border-[--color-border-strong]' : 'opacity-60 cursor-pointer'} `}
          aria-disabled={decoded?.is_manager ? 'false' : 'true'}
        >
          <h2 className="font-medium text-[--neutral-800] flex items-center gap-2">Reports {!decoded?.is_manager && <span className="text-[10px] font-normal text-[--color-muted]">(view only)</span>}</h2>
          <p className="text-xs text-[--color-muted]">Generate and send salary documents</p>
          {!decoded?.is_manager && <p className="mt-2 text-[10px] text-[--color-muted]">Manager role required to execute actions.</p>}
        </Link>
      </div>
    </div>
    </Protected>
  );
}
