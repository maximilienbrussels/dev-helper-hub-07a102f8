/**
 * Teamsjablonen: kant-en-klare, drietalige HTML-mails in de huisstijl die het
 * team kan downloaden en in Infomaniak (Mail of Newsletter) kan plakken of
 * uploaden. Pure opmaak — geen secrets, geen netwerk — dus ook bruikbaar in
 * de browser voor previews.
 *
 * Plaatshouders staan tussen dubbele vierkante haken, bv. [[Voornaam]].
 * In Infomaniak Newsletter vervang je die door de eigen variabelen
 * ({{firstname}} …); in een gewone mail overschrijf je ze gewoon.
 */
import type { MailLang } from "./email-copy";
import {
  SANS,
  SERIF,
  MAIL_COLORS,
  BRAND_NAME,
  ORG,
  bulletList,
  button,
  escapeHtml,
  EMAIL_ASSET_BASE_URL,
  infoGrid,
  mailOrigin,
  publicUrl,
  sectionTitle,
  shell,
  signature,
} from "./email-shell";

export type TeamTemplateCategory = "nieuwsbrief" | "evenement" | "pers" | "relatie" | "intern";

export interface TeamTemplate {
  id: string;
  category: TeamTemplateCategory;
  name: Record<MailLang, string>;
  description: Record<MailLang, string>;
  /** Plaatshouders die in het sjabloon voorkomen (voor de uitleg in het portaal). */
  placeholders: string[];
  build: (lang: MailLang) => { subject: string; html: string };
}

const C = MAIL_COLORS;
const P = (name: string) => `[[${name}]]`;

/** Gemarkeerde plaatshouder, zodat het team ze snel terugvindt in de preview. */
function ph(name: string): string {
  return `<span style="background:#FFF1C2;color:#6B4E00;padding:0 4px;border-radius:4px;font-family:'Courier New',Courier,monospace;font-size:0.9em;">${escapeHtml(P(name))}</span>`;
}

function p(html: string, extra = ""): string {
  return `<p style="margin:0 0 14px;${extra}">${html}</p>`;
}

function origin(): string {
  return mailOrigin();
}

/* ------------------------------ 1. Nieuwsbrief ---------------------------- */

