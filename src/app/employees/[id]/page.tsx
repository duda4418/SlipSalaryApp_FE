"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { getEmployee } from '@/lib/apiClient';
import type { Employee } from '@/types';
import { Spinner } from '@/components/shadcn/spinner';
import { Badge } from '@/components/shadcn/badge';
import Link from 'next/link';
import { Protected } from '@/components/shadcn/protected';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    getEmployee(id).then(setEmployee).catch(e => setError(e.detail || 'Failed to load employee'));
  }, [id]);

  return (
    <Protected fallback={<div className="p-6 text-center text-muted-foreground">Please sign in.</div>}>
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Employee Details</h1>
          <Link href="/employees" className="text-sm text-primary hover:underline">Back</Link>
        </div>
        {!employee && !error && <Spinner />}
        {error && <div className="text-destructive text-sm">{error}</div>}
        {employee && (
          <div className="space-y-4 rounded-md border border-input p-4 bg-card shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium">{employee.firstName} {employee.lastName}</h2>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
              <div className="flex gap-2">
                {employee.isManager && <Badge variant="secondary">Manager</Badge>}
                <Badge variant={employee.isActive ? 'default' : 'outline'}>{employee.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium">CNP</dt>
                <dd className="text-muted-foreground">{employee.cnp || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Base Salary</dt>
                <dd className="text-muted-foreground">{employee.baseSalary.toLocaleString()} RON</dd>
              </div>
              <div>
                <dt className="font-medium">Manager ID</dt>
                <dd className="text-muted-foreground">{employee.managerId || (employee.isManager ? '—' : 'N/A')}</dd>
              </div>
              <div>
                <dt className="font-medium">Created</dt>
                <dd className="text-muted-foreground">{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Updated</dt>
                <dd className="text-muted-foreground">{employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString() : '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </Protected>
  );
}
