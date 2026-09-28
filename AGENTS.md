<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GCMC Frontend — AI Project Guide

Read this before adding or updating any feature. It documents the verified API contract, conventions, and recipes. The full product spec lives in `FRONTEND_IMPLEMENTATION_PLAN.md` (§-references below point there).

## What this project is

Arabic-first (RTL) consultancy platform "GCMC" — marketing site + booking wizard + client portal + admin dashboard. This repo is **frontend only**. The backend is a separate Laravel app serving a fixed REST API at `http://127.0.0.1:8000/api/v1` (dev). Never redesign the existing theme; extend it.

## Stack

- Next.js **16.3.5** (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4
- axios · @tanstack/react-query 5 · zustand 5 (persist) · react-hook-form 7 + zod 4 (`@hookform/resolvers`) · dayjs
- `.env.local`: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1`
- No next-intl — custom i18n (see below). No UI kit — custom primitives in `src/components/ui/`.

## Directory map

```
src/
  app/
    (public)/           # landing, /packages, /consultants(+[id]), /login /register /forgot-password /reset-password, /book/[packageSlug] (wizard)
    (client)/           # client portal: /dashboard /bookings(+[id]) /reports(+[id]) /my-packages /locations /payment-methods /profile /bookings/payment-callback
    admin/              # /admin login+forgot+reset, dashboard, bookings(+calendar+[id]), reports, clients(+[id]), consultants(+[id]), my-availability, packages, payments, users, roles, profile
    client/             # LEGACY redirects only (/client → /dashboard, /client/[...slug] maps old paths)
  components/
    ui/                 # design-system primitives, barrel-exported from index.ts (see inventory below)
    wizard/             # booking-wizard step components + WizardSummary + BookingResult
    admin/              # AdminShell, RequirePermission, AvailabilityEditor, AvailabilityTab, TimeOffsTab, SlotPreviewTab, ReportUploadModal
    auth/               # RequireClient, RequireAdmin, AuthCard
    client/ public/ payment/ shared/
  lib/                  # api.ts (axios), errors.ts, files.ts, form-data.ts, form-errors.ts, meta.ts, permissions.tsx, query-client.ts, i18n/
  stores/               # zustand persist: client-auth.ts, admin-auth.ts, wizard.ts
  schemas/              # zod v4 schemas per domain (messages are translation KEYS, not sentences)
  types/api.ts          # every API entity (keep in sync with backend responses)
  styles/ + globals.css # brand tokens
```

## Backend API contract (verified live — trust this over the plan when they differ)

**Envelope:** `{ success, message, data, error_code, errors }`. Errors: `success:false` + `error_code` (e.g. `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `SLOT_NOT_AVAILABLE`, `PAYMENT_FAILED` 402). Validation errors: `errors: { "field": ["msg"] }` (nested keys like `days.0.ranges.1.end_time`).

**Pagination:** `{ data: [...], meta: { current_page, per_page, total, last_page }, links }`. Some lists are plain arrays (locations, payment-methods, client reports, time-offs, availability days) — check `src/types/api.ts` before writing a queryFn.

**Route prefixes** (auth token chosen by URL prefix in `src/lib/api.ts`):
- `/admin/auth/*` — login, logout, me, forgot-password, reset-password
- `/client/auth/*` — same + register
- `/public/*` — packages, packages/{slug}, consultants, consultants/{id}, consultants/{id}/available-dates?month=YYYY-MM, consultants/{id}/slots?date=, meta
- `/client/*` — bookings (CRUD+quote+cancel), locations, payment-methods, payments, payments/{id}/verify, profile(+avatar+password), reports(+download), subscriptions(+active), dashboard
- `/admin/*` — bookings(+calendar+cancel+complete+mark-refunded+meeting+report), clients, consultants(+availability/time-offs/slots/stats/photo/status), my/availability+time-offs+slots, packages, payments, permissions, profile, reports(+download+notify-client), roles(+users), users(+roles+status+avatar), dashboard/stats

**Critical field names (backend rejects the alternatives):**
- Quote/booking: `package_id` (NOT slug), `time` "HH:MM" (NOT start_time), `client_location_id` (NOT location_id), `client_notes`
- Availability ranges: `start_time` / `end_time`; `day_of_week` 0=Sunday..6; PUT sends **working days only** (omitted days are cleared); PUT response includes `warnings.conflicting_bookings_count`
- `password_confirmation` is required whenever `password` is sent (users/consultants create)
- Money is **halalas** in API payloads; display only via `*_formatted` strings; convert SAR→halalas with `Math.round(sar*100)`
- `/public/meta` `days_of_week[].name` arrives **already localized** via Accept-Language (there is NO `name_ar`)
- Payment verify response is nested: `data: { booking, payment }`
- Booking has record-level `can: { complete, cancel, upload_report }` — always AND it with the user's permission before showing an action
- Fake payment driver tokens: `tok_fake_success`, `tok_fake_3ds` (returns `transaction_url`), `tok_fake_declined`. Real driver = Moyasar (tokenize at `https://api.moyasar.com/v1/tokens`, never send card numbers to our API)

**Uploads/downloads** (`src/lib/files.ts`): FormData, never set Content-Type manually; arrays via bracket notation (`appendFormData` in `src/lib/form-data.ts`); downloads via authenticated blob helper `downloadFile`. Avatar ≤2MB, report file ≤20MB.

## Auth & permissions (§6-§7)