const newsletter: TeamTemplate = {
  id: "nieuwsbrief",
  category: "nieuwsbrief",
  name: { nl: "Nieuwsbrief", fr: "Newsletter", en: "Newsletter" },
  description: {
    nl: "Maandelijkse nieuwsbrief met sfeerbeeld, drie rubrieken, agenda en oproep tot actie.",
    fr: "Newsletter mensuelle avec visuel, trois rubriques, agenda et appel à l'action.",
    en: "Monthly newsletter with hero image, three sections, agenda and call to action.",
  },
  placeholders: ["Voornaam", "Maand", "Uitschrijflink"],
  build(lang) {
    const c = {
      nl: {
        subject: "Nieuws van de boerderij — [[Maand]]",
        kicker: "Nieuwsbrief · [[Maand]]",
        title: "Nieuws van het erf",
        intro:
          "Dag [[Voornaam]], de seizoenen draaien door op de stadsboerderij. Dit is wat er de voorbije weken gebeurde en wat eraan komt.",
        s1: ["Op het erf", "Lammetjes, bijen en de eerste oogst"],
        s1b:
          "Vertel hier in drie à vier zinnen het belangrijkste nieuws van de maand. Hou het concreet: wat is er gebeurd, wie was erbij, wat betekent het voor de buurt?",
        s2: ["Educatie", "Nieuwe schoolanimaties voor het najaar"],
        s2b:
          "Kondig een nieuw aanbod aan of blik terug op een geslaagde activiteit. Sluit af met een link naar de juiste pagina.",
        s3: ["Agenda", "Binnenkort op de boerderij"],
        agenda: [
          "<strong>za 13 sep</strong> — Boerderijfeest, 11:00–18:00",
          "<strong>wo 24 sep</strong> — Compostworkshop voor buren, 14:00",
          "<strong>zo 5 okt</strong> — Oogstmarkt in de hoevewinkel",
        ],
        cta: "Bekijk de volledige agenda",
        outro: "Tot op de boerderij!",
      },
      fr: {
        subject: "Nouvelles de la ferme — [[Maand]]",
        kicker: "Newsletter · [[Maand]]",
        title: "Nouvelles de la cour",
        intro:
          "Bonjour [[Voornaam]], les saisons se succèdent à la ferme urbaine. Voici ce qui s'est passé ces dernières semaines et ce qui arrive.",
        s1: ["À la ferme", "Agneaux, abeilles et premières récoltes"],
        s1b:
          "Racontez ici, en trois ou quatre phrases, la nouvelle principale du mois. Restez concret : que s'est-il passé, qui était là, qu'est-ce que cela change pour le quartier ?",
        s2: ["Éducation", "Nouvelles animations scolaires pour l'automne"],
        s2b:
          "Annoncez une nouvelle offre ou revenez sur une activité réussie. Terminez par un lien vers la bonne page.",
        s3: ["Agenda", "Bientôt à la ferme"],
        agenda: [
          "<strong>sa 13 sept</strong> — Fête de la ferme, 11h–18h",
          "<strong>me 24 sept</strong> — Atelier compost pour les voisins, 14h",
          "<strong>di 5 oct</strong> — Marché des récoltes à la boutique",
        ],
        cta: "Voir tout l'agenda",
        outro: "À bientôt à la ferme !",
      },
      en: {
        subject: "News from the farm — [[Maand]]",
        kicker: "Newsletter · [[Maand]]",
        title: "News from the farmyard",
        intro:
          "Hi [[Voornaam]], the seasons keep turning at the city farm. Here's what happened over the past weeks and what's coming up.",
        s1: ["On the farm", "Lambs, bees and the first harvest"],
        s1b:
          "Tell the month's main story in three or four sentences. Keep it concrete: what happened, who was there, what does it mean for the neighbourhood?",
        s2: ["Education", "New school activities for autumn"],
        s2b:
          "Announce a new offer or look back on a successful activity. End with a link to the right page.",
        s3: ["Agenda", "Coming up at the farm"],
        agenda: [
          "<strong>Sat 13 Sep</strong> — Farm festival, 11:00–18:00",
          "<strong>Wed 24 Sep</strong> — Compost workshop for neighbours, 14:00",
          "<strong>Sun 5 Oct</strong> — Harvest market in the farm shop",
        ],
        cta: "See the full agenda",
        outro: "See you at the farm!",
      },
    }[lang];
    const o = origin();
    const body = `
      ${p(c.intro.replace("[[Voornaam]]", ph("Voornaam")))}
      ${sectionTitle(c.s1[0]!, c.s1[1]!)}
      ${p(c.s1b)}
      <img src="${EMAIL_ASSET_BASE_URL}/assets/email/hero-kinderen.jpg" border="0" width="536" alt="${BRAND_NAME}" style="display:block;outline:none;text-decoration:none;border:none;border:0;width:100%;max-width:536px;height:auto;border-radius:14px;margin:4px 0 6px;">
      ${sectionTitle(c.s2[0]!, c.s2[1]!)}
      ${p(c.s2b)}
      ${sectionTitle(c.s3[0]!, c.s3[1]!)}
      ${bulletList(c.agenda)}
      <div style="margin:24px 0 8px;">${button(publicUrl("events", lang, o), c.cta)}</div>
      ${p(c.outro, `margin-top:22px;color:${C.muted};font-size:14px;`)}`;
    return {
      subject: c.subject,
      html: shell({
        lang,
        preview: c.intro,
        kicker: c.kicker.replace("[[Maand]]", P("Maand")),
        title: c.title,
        hero: { src: `${EMAIL_ASSET_BASE_URL}/assets/email/hero-erf.jpg`, alt: BRAND_NAME },
        body,
        unsubscribeUrl: P("Uitschrijflink"),
        hideDisclaimer: true,
      }),
    };
  },
};

/* ------------------------------ 2. Uitnodiging ---------------------------- */

