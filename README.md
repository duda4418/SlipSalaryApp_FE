This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# Slip Salary Frontend Additions

## Overview

Implements the UI for employee management and manager-triggered salary report generation (CSV + PDF) integrating with a FastAPI backend.

## Architecture

```
src/
	app/                Next.js App Router pages
		auth/             Authentication form (email/password)
		login/            Legacy redirect -> /auth
		dashboard/        Entry point after login (protected)
		employees/        List employees (protected)
		reports/          Manager report actions (protected + manager-only logic in UI)
	components/ui/      Reusable Tailwind components (Button, Card, Spinner, Protected wrappers)
	context/            React context providers (Auth)
	hooks/              Custom hooks (auth guard)
	lib/                API client fetch + refresh logic
	types/              Shared TypeScript contracts
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

All frontend data requests must explicitly include the `/api` prefix (e.g. `GET /api/employees`). The `apiClient` functions already embed `/api` in each path. If you add a new endpoint, follow the pattern: `baseFetch<YourType>("/api/your_resource")`.

## Auth Flow

1. User navigates to `/auth` and submits email + password (POST `/api/auth/login`).
2. Tokens (access + refresh) stored in `localStorage`; access decoded for role (`is_manager`).
3. Protected pages (`/dashboard`, `/employees`, `/reports`) use a `Protected` wrapper and redirect unauthenticated users to `/auth`.
4. Manager-specific actions additionally gate UI with `is_manager` check.
5. Auto refresh every ~14 minutes or on 401 (single retry via fetch logic); legacy `/login` now redirects into `/auth`.
6. Logout clears tokens and scheduled refresh interval.

## Manager Actions

Accessible on `/reports` if `is_manager` is true (page is protected and requires auth):

- Create CSV: `/api/reports_generation/createAggregatedEmployeeData`
- Send CSV: `/api/reports_generation/sendAggregatedEmployeeData`
- Create PDFs: `/api/reports_generation/createPdfForEmployees`
- Send PDFs: `/api/reports_generation/sendPdfToEmployees`

### Report Download
### Idempotency

The following send endpoints support idempotency via an `Idempotency-Key` header (UUID v4):

```
POST /api/reports_generation/sendAggregatedEmployeeData
POST /api/reports_generation/sendPdfToEmployees
```

Frontend integration now constructs a contextual key using `makeIdempotencyKey(op, managerId, year, month)`:

Format: `<operation>-<managerId>-<year>-<MM>-<uuid>` e.g.

```
csv-612d2135-cc3b-41bc-ad3a-e1704e30cd94-2025-11-38f7b3d2
pdf-612d2135-cc3b-41bc-ad3a-e1704e30cd94-2025-11-a9c1e541
```

If the same key is reused for the same parameters the backend returns a cached response rather than re-sending emails or regenerating archives.

Implementation details:
* Utility: `generateIdempotencyKey()` in `lib/utils.ts` (uses `crypto.randomUUID()` with a fallback).
* API layer: Optional `idempotencyKey` param added to `sendAggregatedEmployeeData` and `sendPdfToEmployees` functions in `apiClient.ts` sets the `Idempotency-Key` header.
* UI: Buttons on `/reports` manage operation state (`idle | in_progress | sent | cached | error`) and retry automatically on 409 (in-progress) using the SAME key.

To allow manual reuse of keys (e.g. for debugging) you can extend the UI with an input bound to a state variable passed to the send functions instead of auto-generating. Current implementation auto-generates and persists per send attempt until resolved.


Each generated file can now be downloaded directly via the secured endpoint:

`GET /api/reports/{report_id}/download`

Frontend integration (`downloadReport(reportId)`) handles:
* Authorization header (Bearer access token)
* Parsing `Content-Disposition` to derive filename
* Blob creation and automatic trigger of browser download

If the backend sets a content type (`application/pdf` or `text/csv`) but no filename, a sensible fallback is applied (e.g. `report-<id>.pdf`).

Errors are surfaced in the activity log and inline below the download button inside the report preview dialog.

## Styling

"Final Theme Reports" palette baked into CSS variables in `globals.css`:

Light theme overhaul (2025 second refresh) prioritizes clarity, cool neutrals, and consistent interaction states.

Core variables (see `globals.css`):
```
--color-primary: #2563eb (blue 600)
--color-accent: #6366f1 (indigo 500)
--color-success: #10b981
--color-warning: #f59e0b
--color-danger: #dc2626
--neutral-50 .. 900: slate scale for backgrounds + text
--background: var(--neutral-50)
--color-surface / --color-surface-alt: elevated containers
--color-border / --color-border-strong: subtle dividers
--color-muted: var(--neutral-600) secondary text
--radius-sm/md/lg: consistent rounded shapes
```

Usage guidelines:
* Headings: `text-[--neutral-800]` or `text-[--neutral-900]`.
* Secondary text: `text-[--color-muted]`.
* Primary actions: `Button` variant `primary`; highlight or secondary emphasis: `accent`; low emphasis: `ghost`.
* Avoid mixing raw hex codes—extend palette by adding new CSS variables.
* Dark mode auto-switches via `prefers-color-scheme: dark` token adjustments.

To add a new brand color: define `--color-brandX` in `:root`, then reference with Tailwind arbitrary class `text-[--color-brandX]`.

Use Tailwind with arbitrary values for brand shades; shared utility classes also provided.

## Running

```bash
npm install
npm run dev
```

Backend must be available at `NEXT_PUBLIC_API_BASE`.

## Lint

```bash
npm run lint
```

## Future Enhancements

- Switch token storage to httpOnly cookies.
- Add SWR/React Query for caching + revalidation.
- Robust error boundary + toast notifications instead of alerts.
- Download links for archived reports.
- Dark mode variant (palette adaption).

## Security Notes

Avoid storing sensitive PII beyond needed for display; ensure backend filters by manager on report endpoints.

---
