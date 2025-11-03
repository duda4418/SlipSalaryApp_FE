"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const { decoded, logout } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[--color-primary]">Dashboard</h1>
        <Button variant="secondary" onClick={logout}>Logout</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/employees" className="rounded-lg border border-[--color-border] bg-[--color-surface] p-4 shadow-sm hover:border-[--color-primary]">
          <h2 className="font-medium text-[--color-primary]">Employees</h2>
          <p className="text-xs text-[--color-muted]">Manage employee records</p>
        </Link>
        {decoded?.is_manager && (
          <Link href="/reports" className="rounded-lg border border-[--color-border] bg-[--color-surface] p-4 shadow-sm hover:border-[--color-primary]">
            <h2 className="font-medium text-[--color-primary]">Reports</h2>
            <p className="text-xs text-[--color-muted]">Generate and send salary documents</p>
          </Link>
        )}
      </div>
    </div>
  );
}
