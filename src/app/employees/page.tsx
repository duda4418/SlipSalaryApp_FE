"use client";
import React from 'react';
import { Protected } from '@/components/shadcn/protected';
import { listEmployees, listEmployeesForManager, createEmployee } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Employee } from '@/types';
import { Spinner } from '@/components/shadcn/spinner';
import { Table, THead, TBody, TR, TH, TD } from '@/components/shadcn/table';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/shadcn/dialog';
import { getEmployee } from '@/lib/apiClient';
import Link from 'next/link';

export default function EmployeesPage() {
  const { decoded } = useAuth();
  const managerId = decoded?.sub;
  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [myEmployees, setMyEmployees] = React.useState<Employee[] | null>(null);
  const [myError, setMyError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'all' | 'mine'>('all');
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ key: 'name' | 'email'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  // Create employee dialog state (manager-only)
  const [showCreate, setShowCreate] = React.useState(false);
  const [newFirst, setNewFirst] = React.useState('');
  const [newLast, setNewLast] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newBaseSalary, setNewBaseSalary] = React.useState<number | ''>('');
  const [newCnp, setNewCnp] = React.useState('');
  const [newHireDate, setNewHireDate] = React.useState<string>(() => new Date().toISOString().slice(0,10));
  const [newIsActive, setNewIsActive] = React.useState(true);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    listEmployees().then(setEmployees).catch(e => setError(e.detail || 'Failed to load'));
  }, []);

  // Fetch manager's own employees if user is manager
  React.useEffect(() => {
    if (!decoded?.is_manager || !managerId) {
      setMyEmployees(null);
      setMyError(null);
      return;
    }
    listEmployeesForManager(managerId)
      .then(setMyEmployees)
      .catch(e => {
        // If backend endpoint collides with getEmployee returning a single object, fallback to filtering
        if (e.status === 404 || e.status === 400) {
          setMyEmployees(employees ? employees.filter(emp => emp.managerId === managerId) : []);
          setMyError(null);
        } else if (e.detail) {
          setMyError(e.detail);
        } else {
          setMyError('Failed to load managed employees');
        }
      });
  }, [decoded?.is_manager, managerId, employees]);

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
    // Local fallback: try to find employee in already loaded arrays to avoid blank dialog
    const local = (employees || []).find(e => e.id === id) || (myEmployees || []).find(e => e.id === id) || null;
    setSelectedEmployee(local);
    setDetailError(null);
    // If local employee is a manager, skip ambiguous remote fetch (manager endpoint returns a list of direct reports)
    if (local?.isManager) {
      if (typeof window !== 'undefined') console.log('[DEBUG] Skipping remote fetch for manager id', id);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    getEmployee(id)
      .then(emp => { 
        if (typeof window !== 'undefined') {
          console.log('[DEBUG] Selected employee normalized:', emp);
        }
        // If remote returns minimal/blank fields but we have local richer data, keep local
        const isBlank = !emp.firstName && !emp.lastName && !emp.email;
        setSelectedEmployee(isBlank && local ? local : emp); 
      })
      .catch(e => setDetailError(e.detail || 'Failed to load employee'))
      .finally(() => setDetailLoading(false));
  }

  function resetCreateForm() {
    setNewFirst('');
    setNewLast('');
    setNewEmail('');
    setNewBaseSalary('');
    setNewCnp('');
    setNewHireDate(new Date().toISOString().slice(0,10));
    setNewIsActive(true);
    setCreateError(null);
    setCreateSuccess(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!decoded?.is_manager || !managerId) {
      setCreateError('Manager role required');
      return;
    }
    // Basic validation
    if (!newFirst || !newLast || !newEmail || !newBaseSalary || !newCnp || !newHireDate) {
      setCreateError('All fields are required');
      return;
    }
    // Basic Romanian CNP validation: 13 digits
    if (!/^\d{13}$/.test(newCnp)) {
      setCreateError('CNP must be exactly 13 digits');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const payload = {
        firstName: newFirst,
        lastName: newLast,
        email: newEmail,
        baseSalary: typeof newBaseSalary === 'number' ? newBaseSalary : Number(newBaseSalary),
        isActive: newIsActive,
        isManager: false,
        managerId: managerId,
        cnp: newCnp,
        hireDate: newHireDate,
      } as Partial<Employee>;
      const created = await createEmployee(payload);
      // Update employees + myEmployees lists optimistically
      setEmployees(prev => prev ? [...prev, created] : [created]);
      if (created.managerId === managerId) {
        setMyEmployees(prev => prev ? [...prev, created] : [created]);
      }
      setCreateSuccess(`Employee ${created.firstName} ${created.lastName} created`);
      resetCreateForm();
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err.detail || err.message || 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Protected fallback={<div className="p-6 text-center text-muted-foreground">Please sign in to view employees.</div>}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">Back</Link>
        </div>
        {/* Tabs header */}
        <div className="flex items-center gap-2 border-b border-[--color-border]">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-sm font-medium rounded-t-md border-x border-t border-b-2 ${activeTab === 'all' ? 'border-b-[--color-primary] text-[--neutral-800] bg-[--color-surface]' : 'border-b-transparent text-[--color-muted] hover:text-[--neutral-700]'}`}
            aria-selected={activeTab === 'all'}
            role="tab"
          >Employees</button>
          {decoded?.is_manager && (
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`px-3 py-2 text-sm font-medium rounded-t-md border-x border-t border-b-2 ${activeTab === 'mine' ? 'border-b-[--color-primary] text-[--neutral-800] bg-[--color-surface]' : 'border-b-transparent text-[--color-muted] hover:text-[--neutral-700]'}`}
              aria-selected={activeTab === 'mine'}
              role="tab"
            >My Employees {myEmployees ? `(${myEmployees.length})` : ''}</button>
          )}
        </div>
        {/* Tab panels */}
        {activeTab === 'mine' && decoded?.is_manager && (
          <div role="tabpanel" aria-labelledby="tab-mine" className="space-y-3 rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">My Employees</h2>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  {myEmployees ? `${myEmployees.length} managed` : 'Loading...'}
                </div>
                <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetCreateForm(); }}>
                  <DialogTrigger className="text-sm text-primary hover:underline" onClick={() => setShowCreate(true)}>Add Employee</DialogTrigger>
                  <DialogContent className="p-0 max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Employee</DialogTitle>
                      <DialogDescription>Fill required fields to create a new employee assigned to you.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="p-6 space-y-4">
                      {createError && <div className="text-xs text-destructive">{createError}</div>}
                      {createSuccess && <div className="text-xs text-green-600">{createSuccess}</div>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="newFirst" className="text-xs font-medium">First Name</label>
                          <Input id="newFirst" value={newFirst} onChange={e => setNewFirst(e.target.value)} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="newLast" className="text-xs font-medium">Last Name</label>
                          <Input id="newLast" value={newLast} onChange={e => setNewLast(e.target.value)} required />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label htmlFor="newEmail" className="text-xs font-medium">Email</label>
                          <Input id="newEmail" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="newCnp" className="text-xs font-medium">CNP</label>
                          <Input id="newCnp" value={newCnp} onChange={e => setNewCnp(e.target.value)} required placeholder="13 digits" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="newHireDate" className="text-xs font-medium">Hire Date</label>
                          <Input id="newHireDate" type="date" value={newHireDate} onChange={e => setNewHireDate(e.target.value)} required />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label htmlFor="newBaseSalary" className="text-xs font-medium">Base Salary (RON)</label>
                          <Input id="newBaseSalary" type="number" value={newBaseSalary} onChange={e => setNewBaseSalary(e.target.value === '' ? '' : Number(e.target.value))} required />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <input id="newIsActive" type="checkbox" checked={newIsActive} onChange={e => setNewIsActive(e.target.checked)} />
                          <label htmlFor="newIsActive" className="text-xs">Active</label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <DialogClose type="button" className="text-xs px-3 py-2 rounded border">Cancel</DialogClose>
                        <button type="submit" disabled={createLoading} className="text-xs px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
                          {createLoading ? 'Creating…' : 'Create'}
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {myError && <div className="text-xs text-destructive">{myError}</div>}
            {myEmployees && myEmployees.length === 0 && (
              <div className="text-xs text-muted-foreground">No direct reports found.</div>
            )}
            {myEmployees && myEmployees.length > 0 && (
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {myEmployees.map(e => (
                    <TR key={e.id} className="hover:bg-muted/50">
                      <TD>{e.firstName} {e.lastName}</TD>
                      <TD className="text-xs">{e.email}</TD>
                      <TD><Badge variant={e.isActive ? 'default' : 'outline'}>{e.isActive ? 'Active' : 'Inactive'}</Badge></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        )}
        {activeTab === 'all' && (
          <div role="tabpanel" aria-labelledby="tab-all" className="space-y-4">
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
                                      <dd className="text-muted-foreground">{typeof selectedEmployee.baseSalary === 'number' ? selectedEmployee.baseSalary.toLocaleString() + ' RON' : '—'}</dd>
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
        )}
      </div>
    </Protected>
  );
}