const invitation: TeamTemplate = {
  id: "uitnodiging",
  category: "evenement",
  name: { nl: "Uitnodiging evenement", fr: "Invitation à un événement", en: "Event invitation" },
  description: {
    nl: "Uitnodiging voor een feest, opening of workshop met datum, uur, plaats en RSVP-knop.",
    fr: "Invitation à une fête, inauguration ou atelier avec date, heure, lieu et bouton RSVP.",
    en: "Invitation to a festival, opening or workshop with date, time, venue and RSVP button.",
  },
  placeholders: ["Voornaam", "Evenement", "Datum", "Uur", "RSVP-link"],
  build(lang) {
    const c = {
      nl: {
        subject: "Uitnodiging: [[Evenement]] op de boerderij",
        kicker: "Uitnodiging",
        title: "[[Evenement]]",
        intro:
          "Dag [[Voornaam]], we nodigen je graag uit op de stadsboerderij. Kom langs, breng je buren mee en ontdek wat er leeft op het erf.",
        program: "Programma",
        items: ["11:00 — Onthaal met koffie en boerderijkoeken", "13:00 — Rondleiding langs de dieren", "15:00 — Workshop voor kinderen", "17:00 — Aperitief met producten uit de hoevewinkel"],
        labels: { date: "Datum", time: "Uur", place: "Plaats" },
        cta: "Ik kom!",
        small: "Toegang is gratis. Laat ons even weten of je komt, zo voorzien we genoeg voor iedereen.",
      },
      fr: {
        subject: "Invitation : [[Evenement]] à la ferme",
        kicker: "Invitation",
        title: "[[Evenement]]",
        intro:
          "Bonjour [[Voornaam]], nous avons le plaisir de vous inviter à la ferme urbaine. Passez, amenez vos voisins et découvrez la vie de la cour.",
        program: "Programme",
        items: ["11h — Accueil café et biscuits de la ferme", "13h — Visite guidée des animaux", "15h — Atelier pour enfants", "17h — Apéritif avec les produits de la boutique"],
        labels: { date: "Date", time: "Heure", place: "Lieu" },
        cta: "Je viens !",
        small: "L'entrée est gratuite. Dites-nous si vous venez, pour que nous prévoyions assez pour tout le monde.",
      },
      en: {
        subject: "Invitation: [[Evenement]] at the farm",
        kicker: "Invitation",
        title: "[[Evenement]]",
        intro:
          "Hi [[Voornaam]], we'd love to welcome you at the city farm. Drop by, bring your neighbours and discover life in the farmyard.",
        program: "Programme",
        items: ["11:00 — Welcome coffee and farm biscuits", "13:00 — Guided tour of the animals", "15:00 — Workshop for children", "17:00 — Drinks with farm shop products"],
        labels: { date: "Date", time: "Time", place: "Venue" },
        cta: "I'm coming!",
        small: "Admission is free. Let us know if you're coming so we can plan enough for everyone.",
      },
    }[lang];
    const o = origin();
    const body = `
      ${p(c.intro.replace("[[Voornaam]]", ph("Voornaam")))}
      ${infoGrid([
        { label: c.labels.date, value: P("Datum") },
        { label: c.labels.time, value: P("Uur") },
        { label: c.labels.place, value: "Schipperijkaai 2, 1000 Brussel" },
      ])}
      ${sectionTitle(c.kicker, c.program)}
      ${bulletList(c.items)}
      <div style="margin:26px 0 8px;">${button(P("RSVP-link"), c.cta)}</div>
      ${p(c.small, `margin-top:18px;color:${C.muted};font-size:13px;text-align:center;`)}`;
    return {
      subject: c.subject,
      html: shell({
        lang,
        preview: c.intro,
        kicker: c.kicker,
        title: c.title,
        hero: { src: `${EMAIL_ASSET_BASE_URL}/assets/email/hero-erf.jpg`, alt: BRAND_NAME },
        body,
        hideDisclaimer: true,
      }),
    };
  },
};

/* ------------------------------- 3. Persbericht --------------------------- */

