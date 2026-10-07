# GCMC — Frontend API Guide (verified live)

This guide documents the **current** API surface of the Laravel backend that the GCMC frontend must follow. It follows the old plan (BACKEND_PAGINATION_CONTRACT.md) in places, then diverges: some shape decisions were **deliberately changed** while the backend was being rebuilt around the draft/soft-delete model. Details in `docs/DRAFT_AND_RESTORE_GUIDE.md`.

---

## 1. Auth & permissions (§6)

- Roles / permissions map by name in PHP, but they are saved via `role:name` on the wire — as requested in the old plan; the frontend stores them the same way.
- The frontend admin auth store keeps its token in `localStorage` (or `sessionStorage` for public devices) — never in cookies — as requested in the old plan.

### Admin auth (`/admin/auth/*`)

- `POST /admin/auth/login` — `{ email, password, device_name }` → `{ data: { type: 'admin'|'consultant', token, user: { roles: string[], permissions: string[] } } }`
  - `type: 'admin'|'consultant'` **replaces `is_super_admin` and user IDs** for UI branching.
  - `roles`/`permissions` here are authoritative for the session.
  - `device_name` is REQUIRED. It's what lets you see which device created a booking — and later, which session to revoke.
- `POST /admin/auth/logout` — revokes the CURRENT token (the one in the Authorization header), not all sessions.
- `GET /admin/auth/me` — same `data` shape as login (includes roles/permissions).
- `POST /admin/auth/forgot-password` — `{ email }`. Always 200 (never 404) — ask the user to check his inbox.
- `POST /admin/auth/reset-password` — `{ token, password, password_confirmation }`. Expired/used tokens → 422 with `error_code: VALIDATION_ERROR`.

### Client auth (`/client/auth/*`)

