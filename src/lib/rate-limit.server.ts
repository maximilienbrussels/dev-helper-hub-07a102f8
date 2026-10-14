/**
 * Server-side rate limiting via de `check_rate_limit` database-functie.
 * Enkel bereikbaar met de service role, dus niet manipuleerbaar vanuit de browser.
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  maxEvents: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const client = dbAdmin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
    };
    const { data, error } = await client.rpc("check_rate_limit", {
      _bucket: bucket,
      _identifier: identifier,
      _max_events: maxEvents,
      _window_seconds: windowSeconds,
    });
    if (error) return true; // fail-open: nooit de winkel blokkeren bij een DB-hik
    return data !== false;
  } catch {
    return true;
  }
}

/** Beste inschatting van het client-IP achter de edge-proxy. */
export function clientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    headers.get("cf-connecting-ip") ??
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ??
    headers.get("x-real-ip") ??
    "unknown";
  return ip.slice(0, 64);
}
