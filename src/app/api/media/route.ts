// Media proxy: the PHP dev server (artisan serve) serves /storage/* as static
// files, so Laravel's CORS middleware never runs on them and browsers block
// cross-origin <img>/fetch to http://localhost:8000/storage/... . Proxying
// through this same-origin route fixes card/report exports (html-to-image)
// without touching the backend.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1';

function isAllowedTarget(target: URL): boolean {
  if (!/^https?:$/.test(target.protocol)) return false;
  const apiHost = new URL(API_BASE).hostname;
  const devHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  return target.hostname === apiHost || devHosts.has(target.hostname);
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('url');
  if (!raw) return new Response('missing url', { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response('invalid url', { status: 400 });
  }
  if (!isAllowedTarget(target)) return new Response('forbidden', { status: 403 });

  let upstream: Response;
  try {
    upstream = await fetch(target, { cache: 'no-store' });
  } catch {
    return new Response('upstream unreachable', { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response('not found', { status: upstream.status || 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'cache-control': 'public, max-age=300',
    },
  });
}
