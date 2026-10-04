# Missing Backend Endpoints — GCMC API v1

**Date:** 2026-10-04
**Base URL:** `http://127.0.0.1:8000/api/v1`
**Status:** All endpoints below return **404 NOT_FOUND** — verified live against the running backend (`route:list` shows no routes for them).

The frontend already implements pages/features that call these endpoints. Each section lists the exact routes, request shapes, and response shapes the frontend expects.

---

## Contract conventions (same as existing endpoints)

- **Envelope:** `{ success, message, data, error_code, errors }`
- **Pagination:** `{ data: [...], meta: { current_page, per_page, total, last_page }, links: { first, last, prev, next } }` — some list endpoints may return plain arrays, but paginated is preferred for lists shown in tables.
- **Errors:** `success:false` + `error_code` (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`...). Validation errors: `errors: { "field": ["msg"] }`.
- **Uploads:** `multipart/form-data` — files under `image`, `voice`, `cv` keys.
- **Localization:** `*_label` fields must respect `Accept-Language` (ar/en), same as `status_label` on existing resources.
- **Auth:** same Sanctum bearer tokens — `/admin/*` uses admin/consultant token, `/client/*` uses client token.

---

## 1. Notifications (highest priority — polled every 30s)

`NotificationBell` (`src/components/notifications/NotificationBell.tsx`) polls `unread-count` every 30 seconds for **every logged-in admin and client**, so these 404s spam logs continuously.

### Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/admin/notifications` | admin/consultant | `?unread=0|1&per_page=10&page=N` → **paginated** |
| GET | `/admin/notifications/unread-count` | admin/consultant | → `{ data: { unread_count: number } }` |
| PATCH | `/admin/notifications/{id}/read` | admin/consultant | mark single as read |
| POST | `/admin/notifications/read-all` | admin/consultant | mark all as read |
| DELETE | `/admin/notifications/{id}` | admin/consultant | delete one |
| GET | `/client/notifications` | client | same params → paginated |
| GET | `/client/notifications/unread-count` | client | same shape |
| PATCH | `/client/notifications/{id}/read` | client | |
| POST | `/client/notifications/read-all` | client | |
| DELETE | `/client/notifications/{id}` | client | |

### Notification shape (`Notification` in `src/types/api.ts`)

```ts
{
  id: string,                        // uuid string — NOT number
  type: string | null,
  data: {
    type?: string,                   // notification type also inside data
    recipient?: { type: 'client'|'user', id: number, name: string, email: string },
    // type-specific fields below:
    booking_id?: number, reference?: string, company_name?: string, reason?: string,
    report_id?: number, title?: string,
    join_request_id?: number, name?: string, specialization?: string,
    review_id?: number, rating?: number, email?: string,
  },
  read_at: string | null,
  created_at: string,
}
```

### Known `data.type` values (emitted on these events)

- `new_booking` — booking created (→ admins)
- `booking_confirmed` — payment confirmed (→ client)
- `booking_cancelled` — carries `reason` (→ other party)
- `payment_failed` (→ client)
- `report_ready` — report uploaded, carries `title` (→ client)
- `client_welcome` — new client registered (→ admins, `recipient.type='client'`)
- `staff_account_created` — new user created (→ admins, `recipient.type='user'`, carries `email`)
- `join_request_submitted` — carries `join_request_id`, `name`, `specialization` (→ admins)
- `review_submitted` — carries `review_id`, `name`, `rating` (→ admins)
- `reset_password`

Standard Laravel database notifications fit this shape if `data.type` is included in the payload.

---

## 2. Join Requests (public consultant application form)

### Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | `/public/join-requests` | **public** | `multipart/form-data`: `name`*, `email`*, `phone`*, `specialization`*, `bio`, `linkedin_url`, `cv` (file, PDF/DOC ~≤5MB) |
| GET | `/admin/join-requests` | admin | `?search=&status=pending|approved|rejected&page=` → paginated |
| GET | `/admin/join-requests/{id}` | admin | |
| PATCH | `/admin/join-requests/{id}/approve` | admin | see side-effect note |
| PATCH | `/admin/join-requests/{id}/reject` | admin | body: `{ reason: string }` |

### `JoinRequest` shape

```ts
{
  id, name, email, phone, specialization,
  bio: string | null, linkedin_url: string | null,
  cv_url?: string,                       // signed/public URL to uploaded CV
  status: 'pending' | 'approved' | 'rejected',
  user_id?: number | null,               // set when approved → created user
  reviewed_by?: number | null,
  reviewer?: { id, name } | null,
  reviewed_at?: string | null,
  created_at, updated_at,
}
```

**Approve side-effect:** frontend expects approval to create a consultant-type `User` (sets `user_id`) — check `src/app/admin/join-requests/page.tsx` flow. Emit `staff_account_created` + `join_request_submitted` notifications.

**New permission needed:** `view-join-requests` (frontend gates pages with it — seed it into the permissions table).

---

## 3. Reviews / Testimonials

### Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/public/reviews` | **public** | `?per_page=6&page=` → paginated, **approved only** (landing page testimonials) |
| GET | `/client/reviews` | client | own reviews → paginated |
| POST | `/client/reviews` | client | JSON: `{ name*, rating: 1-5*, title?, comment* }` → starts `status: 'pending'` |
| GET | `/admin/reviews` | admin | `?search=&status=pending|approved|rejected&page=` → paginated |
| GET | `/admin/reviews/{id}` | admin | |
| PATCH | `/admin/reviews/{id}/approve` | admin | sets `published_at` |
| PATCH | `/admin/reviews/{id}/reject` | admin | body: `{ reason: string }` → `rejection_reason` |

### `Review` shape

```ts
{
  id, client_id,
  client?: { id, name, company_name } | null,
  name: string,                  // display name (client picks it, not necessarily account name)
  title: string | null,          // e.g. job title
  rating: number,                // 1..5
  comment: string,
  status: 'pending' | 'approved' | 'rejected',
  status_label?: string,         // localized
  rejection_reason: string | null,
  published_at: string | null,
  created_at, updated_at,
}
```

Emit `review_submitted` notification to admins on create.

**New permission needed:** `view-reviews`.

---

## 4. Support Tickets

### Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/client/support-tickets` | client | `?page=` → paginated |
| POST | `/client/support-tickets` | client | `multipart`: `category`*, `description`*, `image?`, `voice?` |
| GET | `/client/support-tickets/{id}` | client | includes `messages[]` |
| POST | `/client/support-tickets/{id}/messages` | client | `multipart`: `body?`, `image?`, `voice?` (at least one required) |
| GET | `/admin/support-tickets` | admin/staff | `?status=&category=&client_id=&page=` → paginated |
| GET | `/admin/support-tickets/{id}` | admin/staff | includes `messages[]` |
| POST | `/admin/support-tickets/{id}/messages` | admin/staff | `multipart`: `body?`, `image?`, `voice?`, `is_internal` ('1' = staff-only note) |
| PATCH | `/admin/support-tickets/{id}/status` | admin/staff | JSON: `{ status: 'open'|'in_progress'|'resolved'|'closed' }` |

### Enums

- **category:** `general_inquiry | booking_issue | payment_issue | technical | consultant_complaint`
- **status:** `open | in_progress | resolved | closed`

### `SupportTicket` shape

```ts
{
  id, category, category_label?, status, status_label?,
  description, client_id,
  client?: { id, name, company_name, email, phone } | null,
  consultant_id: number | null,          // set when category=consultant_complaint (optional link)
  consultant?: { id, name } | null,
  image_url?: string | null, voice_url?: string | null,
  can_reply?: boolean,                   // false when closed
  created_at, updated_at,
  messages?: SupportMessage[],           // on show endpoint
}

SupportMessage: {
  id, body: string | null,
  image_url?: string | null, voice_url?: string | null,
  is_internal: boolean,                  // staff notes hidden from client
  sender_type: 'client' | 'user' | 'system',
  sender?: { id, name, type?: string } | null,
  created_at,
}
```

**Important:** filter `is_internal` messages OUT of the `/client/*` responses — they are staff-only.

**New permission needed:** `view-support-tickets`.

---

## Summary checklist for backend

- [ ] `admin + client /notifications/*` (5 routes each)
- [ ] `POST /public/join-requests` + `admin /join-requests/*` (4 routes) + consultant creation on approve
- [ ] `GET /public/reviews` + `client /reviews` (2) + `admin /reviews/*` (4)
- [ ] `client /support-tickets/*` (4) + `admin /support-tickets/*` (4)
- [ ] Seed new permissions: `view-join-requests`, `view-reviews`, `view-support-tickets`
- [ ] Emit notifications on: new booking, booking confirmed/cancelled, payment failed, report ready, client registered, staff created, join request, review submitted

## Verify after implementation (curl)

```bash
TOKEN=<admin token>
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/v1/admin/notifications/unread-count
# expect: {"success":true,"data":{"unread_count":0}}
```
