/**
 * Transparantie: subsidies, studies, overheidsopdrachten en jaarverslag.
 * Cijfers overgenomen van lafermeduparcmaximilien.be/transparence (boekjaar 2025).
 */

import type { Lang } from "@/lib/i18n";

export const TRANSPARENCY_YEAR = 2025;

/** Zolang de PDF's niet gemigreerd zijn, verwijzen we naar de oude bron. */
export const OLD_SITE = "https://www.lafermeduparcmaximilien.be";

export const TRANSPARENCY_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    introTitle: string;
    intro: string[];
    subsidiesTitle: string;
    subsidiesIntro: string;
    studiesTitle: string;
    studies: string;
    tendersTitle: string;
    tendersIntro: string;
    jobsTitle: string;
    jobsIntro: string;
    reportsTitle: string;
    transparencyReport: string;
    annualReport: string;
    project: string;
    funder: string;
    amount: string;
    download: string;
    formTitle: string;
    formIntro: string;
  }
> = {
  nl: {
    eyebrow: "Over ons",
    title: "Transparantie",
    lede: "Subsidies, overheidsopdrachten, verloning en jaarverslag van vzw Maximilien.",
    introTitle: "Inleiding",
    intro: [
      "Op deze pagina bundelen we alles rond de transparantie van de vzw:",
      "de rubrieken uit artikel 6 §1 van de decreten over de openbaarheid van bestuur, een inventaris van de subsidies, de studies en de overheidsopdrachten, informatie over aanwervingen, het transparantierapport en het jaarlijkse activiteitenverslag.",
    ],
    subsidiesTitle: "Subsidies",
    subsidiesIntro:
      "De subsidies die de boerderij in 2025 ontving, met de subsidiërende overheid en het bedrag:",
    studiesTitle: "Studies",
    studies: "In 2025 bestelde de boerderij geen enkele studie. Nihil — 2025.",
    tendersTitle: "Overheidsopdrachten",
    tendersIntro:
      "In 2025 publiceerde de boerderij zelf geen overheidsopdrachten. De opdrachten die we in 2025 wonnen:",
    jobsTitle: "Tewerkstelling",
    jobsIntro:
      "Alle informatie over aanwervingen en oproepen tot kandidaten verschijnt op onze vacaturepagina en op LinkedIn.",
    reportsTitle: "Rapporten",
    transparencyReport:
      "Het transparantierapport 2025 bevat de informatie uit artikel 7: verloning, aanwezigheden op vergaderingen, overheidsopdrachten en subsidies.",
    annualReport:
      "Het activiteitenverslag 2025: onze opdrachten, het team, de werkpolen, de projecten en de evenementen van het jaar.",
    project: "Project",
    funder: "Subsidiërende overheid",
    amount: "Bedrag 2025",
    download: "PDF downloaden",
    formTitle: "Een vraag over onze cijfers?",
    formIntro: "Stel je vraag over de subsidies, de rapporten of het bestuur van de vzw.",
  },
  fr: {
    eyebrow: "À propos",
    title: "Transparence",
    lede: "Subsides, marchés publics, rémunérations et rapport annuel de l'ASBL Maximilien.",
    introTitle: "Introduction",
    intro: [
      "Vous trouverez sur cette page le contenu relatif à la transparence de l'ASBL :",
      "les rubriques visées à l'article 6 §1er des décrets relatifs à la publicité de l'administration, un inventaire des subventions, des études et des marchés publics, les informations relatives au recrutement, le rapport transparence et le rapport annuel d'activité.",
    ],
    subsidiesTitle: "Subventions",
    subsidiesIntro:
      "Les subsides reçus par Maximilien en 2025, avec leur pouvoir subsidiant et le montant perçu :",
    studiesTitle: "Études",
    studies:
      "Aucune étude n'a été commandée par Maximilien en 2025. Néant — 2025.",
    tendersTitle: "Marchés publics",
    tendersIntro:
      "Aucun marché public n'a été publié par Maximilien en 2025. Les marchés remportés au cours de l'année 2025 sont les suivants :",
    jobsTitle: "Emploi",
    jobsIntro:
      "Toutes les informations relatives aux recrutements et aux appels à candidats sont publiées sur notre page emploi et sur LinkedIn.",
    reportsTitle: "Rapports",
    transparencyReport:
      "Le rapport transparence 2025 reprend les informations listées à l'article 7 : transparence des rémunérations, présences en réunion, marchés publics et subsides.",
    annualReport:
      "Le rapport annuel d'activité 2025 : nos missions, notre équipe, nos pôles, nos projets et nos événements de l'année.",
    project: "Projet",
    funder: "Pouvoir subsidiant",
    amount: "Montant 2025",
    download: "Télécharger le PDF",
    formTitle: "Une question sur nos chiffres ?",
    formIntro: "Posez votre question sur les subsides, les rapports ou la gouvernance de l'ASBL.",
  },
  en: {
    eyebrow: "About us",
    title: "Transparency",
    lede: "Subsidies, public contracts, pay and annual report of the non-profit Maximilien.",
    introTitle: "Introduction",
    intro: [
      "This page gathers everything about the transparency of the non-profit:",
      "the sections required by article 6 §1 of the decrees on open government, an inventory of subsidies, studies and public contracts, recruitment information, the transparency report and the annual activity report.",
    ],
    subsidiesTitle: "Subsidies",
    subsidiesIntro:
      "The subsidies received by the farm in 2025, with the granting authority and the amount:",
    studiesTitle: "Studies",
    studies: "No study was commissioned by the farm in 2025. None — 2025.",
    tendersTitle: "Public contracts",
    tendersIntro:
      "The farm published no public contracts in 2025. The contracts we were awarded in 2025 are:",
    jobsTitle: "Employment",
    jobsIntro:
      "All information on recruitment and calls for candidates is published on our jobs page and on LinkedIn.",
    reportsTitle: "Reports",
    transparencyReport:
      "The 2025 transparency report covers the information listed in article 7: pay transparency, meeting attendance, public contracts and subsidies.",
    annualReport:
      "The 2025 activity report: our missions, our team, our departments, our projects and the year's events.",
    project: "Project",
    funder: "Granting authority",
    amount: "Amount 2025",
    download: "Download PDF",
    formTitle: "A question about our figures?",
    formIntro: "Ask us about the subsidies, the reports or the governance of the non-profit.",
  },
};

