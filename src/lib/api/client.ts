/**
 * Kleine fetch-helper voor de eigen API-routes: voegt de sessie-bearer toe en
 * maakt van foutantwoorden een leesbare Nederlandse foutmelding.
 */
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";

export type ApiError = Error & { code?: string; status?: number };

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth
    .getSession()
    .catch(() => ({ data: { session: null } }) as never);
  const token = data?.session?.access_token;
  return {
    "content-type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: await authHeaders(),
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const record = (payload ?? {}) as { error?: string; code?: string };
    const error = new Error(record.error || `Er ging iets mis [${res.status}].`) as ApiError;
    error.code = record.code;
    error.status = res.status;
    throw error;
  }
  return payload as T;
}
