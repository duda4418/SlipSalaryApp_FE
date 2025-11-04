"use client";
import React from 'react';
import { Protected } from '@/components/shadcn/protected';
import { listEmployees } from '@/lib/apiClient';
import { Employee } from '@/types';
import { Spinner } from '@/components/shadcn/spinner';
import { Table, THead, TBody, TR, TH, TD } from '@/components/shadcn/table';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/shadcn/dialog';
import { getEmployee } from '@/lib/apiClient';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ key: 'name' | 'email'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    listEmployees().then(setEmployees).catch(e => setError(e.detail || 'Failed to load'));
  }, []);

  if (error) return <div className="p-6 text-destructive text-sm">{error}</div>;
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

  function openDetail(id: string) {
    setSelectedId(id);
    setSelectedEmployee(null);
    setDetailError(null);
    setDetailLoading(true);
    getEmployee(id)
      .then(emp => { setSelectedEmployee(emp); })
      .catch(e => setDetailError(e.detail || 'Failed to load employee'))
      .finally(() => setDetailLoading(false));
  }

  return (
    <Protected fallback={<div className="p-6 text-center text-muted-foreground">Please sign in to view employees.</div>}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">Back</Link>
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
                    <Dialog>
                      <DialogTrigger className="text-primary hover:underline" onClick={() => openDetail(e.id)}>
                        {e.firstName} {e.lastName}
                      </DialogTrigger>
                      <DialogContent className="p-0">
                        <DialogHeader>
                          <DialogTitle>Employee Details</DialogTitle>
                          <DialogDescription>{selectedEmployee?.email || ''}</DialogDescription>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                          {detailLoading && <Spinner />}
                          {detailError && <div className="text-destructive text-sm">{detailError}</div>}
                          {selectedEmployee && (
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h2 className="text-lg font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                                  <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                                </div>
                                <div className="flex gap-2">
                                  {selectedEmployee.isManager && <Badge variant="secondary">Manager</Badge>}
                                  <Badge variant={selectedEmployee.isActive ? 'default' : 'outline'}>{selectedEmployee.isActive ? 'Active' : 'Inactive'}</Badge>
                                </div>
                              </div>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <dt className="font-medium">CNP</dt>
                                  <dd className="text-muted-foreground">{selectedEmployee.cnp || '—'}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium">Base Salary</dt>
                                  <dd className="text-muted-foreground">{selectedEmployee.baseSalary.toLocaleString()} RON</dd>
                                </div>
                                <div>
                                  <dt className="font-medium">Manager ID</dt>
                                  <dd className="text-muted-foreground">{selectedEmployee.managerId || (selectedEmployee.isManager ? '—' : 'N/A')}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium">Created</dt>
                                  <dd className="text-muted-foreground">{selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : '—'}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium">Updated</dt>
                                  <dd className="text-muted-foreground">{selectedEmployee.updatedAt ? new Date(selectedEmployee.updatedAt).toLocaleDateString() : '—'}</dd>
                                </div>
                              </dl>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <DialogClose />
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
