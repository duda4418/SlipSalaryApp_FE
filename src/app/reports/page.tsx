"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createAggregatedEmployeeData, sendAggregatedEmployeeData, createPdfForEmployees, sendPdfToEmployees } from '@/lib/apiClient';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function ReportsPage() {
  const { decoded } = useAuth();
  const managerId = decoded?.sub || '';
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [month, setMonth] = React.useState<number>(new Date().getMonth() + 1);
  const [log, setLog] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const pushLog = (msg: string) => setLog(l => [msg, ...l]);

  const wrap = async (fn: () => Promise<any>, label: string) => {
    setLoading(true);
    try {
      const res = await fn();
      pushLog(`${label} success: ${JSON.stringify(res)}`);
    } catch (e: any) {
      pushLog(`${label} failed: ${e.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[--color-primary]">Reports</h1>
        <Link href="/dashboard" className="text-sm text-[--color-primary] hover:underline">Back</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-[--color-border] bg-[--color-surface] p-4">
          <h2 className="text-lg font-medium text-[--color-primary]">Parameters</h2>
          <div className="flex gap-4">
            <Input type="number" label="Year" value={year} onChange={e => setYear(Number(e.target.value))} />
            <Input type="number" label="Month" value={month} onChange={e => setMonth(Number(e.target.value))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!managerId || loading} onClick={() => wrap(() => createAggregatedEmployeeData(managerId, year, month, true), 'Create CSV')}>Create CSV</Button>
            <Button variant="secondary" disabled={!managerId || loading} onClick={() => wrap(() => sendAggregatedEmployeeData(managerId, year, month), 'Send CSV')}>Send CSV</Button>
            <Button variant="outline" disabled={!managerId || loading} onClick={() => wrap(() => createPdfForEmployees(managerId, year, month, false), 'Create PDFs')}>Create PDFs</Button>
            <Button variant="danger" disabled={!managerId || loading} onClick={() => wrap(() => sendPdfToEmployees(managerId, year, month, false), 'Send PDFs')}>Send PDFs</Button>
          </div>
          {loading && <Spinner />}
        </div>
        <div className="space-y-2 rounded-lg border border-[--color-border] bg-[--color-surface] p-4">
          <h2 className="text-lg font-medium text-[--color-primary]">Activity Log</h2>
          <ul className="space-y-1 text-xs max-h-80 overflow-auto">
            {log.map((l, i) => <li key={i} className="rounded bg-[--neutral-100] p-2 text-[--neutral-800]">{l}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
