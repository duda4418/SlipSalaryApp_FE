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

// Generic list helpers
export const listEmployees = () => baseFetch<Employee[]>('/api/employees');
export const getEmployee = (id: string) => baseFetch<Employee>(`/api/employees/${id}`);
export const createEmployee = (payload: Partial<Employee>) => baseFetch<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(payload) });
export const updateEmployee = (id: string, payload: Partial<Employee>) => baseFetch<Employee>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteEmployee = (id: string) => baseFetch<{ deleted: boolean; id: string }>(`/api/employees/${id}`, { method: 'DELETE' });

export const listSalaryComponents = () => baseFetch<SalaryComponent[]>('/api/salary_components');
export const listVacations = () => baseFetch<Vacation[]>('/api/vacations');
export const listMonths = () => baseFetch<MonthInfo[]>('/api/months');
export const listReports = () => baseFetch<ReportFile[]>('/api/reports');
export const listIdempotencyKeys = () => baseFetch<IdempotencyKey[]>('/api/idempotency_keys');

// Report generation (manager-only)
export const createAggregatedEmployeeData = (managerId: string, year: number, month: number, includeBonuses = true) =>
  baseFetch<CreateAggregatedResponse>(`/api/reports_generation/createAggregatedEmployeeData?managerId=${managerId}&year=${year}&month=${month}&includeBonuses=${includeBonuses}`,
    { method: 'POST' });

export const sendAggregatedEmployeeData = (managerId: string, year: number, month: number) =>
  baseFetch<SendAggregatedResponse>(`/api/reports_generation/sendAggregatedEmployeeData?managerId=${managerId}&year=${year}&month=${month}`, { method: 'POST' });

export const createPdfForEmployees = (managerId: string, year: number, month: number, overwriteExisting = false) =>
  baseFetch<CreatePdfResponse>(`/api/reports_generation/createPdfForEmployees?managerId=${managerId}&year=${year}&month=${month}&overwriteExisting=${overwriteExisting}`, { method: 'POST' });

export const sendPdfToEmployees = (managerId: string, year: number, month: number, regenerateMissing = false) =>
  baseFetch<SendPdfResponse>(`/api/reports_generation/sendPdfToEmployees?managerId=${managerId}&year=${year}&month=${month}&regenerateMissing=${regenerateMissing}`, { method: 'POST' });

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
