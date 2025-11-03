"use client";
import React from 'react';
import { listEmployees } from '@/lib/apiClient';
import { Employee } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    listEmployees().then(setEmployees).catch(e => setError(e.detail || 'Failed to load'));
  }, []);

  if (error) return <div className="p-6 text-[--color-danger]">{error}</div>;
  if (!employees) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[--color-primary]">Employees</h1>
        <Link href="/dashboard" className="text-sm text-[--color-primary] hover:underline">Back</Link>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Manager</TH>
            <TH>Active</TH>
          </TR>
        </THead>
        <TBody>
          {employees.map(e => (
            <TR key={e.id}>
              <TD>{e.firstName} {e.lastName}</TD>
              <TD>{e.email}</TD>
              <TD>{e.isManager ? 'Manager' : e.managerId ? 'Employee' : '—'}</TD>
              <TD>{e.isActive ? 'Yes' : 'No'}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
