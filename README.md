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
		login/            Authentication form
		dashboard/        Entry point after login
		employees/        List employees
		reports/          Manager report actions
	components/ui/      Reusable Tailwind components
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

1. POST /api/auth/login returns access + refresh tokens.
2. Tokens stored in localStorage; access decoded for role (`is_manager`).
3. Auto refresh every ~14 minutes or on 401 (single retry).
4. Logout clears tokens.

## Manager Actions

Accessible on `/reports` if `is_manager` is true:

- Create CSV: `/api/reports_generation/createAggregatedEmployeeData`
- Send CSV: `/api/reports_generation/sendAggregatedEmployeeData`
- Create PDFs: `/api/reports_generation/createPdfForEmployees`
- Send PDFs: `/api/reports_generation/sendPdfToEmployees`

## Styling

"Final Theme Reports" palette baked into CSS variables in `globals.css`:

Updated palette (2025 refresh) focuses on contrast, warmth in accents, and accessible neutrals.

Core variables:

```
--color-primary: #1D5B79;
--color-primary-600: #16455C;
--color-accent: #FF8E3C;
--color-danger: #E5484D;
--color-success: #2BAA74;
--color-warning: #E4B800;
--neutral-50..900: tiered grayscale/blue slate neutrals
--background: var(--neutral-100);
--color-surface / --color-surface-alt: card + subtle surface layering
```

Usage patterns:
* Components pull from CSS variables via Tailwind arbitrary values (e.g. `bg-[--color-primary]`).
* Favor `text-[--color-muted]` for secondary text; primary headings use `text-[--color-primary]`.
* Buttons: new `accent` variant for highlight actions.
* Dark mode auto-applies via `prefers-color-scheme: dark` media query.

Add new semantic colors by extending `:root` with `--color-*` then referencing in components.

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
