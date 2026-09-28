import { redirect } from 'next/navigation';

// legacy mock portal deep links → new client area routes
const MAP: Record<string, string> = {
  bookings: '/bookings',
  interviews: '/bookings',
  packages: '/my-packages',
  payments: '/payment-methods',
  receipts: '/bookings',
  reports: '/reports',
  reviews: '/reports',
  profile: '/profile',
};

export default async function LegacyClientCatchAll({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  redirect(MAP[slug[0]] ?? '/dashboard');
}
