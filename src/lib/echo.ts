import Echo from 'laravel-echo';
import { useAdminAuth } from '@/stores/admin-auth';
import { useClientAuth } from '@/stores/client-auth';

/**
 * Laravel Echo + Reverb client for live notifications (backend §3a).
 * One shared instance per guard; created lazily on first subscribe.
 * If env vars are missing or the socket is down, nothing breaks — the
 * notification bell keeps working via its REST polling.
 */

type Guard = 'admin' | 'client';

const instances = new Map<Guard, Echo<'reverb'>>();

function apiOrigin(): string {
  // NEXT_PUBLIC_API_URL = http://127.0.0.1:8000/api/v1 → strip the /api/v1 suffix
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/v1\/?$/, '');
}

export function getEcho(guard: Guard): Echo<'reverb'> | null {
  if (typeof window === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST;
  if (!key || !host) return null;

  const existing = instances.get(guard);
  if (existing) return existing;

  // pusher-js touches `window` at module scope — load it client-side only.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Pusher = require('pusher-js');
  (window as unknown as { Pusher: unknown }).Pusher = Pusher;

  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http';
  const token = () =>
    guard === 'admin' ? useAdminAuth.getState().token : useClientAuth.getState().token;

  const echo = new Echo<'reverb'>({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiOrigin()}/broadcasting/auth`, // NOT under /api/v1
    auth: {
      headers: {
        get Authorization() {
          const t = token();
          return t ? `Bearer ${t}` : '';
        },
        Accept: 'application/json',
      },
    },
  });

  instances.set(guard, echo);
  return echo;
}

export function disconnectEcho(guard: Guard) {
  instances.get(guard)?.disconnect();
  instances.delete(guard);
}