const pressRelease: TeamTemplate = {
  id: "persbericht",
  category: "pers",
  name: { nl: "Persbericht", fr: "Communiqué de presse", en: "Press release" },
  description: {
    nl: "Persbericht met kop, lead, citaat, boilerplate en perscontact — klaar voor redacties.",
    fr: "Communiqué avec titre, chapeau, citation, boilerplate et contact presse.",
    en: "Press release with headline, lede, quote, boilerplate and press contact.",
  },
  placeholders: ["Titel", "Lead", "Citaat", "Naam woordvoerder", "Datum"],
  build(lang) {
    const c = {
      nl: {
        subject: "Persbericht — [[Titel]]",
        kicker: "Persbericht · Brussel, [[Datum]]",
        body1: "Schrijf hier de eerste alinea: wie, wat, waar, wanneer en waarom. Journalisten lezen vaak alleen deze alinea.",
        body2: "Tweede alinea met context, cijfers en het bredere verhaal van de stadsboerderij in hartje Brussel.",
        quoteBy: "[[Naam woordvoerder]], Maximilien",
        boilerTitle: "Over Maximilien",
        boiler:
          "Maximilien is een stadsboerderij in het hart van Brussel, tussen het Noordstation en het kanaal. De vzw verwelkomt scholen, buurtbewoners en bezoekers gratis, met dieren, een moestuin, buurtcompost, een hoevewinkel en educatieve programma's rond voeding en biodiversiteit.",
        contactTitle: "Perscontact",
        kit: "Logo's, persfoto's en kerncijfers",
      },
      fr: {
        subject: "Communiqué de presse — [[Titel]]",
        kicker: "Communiqué · Bruxelles, [[Datum]]",
        body1: "Rédigez ici le premier paragraphe : qui, quoi, où, quand et pourquoi. Les journalistes ne lisent souvent que celui-ci.",
        body2: "Deuxième paragraphe avec le contexte, les chiffres et l'histoire plus large de la ferme urbaine au cœur de Bruxelles.",
        quoteBy: "[[Naam woordvoerder]], Maximilien",
        boilerTitle: "À propos de Maximilien",
        boiler:
          "Maximilien est une ferme urbaine au cœur de Bruxelles, entre la gare du Nord et le canal. L'ASBL accueille gratuitement écoles, habitants et visiteurs, avec des animaux, un potager, un compost de quartier, une boutique fermière et des programmes éducatifs autour de l'alimentation et de la biodiversité.",
        contactTitle: "Contact presse",
        kit: "Logos, photos de presse et chiffres clés",
      },
      en: {
        subject: "Press release — [[Titel]]",
        kicker: "Press release · Brussels, [[Datum]]",
        body1: "Write the first paragraph here: who, what, where, when and why. Journalists often read only this paragraph.",
        body2: "Second paragraph with context, figures and the wider story of the city farm in the heart of Brussels.",
        quoteBy: "[[Naam woordvoerder]], Maximilien",
        boilerTitle: "About Maximilien",
        boiler:
          "Maximilien is a city farm in the heart of Brussels, between the North Station and the canal. The non-profit welcomes schools, neighbours and visitors free of charge, with animals, a kitchen garden, neighbourhood compost, a farm shop and educational programmes on food and biodiversity.",
        contactTitle: "Press contact",
        kit: "Logos, press photos and key figures",
      },
    }[lang];
    const o = origin();
    const pressPath = { nl: "/nl/pers", fr: "/fr/presse", en: "/en/press" }[lang];
    const body = `
      ${p(`<strong>${ph("Lead")}</strong>`, "font-size:17px;line-height:1.55;")}
      ${p(c.body1)}
      ${p(c.body2)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;"><tr>
        <td width="4" bgcolor="${C.terra}" style="background:${C.terra};border-radius:4px;font-size:0;">&nbsp;</td>
        <td style="padding:4px 0 4px 18px;font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.45;color:${C.forest};">“${ph("Citaat")}”<br><span style="font-family:${SANS};font-style:normal;font-size:13px;color:${C.muted};">— ${escapeHtml(c.quoteBy).replace(escapeHtml("[[Naam woordvoerder]]"), ph("Naam woordvoerder"))}</span></td>
      </tr></table>
      ${sectionTitle("Boilerplate", c.boilerTitle)}
      ${p(c.boiler, `font-size:14px;color:${C.muted};`)}
      ${sectionTitle("Contact", c.contactTitle)}
      ${p(`${escapeHtml(BRAND_NAME)}<br><a href="mailto:${ORG.email}" style="color:${C.terra};">${ORG.email}</a> · <a href="${ORG.phoneHref}" style="color:${C.terra};text-decoration:none;">${escapeHtml(ORG.phone)}</a><br><a href="${o}${pressPath}" style="color:${C.terra};">${escapeHtml(c.kit)} →</a>`, "font-size:14px;")}`;
    return {
      subject: c.subject,
      html: shell({
        lang,
        preview: "[[Lead]]",
        kicker: c.kicker.replace("[[Datum]]", P("Datum")),
        title: P("Titel"),
        body,
        hideDisclaimer: true,
      }),
    };
  },
};

/* ------------------------- 4. Antwoord op aanvraag ------------------------ */

