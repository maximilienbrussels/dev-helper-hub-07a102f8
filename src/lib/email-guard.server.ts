import { getRequestHeaders } from "@tanstack/react-start/server";
import { checkRateLimit, clientIdentifier } from "./rate-limit.server";

type Limit = { max: number; window: number };

/**
 * Per-sleutel limieten. Verzendbuckets mogen 5 mails per uur; het controleren
 * van de 6-cijferige inlogcode heeft een eigen, ruimere sleutel ("logincode")
 * omdat een bezoeker meerdere pogingen mag doen zonder de mailer te belasten —
 * maar strak genoeg om brute force op 6 cijfers uit te sluiten.
 */
const LIMITS: Record<string, Limit> = {
  logincode: { max: 10, window: 900 },
};

/** Standaard: maximaal 5 inzendingen per 10 minuten per IP én per e-mailadres. */
const DEFAULT_LIMIT: Limit = { max: 5, window: 600 };


/** Strikte rate-limit per IP én per e-mailadres, zodat de mailer geen spamrelay wordt. */
export async function guardRate(bucket: string, email: string) {
  const { max, window } = LIMITS[bucket] ?? DEFAULT_LIMIT;
  const ip = clientIdentifier(
    new Headers(getRequestHeaders() as unknown as Record<string, string>),
  );
  const okIp = await checkRateLimit(bucket, ip, max, window);
  const okMail = await checkRateLimit(`${bucket}-email`, email.toLowerCase(), max, window);
  if (!okIp || !okMail) throw new Error("Te veel aanvragen na elkaar. Probeer straks opnieuw.");
}