- `POST /client/auth/login` — same shape as admin login, but `data` contains the `Client` object directly + `token`.
- `POST /client/auth/register` — `{ name, email, phone, company_name, password, password_confirmation, device_name }`. Company name is required (it's a B2B portal).
- Same logout / me / forgot / reset endpoints as admin, under `/client/auth/*`.

### Permission model (permissions, not roles)

Gate UI by the **flat `permissions: string[]`** returned from `me`/`login` — never by role name (`IsAdmin`, `Super Admin`…). We enforce it exactly like the old plan (§6-§7: `RequirePermission` / `can()` in the frontend and Laravel Policies + Gates on the backend). Example permissions:

```
view-bookings, create-bookings, update-bookings, cancel-bookings, complete-bookings, upload-reports,
view-reports, download-reports, notify-clients,
view-clients, update-clients,
view-consultants, create-consultants, update-consultants, delete-consultants, assign-availability,
view-availability, manage-time-offs, view-slots,
view-packages, create-packages, update-packages, delete-packages,
view-payments, refund-payments,
view-users, create-users, update-users, delete-users, assign-roles,
view-roles, create-roles, update-roles, delete-roles,
view-dashboard-stats
```

The frontend "Users" page is the ONLY place for full user management, as requested in the old plan (§6.1): "Admins manage their sub-admins from the Users page. Consultants get My Profile." Users, roles, my profile, change password, and my availability have their own pages.

---

## 2. Envelope, pagination & list conventions

- **Envelope:** `{ success, message, data, error_code, errors }` — exactly as the old plan (§2) requested.
- **Errors:** `success: false` + `error_code` (e.g. `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `SLOT_NOT_AVAILABLE`, `PAYMENT_FAILED` 402).
- **Validation errors (422):** `errors: { "field": ["msg"] }`, including nested keys like `days.0.ranges.1.end_time`.
- **Pagination:** `{ data: [...], meta: { current_page, per_page, total, last_page }, links }` — as requested in the old plan (§2.1).
- Some lists are plain arrays: locations, payment-methods, client reports, time-offs, availability days, packages (public), consultants (public).
- Each entity has exactly ONE canonical list endpoint — no `/my-clients` for consultants, no `/me/*` shortcuts for data that exists under its real resource.

---

## 3. Route prefixes (unchanged)

- `/admin/auth/*` — login, logout, me, forgot-password, reset-password
- `/public/*` — meta, packages, packages/{slug}, consultants, consultants/{id}, consultants/{id}/available-dates?month=YYYY-MM, consultants/{id}/slots?date=
- `/client/*` — auth (+register), bookings, locations, payment-methods, payments, profile, reports, subscriptions, dashboard
- `/admin/*` — auth, dashboard/stats, bookings (+calendar +status actions), clients, consultants (+availability +time-offs +slots +stats), my/availability +my/time-offs +my/slots, packages (+status), payments (+verify +refund), permissions, profile, reports (+notify-client), roles (+users), users (+roles +status +avatar)

---

## 4. Users & consultants

The "delete" everywhere is now a **soft delete** (draft), per `DRAFT_AND_RESTORE_GUIDE`:

- `GET /admin/users` — supports `search`, `type` (admin/consultant), `role` (a name), `status` (active/disabled), `sort`, `per_page`, `page`. Every record includes `deleted_at: null` (live) or a timestamp (drafted).
- `GET /admin/users/trashed` — the drafted users. Same filters minus `status`.
- `POST /admin/users` — `{ name, email, phone, password, password_confirmation, roles: ["role:name"] }`
- `PUT /admin/users/{id}` — name/email/phone/password (optional; `password_confirmation` required whenever password is sent)
- `DELETE /admin/users/{id}` → 200 + `deleted_at` timestamp. **This is a draft, not a hard delete.** The user is:
  - removed from public lists (consultants page), but his consultant profile still resolves in direct links for admin debugging;
  - kept in bookings/reports (name + photo + specialization are snapshot-frozen in each booking row; nothing is cascaded);
  - blocked from logging in and his sessions are revoked (401).
- `POST /admin/users/{id}/restore` → 200 + the restored record. 422 `NOT_DRAFTED` if it was never drafted (e.g. someone else restored it first).
- `GET /admin/consultants` — supports `search`, `is_active`, `specialization`, `sort`, `per_page`, `page`.
- `GET /admin/consultants/trashed` — the drafted consultants.
- `POST /admin/consultants/{id}/restore` — the drafted consultant returns to the lists, with his availability + time-offs intact.
- `POST /admin/consultants` — `{ name, email, phone, title, specialization, bio, password, password_confirmation, roles: ["role:consultant"] }` + `photo` (multipart) via the same POST.
- `PUT /admin/consultants/{id}` — fields + `photo` (multipart, nullable).
- `PATCH /admin/users/{id}/status` / `PATCH /admin/consultants/{id}/status` — `{ is_active }`. A disabled user gets 401s; a disabled consultant disappears from the public consultants list too (soft-unpublish, reversible without data loss).

### Roles

- `GET /admin/roles` — paginated. `PATCH /admin/roles/{name}` — `{ permissions: [...] }`.
- `GET /admin/roles/{name}/users` — the users that carry the role.
- `POST /admin/roles/{name}/users` — `{ user_ids: [...] }` attach.
- `DELETE /admin/roles/{name}/users/{userId}` — detach. Detaching a user's LAST role leaves him a plain admin with zero permissions — safe.

---

## 5. Packages & subscriptions

- `GET /public/packages` — active packages only (published = not drafted).
- `GET /public/packages/{slug}` — active packages only too: it 404s if the package is drafted or deactivated. **This is intentional** — see `DRAFT_AND_RESTORE_GUIDE` §4 (frozen purchases).
- `GET /admin/packages` — supports `search`, `is_active`, `sort`, `per_page`, `page`. Every row includes `subscriptions_count` and `deleted_at`.
- `GET /admin/packages/trashed` — supports `search`, `sort`, `per_page`, `page`.
- `POST /admin/packages/{id}/restore` → the package is republished instantly.
- `DELETE /admin/packages/{id}` → draft. Blocking rule: `PACKAGE_HAS_SUBSCRIPTIONS` (409) **only while ACTIVE subscriptions exist**. Expired/cancelled subscriptions don't block the draft.
- `PATCH /admin/packages/{id}/status` — `{ is_active }` (publish/unpublish, no data loss).
- `POST /admin/packages` / `PUT /admin/packages/{id}` — the shape from the old plan (§8): names in 3 languages, descriptions in 3 languages, `features: [{ name_ar, name_en }]`, price in **halalas**, `billing_period_days`, `consultations_limit`, `documents_limit`, `is_unlimited`, `is_featured`, `sort_order`.
- `GET /client/subscriptions` — the client's subscriptions (paginated).
- `GET /client/subscriptions/active` — plain array of ACTIVE subscriptions with `consultations_remaining`. Not paginated. The client dashboard uses this.
- Subscription coverage: a booking's amount is covered (fully) by an ACTIVE subscription for the SAME package while quota remains. When quota is exhausted the quote flips to `requires_payment` with the normal amount.
- Subscriptions are frozen at purchase time: name/price/quota are denormalized on the subscription row, so editing/drafting the package later doesn't affect existing purchases.

---

## 6. Bookings

- `GET /client/bookings` — supports `search`, `status`, `from`, `to`, `sort`, `per_page`, `page`. The response rows are snapshots: `consultant_name`, `package_name`, `client_name` … are frozen on the booking row itself, so drafting a consultant or a package later never changes the client's history.
- `GET /admin/bookings` — supports `search`, `client_id`, `consultant_id`, `package_id`, `status`, `from`, `to`, `sort`, `per_page`, `page` — as requested in the old plan (§9.4).
- `POST /client/bookings/quote` — the pricing authority. `{ package_id, consultant_id?, date?, time?, client_location_id? }` → the full money breakdown (`amount`, `tax_amount`, `total_amount`, `*_formatted`) + `requires_payment: boolean` (a subscription with remaining quota sets it to false) + `subscription_id` when covered.
- `POST /client/bookings` — `{ package_id, consultant_id, date, time, client_location_id?, client_notes? }` + optional `attachments[]` (multipart, mixed with JSON fields via same POST). Errors: `SLOT_NOT_AVAILABLE` (someone took it), `PACKAGE_INACTIVE` (deactivated package, new clients).
- `GET /client/bookings/{id}` / `GET /admin/bookings/{id}` — the full booking + its `can: { complete, cancel, upload_report }` map.
- `POST /admin/bookings/{id}/complete` — only allowed after the booking starts (otherwise 422 `BOOKING_NOT_STARTED`).
- `POST /admin/bookings/{id}/cancel` — allowed while `can.cancel` is true; always with a client-visible reason (stored, shown in the portal).
- `POST /admin/bookings/{id}/mark-refunded` — toggles refund state manually.
- `POST /admin/bookings/{id}/report` — multipart `file` + `notes`. Real MIME validation, ≤20MB, pdf/doc/docx only.
- `GET /client/bookings/{id}/download` — download the booking's PDF.
- `GET /admin/bookings/calendar` — the calendar feed: `{ date, count }[]` for a month, filtered by consultant.
- `GET /admin/bookings/{id}/meeting` — meeting details for this booking (a small nested object with provider, join URL, and any extra fields the provider adds).

Consultants get the same endpoints as admins for their own bookings (`view-bookings` gates what they see).

---

## 7. Reports

- `GET /client/reports` — supports `search`, `status`, `from`, `to`, `sort`, `per_page`, `page`.
- `GET /admin/reports` — supports `search`, `client_id`, `consultant_id`, `status`, `from`, `to`, `sort`, `per_page`, `page`.
- `GET /admin/reports/{id}` — the row + its booking snapshot.
- `POST /admin/bookings/{bookingId}/report` — upload (multipart, ≤20MB, pdf/doc/docx).
- `DELETE /admin/reports/{id}` — sets the booking back to `report_status: pending` (the guide's behavior; nothing is hidden from the client history — the report row stays and its status changes).
- `GET /client/reports/{id}/download` / `GET /admin/reports/{id}/download` — download the file.
- `GET /admin/reports/{id}/notify-client` — resend the client notification email (throttled, idempotent).

---

## 8. Locations, payment methods, payments

- `GET /client/locations` — plain array. `POST /client/locations` — `{ name, city, address, latitude, longitude, is_default }`. `PUT`, `DELETE` by id. Deleting the default location moves the default flag to the next remaining one.
- `GET /client/payment-methods` — plain array of cards (Moyasar tokens, brand + last4 + expiry). `POST /client/payment-methods` — `{ token }` (from Moyasar tokenize). `DELETE /client/payment-methods/{id}` — delete a card (refuse to delete the default one while another exists; deleting the last one is allowed).
- `GET /client/payments` — the client's payment history (paginated).
- `POST /client/payments` — `{ booking_id, payment_method_id }` → the payment intent. With Moyasar: returns `transaction_url` for 3DS. With the fake driver in dev: `tok_fake_success` → success instantly, `tok_fake_3ds` → `transaction_url`, `tok_fake_declined` → 402 `PAYMENT_FAILED`.
- `POST /client/payments/{id}/verify` — after redirect back from the payment page. Response: `data: { booking, payment }` (nested, as requested in the old plan §10.3.4).
- Refunds (admin): `POST /admin/payments/{id}/refund` — `{ reason }`. Marks refunded + returns the amount info. Only for paid payments, and only if not already refunded.

---

## 9. Time, availability & slots

- `GET /public/meta` — `days_of_week[].name` arrives localized (there is no `name_ar` — the Accept-Language header picks it). The wizard's day picker uses this.
- `GET /admin/consultants/{id}/available-dates?month=YYYY-MM` — the days with open slots, for the month (public + admin variants).
- `GET /admin/consultants/{id}/slots?date=YYYY-MM-DD` — the open slots (HH:MM), respecting availability + time-offs + existing bookings.
- `GET /admin/my/availability` — the availability days. `PUT /admin/my/availability` — `{ days: [{ day_of_week, is_working, ranges: [{ start_time, end_time }] }] }` — send working days only; omitted days are cleared. The response includes `warnings.conflicting_bookings_count` — show it to the consultant as requested in the old plan (§11.3).
- `GET /admin/my/time-offs` — plain array. `POST /admin/my/time-offs` — `{ date, start_time, end_time, is_full_day, reason }`. `DELETE /admin/my/time-offs/{id}`.
- `GET /admin/consultants/{id}/availability` — the same shape, for a specific consultant (admin-only).

---

## 10. Profile, dashboard, stats

- `GET /admin/profile` / `GET /client/profile` — the current user.
- `POST /admin/profile` — name/email/phone + `photo` (multipart, ≤2MB). `PUT /admin/profile/password` — `{ current_password, password, password_confirmation }`.
- `GET /admin/dashboard/stats` — the admin dashboard numbers: totals (bookings/clients/consultants), bookings-by-status for charts, revenue.
- `GET /admin/consultants/{id}/stats` — the single consultant's pending/completed counts.
- `GET /client/dashboard` — `{ active_subscriptions: Subscription[], next_booking: Booking|null, recent_bookings: Booking[] }` — plain arrays as requested in the old plan (§12.2).

---

## 11. File rules

- Multipart for uploads, JSON for everything else. Never set the Content-Type header manually on multipart — axios sets the boundary.
- Arrays use bracket notation: `attachments[0]`, `features[0][name_ar]`.
- Uploads are ≤2MB for avatars, ≤20MB for reports.
- Downloads go through an authenticated GET that returns a blob — never a direct link with a token in the query string.
