// Shared TypeScript types aligning with backend contract

export type TokenResponse = {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number; // seconds
  refreshToken?: string;
};

export interface DecodedAccessToken {
  sub: string; // employee UUID
  is_manager: boolean;
  email: string;
  exp: number; // epoch seconds
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cnp: string;
  baseSalary: number;
  isActive: boolean;
  isManager: boolean;
  managerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryComponent {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  type: 'bonus' | 'adjustment';
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  daysTaken: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthInfo {
  id: string;
  year: number;
  month: number; // 1-12
  workingDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportFile {
  id: string;
  path: string;
  type: 'csv' | 'pdf';
  managerId?: string;
  year?: number;
  month?: number;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IdempotencyKey {
  id: string;
  key: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiError {
  status: number;
  detail: string;
}

export type CreateAggregatedResponse = {
  fileId: string;
  path: string;
  archived: boolean;
  // Idempotency-enhanced fields (optional; present when using Idempotency-Key)
  status?: 'created' | 'cached' | 'in_progress' | 'error';
  idempotent?: boolean;
};

export type SendAggregatedResponse = {
  sent?: boolean; // legacy
  recipientCount?: number; // legacy
  status?: 'sent' | 'cached' | 'in_progress' | 'error';
  fileId?: string;
  archived?: boolean;
  archivePath?: string;
  idempotent?: boolean;
};

export type CreatePdfResponse = {
  generatedCount: number;
  skippedCount: number;
  month: number;
  year: number;
  // Idempotency-enhanced fields (optional)
  status?: 'created' | 'cached' | 'in_progress' | 'error';
  idempotent?: boolean;
};

export type SendPdfResponse = {
  sentCount?: number; // legacy
  missingCount?: number; // legacy
  status?: 'sent' | 'cached' | 'in_progress' | 'error';
  archiveZipId?: string;
  archiveZipPath?: string;
  archivedPdfs?: number;
  idempotent?: boolean;
};
