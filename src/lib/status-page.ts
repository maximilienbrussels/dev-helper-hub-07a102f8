/**
 * Status & infrastructuur — drietalig.
 * Legt open uit welke domeinen we gebruiken, waar de gegevens staan en
 * hoe de geïsoleerde mailgate (send.maximilien.site) werkt.
 */
import type { Lang } from "@/lib/i18n";
import type { LegalDoc } from "@/lib/legal-pages";

export const STATUS_DOC: Record<Lang, LegalDoc> = {
  nl: {
    eyebrow: "Status",
    title: "Status & infrastructuur",
    lede: "Volledige openheid over de domeinen, de mailgate en de Europese infrastructuur achter dit platform.",
    updated: "Laatst bijgewerkt: september 2026",
    footnote:
      "Een storing gezien? Meld het via contact@maximilien.brussels; we koppelen zo snel mogelijk terug.",
    blocks: [
      {
        h: "1. Onze domeinen",
        ul: [
          "maximilien.brussels — de publieke bezoekerssite.",
          "maximilien.site — het beheerportaal voor het team.",
          "maximilien.app — de mobiele veld-app voor medewerkers op het terrein.",
          "send.maximilien.site — uitsluitend voor uitgaande e-mail; er staat geen website op.",
        ],
      },
      {
        h: "2. Geïsoleerde mailgate",
        p: [
          "Alle e-mail (bevestigingen, inlogcodes, afhaalberichten en certificaten) vertrekt via een apart subdomein: send.maximilien.site. Zo blijft de reputatie van onze hoofddomeinen los van het mailverkeer.",
          "De verzending loopt via Brevo (Sendinblue SAS, Frankrijk). Onze mails bevatten geen leesbevestigingen of trackingpixels.",
        ],
      },
      {
        h: "3. Waar de gegevens staan",
        ul: [
          "Databank: Neon, Europese regio.",
          "Foto's en documenten: Scaleway, Frankrijk.",
          "Betalingen: Stripe — wij zien nooit je kaartgegevens.",
        ],
      },
      {
        h: "4. Beschikbaarheid",
        p: [
          "We plannen onderhoud waar mogelijk buiten de openingsuren. Bij een onderbreking verschijnt er een melding op de site zelf.",
          "Reserveringen en bestellingen blijven bewaard, ook wanneer een onderdeel tijdelijk onbereikbaar is.",
        ],
      },
    ],
  },
  fr: {
    eyebrow: "Statut",
    title: "Statut & infrastructure",
    lede: "Transparence totale sur nos domaines, la passerelle e-mail et l'infrastructure européenne de cette plateforme.",
    updated: "Dernière mise à jour : septembre 2026",
    footnote:
      "Vous constatez une panne ? Écrivez à contact@maximilien.brussels ; nous revenons vers vous au plus vite.",
    blocks: [
      {
        h: "1. Nos domaines",
        ul: [
          "maximilien.brussels — le site public des visiteurs.",
          "maximilien.site — le portail de gestion de l'équipe.",
          "maximilien.app — l'application mobile de terrain.",
          "send.maximilien.site — uniquement pour les e-mails sortants ; aucun site web n'y est hébergé.",
        ],
      },
      {
        h: "2. Passerelle e-mail isolée",
        p: [
          "Tous les e-mails (confirmations, codes de connexion, avis de retrait et certificats) partent d'un sous-domaine distinct : send.maximilien.site. La réputation de nos domaines principaux reste ainsi séparée du trafic e-mail.",
          "L'envoi passe par Brevo (Sendinblue SAS, France). Nos e-mails ne contiennent ni accusés de lecture ni pixels de suivi.",
        ],
      },
      {
        h: "3. Où sont les données",
        ul: [
          "Base de données : Neon, région européenne.",
          "Photos et documents : Scaleway, France.",
          "Paiements : Stripe — nous ne voyons jamais vos données de carte.",
        ],
      },
      {
        h: "4. Disponibilité",
        p: [
          "La maintenance est planifiée autant que possible en dehors des heures d'ouverture. En cas d'interruption, un message s'affiche sur le site.",
          "Les réservations et commandes sont conservées, même si un service est momentanément indisponible.",
        ],
      },
    ],
  },
  en: {
    eyebrow: "Status",
    title: "Status & infrastructure",
    lede: "Full transparency about our domains, the mail gateway and the European infrastructure behind this platform.",
    updated: "Last updated: September 2026",
    footnote:
      "Noticed an outage? Write to contact@maximilien.brussels and we will get back to you as soon as possible.",
    blocks: [
      {
        h: "1. Our domains",
        ul: [
          "maximilien.brussels — the public visitor site.",
          "maximilien.site — the team's management portal.",
          "maximilien.app — the mobile field app for staff on site.",
          "send.maximilien.site — outgoing email only; no website is hosted there.",
        ],
      },
      {
        h: "2. Isolated mail gateway",
        p: [
          "All email (confirmations, login codes, pickup notices and certificates) is sent from a separate subdomain: send.maximilien.site, keeping our main domains' reputation apart from mail traffic.",
          "Delivery runs through Brevo (Sendinblue SAS, France). Our emails contain no read receipts and no tracking pixels.",
        ],
      },
      {
        h: "3. Where the data lives",
        ul: [
          "Database: Neon, European region.",
          "Photos and documents: Scaleway, France.",
          "Payments: Stripe — we never see your card details.",
        ],
      },
      {
        h: "4. Availability",
        p: [
          "Maintenance is scheduled outside opening hours wherever possible. During an interruption a notice appears on the site itself.",
          "Bookings and orders are preserved even when a component is temporarily unreachable.",
        ],
      },
    ],
  },
};
