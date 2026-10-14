/**
 * Peter/Meterschap (dierensponsoring): tarieven, pending-rij, afronding na
 * betaling en de bevestigingsmail. Server-only.
 */
import { randomUUID } from "node:crypto";
import { db } from "@/lib/neon.server";
import { shell, button, infoCard, escapeHtml } from "@/lib/email-shell";
import { sendMail } from "@/lib/email.server";
import { PUBLIC_SITE_URL } from "@/lib/routes-i18n";

export type SponsorLang = "nl" | "fr" | "en";

export type SponsorTier = {
  id: string;
  amountCents: number;
  interval: "month" | "year";
  label: Record<SponsorLang, string>;
};

export const SPONSOR_TIERS: SponsorTier[] = [
  { id: "basis", amountCents: 500, interval: "month", label: { nl: "€5 / maand", fr: "5 € / mois", en: "€5 / month" } },
  { id: "vriend", amountCents: 1000, interval: "month", label: { nl: "€10 / maand", fr: "10 € / mois", en: "€10 / month" } },
  { id: "beschermer", amountCents: 5000, interval: "year", label: { nl: "€50 / jaar", fr: "50 € / an", en: "€50 / year" } },
];

export function tierById(id: string): SponsorTier | null {
  return SPONSOR_TIERS.find((t) => t.id === id) ?? null;
}

export type SponsorshipRow = {
  id: string;
  animal_id: number | null;
  animal_name: string;
  tier: string;
  amount_cents: number;
  interval: string;
  sponsor_name: string;
  sponsor_email: string;
  lang: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  certificate_id: string | null;
  paid_at: string | Date | null;
  created_at: string | Date;
};

export async function createPendingSponsorship(input: {
  animalId: number | null;
  animalName: string;
  tier: SponsorTier;
  sponsorName: string;
  sponsorEmail: string;
  lang: SponsorLang;
}): Promise<SponsorshipRow> {
  const rows = (await db()`
    insert into public.sponsorships
      (animal_id, animal_name, tier, amount_cents, interval, sponsor_name, sponsor_email, lang, status)
    values (
      ${input.animalId}, ${input.animalName}, ${input.tier.id}, ${input.tier.amountCents},
      ${input.tier.interval}, ${input.sponsorName}, ${input.sponsorEmail}, ${input.lang}, 'pending'
    )
    returning *
  `) as SponsorshipRow[];
  const row = rows[0];
  if (!row) throw new Error("sponsorship_insert_failed");
  return row;
}

export async function attachSessionToSponsorship(id: string, sessionId: string): Promise<void> {
  await db()`update public.sponsorships set stripe_session_id = ${sessionId} where id = ${id}`;
}

export async function sponsorshipBySessionId(sessionId: string): Promise<SponsorshipRow | null> {
  const rows = (await db()`
    select * from public.sponsorships where stripe_session_id = ${sessionId} limit 1
  `) as SponsorshipRow[];
  return rows[0] ?? null;
}

export async function sponsorshipByCertificateId(certificateId: string): Promise<SponsorshipRow | null> {
  const rows = (await db()`
    select * from public.sponsorships where certificate_id = ${certificateId} limit 1
  `) as SponsorshipRow[];
  return rows[0] ?? null;
}

/** Verwerkt de betaalde checkout-sessie: idempotent (mag meerdere keren draaien). */
export async function finalizeSponsorshipForSession(
  sessionId: string,
  subscriptionId: string | null,
): Promise<SponsorshipRow | null> {
  const existing = await sponsorshipBySessionId(sessionId);
  if (!existing) return null;
  if (existing.status === "paid" && existing.certificate_id) return existing;

  const certificateId = existing.certificate_id ?? `PM-${randomUUID().slice(0, 8).toUpperCase()}`;
  const rows = (await db()`
    update public.sponsorships
       set status = 'paid',
           certificate_id = ${certificateId},
           stripe_subscription_id = coalesce(${subscriptionId}, stripe_subscription_id),
           paid_at = coalesce(paid_at, now())
     where id = ${existing.id}
     returning *
  `) as SponsorshipRow[];
  const updated = rows[0] ?? existing;

  if (!existing.certificate_id) {
    await sendSponsorshipConfirmation(updated).catch((err) =>
      console.error("[sponsorship] bevestigingsmail mislukt", err),
    );
  }
  return updated;
}

const TIER_LABEL: Record<SponsorLang, string> = { nl: "Formule", fr: "Formule", en: "Tier" };
const COPY: Record<
  SponsorLang,
  { subject: (a: string) => string; preview: string; kicker: string; title: string; hello: (n: string) => string; body: string; cta: string }
> = {
  nl: {
    subject: (a) => `Bedankt! Je bent Peter/Meter van ${a} 💚`,
    preview: "Je Peter/Meterschap-certificaat staat klaar.",
    kicker: "Peter/Meterschap",
    title: "Welkom bij onze dierenfamilie",
    hello: (n) => `Dag ${n},`,
    body: "Bedankt voor je steun! Dankzij jou krijgt dit dier extra zorg, voeding en aandacht. Je officiële certificaat staat hieronder klaar om te downloaden.",
    cta: "Download mijn certificaat",
  },
  fr: {
    subject: (a) => `Merci ! Vous êtes marraine/parrain de ${a} 💚`,
    preview: "Votre certificat de parrainage est prêt.",
    kicker: "Parrainage",
    title: "Bienvenue dans notre famille animale",
    hello: (n) => `Bonjour ${n},`,
    body: "Merci pour votre soutien ! Grâce à vous, cet animal reçoit des soins, de la nourriture et de l'attention supplémentaires. Votre certificat officiel est prêt à télécharger ci-dessous.",
    cta: "Télécharger mon certificat",
  },
  en: {
    subject: (a) => `Thank you! You're now sponsoring ${a} 💚`,
    preview: "Your sponsorship certificate is ready.",
    kicker: "Sponsorship",
    title: "Welcome to our animal family",
    hello: (n) => `Hi ${n},`,
    body: "Thank you for your support! Thanks to you, this animal receives extra care, food and attention. Your official certificate is ready to download below.",
    cta: "Download my certificate",
  },
};

export async function sendSponsorshipConfirmation(row: SponsorshipRow): Promise<void> {
  const lang = (["nl", "fr", "en"].includes(row.lang) ? row.lang : "nl") as SponsorLang;
  const c = COPY[lang];
  const tier = tierById(row.tier);
  const certUrl = `${PUBLIC_SITE_URL}/api/sponsorship/certificate/${row.certificate_id}`;
  const body = `
    <p style="margin:0;">${escapeHtml(c.hello(row.sponsor_name))}</p>
    <p style="margin:12px 0 0;">${escapeHtml(c.body)}</p>
    ${infoCard(TIER_LABEL[lang], tier?.label[lang] ?? row.tier)}
    <div style="margin:26px 0 8px;">${button(certUrl, c.cta)}</div>`;
  const html = shell({ preview: c.preview, kicker: c.kicker, title: c.title, body, lang });
  await sendMail({
    to: row.sponsor_email,
    subject: c.subject(row.animal_name),
    html,
    kind: "sponsorship",
    transactional: true,
  });
}
