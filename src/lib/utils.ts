import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a UUID v4 idempotency key. Prefer native crypto.randomUUID where available.
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback simple UUID v4 polyfill
  // Not cryptographically strong but adequate for idempotency uniqueness client-side
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Compose a deterministic-ish idempotency key prefix with contextual params + random UUID.
// Format: <operation>-<managerId>-<year>-<MM>-<uuid>
export function makeIdempotencyKey(op: 'csv' | 'pdf' | 'create_csv' | 'create_pdfs' | 'csv_live' | 'pdf_live', managerId: string, year: number, month: number): string {
  const mm = String(month).padStart(2, '0');
  return `${op}-${managerId}-${year}-${mm}-${generateIdempotencyKey()}`;
}
