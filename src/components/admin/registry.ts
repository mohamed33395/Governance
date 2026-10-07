import {
  Boxes,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileText,
  Headset,
  History,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  Star,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

// Brand color families derived from the logo palette (deep green #1A412E,
// gold #C19B4A, cream #F6F4EE). `strong` = thin marks/icons/text,
// `light` = thick marks and icons on the dark sidebar, `soft` = pale tint
// behind icon tiles.
export const FAMILY = {
  pine: { light: '#4A7A60', strong: '#1A412E', soft: '#E9F1EC' },
  gold: { light: '#C19B4A', strong: '#96762F', soft: '#F7EFDC' },
  moss: { light: '#6F9A80', strong: '#33604A', soft: '#ECF3EE' },
  sage: { light: '#9DB5A6', strong: '#5C7A68', soft: '#EFF4F1' },
  bronze: { light: '#8A6D3B', strong: '#665021', soft: '#F2ECDD' },
  sand: { light: '#CBB98E', strong: '#8C7B4F', soft: '#F6F1E2' },
  clay: { light: '#C0654A', strong: '#8F3B2B', soft: '#F9ECE7' },
} as const;

export type FamilyKey = keyof typeof FAMILY;

// Stable KPI accent sequence for distinct measures.
export const KPI_SEQUENCE: FamilyKey[] = ['pine', 'gold', 'moss', 'sage', 'bronze'];

// Stable categorical mapping — bound to a domain key, never to array order.
export const CATEGORY_COLOR: Record<string, string> = {
  // booking statuses (semantic outcomes)
  pending_payment: '#8A6D3B',
  pending: '#C19B4A',
  completed: '#33604A',
  cancelled: '#B3402A',
  // payment statuses
  initiated: '#9DB5A6',
  paid: '#1A412E',
  failed: '#B3402A',
  refunded: '#665021',
};

// Neutral categorical palette for unlabeled categories.
export const CATEGORY_PALETTE = [FAMILY.pine, FAMILY.gold, FAMILY.moss, FAMILY.sage, FAMILY.bronze];

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
  { key: 'nav.dashboard', href: '/admin', icon: LayoutDashboard, family: 'pine', perm: 'view-dashboard' },
  { key: 'nav.bookings', href: '/admin/bookings', icon: CalendarDays, family: 'gold', perm: 'view-bookings' },
  { key: 'nav.reports', href: '/admin/reports', icon: FileText, family: 'sage', perm: 'view-reports' },
  { key: 'nav.payments', href: '/admin/payments', icon: CreditCard, family: 'moss', perm: 'view-payments' },
  { key: 'nav.clients', href: '/admin/clients', icon: Users, family: 'bronze', perm: 'view-clients' },
  { key: 'nav.consultants', href: '/admin/consultants', icon: UserRound, family: 'pine', perm: 'view-consultants' },
  {
    key: 'nav.my_availability',
    href: '/admin/my-availability',
    icon: CalendarClock,
    family: 'sand',
    perm: 'view-availability',
    consultantOnly: true,
  },
  { key: 'nav.packages', href: '/admin/packages', icon: Boxes, family: 'sand', perm: 'view-packages' },
  { key: 'nav.support', href: '/admin/support-tickets', icon: Headset, family: 'bronze', perm: 'view-support-tickets' },
  { key: 'nav.join_requests', href: '/admin/join-requests', icon: UserPlus, family: 'bronze', perm: 'view-join-requests' },
  { key: 'nav.reviews', href: '/admin/reviews', icon: Star, family: 'gold', perm: 'view-reviews' },
  { key: 'nav.users', href: '/admin/users', icon: ShieldCheck, family: 'gold', perm: 'view-users' },
  { key: 'nav.roles', href: '/admin/roles', icon: KeyRound, family: 'sage', perm: 'view-roles' },
  { key: 'nav.activity_logs', href: '/admin/activity-logs', icon: History, family: 'sage', perm: 'view-activity-logs' },
];

export interface NavGroup {
  key: string; // translation key
  family: FamilyKey;
  hrefs: string[];
}

// Grouped by user intent, stable order.
export const NAV_GROUPS: NavGroup[] = [
  { key: 'navGroup.overview', family: 'pine', hrefs: ['/admin'] },
  {
    key: 'navGroup.operations',
    family: 'gold',
    hrefs: ['/admin/bookings', '/admin/my-availability', '/admin/reports', '/admin/payments'],
  },
  { key: 'navGroup.people', family: 'bronze', hrefs: ['/admin/clients', '/admin/consultants'] },
  { key: 'navGroup.catalog', family: 'sand', hrefs: ['/admin/packages'] },
  { key: 'navGroup.support', family: 'bronze', hrefs: ['/admin/support-tickets', '/admin/join-requests', '/admin/reviews'] },
  { key: 'navGroup.access', family: 'sage', hrefs: ['/admin/users', '/admin/roles', '/admin/activity-logs'] },
];

// Longest-prefix match so /admin/clients/5 resolves to the clients route.
export function routeForPath(pathname: string): RouteIdentity | undefined {
  return [...ROUTES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((r) => (r.href === '/admin' ? pathname === '/admin' : pathname.startsWith(r.href)));
}
