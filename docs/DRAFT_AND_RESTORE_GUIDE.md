# GCMC — Draft & Restore (Soft Delete) Guide

> This document follows `docs/FRONTEND_API_GUIDE.md` and explains the behavioural contract of the backend's soft-delete model ("delete = draft"), and how the frontend should present it to users and staff.

## 1. Why "delete = draft"

In GCMC we never destroy historical records, because bookings/reports reference them for accounting and follow-up. "Deleting" a user/consultant/client/package means:

- it disappears from its normal (live) lists;
- it keeps ALL its data intact, unchanged;
- it can be brought back at any time (restored) with a single click, without losing any of its relations (roles, availability, time-offs, photos...);
- its historical references (bookings, reports, payments) remain visible and unchanged — those rows are denormalised snapshots (name + photo + title frozen on the booking row itself), so nothing is cascaded and no historical page ever changes.

Put simply: **"delete" is an undoable un-publish, never a destruction.** The user-visible word is still "حذف / Delete" (we don't scare users with "drafts" in the normal flow), but the frontend UI offers a "المسودات / Drafts" tab where drafted records can be restored with one click.

### 1.1 Who can draft / restore

Drafting a record uses its `delete-*` permission (e.g. `delete-consultants`), and restoring uses the SAME `delete-*` permission. There is no new permission to add to the roles matrix — whoever can delete can restore. Backend enforces both.

## 2. What the API returns

- **Live lists (`GET /admin/users`, `/admin/consultants`, `/admin/clients`, `/admin/packages`)**: only live records, as before. Each record carries `deleted_at: null`.
- **Trashed lists (`GET /admin/{resource}/trashed`)**: only drafted records, each with `deleted_at` as a timestamp. Supports `search`, `sort`, `per_page`, `page` exactly like the live list (search is a LIKE on name/email/phone).
- **Detail endpoints**: drafted records still resolve by id for admin debugging (`GET /admin/consultants/{id}` returns the record with `deleted_at` set), but client/public endpoints 404/403 for drafted records (a drafted consultant is not bookable, a drafted package is not purchasable).
- **Restore (`POST /admin/{resource}/{id}/restore`)**: 200 + the restored record (`deleted_at: null` again). 422 `NOT_DRAFTED` if the record was never drafted — e.g. someone else restored it first.
- Money is **halalas** in payloads, and `*_formatted` strings in responses — this doesn't change.

### 2.1 Blocking rules (nothing changed vs the old "hard delete" plan)

- `USER_HAS_FUTURE_BOOKINGS` / `CONSULTANT_HAS_FUTURE_BOOKINGS` (409): a consultant with future bookings cannot be drafted — cancel them first.
- `CLIENT_HAS_FUTURE_BOOKINGS` (409): same for clients.
- `PACKAGE_HAS_SUBSCRIPTIONS` (409): a package with ACTIVE subscriptions cannot be drafted — wait for expiry or cancel them.
- Blocking errors surface with `error_code` — the frontend should show the backend's message (it's localized) and not invent its own.

### 2.2 Drafted client accounts & auth

- A drafted client cannot log in (403 `FORBIDDEN` with a localized "account suspended" message) and his tokens are revoked.
- Drafting is also instant for sessions: drafting a user revokes all his tokens (same behaviour as the disable toggle).

## 3. Frontend UI (Suggested)

### 3.1 Admin pages (users, consultants, clients, packages)

- Add a "المسودات / Drafts" tab next to the live list:
  - the tab shows the count of drafted records as a badge (from the trashed endpoint's `meta.total`);
  - rows in the drafts tab show `deleted_at` and a Restore button (restoring uses the same `delete-*` permission as delete);
  - keep the normal delete button on live rows — the action is the same "delete" the users already know.
- On restore success: move the row back to the live list (refetch both lists) and show a success toast.
- On `NOT_DRAFTED` (someone else restored it first): silently refresh the list — the record is already live, there is nothing to warn about.
- Deleting from the drafts tab is not possible (there is no force delete; only a database cleanup tool that the admin may run later, outside the app).

## 4. Frozen purchases — packages & subscriptions (§4)

Subscriptions are frozen at purchase time: each subscription row denormalises its own copy of name/price/quota. Changing a package later (name, price, quota, features...) never touches existing subscriptions. This is also why:

- `GET /public/packages` (the wizard's step 1) shows only active packages;
- but `GET /client/subscriptions/active` (the client's own list) shows his subscriptions with their frozen names and remaining quota;
- when a package is **drafted or deactivated** after the client purchased it, he can still: see the subscription with the remaining quota; book the remaining consultations of that package normally (the quote/booking endpoints accept it — the coverage logic runs before the package checks), and only the NEW purchases are blocked;
- in the wizard, if the client tries to book a package that was drafted/deactivated and he does NOT have an active subscription for it, he gets the backend's localized error (404/422) — show it as a normal toast/error state, don't redirect to the pricing page silently.

### 4.1 Suggested UI on the wizard

- On the wizard's package step (or the pricing list page), put the client's active subscriptions at the top (from `GET /client/subscriptions/active`): "لديك استشارتان متبقيتان في الباقة الفضية" with a "continue with this package" one-click that jumps straight to the consultant step, keeping the chosen packageSlug.
- When the chosen package was drafted/deactivated, this subscriptions card still works (it carries its own name/price/quota), so the client isn't blocked by an admin's edit.

## 5. Client portal

- The client portal never surfaces drafted/deactivated state to the client: his history (bookings/reports/payments) is always live, unchanged, snapshot-frozen.
- `my packages` shows his subscriptions with the frozen names and statuses (active/expired/cancelled) — never the live package list.

## 6. Statuses are separate from drafts

- `is_active` (the disable toggle) is a separate, reversible flag that only affects new bookings and login; it never hides history.
- `report_status`, `booking.status`, `subscription.status` follow their own state machines — drafting a consultant doesn't change his old bookings' statuses.

## 7. Backend parity note

The Laravel side uses a `Drafted` scope + `deleted_at` column on `users`, `clients`, `packages` (and a polymorphic `drafts` table for future entities), with a global scope that hides drafted records from every Eloquent query unless explicitly requested. Restore is a single service method. No frontend endpoint shape changed in this model — only the data returned (drafted records now resolve for admin debugging instead of 404ing).

---

_See also: `docs/FRONTEND_API_GUIDE.md` for the full API surface, and `BACKEND_PAGINATION_CONTRACT.md` for the envelope/pagination shape._
