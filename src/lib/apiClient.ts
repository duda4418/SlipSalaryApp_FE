import { jwtDecode } from 'jwt-decode';
import type {
  TokenResponse,
  DecodedAccessToken,
  Employee,
  SalaryComponent,
  Vacation,
  MonthInfo,
  ReportFile,
  IdempotencyKey,
  CreateAggregatedResponse,
  SendAggregatedResponse,
  CreatePdfResponse,
  SendPdfResponse,
  ApiError,
} from '@/types';

// Environment-driven base URL; fallback to localhost
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
// Standard API prefix for all backend routes
const API_PREFIX = '/api';

// Key names for storage (localStorage for simplicity; could move to cookies if needed)
const ACCESS_KEY = 'ssa_access_token';
const REFRESH_KEY = 'ssa_refresh_token';

export function getStoredTokens() {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

export function storeTokens(tr: TokenResponse) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, tr.accessToken);
  if (tr.refreshToken) localStorage.setItem(REFRESH_KEY, tr.refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function decodeAccess(token: string): DecodedAccessToken | null {
  try {
    return jwtDecode<DecodedAccessToken>(token);
  } catch {
    return null;
  }
}

async function baseFetch<T>(path: string, options: RequestInit = {}, retryOn401 = true): Promise<T> {
  // Allow full URLs, otherwise guarantee /api prefix
  const ensured = path.startsWith('http')
    ? path
    : path.startsWith(API_PREFIX)
      ? path
      : `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
  const url = ensured.startsWith('http') ? ensured : `${API_BASE}${ensured}`;
  const tokens = getStoredTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (tokens.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && retryOn401 && tokens.refresh) {
    const refreshed = await tryRefresh(tokens.refresh);
    if (refreshed) {
      return baseFetch<T>(path, options, false);
    }
  }
  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const data = await response.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      // ignore
    }
    const error: ApiError = { status: response.status, detail };
    throw error;
  }
  // If expecting empty body
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function tryRefresh(refreshToken: string): Promise<boolean> {
  try {
  const res = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data: TokenResponse = await res.json();
    storeTokens(data);
    return true;
  } catch {
    return false;
  }
}

// Auth
export async function login(email: string, password: string): Promise<TokenResponse> {
  const data = await baseFetch<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
  storeTokens(data);
  return data;
}

export function logout() {
  clearTokens();
}

// Generic list helpers (legacy direct versions replaced below with normalized variants)
// NOTE: legacy exports removed in favor of normalized implementations further down.
// List employees for a specific manager. Backend endpoint provided as GET /api/employees/{manager_id} (returns array).
// WARNING: This path overlaps with getEmployee; only call when you expect an array result.
// Employee shape normalizer (handles snake_case or camelCase from backend)
function normalizeEmployee(raw: any): Employee {
  if (!raw) {
    return {
      id: '', firstName: '', lastName: '', email: '', cnp: '', baseSalary: 0,
      isActive: false, isManager: false, managerId: null, hireDate: undefined, createdAt: undefined, updatedAt: undefined
    };
  }
  return {
    id: raw.id,
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    email: raw.email ?? '',
    cnp: raw.cnp ?? '',
    baseSalary: raw.baseSalary ?? raw.base_salary ?? 0,
    isActive: raw.isActive ?? raw.is_active ?? false,
    isManager: raw.isManager ?? raw.is_manager ?? false,
    managerId: raw.managerId ?? raw.manager_id ?? null,
    hireDate: raw.hireDate ?? raw.hire_date,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

// Generic employee helpers with normalization
export const listEmployees = async () => {
  const data = await baseFetch<any[]>('/api/employees');
  // Debug logging: raw server response
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] RAW /api/employees response:', data);
  }
  const normalized = data.map(normalizeEmployee);
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] NORMALIZED /api/employees:', normalized);
  }
  return normalized;
};
export const getEmployee = async (id: string) => {
  const raw = await baseFetch<any>(`/api/employees/${id}`);
  // If backend returns array accidentally, take first
  if (Array.isArray(raw)) {
    // Backend ambiguity: /api/employees/{managerId} returns a list. Attempt to find matching id; otherwise fallback.
    if (raw.length === 0) {
      // Return placeholder instead of throwing to avoid noisy modal errors.
      return normalizeEmployee({ id, first_name: '', last_name: '', email: '', is_active: false, is_manager: false, base_salary: 0, cnp: '', manager_id: null });
    }
    const match = raw.find((r: any) => r.id === id);
    return normalizeEmployee(match || raw[0]);
  }
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] RAW /api/employees/{id} response:', raw);
  }
  return normalizeEmployee(raw);
};
// List employees for a specific manager. Backend endpoint provided as GET /api/employees/{manager_id} (returns array).
// WARNING: This path overlaps with getEmployee; only call when you expect an array result.
export const listEmployeesForManager = async (managerId: string) => {
  const data = await baseFetch<any[]>(`/api/employees/manager/${managerId}`);
  return Array.isArray(data) ? data.map(normalizeEmployee) : [];
};
export const createEmployee = async (payload: Partial<Employee>) => {
  const raw = await baseFetch<any>('/api/employees', { method: 'POST', body: JSON.stringify(payload) });
  return normalizeEmployee(raw);
};
export const updateEmployee = async (id: string, payload: Partial<Employee>) => {
  const raw = await baseFetch<any>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return normalizeEmployee(raw);
};
export const deleteEmployee = (id: string) => baseFetch<{ deleted: boolean; id: string }>(`/api/employees/${id}`, { method: 'DELETE' });

export const listSalaryComponents = () => baseFetch<SalaryComponent[]>('/api/salary_components');
export const listVacations = () => baseFetch<Vacation[]>('/api/vacations');
export const listMonths = () => baseFetch<MonthInfo[]>('/api/months');
export const listReports = () => baseFetch<ReportFile[]>('/api/reports');
export const listIdempotencyKeys = () => baseFetch<IdempotencyKey[]>('/api/idempotency_keys');

// Report generation (manager-only)
export const createAggregatedEmployeeData = (managerId: string, year: number, month: number, includeBonuses = true, idempotencyKey?: string) =>
  baseFetch<CreateAggregatedResponse>(`/api/reports_generation/createAggregatedEmployeeData?managerId=${managerId}&year=${year}&month=${month}&includeBonuses=${includeBonuses}`,
    { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined });

export const sendAggregatedEmployeeData = (managerId: string, year: number, month: number, idempotencyKey?: string) =>
  baseFetch<SendAggregatedResponse>(`/api/reports_generation/sendAggregatedEmployeeData?managerId=${managerId}&year=${year}&month=${month}`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });

export const createPdfForEmployees = (managerId: string, year: number, month: number, overwriteExisting = false, idempotencyKey?: string) =>
  baseFetch<CreatePdfResponse>(`/api/reports_generation/createPdfForEmployees?managerId=${managerId}&year=${year}&month=${month}&overwriteExisting=${overwriteExisting}`, { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined });

export const sendPdfToEmployees = (managerId: string, year: number, month: number, regenerateMissing = false, idempotencyKey?: string) =>
  baseFetch<SendPdfResponse>(`/api/reports_generation/sendPdfToEmployees?managerId=${managerId}&year=${year}&month=${month}&regenerateMissing=${regenerateMissing}`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });

// Live email sending endpoints (alternate email service)
export const sendAggregatedEmployeeDataLive = (managerId: string, year: number, month: number, idempotencyKey?: string) =>
  baseFetch<SendAggregatedResponse>(`/api/reports_generation/sendAggregatedEmployeeDataLive?managerId=${managerId}&year=${year}&month=${month}`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });

export const sendPdfToEmployeesLive = (managerId: string, year: number, month: number, regenerateMissing = false, idempotencyKey?: string) =>
  baseFetch<SendPdfResponse>(`/api/reports_generation/sendPdfToEmployeesLive?managerId=${managerId}&year=${year}&month=${month}&regenerateMissing=${regenerateMissing}`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });

// Utility to check token expiration (seconds remaining)
export function secondsUntilExpiry(): number | null {
  const { access } = getStoredTokens();
  if (!access) return null;
  const decoded = decodeAccess(access);
  if (!decoded) return null;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp - now;
}

// Background refresh (call within AuthProvider after login)
export function scheduleAutoRefresh(callback: () => Promise<void>): number {
  // Refresh a bit earlier than 15 minutes (e.g., every 14m)
  const fourteenMinutesMs = 14 * 60 * 1000;
  return window.setInterval(() => {
    callback().catch(() => {/* ignore */});
  }, fourteenMinutesMs);
}

// Download a binary report file by ID via the dedicated download endpoint.
// Returns blob + suggested filename + contentType.
export async function downloadReport(reportId: string): Promise<{ blob: Blob; filename: string; contentType: string }> {
  const ensured = `${API_BASE}${API_PREFIX}/reports/${reportId}/download`;
  const tokens = getStoredTokens();
  const headers: Record<string, string> = {};
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`;
  const res = await fetch(ensured, { headers });
  if (!res.ok) {
    let detail = `Download failed (HTTP ${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {/* ignore JSON parse */}
    const error: ApiError = { status: res.status, detail };
    throw error;
  }
  const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
  const disposition = res.headers.get('Content-Disposition') || '';
  let filename = `report-${reportId}`;
  const match = disposition.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
  if (match) {
    filename = decodeURIComponent(match[1] || match[2]);
  } else {
    // Append extension guess based on content type if missing
    if (!/\.[a-zA-Z0-9]{2,5}$/.test(filename)) {
      if (contentType.includes('pdf')) filename += '.pdf';
      else if (contentType.includes('csv')) filename += '.csv';
    }
  }
  const blob = await res.blob();
  return { blob, filename, contentType };
}
