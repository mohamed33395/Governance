'use client';

import type { BadgeColor } from './Badge';

// §15 — status → color maps. The label always comes translated from the API.
const MAPS: Record<string, Record<string, BadgeColor>> = {
  booking: { pending_payment: 'amber', pending: 'blue', completed: 'green', cancelled: 'gray' },
  report: { none: 'gray', pending: 'amber', uploaded: 'green' },
  payment: { initiated: 'amber', paid: 'green', failed: 'red', refunded: 'purple' },
  bookingPayment: { unpaid: 'amber', paid: 'green', not_required: 'gray', failed: 'red', refunded: 'purple' },
  refund: { none: 'gray', requested: 'amber', refunded: 'green' },
  meeting: { none: 'gray', pending: 'amber', created: 'green', failed: 'red' },
  subscription: { active: 'green', expired: 'gray', cancelled: 'red' },
};

// Yafa-UI status anatomy: a 6px semantic dot plus plain neutral text — no capsule.
export function StatusBadge({
  kind,
  value,
  label,
  className = '',
}: {
  kind: 'booking' | 'report' | 'payment' | 'bookingPayment' | 'refund' | 'meeting' | 'subscription';
  value: string;
  label: string;
  className?: string;
}) {
  const color = MAPS[kind]?.[value] ?? 'gray';
  return (
    <span className={`status-dot-label ${className}`} data-color={color}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
