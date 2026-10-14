/**
 * Voorbeeldweergaven van álle systeemmails (met fictieve gegevens) voor het
 * beheerportaal: bekijken, vergelijken en als HTML downloaden.
 */
import type { MailLang } from "./email-copy";
import { publicUrl } from "./email-shell";

export type SystemEmailPreview = {
  id: string;
  name: string;
  lang: MailLang;
  subject: string;
  html: string;
};

const NAMES: Record<string, string> = {
  order: "Afhaalbon hoevewinkel",
  booking: "Boekingsbevestiging (betaald)",
  auth_magic: "Inloglink + code",
  verify: "E-mailadres bevestigen",
  reset: "Wachtwoord herstellen",
  notice: "Algemene mededeling",
  certificate: "Academy-certificaat",
  donation: "Gift met overschrijving",
  contact_receipt: "Ontvangstbevestiging contact",
  contact_admin: "Interne melding contactformulier",
  tx_ticket: "Ticket vakantiestage / animatie",
  tx_invoice: "Boeking + factuur (zaalverhuur)",
  tx_shop: "Besteloverzicht hoevewinkel",
  tx_donation: "Donatiebewijs",
  system_test: "Systeemcheck",
};

export async function buildSystemEmailPreviews(langs: MailLang[]): Promise<SystemEmailPreview[]> {
  const m = await import("./email.server");
  const { buildTransactionalEmail } = await import("./transactional-templates");
  const out: SystemEmailPreview[] = [];
  const push = (id: string, lang: MailLang, r: { subject: string; html: string }) =>
    out.push({ id, name: NAMES[id] ?? id, lang, subject: r.subject, html: r.html });

  for (const lang of langs) {
    push(
      "order",
      lang,
      m.orderEmail({
        naam: "Jona",
        ordernummer: "2026-0142",
        code: "MX-7K2P",
        afhaalmoment: { nl: "zaterdag 6 september, 10:00–12:00", fr: "samedi 6 septembre, 10h–12h", en: "Saturday 6 September, 10:00–12:00" }[lang],
        totaal_cent: 2350,
        lijnen: [
          { titel: { nl: "Verse eieren (6)", fr: "Œufs frais (6)", en: "Fresh eggs (6)" }[lang], aantal: 2, prijs_cent: 350 },
          { titel: { nl: "Honing 500 g", fr: "Miel 500 g", en: "Honey 500 g" }[lang], aantal: 1, prijs_cent: 1650 },
        ],
        lang,
      }),
    );
    push(
      "booking",
      lang,
      m.bookingPaidEmail({
        naam: "Camille",
        referentie: "BK-2026-031",
        formule: { nl: "Teambuilding — halve dag", fr: "Team-building — demi-journée", en: "Team building — half day" }[lang],
        datum: { nl: "12 september 2026", fr: "12 septembre 2026", en: "12 September 2026" }[lang],
        personen: 14,
        bedrag_cent: 68000,
        lang,
      }),
    );
    push("auth_magic", lang, m.authActionEmail("magic", { naam: "Sam", url: "https://maximilien.brussels/inloglink?t=voorbeeld", code: "482913", lang }));
    push("verify", lang, m.verifyEmailEmail({ naam: "Sam", url: "https://maximilien.brussels/bevestigen?t=voorbeeld", lang }));
    push("reset", lang, m.passwordResetEmail({ naam: "Sam", url: "https://maximilien.brussels/wachtwoord-herstellen?t=voorbeeld", lang }));
    push(
      "notice",
      lang,
      m.noticeEmail({
        naam: "Jona",
        title: { nl: "Boerderij gesloten op 15 augustus", fr: "Ferme fermée le 15 août", en: "Farm closed on 15 August" }[lang],
        message: {
          nl: "Op vrijdag 15 augustus is de boerderij uitzonderlijk gesloten.\n\nZaterdag verwelkomen we je opnieuw vanaf 10 uur.",
          fr: "Le vendredi 15 août, la ferme est exceptionnellement fermée.\n\nNous vous accueillons à nouveau samedi dès 10h.",
          en: "On Friday 15 August the farm is exceptionally closed.\n\nWe welcome you again on Saturday from 10:00.",
        }[lang],
        ctaLabel: { nl: "Bekijk de openingsuren", fr: "Voir les horaires", en: "See opening hours" }[lang],
        ctaUrl: publicUrl("visit", lang),
        lang,
      }),
    );
    if (lang === "nl") {
      push("certificate", lang, m.certificateEmail({ naam: "Noor", academy: "Kippen", badge: "🐔", score: "9/10", onderscheiding: true, url: "https://maximilien.brussels/certificaat/voorbeeld" }));
      push(
        "contact_admin",
        lang,
        m.contactAdminEmail({
          onderwerp: "Schoolbezoek",
          naam: "Els Peeters",
          email: "els@voorbeeld.be",
          telefoon: "0470 00 00 00",
          organisatie: "GBS De Wingerd",
          bericht: "Wij komen graag met twee klassen.\nWelke data zijn nog vrij in oktober?",
        }),
      );
      push("system_test", lang, m.systemTestEmail());
    }
    push(
      "donation",
      lang,
      m.donationEmail({
        naam: "Pieter",
        bedrag_cent: 5000,
        referentie: "+++123/4567/89012+++",
        doel: { nl: "Peterschap alpaca Nino", fr: "Parrainage alpaga Nino", en: "Sponsorship alpaca Nino" }[lang],
        iban: "BE12 3456 7890 1234",
        bic: "GEBABEBB",
        begunstigde: "Maximilien vzw",
        lang,
      }),
    );
    push(
      "contact_receipt",
      lang,
      m.contactReceiptEmail({
        onderwerp: { nl: "Schoolbezoek", fr: "Visite scolaire", en: "School visit" }[lang],
        naam: "Els",
        email: "els@voorbeeld.be",
        bericht: { nl: "Wij komen graag met twee klassen.", fr: "Nous aimerions venir avec deux classes.", en: "We'd like to come with two classes." }[lang],
        lang,
      }),
    );
    push(
      "tx_ticket",
      lang,
      buildTransactionalEmail({
        template: "ticket",
        reference: "TK-2026-0088",
        lang,
        customerName: "Anke",
        amountCent: 12500,
        subjectName: { nl: "Vakantiestage 'Boerderijdieren'", fr: "Stage 'Animaux de la ferme'", en: "Holiday camp 'Farm animals'" }[lang],
        eventDate: { nl: "7 juli 2026, 9:00", fr: "7 juillet 2026, 9h", en: "7 July 2026, 9:00" }[lang],
        participantName: "Lou (8)",
        practicalInfo: {
          nl: ["Laarzen en kleren die vuil mogen worden", "Lunchpakket en drinkbus"],
          fr: ["Bottes et vêtements qui peuvent se salir", "Pique-nique et gourde"],
          en: ["Boots and clothes that can get dirty", "Packed lunch and water bottle"],
        }[lang],
      }),
    );
    push(
      "tx_invoice",
      lang,
      buildTransactionalEmail({
        template: "invoice",
        reference: "INV-2026-0012",
        lang,
        customerName: "Marc",
        amountCent: 60500,
        vatRate: 21,
        subjectName: { nl: "Zaal Het Fenil — volledige dag", fr: "Salle Le Fenil — journée", en: "Room Le Fenil — full day" }[lang],
        eventDate: { nl: "3 oktober 2026", fr: "3 octobre 2026", en: "3 October 2026" }[lang],
      }),
    );
    push(
      "tx_shop",
      lang,
      buildTransactionalEmail({
        template: "shop",
        reference: "SH-2026-0201",
        lang,
        customerName: "Amy",
        amountCent: 2350,
        items: [
          { name: { nl: "Verse eieren (6)", fr: "Œufs frais (6)", en: "Fresh eggs (6)" }[lang], quantity: 2, amountCent: 700 },
          { name: { nl: "Honing 500 g", fr: "Miel 500 g", en: "Honey 500 g" }[lang], quantity: 1, amountCent: 1650 },
        ],
        pickupSlot: { nl: "zaterdag 6 september, 10:00–12:00", fr: "samedi 6 septembre, 10h–12h", en: "Saturday 6 September, 10:00–12:00" }[lang],
        openingHours: { nl: ["wo–zo 10:00–17:00"], fr: ["me–di 10h–17h"], en: ["Wed–Sun 10:00–17:00"] }[lang],
      }),
    );
    push(
      "tx_donation",
      lang,
      buildTransactionalEmail({
        template: "donation",
        reference: "DN-2026-0301",
        lang,
        customerName: "Pieter",
        amountCent: 5000,
        subjectName: "Alpaca Nino",
        qrUrl: "https://maximilien.brussels/steun",
      }),
    );
  }
  return out;
}