const requestReply: TeamTemplate = {
  id: "antwoord-aanvraag",
  category: "relatie",
  name: { nl: "Antwoord op aanvraag / offerte", fr: "Réponse à une demande / devis", en: "Reply to request / quote" },
  description: {
    nl: "Persoonlijk antwoord op een school-, verhuur- of teambuildingaanvraag met voorstel en volgende stappen.",
    fr: "Réponse personnelle à une demande scolaire, de location ou de team-building avec proposition et étapes suivantes.",
    en: "Personal reply to a school, rental or team-building request with proposal and next steps.",
  },
  placeholders: ["Voornaam", "Aanvraag", "Voorstel datum", "Prijs", "Naam medewerker", "Functie"],
  build(lang) {
    const c = {
      nl: {
        subject: "Je aanvraag voor [[Aanvraag]] — ons voorstel",
        kicker: "Aanvraag",
        title: "Bedankt voor je aanvraag",
        intro: "Dag [[Voornaam]], bedankt voor je interesse in de stadsboerderij. Hieronder vind je ons voorstel voor [[Aanvraag]].",
        labels: { what: "Aanvraag", when: "Voorstel", price: "Richtprijs" },
        next: "Volgende stappen",
        steps: ["Laat ons weten of de voorgestelde datum past — of stel een alternatief voor.", "Wij bevestigen en sturen de praktische info door.", "Betaling kan online of via overschrijving na bevestiging."],
        cta: "Bevestig of stel een andere datum voor",
        role: "[[Functie]]",
      },
      fr: {
        subject: "Votre demande pour [[Aanvraag]] — notre proposition",
        kicker: "Demande",
        title: "Merci pour votre demande",
        intro: "Bonjour [[Voornaam]], merci de votre intérêt pour la ferme urbaine. Voici notre proposition pour [[Aanvraag]].",
        labels: { what: "Demande", when: "Proposition", price: "Prix indicatif" },
        next: "Étapes suivantes",
        steps: ["Dites-nous si la date proposée vous convient — ou proposez une alternative.", "Nous confirmons et envoyons les infos pratiques.", "Le paiement se fait en ligne ou par virement après confirmation."],
        cta: "Confirmer ou proposer une autre date",
        role: "[[Functie]]",
      },
      en: {
        subject: "Your request for [[Aanvraag]] — our proposal",
        kicker: "Request",
        title: "Thank you for your request",
        intro: "Hi [[Voornaam]], thank you for your interest in the city farm. Below is our proposal for [[Aanvraag]].",
        labels: { what: "Request", when: "Proposal", price: "Indicative price" },
        next: "Next steps",
        steps: ["Let us know whether the proposed date works — or suggest an alternative.", "We confirm and send the practical details.", "Payment is possible online or by bank transfer after confirmation."],
        cta: "Confirm or suggest another date",
        role: "[[Functie]]",
      },
    }[lang];
    const body = `
      ${p(c.intro.replace("[[Voornaam]]", ph("Voornaam")).replace("[[Aanvraag]]", ph("Aanvraag")))}
      ${infoGrid([
        { label: c.labels.what, value: P("Aanvraag") },
        { label: c.labels.when, value: P("Voorstel datum") },
        { label: c.labels.price, value: P("Prijs") },
      ])}
      ${sectionTitle(c.kicker, c.next)}
      ${bulletList(c.steps)}
      <div style="margin:24px 0 8px;">${button(`mailto:${ORG.email}`, c.cta)}</div>
      ${signature(P("Naam medewerker"), c.role, lang)}`;
    return {
      subject: c.subject,
      html: shell({ lang, preview: c.intro, kicker: c.kicker, title: c.title, body, hideDisclaimer: true }),
    };
  },
};

/* --------------------------- 5. Bedanking steun --------------------------- */

