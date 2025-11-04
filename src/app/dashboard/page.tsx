"use client";
import React from 'react';
import { Protected } from '@/components/ui/Protected';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
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
        {decoded?.is_manager && (
          <Link href="/reports" className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm hover:shadow-md hover:border-[--color-border-strong] transition">
            <h2 className="font-medium text-[--neutral-800]">Reports</h2>
            <p className="text-xs text-[--color-muted]">Generate and send salary documents</p>
          </Link>
        )}
      </div>
    </div>
    </Protected>
  );
}
