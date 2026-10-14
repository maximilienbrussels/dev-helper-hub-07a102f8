/**
 * Centrale e-mailadressen van de boerderij.
 *
 * Dit zijn de *standaardwaarden*. De echte bestemming per formulier wordt
 * server-side uit de tabel `contact_routes` gelezen en is instelbaar in het
 * beheerportaal (pagina "E-mail"). Deze lijst blijft de vangnetwaarde wanneer
 * de databank (nog) niets teruggeeft.
 */

export const CONTACT_EMAIL = "contact@maximilien.brussels";
export const DESK_EMAIL = "desk@delplanche.cloud";
export const JONA_EMAIL = "jona@maximilien.brussels";

/** Formulier-onderwerpen → bestemmingsadres(sen). */
export const CONTACT_INBOXES = {
  algemeen: [CONTACT_EMAIL],
  school: [CONTACT_EMAIL],
  familie: [CONTACT_EMAIL],
  bedrijf: [CONTACT_EMAIL, JONA_EMAIL],
  vrijwilligers: [CONTACT_EMAIL],
  stages: [CONTACT_EMAIL],
  partner: [CONTACT_EMAIL, JONA_EMAIL],
  rooster: [CONTACT_EMAIL],
  toegankelijkheid: [CONTACT_EMAIL],
  technisch: [DESK_EMAIL],
  betalingen: [CONTACT_EMAIL],
  verhuur: [CONTACT_EMAIL],
  webshop: [CONTACT_EMAIL],
} as const;

/** Leesbare naam per categorie, voor het beheerportaal. */
export const CONTACT_ROUTE_LABELS: Record<string, string> = {
  algemeen: "Algemene vragen & contact",
  school: "Scholen",
  familie: "Families",
  bedrijf: "Bedrijven & team building",
  vrijwilligers: "Vrijwilligers",
  stages: "Stages & jobs",
  partner: "Partners & sponsoring",
  rooster: "Openingsuren & bezoek",
  toegankelijkheid: "Toegankelijkheid",
  technisch: "Problemen & meldingen",
  betalingen: "Betalingen & donaties",
  verhuur: "Zaalverhuur & aanvragen",
  webshop: "Webshop & bestellingen",
};


export type ContactInbox = keyof typeof CONTACT_INBOXES;

/** Vangnet: standaardontvangers voor een categorie. */
export function defaultRecipients(key?: string): string[] {
  if (!key) return [CONTACT_EMAIL];
  const found = CONTACT_INBOXES[key as ContactInbox];
  return found ? [...found] : [CONTACT_EMAIL];
}

export function inboxFor(key?: string): string {
  return defaultRecipients(key)[0] ?? CONTACT_EMAIL;
}

/**
 * Bouwt een nette, leesbare mailto-link. De mail vertrekt vanuit het eigen
 * mailprogramma van de bezoeker, zodat een antwoord automatisch bij de juiste
 * persoon terechtkomt — het adres staat bovendien expliciet in de mail.
 */
export function buildMailto({
  to,
  topic,
  name,
  email,
  phone,
  message,
  page,
}: {
  to: string;
  topic: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  page?: string;
}): string {
  const subject = `${topic} — ${name || "Bezoeker"}`;
  const lines = [
    `Beste team van Maximilien,`,
    ``,
    message.trim(),
    ``,
    `— — — — — — — — — — — — — — —`,
    `Onderwerp   : ${topic}`,
    `Naam        : ${name || "-"}`,
    `E-mail      : ${email || "-"}`,
    ...(phone ? [`Telefoon    : ${phone}`] : []),
    ...(page ? [`Pagina      : ${page}`] : []),
    `Antwoord graag naar: ${email || "-"}`,
    `— — — — — — — — — — — — — — —`,
  ];
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
