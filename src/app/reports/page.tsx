"use client";
import React from 'react';
import { Protected } from '@/components/shadcn/protected';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { createAggregatedEmployeeData, sendAggregatedEmployeeData, createPdfForEmployees, sendPdfToEmployees, sendAggregatedEmployeeDataLive, sendPdfToEmployeesLive, listReports, downloadReport } from '@/lib/apiClient';
import { makeIdempotencyKey } from '@/lib/utils';
import { Spinner } from '@/components/shadcn/spinner';
import Link from 'next/link';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/shadcn/dialog';
import { Badge } from '@/components/shadcn/badge';

export default function ReportsPage() {
  const { decoded, accessToken } = useAuth();
  const managerId = decoded?.sub || '';
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [month, setMonth] = React.useState<number>(new Date().getMonth() + 1);
  const [log, setLog] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [reports, setReports] = React.useState<import('@/types').ReportFile[] | null>(null);
  const [reportsError, setReportsError] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewCsv, setPreviewCsv] = React.useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = React.useState<string | null>(null);
  const [selectedReport, setSelectedReport] = React.useState<import('@/types').ReportFile | null>(null);
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = React.useState<string | null>(null);
  // Idempotent operation tracking state
  type OpState = { key: string; status: 'idle' | 'in_progress' | 'sent' | 'cached' | 'error' | 'created'; lastMessage?: string };
  const [csvOp, setCsvOp] = React.useState<OpState>({ key: '', status: 'idle' });
  const [pdfOp, setPdfOp] = React.useState<OpState>({ key: '', status: 'idle' });
  const [liveCsvOp, setLiveCsvOp] = React.useState<OpState>({ key: '', status: 'idle' });
  const [livePdfOp, setLivePdfOp] = React.useState<OpState>({ key: '', status: 'idle' });
  const [createCsvOp, setCreateCsvOp] = React.useState<OpState>({ key: '', status: 'idle' });
  const [createPdfOp, setCreatePdfOp] = React.useState<OpState>({ key: '', status: 'idle' });
  const isManager = !!decoded?.is_manager;

  // Reset idempotent operation state when parameters change (year/month/manager)
  React.useEffect(() => {
    // Avoid clearing if currently in progress to let operation finish; else reset to idle
  if (csvOp.status !== 'in_progress') setCsvOp({ key: '', status: 'idle' });
  if (pdfOp.status !== 'in_progress') setPdfOp({ key: '', status: 'idle' });
  if (liveCsvOp.status !== 'in_progress') setLiveCsvOp({ key: '', status: 'idle' });
  if (livePdfOp.status !== 'in_progress') setLivePdfOp({ key: '', status: 'idle' });
    if (createCsvOp.status !== 'in_progress') setCreateCsvOp({ key: '', status: 'idle' });
    if (createPdfOp.status !== 'in_progress') setCreatePdfOp({ key: '', status: 'idle' });
  }, [managerId, year, month]);
  async function startCsvCreate() {
    if (!isManager) {
      pushLog('Manager role required: Create CSV');
      return;
    }
    const key = createCsvOp.key || makeIdempotencyKey('create_csv', managerId, year, month);
    setCreateCsvOp({ key, status: 'in_progress' });
    try {
      const res = await createAggregatedEmployeeData(managerId, year, month, true, key);
      const statusValue = res.status || 'created';
      setCreateCsvOp({ key, status: statusValue === 'cached' ? 'cached' : 'created', lastMessage: statusValue });
      pushLog(`CSV create ${statusValue} (key=${key})`);
    } catch (e: any) {
      if (e.status === 409) {
        pushLog(`CSV create in progress; retrying (key=${key})`);
        setTimeout(() => startCsvCreate(), 2000);
        return;
      }
      const msg = e.detail || e.message || 'CSV create failed';
      setCreateCsvOp({ key, status: 'error', lastMessage: msg });
      pushLog(`CSV create error: ${msg}`);
    }
  }

  async function startPdfCreate() {
    if (!isManager) {
      pushLog('Manager role required: Create PDFs');
      return;
    }
    const key = createPdfOp.key || makeIdempotencyKey('create_pdfs', managerId, year, month);
    setCreatePdfOp({ key, status: 'in_progress' });
    try {
      const res = await createPdfForEmployees(managerId, year, month, false, key);
      const statusValue = res.status || 'created';
      setCreatePdfOp({ key, status: statusValue === 'cached' ? 'cached' : 'created', lastMessage: statusValue });
      pushLog(`PDF create ${statusValue} (key=${key})`);
    } catch (e: any) {
      if (e.status === 409) {
        pushLog(`PDF create in progress; retrying (key=${key})`);
        setTimeout(() => startPdfCreate(), 2000);
        return;
      }
      const msg = e.detail || e.message || 'PDF create failed';
      setCreatePdfOp({ key, status: 'error', lastMessage: msg });
      pushLog(`PDF create error: ${msg}`);
    }
  }

  const pushLog = (msg: string) => setLog(l => [msg, ...l]);

  const refreshReports = React.useCallback(() => {
    listReports().then(setReports).catch(e => setReportsError(e.detail || 'Failed to list reports'));
  }, []);

  React.useEffect(() => { refreshReports(); }, [refreshReports]);

  const wrap = async (fn: () => Promise<any>, label: string) => {
    setLoading(true);
    try {
      const res = await fn();
      pushLog(`${label} success: ${JSON.stringify(res)}`);
      // Refresh reports after successful generation/send
      refreshReports();
    } catch (e: unknown) {
      const detail = (e as any)?.detail || (e instanceof Error ? e.message : 'Unknown error');
      pushLog(`${label} failed: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  function buildFileUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    // Start from either full URL or compose from base
    let full: string;
    if (path.startsWith('http')) {
      full = path;
    } else {
      const relative = path.startsWith('/') ? path : `/${path}`;
      full = `${base}${relative}`;
    }
    // Normalize: ensure /api/reports/ instead of /reports/ if missing
    try {
      const urlObj = new URL(full);
      if (urlObj.pathname.startsWith('/reports/')) {
        // Avoid double insertion
        urlObj.pathname = urlObj.pathname.startsWith('/api/reports/')
          ? urlObj.pathname
          : `/api${urlObj.pathname}`;
        return urlObj.toString();
      }
      // Also handle case where backend accidentally returns //reports//...
      if (urlObj.pathname.includes('/reports/')) {
        urlObj.pathname = urlObj.pathname.replace(/\/reports\//, '/api/reports/');
        return urlObj.toString();
      }
      return full;
    } catch {
      // Fallback regex on string if URL parsing fails
      return full.replace(/(https?:\/\/[^/]+)\/reports\//, '$1/api/reports/');
    }
  }

  async function openReport(r: import('@/types').ReportFile) {
    setSelectedReport(r);
    setPreviewError(null);
    setPreviewCsv(null);
    setPreviewPdfUrl(null);
    setPreviewLoading(true);
    setDownloadError(null);
    setDownloadSuccess(null);
    try {
      // Fetch via dedicated download endpoint using report ID (not manager/owner ID path)
      const { blob, filename, contentType } = await downloadReport(r.id);
      if (r.type === 'csv' || contentType.includes('csv') || filename.endsWith('.csv')) {
        const text = await blob.text();
        const lines = text.split(/\r?\n/).slice(0, 50).join('\n');
        setPreviewCsv(lines);
      } else if (r.type === 'pdf' || contentType.includes('pdf') || filename.endsWith('.pdf')) {
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
      } else {
        setPreviewError('Unsupported file type for preview');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load file';
      setPreviewError(msg);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownload() {
    if (!selectedReport) return;
    setDownloadLoading(true);
    setDownloadError(null);
    setDownloadSuccess(null);
    try {
      const { blob, filename } = await downloadReport(selectedReport.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloadSuccess(`Downloaded ${filename}`);
      pushLog(`Download success: ${filename}`);
      // revoke after a short delay to allow browser to start saving
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e: unknown) {
      const msg = (e as any)?.detail || (e instanceof Error ? e.message : 'Download failed');
      setDownloadError(msg);
      pushLog(`Download failed: ${msg}`);
    } finally {
      setDownloadLoading(false);
    }
  }

  // Guard to prevent non-managers from invoking manager-only endpoints while still showing UI controls
  async function managerGuard<T>(fn: () => Promise<T>, label: string): Promise<void> {
    if (!isManager) {
      pushLog(`Manager role required: ${label}`);
      return;
    }
    await wrap(fn, label);
  }

  async function startCsvSend() {
    if (!isManager) {
      pushLog('Manager role required: Send CSV');
      return;
    }
    const key = csvOp.key || makeIdempotencyKey('csv', managerId, year, month);
    setCsvOp({ key, status: 'in_progress' });
    try {
      const res = await sendAggregatedEmployeeData(managerId, year, month, key);
      const statusValue = res.status || (res.sent ? 'sent' : 'sent');
      setCsvOp({ key, status: statusValue === 'cached' ? 'cached' : 'sent', lastMessage: statusValue });
      pushLog(`CSV send ${statusValue} (key=${key})`);
    } catch (e: any) {
      if (e.status === 409) {
        pushLog(`CSV send in progress; retrying (key=${key})`);
        setTimeout(() => startCsvSend(), 2000);
        return;
      }
      const msg = e.detail || e.message || 'CSV send failed';
      setCsvOp({ key, status: 'error', lastMessage: msg });
      pushLog(`CSV send error: ${msg}`);
    }
  }

  async function startPdfSend() {
    if (!isManager) {
      pushLog('Manager role required: Send PDFs');
      return;
    }
    const key = pdfOp.key || makeIdempotencyKey('pdf', managerId, year, month);
    setPdfOp({ key, status: 'in_progress' });
    try {
      const res = await sendPdfToEmployees(managerId, year, month, false, key);
      const statusValue = res.status || 'sent';
      setPdfOp({ key, status: statusValue === 'cached' ? 'cached' : 'sent', lastMessage: statusValue });
      pushLog(`PDF send ${statusValue} (key=${key})`);
    } catch (e: any) {
      if (e.status === 409) {
        pushLog(`PDF send in progress; retrying (key=${key})`);
        setTimeout(() => startPdfSend(), 2000);
        return;
      }
      const msg = e.detail || e.message || 'PDF send failed';
      setPdfOp({ key, status: 'error', lastMessage: msg });
      pushLog(`PDF send error: ${msg}`);
    }
  }

  async function startCsvLiveSend() {
    if (!isManager) {
      pushLog('Manager role required: Send CSV Live');
      return;
    }
    const key = liveCsvOp.key || makeIdempotencyKey('csv_live', managerId, year, month);
    setLiveCsvOp({ key, status: 'in_progress' });
    try {
      const res = await sendAggregatedEmployeeDataLive(managerId, year, month, key);
      const statusValue = res.status || (res.sent ? 'sent' : 'sent');
      setLiveCsvOp({ key, status: statusValue === 'cached' ? 'cached' : 'sent', lastMessage: statusValue });
      pushLog(`CSV Live send ${statusValue} (key=${key})`);
    } catch (e: any) {
      if (e.status === 409) {
        pushLog(`CSV Live send in progress; retrying (key=${key})`);
        setTimeout(() => startCsvLiveSend(), 2000);
        return;
      }
      const msg = e.detail || e.message || 'CSV Live send failed';
      setLiveCsvOp({ key, status: 'error', lastMessage: msg });
      pushLog(`CSV Live send error: ${msg}`);
    }
  }

  async function startPdfLiveSend() {
    if (!isManager) {
      pushLog('Manager role required: Send PDFs Live');
      return;
    }
    const key = livePdfOp.key || makeIdempotencyKey('pdf_live', managerId, year, month);
    setLivePdfOp({ key, status: 'in_progress' });
    try {
      const res = await sendPdfToEmployeesLive(managerId, year, month, false, key);
      const statusValue = res.status || 'sent';
      setLivePdfOp({ key, status: statusValue === 'cached' ? 'cached' : 'sent', lastMessage: statusValue });
      pushLog(`PDF Live send ${statusValue} (key=${key})`);
    } catch (e: any) {
      if (e.status === 409) {
        pushLog(`PDF Live send in progress; retrying (key=${key})`);
        setTimeout(() => startPdfLiveSend(), 2000);
        return;
      }
      const msg = e.detail || e.message || 'PDF Live send failed';
      setLivePdfOp({ key, status: 'error', lastMessage: msg });
      pushLog(`PDF Live send error: ${msg}`);
    }
  }

  React.useEffect(() => {
    return () => { // cleanup blob URL
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    };
  }, [previewPdfUrl]);

  return (
    <Protected fallback={<div className="p-6 text-center text-[--color-muted]">Please sign in to access reports.</div>}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[--neutral-800]">Reports</h1>
        <Link href="/dashboard" className="text-sm text-[--color-primary] hover:underline">Back</Link>
      </div>
      {/* Top row: Parameters + Activity Log */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm">
          <h2 className="text-lg font-medium text-[--neutral-800]">Parameters</h2>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="month">Month</Label>
              <Input id="month" type="number" value={month} onChange={e => setMonth(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button disabled={loading || createCsvOp.status === 'in_progress'} onClick={() => startCsvCreate()}>
                {createCsvOp.status === 'in_progress' ? 'Creating CSV…' : createCsvOp.status === 'cached' ? 'Already Created (CSV)' : createCsvOp.status === 'created' ? 'Created (CSV)' : 'Create CSV'}
              </Button>
              <Button
                variant="secondary"
                disabled={loading || csvOp.status === 'in_progress'}
                onClick={() => startCsvSend()}
              >
                {csvOp.status === 'in_progress' ? 'Sending CSV…' : csvOp.status === 'cached' ? 'Already Sent (CSV)' : 'Send CSV'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={loading || createPdfOp.status === 'in_progress'} onClick={() => startPdfCreate()}>
                {createPdfOp.status === 'in_progress' ? 'Creating PDFs…' : createPdfOp.status === 'cached' ? 'Already Created (PDFs)' : createPdfOp.status === 'created' ? 'Created (PDFs)' : 'Create PDFs'}
              </Button>
              <Button
                variant="destructive"
                disabled={loading || pdfOp.status === 'in_progress'}
                onClick={() => startPdfSend()}
              >
                {pdfOp.status === 'in_progress' ? 'Sending PDFs…' : pdfOp.status === 'cached' ? 'Already Sent (PDFs)' : 'Send PDFs'}
              </Button>
              <Button
                variant="secondary"
                disabled={loading || livePdfOp.status === 'in_progress'}
                onClick={() => startPdfLiveSend()}
              >
                {livePdfOp.status === 'in_progress' ? 'Sending PDFs Live…' : livePdfOp.status === 'cached' ? 'Already Sent (PDFs Live)' : 'Send PDFs Live'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={loading || liveCsvOp.status === 'in_progress'}
                onClick={() => startCsvLiveSend()}
              >
                {liveCsvOp.status === 'in_progress' ? 'Sending CSV Live…' : liveCsvOp.status === 'cached' ? 'Already Sent (CSV Live)' : 'Send CSV Live'}
              </Button>
            </div>
          </div>
          {loading && <Spinner />}
        </div>
        <div className="space-y-2 rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm">
          <h2 className="text-lg font-medium text-[--neutral-800]">Activity Log</h2>
          <ul className="space-y-1 text-xs max-h-80 overflow-auto">
            {log.map((l, i) => <li key={i} className="rounded bg-[--neutral-100] p-2 text-[--neutral-700]">{l}</li>)}
          </ul>
        </div>
      </div>
      {/* Bottom: Generated Files full width */}
      <div className="space-y-2 rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-4 shadow-sm">
        <h2 className="text-lg font-medium text-[--neutral-800] flex items-center justify-between">Generated Files {reports === null && <Spinner />}</h2>
          {reportsError && <div className="text-xs text-destructive">{reportsError}</div>}
          {reports && reports.length === 0 && <div className="text-xs text-muted-foreground">No report files generated yet.</div>}
          {reports && reports.length > 0 && (
            <div className="relative w-full overflow-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="border-b bg-[--neutral-50]">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">Type</th>
                    <th className="px-2 py-1 text-left font-medium">Path</th>
                    <th className="px-2 py-1 text-left font-medium">Created</th>
                    <th className="px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-[--neutral-100]">
                      <td className="px-2 py-1"><Badge variant={r.type === 'pdf' ? 'secondary' : 'outline'}>{r.type.toUpperCase()}</Badge></td>
                      <td className="px-2 py-1 font-mono truncate max-w-[140px]" title={r.path}>{r.path}</td>
                      <td className="px-2 py-1">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-2 py-1">
                        <Dialog>
                          <DialogTrigger className="text-primary hover:underline" onClick={() => openReport(r)}>Open</DialogTrigger>
                          <DialogContent className="p-0 max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Report File</DialogTitle>
                              <DialogDescription>{selectedReport?.path}</DialogDescription>
                            </DialogHeader>
                            <div className="p-6 space-y-4">
                              {previewLoading && <Spinner />}
                              {previewError && <div className="text-destructive text-sm">{previewError}</div>}
                              {selectedReport && !previewLoading && !previewError && (
                                <>
                                  {selectedReport.type === 'csv' && previewCsv && (
                                    <pre className="text-xs rounded border bg-muted p-3 overflow-auto max-h-96 whitespace-pre-wrap">{previewCsv}</pre>
                                  )}
                                  {selectedReport.type === 'pdf' && previewPdfUrl && (
                                    <iframe src={previewPdfUrl} className="w-full h-[70vh] rounded border" title="PDF Preview" />
                                  )}
                                  <div className="flex flex-col gap-2">
                                    <div className="flex gap-2 items-center">
                                      <Button size="sm" variant="secondary" disabled={downloadLoading} onClick={handleDownload}>
                                        {downloadLoading ? 'Downloading...' : 'Download'}
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => selectedReport && openReport(selectedReport)} disabled={previewLoading}>
                                        Refresh Preview
                                      </Button>
                                    </div>
                                    {downloadError && <div className="text-xs text-destructive">{downloadError}</div>}
                                    {downloadSuccess && <div className="text-xs text-green-600">{downloadSuccess}</div>}
                                  </div>
                                </>
                              )}
                            </div>
                            <DialogFooter>
                              <DialogClose />
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
    </Protected>
  );
}
