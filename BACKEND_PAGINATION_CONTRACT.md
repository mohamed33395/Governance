# Backend pagination contract

> Frontend repo: `Governance`  
> Status: pagination UI already exists on every admin/client list page; it simply hides when `last_page <= 1`.

## 1. Required response shape for every list endpoint

All list endpoints must return the standard paginated envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": [
    { ... },
    { ... }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 150,
    "last_page": 10
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

`meta` is the only field the frontend reads for pagination.

## 2. Accepted query parameters

Every list endpoint must accept:

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | integer | 1 | 1-based page number |
| `per_page` | integer | 15 | allow 1–100 |
| `search` | string | — | free-text search across relevant fields |
| `sort` | string | — | `-created_at` = descending; omit `-` for ascending |

## 3. Admin endpoints that must be paginated

The frontend already sends `page`/`per_page` to these endpoints:

- `GET /admin/users`
- `GET /admin/roles`
- `GET /admin/roles/{id}/users`
- `GET /admin/consultants`
- `GET /admin/consultants/{id}/clients`
- `GET /admin/consultants/{id}/bookings`
- `GET /admin/consultants/{id}/time-offs`
- `GET /admin/clients`
- `GET /admin/bookings`
- `GET /admin/reports`
- `GET /admin/payments`
- `GET /admin/packages`

## 4. Client-portal endpoints that must be paginated

- `GET /client/bookings`
- `GET /client/reports`

## 5. Public endpoints that must be paginated

- `GET /public/consultants`

## 6. Why pagination may look “missing”

The `<Pagination>` component in the frontend returns `null` when `meta.last_page <= 1`. If the seeded dataset has fewer than `per_page` rows, the footer simply does not render. This is intentional — it is not a missing feature.

## 7. Nice-to-have: URL-synced filters

The plan prefers list pages to sync `page`, `search`, and filter values to the URL (`?page=2&status=pending`). This currently works as long as the backend accepts the same params listed above.

---

**Reference in plan:** `FRONTEND_IMPLEMENTATION_PLAN.md` §5.3, §5.5 and the `Paginated<T>` type in `src/types/api.ts`.