const thankYou: TeamTemplate = {
  id: "bedankt",
  category: "relatie",
  name: { nl: "Bedankmail donateur / vrijwilliger", fr: "Remerciement donateur / bénévole", en: "Thank-you donor / volunteer" },
  description: {
    nl: "Warme bedanking na een gift, sponsoring of vrijwilligerswerk, met impact en uitnodiging.",
    fr: "Remerciement chaleureux après un don, un sponsoring ou du bénévolat, avec impact et invitation.",
    en: "Warm thank-you after a donation, sponsorship or volunteering, with impact and invitation.",
  },
  placeholders: ["Voornaam", "Bijdrage", "Naam medewerker", "Functie"],
  build(lang) {
    const c = {
      nl: {
        subject: "Dankjewel, [[Voornaam]]",
        kicker: "Dankjewel",
        title: "Jouw steun maakt het verschil",
        intro: "Dag [[Voornaam]], dankzij [[Bijdrage]] blijven de dieren verzorgd, de moestuin groen en de boerderij gratis toegankelijk voor de buurt.",
        impactTitle: "Wat je steun mogelijk maakt",
        impact: ["Een week hooi en voer voor onze schapen, geiten en alpaca's", "Zaden en plantgoed voor de schoolmoestuin", "Gratis animaties voor klassen uit de buurt"],
        cta: "Kom langs op de boerderij",
        role: "[[Functie]]",
      },
      fr: {
        subject: "Merci, [[Voornaam]]",
        kicker: "Merci",
        title: "Votre soutien fait la différence",
        intro: "Bonjour [[Voornaam]], grâce à [[Bijdrage]], les animaux sont soignés, le potager reste vert et la ferme demeure gratuite pour le quartier.",
        impactTitle: "Ce que votre soutien rend possible",
        impact: ["Une semaine de foin et de nourriture pour nos moutons, chèvres et alpagas", "Semences et plants pour le potager des écoles", "Des animations gratuites pour les classes du quartier"],
        cta: "Passez nous voir à la ferme",
        role: "[[Functie]]",
      },
      en: {
        subject: "Thank you, [[Voornaam]]",
        kicker: "Thank you",
        title: "Your support makes the difference",
        intro: "Hi [[Voornaam]], thanks to [[Bijdrage]] the animals are cared for, the garden stays green and the farm stays free for the neighbourhood.",
        impactTitle: "What your support makes possible",
        impact: ["A week of hay and feed for our sheep, goats and alpacas", "Seeds and seedlings for the school garden", "Free activities for classes from the neighbourhood"],
        cta: "Visit us at the farm",
        role: "[[Functie]]",
      },
    }[lang];
    const o = origin();
    const body = `
      ${p(c.intro.replace("[[Voornaam]]", ph("Voornaam")).replace("[[Bijdrage]]", ph("Bijdrage")))}
      ${sectionTitle(c.kicker, c.impactTitle)}
      ${bulletList(c.impact)}
      <div style="margin:24px 0 8px;">${button(o, c.cta)}</div>
      ${signature(P("Naam medewerker"), c.role, lang)}`;
    return {
      subject: c.subject,
      html: shell({
        lang,
        preview: c.intro,
        kicker: c.kicker,
        title: c.title,
        hero: { src: `${EMAIL_ASSET_BASE_URL}/assets/email/hero-moestuin.jpg`, alt: BRAND_NAME },
        body,
        hideDisclaimer: true,
      }),
    };
  },
};

/* ----------------------------- 6. Mededeling ------------------------------ */

const announcement: TeamTemplate = {
  id: "mededeling",
  category: "intern",
  name: { nl: "Mededeling / sluiting", fr: "Annonce / fermeture", en: "Announcement / closure" },
  description: {
    nl: "Korte praktische mededeling: gewijzigde openingsuren, sluitingsdag, weeralarm of wegenwerken.",
    fr: "Brève annonce pratique : horaires modifiés, jour de fermeture, alerte météo ou travaux.",
    en: "Short practical notice: changed opening hours, closing day, weather alert or roadworks.",
  },
  placeholders: ["Titel", "Datum", "Bericht"],
  build(lang) {
    const c = {
      nl: { subject: "[[Titel]] — Maximilien", kicker: "Mededeling", labels: { when: "Wanneer", where: "Waar" }, cta: "Bekijk de openingsuren", small: "Vragen? Antwoord gerust op deze mail." },
      fr: { subject: "[[Titel]] — Maximilien", kicker: "Annonce", labels: { when: "Quand", where: "Où" }, cta: "Voir les horaires", small: "Des questions ? Répondez simplement à cet e-mail." },
      en: { subject: "[[Titel]] — Maximilien", kicker: "Notice", labels: { when: "When", where: "Where" }, cta: "See opening hours", small: "Questions? Just reply to this email." },
    }[lang];
    const o = origin();
    const body = `
      ${p(ph("Bericht"))}
      ${infoGrid([
        { label: c.labels.when, value: P("Datum") },
        { label: c.labels.where, value: "Schipperijkaai 2, 1000 Brussel" },
      ])}
      <div style="margin:26px 0 8px;">${button(publicUrl("visit", lang, o), c.cta)}</div>
      ${p(c.small, `margin-top:18px;color:${C.muted};font-size:13px;text-align:center;`)}`;
    return {
      subject: c.subject,
      html: shell({ lang, preview: P("Titel"), kicker: c.kicker, title: P("Titel"), body, hideDisclaimer: true }),
    };
  },
};

