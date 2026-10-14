/**
 * Automatische afhaalbevestiging (Brevo).
 *
 * Zodra een teamlid een bestelling afvinkt of de QR van de klant scant, gaat
 * hier meteen een transactionele bevestigingsmail naar de klant. Werpt nooit:
 * een mislukte mail mag de afhaling zelf niet blokkeren.
 */
import {
  BRAND_NAME,
  escapeHtml,
  euro,
  infoGrid,
  lineTable,
  mailOrigin,
  shell,
} from "@/lib/email-shell";
import type { MailLang } from "@/lib/email-copy";
import type { PickupOrderSummary } from "./pickup-desk.server";

type Copy = {
  subject: (ref: string) => string;
  kicker: string;
  title: string;
  intro: (name: string) => string;
  paidNow: string;
  reference: string;
  collectedAt: string;
  total: string;
  itemsTitle: string;
  outro: string;
};

const COPY: Record<MailLang, Copy> = {
  nl: {
    subject: (ref) => `Afgehaald — bestelling ${ref}`,
    kicker: "Bevestiging",
    title: "Je bestelling is afgehaald",
    intro: (name) =>
      `${name}bedankt! We hebben je bestelling zonet aan de balie overhandigd. Hieronder vind je het overzicht.`,
    paidNow: "Betaald bij afhaling — bedankt voor de betaling.",
    reference: "Referentie",
    collectedAt: "Afgehaald op",
    total: "Totaal",
    itemsTitle: "Wat je meenam",
    outro: "Klopt er iets niet? Antwoord gerust op deze mail, we kijken het meteen na.",
  },
  fr: {
    subject: (ref) => `Retiré — commande ${ref}`,
    kicker: "Confirmation",
    title: "Votre commande a été retirée",
    intro: (name) =>
      `${name}merci ! Nous venons de vous remettre votre commande au comptoir. Voici le récapitulatif.`,
    paidNow: "Payé au retrait — merci pour le paiement.",
    reference: "Référence",
    collectedAt: "Retiré le",
    total: "Total",
    itemsTitle: "Ce que vous avez emporté",
    outro: "Une erreur ? Répondez simplement à ce message, nous vérifions tout de suite.",
  },
  en: {
    subject: (ref) => `Picked up — order ${ref}`,
    kicker: "Confirmation",
    title: "Your order has been picked up",
    intro: (name) =>
      `${name}thank you! We just handed over your order at the counter. Here is the summary.`,
    paidNow: "Paid on pickup — thanks for the payment.",
    reference: "Reference",
    collectedAt: "Picked up on",
    total: "Total",
    itemsTitle: "What you took home",
    outro: "Something not right? Just reply to this email and we will check it straight away.",
  },
};

function formatDate(lang: MailLang, iso: string): string {
  const locale = lang === "fr" ? "fr-BE" : lang === "en" ? "en-BE" : "nl-BE";
  return new Date(iso).toLocaleString(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  });
}

export type PickupMailResult = { sent: boolean; error?: string };

/** Verstuurt de afhaalbevestiging; faalt stil met een gelogde reden. */
export async function sendPickupConfirmation(
  order: PickupOrderSummary & { wasPayOnPickup: boolean },
  lang: MailLang = "nl",
): Promise<PickupMailResult> {
  const to = order.customerEmail?.trim();
  if (!to) return { sent: false, error: "geen e-mailadres bij de bestelling" };

  const c = COPY[lang] ?? COPY.nl;
  const reference = order.reference ?? order.shortCode ?? `#${order.id}`;
  const hello = order.customerName ? `Dag ${escapeHtml(order.customerName)}, ` : "";
  const collectedAt = formatDate(lang, new Date().toISOString());

  const body = `
    <p style="margin:0 0 16px;">${c.intro(hello)}</p>
    ${infoGrid([
      { label: c.reference, value: escapeHtml(reference) },
      { label: c.collectedAt, value: escapeHtml(collectedAt) },
    ])}
    <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(c.itemsTitle)}</p>
    ${lineTable(
      order.items.map((i) => ({ label: `${i.quantity}× ${i.title}`, value: "" })),
      { label: c.total, value: euro(order.totalCents) },
    )}
    ${order.wasPayOnPickup ? `<p style="margin:12px 0 0;">${c.paidNow}</p>` : ""}
    <p style="margin:20px 0 0;">${c.outro}</p>
  `;

  const html = shell({
    lang,
    preview: c.title,
    kicker: c.kicker,
    title: c.title,
    body,
    origin: mailOrigin(),
  });

  try {
    const { sendMail } = await import("@/lib/email.server");
    const res = await sendMail({
      to,
      subject: `${c.subject(reference)} · ${BRAND_NAME}`,
      html,
      transactional: true,
      kind: "pickup-collected",
      transport: "brevo",
    });
    if (!res.sent) {
      console.error(`[pickup-email] niet verzonden: ${res.error ?? res.reason ?? "onbekend"}`);
      return { sent: false, error: res.error ?? res.reason ?? "onbekende Brevo-fout" };
    }
    return { sent: true };
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[pickup-email] fout: ${message}`);
    return { sent: false, error: message };
  }
}