export type MoneyRow = { project: string; funder: string; amount: string };

export const SUBSIDIES_2025: MoneyRow[] = [
  { project: "Jaarlijkse subsidie", funder: "Stad Brussel", amount: "256 751 €" },
  {
    project: "CQD Heliport En Vert",
    funder: "Brussels Hoofdstedelijk Gewest & Stad Brussel",
    amount: "48 023 €",
  },
  { project: "Serres de Sterrebeek", funder: "Stad Brussel", amount: "45 000 €" },
  {
    project: "Maxi P.A.N.I.E.R.",
    funder: "Brussels Hoofdstedelijk Gewest & Stad Brussel",
    amount: "7 500 €",
  },
  { project: "Animalien", funder: "Koning Boudewijnstichting", amount: "5 000 €" },
  { project: "Le Bon Moment 2025", funder: "Be Planet", amount: "5 015 €" },
  {
    project: "Potager Saint-Hubert",
    funder: "CFE Fondation Heroes for Good (via KBS)",
    amount: "3 500 €",
  },
  { project: "Maxi inclusion", funder: "Fondation Lippens", amount: "2 700 €" },
  { project: "Maxi inclusion", funder: "Koning Boudewijnstichting", amount: "2 210 €" },
  { project: "Maxi Insertion", funder: "Fortil (via vzw Arc-en-Ciel)", amount: "12 000 €" },
  { project: "Maxi communication", funder: "Fonds 4S", amount: "650 €" },
];

export const TENDERS_2025: MoneyRow[] = [
  { project: "MPLCB", funder: "Les Cuisines Bruxelloises", amount: "26 400 €" },
  { project: "VBXMAXPOT", funder: "Stad Brussel", amount: "34 164 €" },
  { project: "Maxi balades", funder: "Stad Brussel", amount: "5 700 €" },
];

export const TRANSPARENCY_REPORT_URL = `${OLD_SITE}/web/content/8196?download=true`;
export const ANNUAL_REPORT_URL = `${OLD_SITE}/web/content/8195?download=true`;
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/la-ferme-du-parc-maximilien-12903990/";
