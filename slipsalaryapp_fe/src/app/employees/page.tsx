"use client";
import React from 'react';
import { Protected } from '@/components/shadcn/protected';
import { listEmployees } from '@/lib/apiClient';
import { Employee } from '@/types';
import { Spinner } from '@/components/shadcn/spinner';
import { Table, THead, TBody, TR, TH, TD } from '@/components/shadcn/table';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ key: 'name' | 'email'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });

  React.useEffect(() => {
    listEmployees().then(setEmployees).catch(e => setError(e.detail || 'Failed to load'));
  }, []);

  if (error) return <div className="p-6 text-[--color-danger]">{error}</div>;
  if (!employees) return <div className="p-6"><Spinner /></div>;

  const filtered = employees.filter(e => {
    const target = `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase();
    return target.includes(query.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string; let bv: string;
    if (sort.key === 'name') {
      av = `${a.firstName} ${a.lastName}`.toLowerCase();
      bv = `${b.firstName} ${b.lastName}`.toLowerCase();
    } else {
      av = a.email.toLowerCase();
      bv = b.email.toLowerCase();
    }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  function toggleSort(key: 'name' | 'email') {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  return (
    <Protected fallback={<div className="p-6 text-center text-[--color-muted]">Please sign in to view employees.</div>}>
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[--neutral-800]">Employees</h1>
        <Link href="/dashboard" className="text-sm text-[--color-primary] hover:underline">Back</Link>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1 w-60">
            <label htmlFor="search" className="text-sm font-medium">Search</label>
            <Input id="search" placeholder="Name or email" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">{sorted.length} result{sorted.length !== 1 && 's'} / {employees.length} total</div>
        </div>
        <Table>
          <THead>
            <TR>
              <TH className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Name {sort.key === 'name' && (sort.dir === 'asc' ? '▲' : '▼')}
              </TH>
              <TH className="cursor-pointer select-none" onClick={() => toggleSort('email')}>
                Email {sort.key === 'email' && (sort.dir === 'asc' ? '▲' : '▼')}
              </TH>
              <TH>Role</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {sorted.length === 0 && (
              <TR>
                <TD colSpan={4} className="text-center text-muted-foreground">No employees match your search.</TD>
              </TR>
            )}
            {sorted.map(e => (
              <TR key={e.id} className="hover:bg-muted/50">
                <TD>
                  <Link href={`/employees/${e.id}`} className="text-primary hover:underline">
                    {e.firstName} {e.lastName}
                  </Link>
                </TD>
                <TD>{e.email}</TD>
                <TD>
                  {e.isManager ? <Badge>Manager</Badge> : e.managerId ? <Badge variant="outline">Employee</Badge> : <span className="text-muted-foreground">—</span>}
                </TD>
                <TD>
                  <Badge variant={e.isActive ? 'default' : 'destructive'}>{e.isActive ? 'Active' : 'Inactive'}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
    </Protected>
  );
}
