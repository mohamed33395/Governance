import {
  Boxes,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

// Yafa-UI color families. `strong` = thin marks/icons/text, `light` = thick marks
// and icons on the dark sidebar, `soft` = pale tint behind icon tiles.
export const FAMILY = {
  cyan: { light: '#67e8f9', strong: '#0891b2', soft: '#ecfeff' },
  blue: { light: '#5dadec', strong: '#2563eb', soft: '#eff6ff' },
  green: { light: '#86efac', strong: '#059669', soft: '#ecfdf5' },
  pink: { light: '#f9a8d4', strong: '#db2777', soft: '#fdf2f8' },
  violet: { light: '#c4b5fd', strong: '#7c3aed', soft: '#f5f3ff' },
  orange: { light: '#fdba74', strong: '#d97706', soft: '#fffbeb' },
} as const;

export type FamilyKey = keyof typeof FAMILY;

// Stable KPI accent sequence for distinct measures: cyan, blue, green, violet, pink.
export const KPI_SEQUENCE: FamilyKey[] = ['cyan', 'blue', 'green', 'violet', 'pink'];

// Stable categorical mapping — bound to a domain key, never to array order.
export const CATEGORY_COLOR: Record<string, string> = {
  // booking statuses (semantic outcomes)
  pending_payment: '#d97706',
  pending: '#2563eb',
  completed: '#059669',
  cancelled: '#dc2626',
  // payment statuses
  initiated: '#5dadec',
  paid: '#059669',
  failed: '#dc2626',
  refunded: '#7c3aed',
};

// Neutral categorical palette (cyan, green, pink, violet, blue) for unlabeled categories.
export const CATEGORY_PALETTE = [FAMILY.cyan, FAMILY.green, FAMILY.pink, FAMILY.violet, FAMILY.blue];

export interface RouteIdentity {
  key: string; // translation key
  href: string;
  icon: LucideIcon;
  family: FamilyKey;
  perm: string;
  consultantOnly?: boolean;
}

// One registry: sidebar, page header and route identity all read from here.
export const ROUTES: RouteIdentity[] = [
  { key: 'nav.dashboard', href: '/admin', icon: LayoutDashboard, family: 'cyan', perm: 'view-dashboard' },
  { key: 'nav.bookings', href: '/admin/bookings', icon: CalendarDays, family: 'blue', perm: 'view-bookings' },
  { key: 'nav.reports', href: '/admin/reports', icon: FileText, family: 'violet', perm: 'view-reports' },
  { key: 'nav.payments', href: '/admin/payments', icon: CreditCard, family: 'green', perm: 'view-payments' },
  { key: 'nav.clients', href: '/admin/clients', icon: Users, family: 'pink', perm: 'view-clients' },
  { key: 'nav.consultants', href: '/admin/consultants', icon: UserRound, family: 'cyan', perm: 'view-consultants' },
  {
    key: 'nav.my_availability',
    href: '/admin/my-availability',
    icon: CalendarClock,
    family: 'orange',
    perm: 'view-availability',
    consultantOnly: true,
  },
  { key: 'nav.packages', href: '/admin/packages', icon: Boxes, family: 'orange', perm: 'view-packages' },
  { key: 'nav.users', href: '/admin/users', icon: ShieldCheck, family: 'blue', perm: 'view-users' },
  { key: 'nav.roles', href: '/admin/roles', icon: KeyRound, family: 'violet', perm: 'view-roles' },
];

export interface NavGroup {
  key: string; // translation key
  family: FamilyKey;
  hrefs: string[];
}

// Grouped by user intent, stable order.
export const NAV_GROUPS: NavGroup[] = [
  { key: 'navGroup.overview', family: 'cyan', hrefs: ['/admin'] },
  {
    key: 'navGroup.operations',
    family: 'blue',
    hrefs: ['/admin/bookings', '/admin/my-availability', '/admin/reports', '/admin/payments'],
  },
  { key: 'navGroup.people', family: 'pink', hrefs: ['/admin/clients', '/admin/consultants'] },
  { key: 'navGroup.catalog', family: 'orange', hrefs: ['/admin/packages'] },
  { key: 'navGroup.access', family: 'violet', hrefs: ['/admin/users', '/admin/roles'] },
];

// Longest-prefix match so /admin/clients/5 resolves to the clients route.
export function routeForPath(pathname: string): RouteIdentity | undefined {
  return [...ROUTES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((r) => (r.href === '/admin' ? pathname === '/admin' : pathname.startsWith(r.href)));
}
