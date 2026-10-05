// Shared helpers for the Asli API routes. Secrets come only from Vercel environment variables.

export const MAX_REQUESTS_PER_VISITOR = 5;

export function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

// Thin wrapper around Supabase's REST API (PostgREST) using the service key.
export async function supabase(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${env('SUPABASE_URL').replace(/\/$/, '')}/rest/v1/${path}`;
  const key = env('SUPABASE_SERVICE_KEY');
  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      // Legacy service_role keys are JWTs and go in Authorization too; new sb_secret_ keys go only in apikey.
      ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} failed: ${res.status} ${await res.text()}`);
  return res;
}

export async function countForVisitor(visitorId) {
  const res = await supabase(`lookups?visitor_id=eq.${encodeURIComponent(visitorId)}&select=id`, {
    headers: { Prefer: 'count=exact', Range: '0-0' },
  });
  const range = res.headers.get('content-range') || '*/0'; // e.g. "0-0/3"
  return Number(range.split('/')[1]) || 0;
}