- Two independent zustand-persisted stores: `client-auth` (Client) and `admin-auth` (User). Guards: `RequireClient` / `RequireAdmin` — they refetch `/auth/me` on every mount and overwrite the store (permissions stay fresh).
- `/admin/auth/me` returns `type: 'admin'|'consultant'`, `roles: string[]`, `permissions: string[]` (flat).
- `usePermissions()` → `{ can(p), canAny(...), type }`; `<Can perm>` wrapper; `RequirePermission perm="view-x"` gates every admin page.
- `AdminShell` filters sidebar items by permission (`view-*`) and `consultantOnly`. When adding an admin page: add its nav item with its `view-*` perm AND wrap the page in `RequirePermission` AND gate every action button with `can('create|update|delete-*')`.
- Backend enforces everything (403) — hidden UI is UX only, never skip the backend check assumption.
- 401 interceptor clears the matching store and redirects to the right login.

## i18n

- `src/lib/i18n/translations.ts`: one flat object with `ar` and `en` blocks, keys like `"bookings.title"`. **Every new string must be added to BOTH blocks.**
- `useI18n()` → `t(key)`, `lang`, `dir`. Some keys interpolate: `t('x').replace('{count}', n)`.
- RTL: Arabic is default; use `dir="ltr"` on emails/phones/times/codes; flip arrows with `rtl:-scale-x-100`.
- Switching language writes `NEXT_LOCALE` cookie → axios sends `Accept-Language` → backend-localized labels (status labels, day names) follow automatically. Queries are invalidated on switch.

## Theme

CSS variables (don't hardcode colors): `--green-deep:#1A412E`, `--gold:#C19B4A`, `--cream:#F6F4EE`, plus semantic `--surface/--border/--muted/--danger` etc. Dark mode via `html[data-theme="dark"]`. Fonts: Amiri (headings), IBM Plex Sans Arabic (body). Existing landing/dashboard CSS classes (`btn btn-primary`, `dash-shell`, `auth-*`, `team-card`…) are reused by the new pages — keep them.

## UI primitives (`@/components/ui`)

Button(variants primary/secondary/outline/danger/ghost/gold; sizes sm/md/lg; `loading`) · Field, Input, Textarea, Select({options,placeholder}), Checkbox, Radio, Switch · Card · Badge + StatusBadge(kinds: booking/report/payment/bookingPayment/refund/meeting/subscription) · Modal(sizes sm–xl, `footer`) · ConfirmDialog · Drawer · Tabs({key,label,count?}) · Table+TableSkeleton (`Column`: key/header/render/minWidth/className; `onRowClick`) · Pagination(meta,onPage) · SearchInput(400ms debounce) · DatePicker(enabledDates,onMonthChange) · SlotPicker · Toast+useToast() · EmptyState · ErrorState(onRetry) · Avatar(sm/md/lg/xl) · FileDrop(accept,maxMb,onFile) · StatCard · PageHeader(title,subtitle,actions) · Alert(color,title,body) · PriceTag(formatted) · CopyButton.

## Code conventions (follow exactly)

- Pages are `'use client'`. Data via TanStack Query: `queryKey: ['admin'|'client'|'public', resource, ...params]`. Extract `const data = q.data` then guard `if (!data)` before use (TS18048). `isLoading` → spinner/`TableSkeleton`; `isError` → `<ErrorState onRetry={q.refetch} />`.
- Forms: RHF + `zodResolver(schema from src/schemas)`; on catch: `if (isApiError(e) && e.code === 'VALIDATION_ERROR') applyValidationErrors(setError, e); else if (isApiError(e)) toast.error(e.message)`. Schema messages are translation keys rendered via `t(errors.x?.message)`.
- Mutations invalidate the matching query prefix (`queryClient.invalidateQueries({ queryKey: ['admin','bookings'] })`).
- Dates: `slice(0,16).replace('T',' ')` or dayjs. Never format money manually.
- After mutations that change the current user, call `setUser(fresh)` from the store.

## Recipe: add a new feature

1. Add/adjust types in `src/types/api.ts` (verify the live response with curl first — see tokens below).
2. Add zod schema in the matching `src/schemas/*.ts` (messages = translation keys).
3. Add translation keys to BOTH `ar` and `en` blocks.
4. Build the page/component using the conventions above; reuse `src/components/ui` primitives.
5. Admin page? Add nav item in `AdminShell` (+ permission), wrap in `RequirePermission`, gate buttons with `can()`.
6. Verify: `npx tsc --noEmit` → `npm run build` → curl smoke `curl -s -o /dev/null -w "%{http_code}" localhost:3000/<route>` → live API test.

## Verify against the live backend

Demo accounts (password `Password@123`): `client@gcmc.sa` (client), `admin@gcmc.sa` (admin), `ahmad.alotaibi@gcmc.sa` (consultant). Seeded consultant IDs start at 6 (id 1 is the admin).

```bash
# get tokens
curl -s -X POST http://127.0.0.1:8000/api/v1/admin/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@gcmc.sa","password":"Password@123","device_name":"web"}'
# route table (backend repo): cd /Users/amrmohamed/Documents/projects/hawkama-backend/hawkma && php artisan route:list --path=api/v1
```

## Gotchas learned the hard way

- The backend route tree changed once already (`/admin/login` → `/admin/auth/login`, `/packages` → `/public/packages`). If everything 404s, run `route:list` before changing frontend code.
- Report upload validates real MIME content — a text file named `.pdf` is rejected.
- `complete` is only allowed after the booking starts (backend returns `BOOKING_NOT_STARTED`); trust `booking.can`.
- Paying for a booking can auto-create a subscription for that package; quote `requires_payment:false` means the subscription covers it — skip the payment step in the wizard.
- Deleting a report returns its booking to `report_status: pending`.
- zod v4 API (`z.email()`), React 19, Next 16 — check `node_modules/next/dist/docs/` before assuming older conventions.

