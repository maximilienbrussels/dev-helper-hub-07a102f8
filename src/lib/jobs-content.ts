/**
 * Jobs & stages. Vacatures worden hier bijgehouden; een lege lijst toont
 * automatisch de spontane sollicitatie.
 */

import type { Lang } from "@/lib/i18n";
import { LINKEDIN_URL } from "@/lib/transparency-content";

export type JobContract = "cdi" | "cdd" | "stage";

export type JobOffer = {
  id: string;
  contract: JobContract;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  regime: Record<Lang, string>;
  deadline?: string;
};

export const JOBS_LINKEDIN = LINKEDIN_URL;

export const JOBS_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    openTitle: string;
    empty: string;
    emptyHint: string;
    regime: string;
    deadline: string;
    contracts: Record<JobContract, string>;
    internshipsTitle: string;
    internshipsIntro: string;
    internshipFields: string[];
    internshipNote: string;
    workingHereTitle: string;
    workingHere: string[];
    formTitle: string;
    formIntro: string;
    linkedin: string;
  }
> = {
  nl: {
    eyebrow: "Werken bij ons",
    title: "Jobs & stages",
    lede: "Werken op een stadsboerderij: handen uit de mouwen, een klein team en een publiek van 0 tot 99 jaar.",
    openTitle: "Openstaande vacatures",
    empty: "Momenteel zijn er geen openstaande vacatures.",
    emptyHint:
      "Je kan altijd spontaan solliciteren — we bewaren je kandidatuur voor toekomstige aanwervingen.",
    regime: "Regime",
    deadline: "Kandidaturen tot",
    contracts: { cdi: "Onbepaalde duur", cdd: "Bepaalde duur", stage: "Stage" },
    internshipsTitle: "Studentenstages",
    internshipsIntro: "We nemen doorheen het jaar stagiairs aan in deze domeinen:",
    internshipFields: [
      "Dierenverzorging",
      "Moestuin en stadslandbouw",
      "Imkerij",
      "Administratie en HR",
      "Onderhoud en techniek",
      "Animatie en projectbeheer",
    ],
    internshipNote:
      "Een cv is verplicht, een motivatiebrief mag. Vermeld de periode en het aantal uren dat je school vraagt.",
    workingHereTitle: "Wat je bij ons vindt",
    workingHere: [
      "Een vzw met een sociale en ecologische opdracht in hartje Brussel.",
      "Een klein team waarin je verantwoordelijkheid krijgt vanaf dag één.",
      "Werk in openlucht, met de dieren, de moestuin en de buurt.",
      "Barema's van het paritair comité, met terugbetaling van het openbaar vervoer.",
    ],
    formTitle: "Spontaan solliciteren",
    formIntro:
      "Vertel ons waarvoor je je kandidaat stelt en wanneer je beschikbaar bent. Vergeet je cv niet te vermelden — we vragen het op na je bericht.",
    linkedin: "Volg onze vacatures op LinkedIn",
  },
  fr: {
    eyebrow: "Nous rejoindre",
    title: "Emploi et stages",
    lede: "Travailler dans une ferme urbaine : les mains dans la terre, une petite équipe et un public de 0 à 99 ans.",
    openTitle: "Offres ouvertes",
    empty: "Aucune offre d'emploi n'est ouverte pour le moment.",
    emptyHint:
      "Vous pouvez toujours envoyer une candidature spontanée — nous la conservons pour les recrutements à venir.",
    regime: "Régime",
    deadline: "Candidatures jusqu'au",
    contracts: { cdi: "CDI", cdd: "CDD", stage: "Stage" },
    internshipsTitle: "Stages étudiants",
    internshipsIntro: "Nous accueillons des stagiaires toute l'année dans ces domaines :",
    internshipFields: [
      "Soin animalier",
      "Maraîchage et agriculture urbaine",
      "Apiculture",
      "Gestion administrative et RH",
      "Entretien et technique",
      "Animation et gestion de projet",
    ],
    internshipNote:
      "Le CV est obligatoire, la lettre de motivation facultative. Précisez la période et le nombre d'heures demandées par votre école.",
    workingHereTitle: "Ce que vous trouverez chez nous",
    workingHere: [
      "Une ASBL à finalité sociale et écologique au cœur de Bruxelles.",
      "Une petite équipe où l'on vous confie des responsabilités dès le premier jour.",
      "Un travail en plein air, avec les animaux, le potager et le quartier.",
      "Les barèmes de la commission paritaire et le remboursement des transports en commun.",
    ],
    formTitle: "Candidature spontanée",
    formIntro:
      "Dites-nous pour quel type de poste vous postulez et vos disponibilités. Nous vous demanderons votre CV en réponse à votre message.",
    linkedin: "Suivez nos offres sur LinkedIn",
  },
  en: {
    eyebrow: "Join us",
    title: "Jobs and internships",
    lede: "Working on an urban farm: hands in the soil, a small team and an audience aged 0 to 99.",
    openTitle: "Open positions",
    empty: "There are no open positions at the moment.",
    emptyHint:
      "You can always send a spontaneous application — we keep it on file for future recruitment.",
    regime: "Schedule",
    deadline: "Applications until",
    contracts: { cdi: "Permanent", cdd: "Fixed term", stage: "Internship" },
    internshipsTitle: "Student internships",
    internshipsIntro: "We host interns all year round in these areas:",
    internshipFields: [
      "Animal care",
      "Market gardening and urban agriculture",
      "Beekeeping",
      "Administration and HR",
      "Maintenance and technical work",
      "Activities and project management",
    ],
    internshipNote:
      "A CV is required, a cover letter is optional. Mention the period and the number of hours your school requires.",
    workingHereTitle: "What you will find here",
    workingHere: [
      "A non-profit with a social and ecological mission in the heart of Brussels.",
      "A small team that trusts you with responsibility from day one.",
      "Outdoor work, with the animals, the garden and the neighbourhood.",
      "Sector pay scales and reimbursement of public transport.",
    ],
    formTitle: "Spontaneous application",
    formIntro:
      "Tell us what kind of role you are applying for and when you are available. We will ask for your CV in reply to your message.",
    linkedin: "Follow our vacancies on LinkedIn",
  },
};

export const JOB_OFFERS: JobOffer[] = [];
