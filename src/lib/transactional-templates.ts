/**
 * Vier meertalige transactionele mailsjablonen (NL/FR/EN):
 *   A. donation → donatie/peterschap + donatiebewijs en QR
 *   B. ticket   → vakantiestage/animatie + digitaal ticket met QR
 *   C. invoice  → zaalverhuur/teambuilding + officiële factuur (PDF)
 *   D. shop     → hoevewinkel-bestelbevestiging met afhaalinstructies
 *
 * Enkel opmaak en tekst: geen secrets, geen netwerk — bruikbaar op server én
 * in previews.
 */
import type { TransactionKind } from "./referenceGenerator";

export type MailLanguage = "nl" | "fr" | "en";

export type TransactionalItem = { name: string; quantity?: number; amountCent?: number };

export type TransactionalInput = {
  template: TransactionKind;
  reference: string;
  lang: MailLanguage;
  customerName?: string;
  amountCent: number;
  vatRate?: number;
  /** Naam van de stage, zaalformule, gesponsord dier of winkelbestelling. */
  subjectName?: string;
  eventDate?: string;
  participantName?: string;
  practicalInfo?: string[];
  items?: TransactionalItem[];
  pickupSlot?: string;
  openingHours?: string[];
  qrUrl?: string;
};

export const money = (cent: number, lang: MailLanguage) =>
  new Intl.NumberFormat(lang === "en" ? "en-BE" : lang === "fr" ? "fr-BE" : "nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cent / 100);

import { CONTACT_EMAIL } from "./contact-emails";
import {
  MAIL_COLORS,
  SANS,
  bulletList,
  button as shellButton,
  escapeHtml,
  infoCard,
  lineTable,
  publicUrl,
  shell,
} from "./email-shell";

const C = MAIL_COLORS;

function layout(opts: { title: string; kicker: string; lang: MailLanguage; body: string; footer: string; preview: string }) {
  return shell({
    lang: opts.lang,
    preview: opts.preview,
    kicker: opts.kicker,
    title: opts.title,
    body: `${opts.body}<p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted};">${opts.footer}</p>`,
  });
}

function refBadge(reference: string, label: string) {
  return infoCard(label, reference, true);
}

function rows(pairs: [string, string][]) {
  const filled = pairs.filter(([, value]) => value);
  if (!filled.length) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0 4px;">
    ${filled
      .map(
        ([key, value]) =>
          `<tr><td style="padding:9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.muted};width:45%;">${escapeHtml(key)}</td><td style="padding:9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;font-weight:bold;color:${C.forest};">${escapeHtml(value)}</td></tr>`,
      )
      .join("")}
  </table>`;
}

function bullets(items: string[]) {
  return bulletList(items.map((i) => escapeHtml(i)));
}

function cta(url: string, label: string) {
  return `<div style="margin:24px 0 8px;">${shellButton(url, label)}</div>`;
}

function heading(text: string) {
  return `<p style="margin:22px 0 4px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${text}</p>`;
}

const COPY: Record<MailLanguage, Record<string, string>> = {
  nl: {
    donationKicker: "Gift",
    ticketKicker: "Ticket",
    invoiceKicker: "Boeking",
    shopKicker: "Hoevewinkel",
    footerSupport: `Vragen? Antwoord op deze mail of schrijf naar ${CONTACT_EMAIL}.`,
    reference: "Referentie",
    amount: "Bedrag",
    date: "Datum",
    donationSubject: "Bedankt voor je steun aan de stadsboerderij!",
    donationTitle: "Bedankt voor je steun",
    donationIntro:
      "Dankzij jou blijven de dieren verzorgd, de moestuin groen en de boerderij gratis toegankelijk voor de buurt.",
    donationProject: "Gesponsord dier / project",
    donationProof: "Dit bericht geldt als uniek donatiebewijs.",
    donationQr: "Bekijk je steunpagina",
    ticketSubject: "Inschrijvingsbewijs & Ticket",
    ticketTitle: "Inschrijving bevestigd",
    ticketIntro: "De inschrijving is rond. Hieronder vind je het digitale toegangsticket.",
    ticketChild: "Deelnemer",
    ticketActivity: "Activiteit",
    ticketPractical: "Praktisch & wat meebrengen",
    ticketQr: "Toon deze QR-code bij de check-in op de boerderij.",
    invoiceSubject: "Boekingsbevestiging & Factuur",
    invoiceTitle: "Boeking bevestigd",
    invoiceIntro: "Je boeking is betaald en genoteerd. De officiële factuur zit in bijlage (PDF).",
    invoiceFormula: "Formule / zaal",
    invoiceNet: "Bedrag excl. btw",
    invoiceVat: "Btw",
    invoiceTotal: "Totaal",
    shopSubject: "Besteloverzicht",
    shopTitle: "Bestelling bevestigd",
    shopIntro: "Bedankt voor je bestelling in de hoevewinkel. Je haalt ze af op de boerderij.",
    shopItems: "Je producten",
    shopTotal: "Totaal",
    shopPickup: "Afhaalmoment",
    shopHours: "Openingsuren",
    ctaVisit: "Bekijk de openingsuren",
    ctaShop: "Naar de hoevewinkel",
    ctaAgenda: "Bekijk de agenda",
  },
  fr: {
    donationKicker: "Don",
    ticketKicker: "Ticket",
    invoiceKicker: "Réservation",
    shopKicker: "Boutique",
    footerSupport: `Une question ? Répondez à cet e-mail ou écrivez à ${CONTACT_EMAIL}.`,
    reference: "Référence",
    amount: "Montant",
    date: "Date",
    donationSubject: "Merci pour votre soutien à la ferme urbaine !",
    donationTitle: "Merci pour votre soutien",
    donationIntro:
      "Grâce à vous, les animaux sont soignés, le potager reste vert et la ferme demeure gratuite pour le quartier.",
    donationProject: "Animal / projet parrainé",
    donationProof: "Ce message tient lieu d'attestation de don unique.",
    donationQr: "Voir votre page de soutien",
    ticketSubject: "Attestation d'inscription & ticket",
    ticketTitle: "Inscription confirmée",
    ticketIntro: "L'inscription est confirmée. Voici votre ticket d'accès numérique.",
    ticketChild: "Participant",
    ticketActivity: "Activité",
    ticketPractical: "Infos pratiques & à emporter",
    ticketQr: "Présentez ce QR-code au check-in à la ferme.",
    invoiceSubject: "Confirmation de réservation & facture",
    invoiceTitle: "Réservation confirmée",
    invoiceIntro: "Votre réservation est payée. La facture officielle est en pièce jointe (PDF).",
    invoiceFormula: "Formule / salle",
    invoiceNet: "Montant hors TVA",
    invoiceVat: "TVA",
    invoiceTotal: "Total",
    shopSubject: "Récapitulatif de commande",
    shopTitle: "Commande confirmée",
    shopIntro: "Merci pour votre commande au magasin de la ferme. Retrait sur place.",
    shopItems: "Vos produits",
    shopTotal: "Total",
    shopPickup: "Moment de retrait",
    shopHours: "Heures d'ouverture",
    ctaVisit: "Voir les horaires d'ouverture",
    ctaShop: "Vers la boutique fermière",
    ctaAgenda: "Voir l'agenda",
  },
  en: {
    donationKicker: "Donation",
    ticketKicker: "Ticket",
    invoiceKicker: "Booking",
    shopKicker: "Farm shop",
    footerSupport: `Questions? Reply to this email or write to ${CONTACT_EMAIL}.`,
    reference: "Reference",
    amount: "Amount",
    date: "Date",
    donationSubject: "Thank you for supporting the city farm!",
    donationTitle: "Thank you for your support",
    donationIntro:
      "Thanks to you the animals are cared for, the garden stays green and the farm stays free for the neighbourhood.",
    donationProject: "Sponsored animal / project",
    donationProof: "This message serves as your unique donation certificate.",
    donationQr: "View your support page",
    ticketSubject: "Registration confirmation & ticket",
    ticketTitle: "Registration confirmed",
    ticketIntro: "Registration is complete. Your digital entry ticket is below.",
    ticketChild: "Participant",
    ticketActivity: "Activity",
    ticketPractical: "Practical info & what to bring",
    ticketQr: "Show this QR code at check-in on the farm.",
    invoiceSubject: "Booking confirmation & invoice",
    invoiceTitle: "Booking confirmed",
    invoiceIntro: "Your booking is paid. The official invoice is attached as a PDF.",
    invoiceFormula: "Formula / room",
    invoiceNet: "Amount excl. VAT",
    invoiceVat: "VAT",
    invoiceTotal: "Total",
    shopSubject: "Order overview",
    shopTitle: "Order confirmed",
    shopIntro: "Thank you for your farm shop order. Pick it up at the farm.",
    shopItems: "Your products",
    shopTotal: "Total",
    shopPickup: "Pick-up moment",
    shopHours: "Opening hours",
    ctaVisit: "See opening hours",
    ctaShop: "To the farm shop",
    ctaAgenda: "See what's on",
  },
};

/** Bouwt onderwerp + HTML voor het gevraagde sjabloon. */
export function buildTransactionalEmail(input: TransactionalInput): {
  subject: string;
  html: string;
} {
  const lang = COPY[input.lang] ? input.lang : "nl";
  const t = COPY[lang]!;
  const hello = input.customerName ? `${escapeHtml(input.customerName)},` : "";
  const greeting = hello
    ? `<p style="margin:0 0 12px;">${lang === "fr" ? "Bonjour" : lang === "en" ? "Hello" : "Dag"} ${hello}</p>`
    : "";
  const footer = `${t["footerSupport"]}`;
  const amount = money(input.amountCent, lang);
  const vatRate = input.vatRate ?? 21;

  if (input.template === "donation") {
    const subject = `${t["donationSubject"]} ${input.reference}`;
    const html = layout({
      lang,
      title: t["donationTitle"]!,
      kicker: t["donationKicker"]!,
      preview: t["donationIntro"]!,
      footer,
      body: `${greeting}
        <p style="margin:0 0 16px;">${t["donationIntro"]}</p>
        ${refBadge(input.reference, t["reference"]!)}
        ${rows([
          [t["donationProject"]!, input.subjectName ?? ""],
          [t["amount"]!, amount],
          [t["date"]!, input.eventDate ?? new Date().toISOString().slice(0, 10)],
        ])}
        <p style="margin:0 0 16px;font-size:14px;">${t["donationProof"]}</p>
        ${input.qrUrl ? cta(input.qrUrl, t["donationQr"]!) : ""}`,
    });
    return { subject, html };
  }

  if (input.template === "ticket") {
    const activity = input.subjectName ?? "";
    const subject = `${t["ticketSubject"]}: ${activity} ${input.reference}`.replace(/\s+/g, " ");
    const html = layout({
      lang,
      title: t["ticketTitle"]!,
      kicker: t["ticketKicker"]!,
      preview: t["ticketIntro"]!,
      footer,
      body: `${greeting}
        <p style="margin:0 0 16px;">${t["ticketIntro"]}</p>
        ${refBadge(input.reference, t["reference"]!)}
        ${rows([
          [t["ticketActivity"]!, activity],
          [t["ticketChild"]!, input.participantName ?? ""],
          [t["date"]!, input.eventDate ?? ""],
          [t["amount"]!, amount],
        ])}
        ${heading(t["ticketPractical"]!)}
        ${bullets(input.practicalInfo ?? [])}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;"><tr><td align="center" bgcolor="${C.cream}" style="background:${C.cream};border:1px solid ${C.line};border-radius:14px;padding:18px;">
          <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;color:${C.muted};">${t["ticketQr"]}</p>
          <img src="cid:ticket-qr" alt="QR" width="180" height="180" style="display:block;margin:0 auto;border-radius:10px;" />
          <p style="margin:10px 0 0;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:bold;color:${C.forest};">${escapeHtml(input.reference)}</p>
        </td></tr></table>
        ${cta(publicUrl("events", lang), t["ctaAgenda"]!)}`,
    });
    return { subject, html };
  }

  if (input.template === "invoice") {
    const netCent = Math.round(input.amountCent / (1 + vatRate / 100));
    const subject = `${t["invoiceSubject"]} ${input.reference} - Stadsboerderij Maximiliaan`;
    const html = layout({
      lang,
      title: t["invoiceTitle"]!,
      kicker: t["invoiceKicker"]!,
      preview: t["invoiceIntro"]!,
      footer,
      body: `${greeting}
        <p style="margin:0 0 16px;">${t["invoiceIntro"]}</p>
        ${refBadge(input.reference, t["reference"]!)}
        ${rows([
          [t["invoiceFormula"]!, input.subjectName ?? ""],
          [t["date"]!, input.eventDate ?? ""],
          [t["invoiceNet"]!, money(netCent, lang)],
          [`${t["invoiceVat"]} ${vatRate}%`, money(input.amountCent - netCent, lang)],
          [t["invoiceTotal"]!, amount],
        ])}
        ${cta(publicUrl("visit", lang), t["ctaVisit"]!)}`,
    });
    return { subject, html };
  }

  const items = input.items ?? [];
  const subject = `${t["shopSubject"]} ${input.reference} - ${lang === "fr" ? "retrait à la ferme" : lang === "en" ? "pick-up at the farm" : "Afhalen op de hoeve"}`;
  const html = layout({
    lang,
    title: t["shopTitle"]!,
    kicker: t["shopKicker"]!,
    preview: t["shopIntro"]!,
    footer,
    body: `${greeting}
      <p style="margin:0 0 16px;">${t["shopIntro"]}</p>
      ${refBadge(input.reference, t["reference"]!)}
      ${heading(t["shopItems"]!)}
      ${lineTable(
        items.map((item) => ({
          label: item.name,
          ...(item.quantity ? { muted: `× ${item.quantity}` } : {}),
          value: item.amountCent != null ? money(item.amountCent, lang) : "",
        })),
        { label: t["shopTotal"]!, value: amount },
      )}
      ${rows([[t["shopPickup"]!, input.pickupSlot ?? ""]])}
      ${heading(t["shopHours"]!)}
      ${bullets(input.openingHours ?? [])}
      ${cta(publicUrl("shop", lang), t["ctaShop"]!)}`,
  });
  return { subject, html };
}