/* -------------------------- 7. Betalingsherinnering ----------------------- */

const paymentReminder: TeamTemplate = {
  id: "betalingsherinnering",
  category: "relatie",
  name: { nl: "Betalingsherinnering", fr: "Rappel de paiement", en: "Payment reminder" },
  description: {
    nl: "Vriendelijke herinnering voor een openstaande factuur of boeking, met bedrag, referentie en betaallink.",
    fr: "Rappel courtois pour une facture ou réservation impayée, avec montant, référence et lien de paiement.",
    en: "Friendly reminder for an outstanding invoice or booking, with amount, reference and payment link.",
  },
  placeholders: ["Voornaam", "Bedrag", "Referentie", "Vervaldatum", "Betaallink"],
  build(lang) {
    const c = {
      nl: {
        subject: "Herinnering: openstaand bedrag [[Referentie]]",
        kicker: "Herinnering",
        title: "Nog een klein duwtje",
        intro: "Dag [[Voornaam]], volgens onze administratie staat onderstaand bedrag nog open. Misschien is het je ontgaan — geen probleem, je regelt het in één klik.",
        labels: { amount: "Bedrag", ref: "Referentie", due: "Vervaldatum" },
        cta: "Nu betalen",
        bank: `Liever overschrijven? IBAN BE12 3456 7890 1234 — vermeld ${P("Referentie")}.`,
        small: "Al betaald? Dan mag je deze mail negeren — bedankt!",
      },
      fr: {
        subject: "Rappel : montant en attente [[Referentie]]",
        kicker: "Rappel",
        title: "Un petit rappel",
        intro: "Bonjour [[Voornaam]], selon notre administration, le montant ci-dessous est encore ouvert. Cela vous a peut-être échappé — pas de souci, réglez-le en un clic.",
        labels: { amount: "Montant", ref: "Référence", due: "Échéance" },
        cta: "Payer maintenant",
        bank: `Vous préférez un virement ? IBAN BE12 3456 7890 1234 — mentionnez ${P("Referentie")}.`,
        small: "Déjà payé ? Ignorez simplement cet e-mail — merci !",
      },
      en: {
        subject: "Reminder: outstanding amount [[Referentie]]",
        kicker: "Reminder",
        title: "A gentle nudge",
        intro: "Hi [[Voornaam]], according to our records the amount below is still open. It may have slipped your mind — no problem, you can settle it in one click.",
        labels: { amount: "Amount", ref: "Reference", due: "Due date" },
        cta: "Pay now",
        bank: `Prefer a bank transfer? IBAN BE12 3456 7890 1234 — mention ${P("Referentie")}.`,
        small: "Already paid? Then please ignore this email — thank you!",
      },
    }[lang];
    const body = `
      ${p(c.intro.replace("[[Voornaam]]", ph("Voornaam")))}
      ${infoGrid([
        { label: c.labels.amount, value: P("Bedrag") },
        { label: c.labels.ref, value: P("Referentie") },
        { label: c.labels.due, value: P("Vervaldatum") },
      ])}
      <div style="margin:26px 0 8px;">${button(P("Betaallink"), c.cta)}</div>
      ${p(escapeHtml(c.bank), `margin-top:18px;font-size:13px;color:${C.muted};text-align:center;`)}
      ${p(c.small, `font-size:13px;color:${C.muted};text-align:center;`)}`;
    return {
      subject: c.subject,
      html: shell({ lang, preview: c.intro, kicker: c.kicker, title: c.title, body, hideDisclaimer: true }),
    };
  },
};

/* ------------------------------ 8. Welkom team ---------------------------- */

