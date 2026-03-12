# StatementFlow Security Map

## Assets

- **User accounts and credentials**: Supabase Auth (passwords, sessions).
- **Profile data**: `profiles` table (id, name, email, balance).
- **Conversion jobs and uploaded files**: `jobs` table, Supabase Storage `raw` bucket.
- **Balances/coins**: Stored in `profiles.balance`, updated by Edge Functions.
- **Payment intent data**: Handled by Stripe; app only redirects to Stripe Checkout URLs.
- **Stripe Checkout URLs**: Returned by `stripe-create-checkout` Edge Function.
- **Supabase sessions and JWTs**: Cookie-based (Supabase SSR); JWTs used for Edge Function calls.

## Actors

- **Anonymous visitors**: Can access landing, login, signup, forgot-password, auth callback (with code).
- **Authenticated users**: Access dashboard, onboarding, reset-password, convert, history, topup, settings, support.
- **Dev/no-auth**: When `NO_AUTH` or dev user cookie is enabled (non-production only); uses mock data.
- **External services**: Supabase (Auth, DB, Storage, Edge Functions), Stripe.

## Entry Points and Boundaries

| Layer | Path / module | Purpose |
|-------|----------------|---------|
| **Routes** | `src/app/**` | Pages: login, signup, forgot-password, reset-password, onboarding, dashboard, convert, history, topup, settings, support; auth callback. |
| **API** | `src/app/api/dashboard/route.ts` | GET dashboard data (uses `getDashboardData()`). |
| **API** | `src/app/api/auth/user/route.ts` | GET current user (uses `getCurrentUser()`). |
| **API** | `src/app/auth/callback/route.ts` | OAuth/Supabase code exchange; sets auth cookies; redirects to `next` (allowlisted). |
| **Middleware** | `src/middleware.ts` | Session refresh; protects `/dashboard`, `/onboarding`, `/reset-password`. |
| **Server** | `src/lib/supabase/server.ts` | Server Supabase client (cookies). |
| **Server** | `src/lib/server-data.ts` | `getCurrentUser()`, `getDashboardData()` (Supabase + optional dev/mock). |
| **Client** | `src/lib/convert-api.ts` | JWT + Edge Function calls (uploads, jobs, exports, topup, Stripe, delete-user, job-delete). |
| **Client** | `src/lib/queries/use-auth.ts` | Sign in/up, OTP, reset password, logout, dev cookie. |
| **Client** | `src/components/auth/AuthHashHandler.tsx` | Hash-based token handling (signup/recovery only); sets session and redirects. |

## Supabase Edge Functions – Security Expectations

These functions are invoked from the frontend with `Authorization: Bearer <user JWT>` and `apikey: <anon key>`. Security must be enforced in each function.

| Function | Method | Inputs | Backend expectations |
|----------|--------|--------|----------------------|
| `uploads-init` | POST | `filename`, `contentType` | Validate types; generate signed URL scoped to current user; enforce size/type limits. |
| `jobs-create` | POST | `key`, `format` | Verify `key` belongs to user; validate `format` allowlist; create job linked to user. |
| `job-delete` | POST | `jobId` | Verify job ownership via JWT; then delete. |
| `exports-download` | POST | `jobId`, `format` | Verify job ownership; validate format; return signed, time-limited URL. |
| `exports-preview` | POST | `jobId`, `format` | Same as download (ownership + format); return safe preview content. |
| `topup-bundles` | GET | — | Return only public bundle list (no secrets). |
| `topup-bundles` | POST | `bundleId` | Verify user; validate `bundleId`; update balance. |
| `stripe-create-checkout` | POST | `bundleId`, `successBaseUrl` | Verify user; validate `bundleId`; allowlist success/cancel URLs to app origin only; create Stripe session; return Stripe Checkout URL. |
| `delete-user` | POST | `otp` | Verify JWT and OTP (e.g. email OTP); then delete user and related data. |

## Stripe Integration

- Checkout URLs are created server-side by `stripe-create-checkout`; the client only redirects to the returned URL.
- Success/cancel URLs sent to Stripe must be restricted to the app origin (no arbitrary external URLs).

## Client-Side Security (XSS and Data Exposure)

- **No unsafe HTML**: No `dangerouslySetInnerHTML`, `eval`, or `new Function` in `src/`. All preview content (convert/history) is rendered as JSX children (React escapes automatically).
- **Preview limits**: `PreviewContent` caps XLSX rows/columns and CSV/QBO with `PREVIEW_MAX_LINES` (2000) and `PREVIEW_MAX_CHARS` (200KB) to avoid DoS.
- **Storage**: No tokens or PII in `localStorage`/`sessionStorage`; auth is cookie-based (Supabase).

## Production Hardening Checklist

- Do not set `NO_AUTH=true` in production.
- Dev user cookie and “Continue in dev mode” are disabled in production builds.
- Security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy (see `next.config`).
- Supabase auth cookies: use Secure, HttpOnly, SameSite in production (Supabase SSR handles this when served over HTTPS).
- Rate limiting on auth and API endpoints (see middleware or upstream).
- Structured logging for auth failures and unexpected nulls in server-data.
- Keep dependencies updated; run `npm audit` regularly.
