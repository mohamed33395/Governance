# Backend request — dashboard charts & page enhancements

> Frontend repo: `Governance`  
> Goal: Add charts and summary cards on top of existing admin tables without redesigning the theme.

The current frontend can already build simple SVG charts. To make the dashboards really useful, we need aggregated endpoints that return counts grouped by status, month, consultant, package, etc.

Please return the usual envelope: `{ success, message, data }`.

---

## 1. Admin dashboard home — `/admin/dashboard/stats` (existing)

Current response is enough for the home-page donut/bar charts. We only use:

```json
{
  "bookings": {
    "total": 120,
    "pending": 30,
    "completed": 80,
    "cancelled": 10,
    "today": 4
  },
  "revenue": { ... }
}
```

Nice to have in the same endpoint (does not block current work):

- `revenue.by_month: [{ month: "2026-09", amount: 15000, amount_formatted: "SAR 150.00" }]`
- `bookings.by_month: [{ month: "2026-09", count: 42 }]`

---

## 2. Bookings list page — `GET /admin/bookings/stats`

Used for the summary cards + donut chart above the bookings table.

```json
{
  "total": 120,
  "today": 4,
  "by_status": [
    { "status": "pending", "count": 30, "label": "قيد الانتظار" },
    { "status": "completed", "count": 80, "label": "مكتمل" },
    { "status": "cancelled", "count": 10, "label": "ملغي" }
  ],
  "by_consultant": [
    { "consultant_id": 6, "consultant_name": "أحمد العتيبي", "count": 25 }
  ],
  "by_package": [
    { "package_id": 1, "package_name": "باقة الذهبية", "count": 15 }
  ],
  "by_month": [
    { "month": "2026-09", "count": 42 }
  ]
}
```

Filters (`status`, `consultant_id`, `package_id`, `date_from`, `date_to`) should be supported so the charts reflect the current table filters.

---

## 3. Payments page — `GET /admin/payments/stats`

```json
{
  "total_amount": 450000,
  "total_amount_formatted": "SAR 4,500.00",
  "by_status": [
    { "status": "paid", "count": 90, "amount": 400000, "amount_formatted": "SAR 4,000.00" },
    { "status": "failed", "count": 10, "amount": 50000, "amount_formatted": "SAR 500.00" }
  ],
  "by_gateway": [
    { "gateway": "moyasar", "count": 80 },
    { "gateway": "fake", "count": 20 }
  ],
  "by_month": [
    { "month": "2026-09", "count": 20, "amount": 100000, "amount_formatted": "SAR 1,000.00" }
  ]
}
```

Should respect `status`, `date_from`, `date_to` filters.

---

## 4. Clients page — `GET /admin/clients/stats`

```json
{
  "total": 80,
  "active": 70,
  "inactive": 10,
  "new_this_month": 5,
  "new_by_month": [
    { "month": "2026-09", "count": 5 }
  ],
  "top_clients": [
    { "client_id": 1, "client_name": "شركة النور", "company_name": "شركة النور", "bookings_count": 12, "revenue": 250000, "revenue_formatted": "SAR 2,500.00" }
  ]
}
```

---

## 5. Consultants page — `GET /admin/consultants/stats`

```json
{
  "total": 10,
  "active": 8,
  "by_specialization": [
    { "specialization": "حوكمة", "count": 3 }
  ],
  "top_consultants": [
    {
      "consultant_id": 6,
      "consultant_name": "أحمد العتيبي",
      "bookings_count": 25,
      "completed_count": 20,
      "pending_reports_count": 2,
      "revenue": 300000,
      "revenue_formatted": "SAR 3,000.00"
    }
  ]
}
```

---

## 6. Reports page — `GET /admin/reports/stats`

```json
{
  "total": 100,
  "pending": 5,
  "uploaded": 95,
  "by_month": [
    { "month": "2026-09", "count": 12 }
  ],
  "by_consultant": [
    { "consultant_id": 6, "consultant_name": "أحمد العتيبي", "count": 15 }
  ]
}
```

---

## Notes

- All money fields should remain **halalas** with a `*_formatted` display string (frontend never formats money manually).
- Month format `YYYY-MM` is preferred.
- Labels can come from the existing `/public/meta` statuses when possible; otherwise a `label` field per group is enough.
- If easier, you can also add a `stats=1` query parameter to the existing list endpoints and return a `meta.stats` object in the paginated response.