const welcome: TeamTemplate = {
  id: "welkom",
  category: "intern",
  name: { nl: "Welkom nieuwe vrijwilliger / collega", fr: "Bienvenue nouveau bénévole / collègue", en: "Welcome new volunteer / colleague" },
  description: {
    nl: "Onthaalmail met praktische info voor de eerste dag, contactpersoon en wat mee te brengen.",
    fr: "E-mail d'accueil avec infos pratiques pour le premier jour, personne de contact et à emporter.",
    en: "Welcome email with practical info for the first day, contact person and what to bring.",
  },
  placeholders: ["Voornaam", "Eerste dag", "Uur", "Contactpersoon", "Naam medewerker", "Functie"],
  build(lang) {
    const c = {
      nl: {
        subject: "Welkom op de boerderij, [[Voornaam]]!",
        kicker: "Welkom",
        title: "Fijn dat je erbij komt",
        intro: "Dag [[Voornaam]], welkom in het team van de stadsboerderij! Hieronder alles voor een vlotte eerste dag.",
        labels: { day: "Eerste dag", time: "Uur", contact: "Contactpersoon" },
        bringTitle: "Wat breng je mee?",
        bring: ["Laarzen of stevige schoenen en kleren die vuil mogen worden", "Een drinkbus — koffie en thee zijn er op de boerderij", "Je identiteitskaart voor de vrijwilligersverzekering"],
        cta: "Bekijk de weg naar de boerderij",
        role: "[[Functie]]",
      },
      fr: {
        subject: "Bienvenue à la ferme, [[Voornaam]] !",
        kicker: "Bienvenue",
        title: "Ravis de vous compter parmi nous",
        intro: "Bonjour [[Voornaam]], bienvenue dans l'équipe de la ferme urbaine ! Voici tout ce qu'il faut pour un premier jour serein.",
        labels: { day: "Premier jour", time: "Heure", contact: "Personne de contact" },
        bringTitle: "Qu'apporter ?",
        bring: ["Des bottes ou chaussures solides et des vêtements qui peuvent se salir", "Une gourde — café et thé sont à la ferme", "Votre carte d'identité pour l'assurance bénévoles"],
        cta: "Voir l'itinéraire vers la ferme",
        role: "[[Functie]]",
      },
      en: {
        subject: "Welcome to the farm, [[Voornaam]]!",
        kicker: "Welcome",
        title: "Glad to have you on board",
        intro: "Hi [[Voornaam]], welcome to the city farm team! Below is everything for a smooth first day.",
        labels: { day: "First day", time: "Time", contact: "Contact person" },
        bringTitle: "What to bring",
        bring: ["Boots or sturdy shoes and clothes that can get dirty", "A water bottle — coffee and tea are available at the farm", "Your ID card for the volunteer insurance"],
        cta: "Directions to the farm",
        role: "[[Functie]]",
      },
    }[lang];
    const o = origin();
    const body = `
      ${p(c.intro.replace("[[Voornaam]]", ph("Voornaam")))}
      ${infoGrid([
        { label: c.labels.day, value: P("Eerste dag") },
        { label: c.labels.time, value: P("Uur") },
        { label: c.labels.contact, value: P("Contactpersoon") },
      ])}
      ${sectionTitle(c.kicker, c.bringTitle)}
      ${bulletList(c.bring)}
      <div style="margin:24px 0 8px;">${button(publicUrl("visit", lang, o), c.cta)}</div>
      ${signature(P("Naam medewerker"), c.role, lang)}`;
    return {
      subject: c.subject,
      html: shell({
        lang,
        preview: c.intro,
        kicker: c.kicker,
        title: c.title,
        hero: { src: `${EMAIL_ASSET_BASE_URL}/assets/email/hero-kinderen.jpg`, alt: BRAND_NAME },
        body,
        hideDisclaimer: true,
      }),
    };
  },
};

export const TEAM_EMAIL_TEMPLATES: TeamTemplate[] = [
  newsletter,
  invitation,
  pressRelease,
  requestReply,
  thankYou,
  announcement,
  paymentReminder,
  welcome,
];

export const TEAM_TEMPLATE_CATEGORY_LABEL: Record<TeamTemplateCategory, Record<MailLang, string>> = {
  nieuwsbrief: { nl: "Nieuwsbrief", fr: "Newsletter", en: "Newsletter" },
  evenement: { nl: "Evenementen", fr: "Événements", en: "Events" },
  pers: { nl: "Pers", fr: "Presse", en: "Press" },
  relatie: { nl: "Klanten & partners", fr: "Clients & partenaires", en: "Customers & partners" },
  intern: { nl: "Praktisch & intern", fr: "Pratique & interne", en: "Practical & internal" },
};

/** Bestandsnaam voor de HTML-download, bv. `maximilien-nieuwsbrief-nl.html`. */
export function teamTemplateFilename(id: string, lang: MailLang): string {
  return `maximilien-${id}-${lang}.html`;
}
