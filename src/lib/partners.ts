export type PartnerCategory = "institutioneel" | "netwerk" | "digitaal";

export type Partner = {
  id: string;
  name: string;
  short: string;
  href: string;
  /** Brand colour shown on hover (logos are grayscale by default). */
  color: string;
  descKey: string;
  category: PartnerCategory;
  /** Optional plain-text description (used when no i18n key applies). */
  desc?: string;
};

export const PARTNERS: Partner[] = [
  {
    id: "brussels",
    name: "Ville de Bruxelles / Stad Brussel",
    short: "Bruxelles\nBrussel",
    href: "https://www.brussels.be",
    color: "#1a4d8f",
    descKey: "partners.brussels.desc",
    category: "institutioneel",
  },
  {
    id: "fedeau",
    name: "Fedeau",
    short: "fedeau",
    href: "https://www.fedeau.be",
    color: "#0f8fa8",
    descKey: "partners.fedeau.desc",
    category: "netwerk",
  },
  {
    id: "natagora",
    name: "Natagora — Réseau Nature",
    short: "natagora",
    href: "https://www.natagora.be",
    color: "#4b8b2b",
    descKey: "partners.natagora.desc",
    category: "netwerk",
  },
  {
    id: "fermedanimation",
    name: "Fédération Belge Francophone des Fermes d'Animation",
    short: "fermes\nd'animation",
    href: "https://www.fermedanimation.be",
    color: "#c9722a",
    descKey: "partners.ffa.desc",
    category: "netwerk",
  },
  {
    id: "leefmilieu",
    name: "Leefmilieu Brussel / Bruxelles Environnement",
    short: "leefmilieu\nbrussel",
    href: "https://environnement.brussels",
    color: "#2f7d5c",
    descKey: "partners.leefmilieu.desc",
    category: "institutioneel",
  },
  {
    id: "fao",
    name: "FAO — Organisation des Nations Unies pour l'alimentation et l'agriculture",
    short: "FAO",
    href: "https://www.fao.org/",
    color: "#5792c9",
    descKey: "partners.fao.desc",
    category: "institutioneel",
  },
  {
    id: "delplanche",
    name: "Delplanche",
    short: "Delplanche",
    href: "https://delplanche.cloud",
    color: "#1042a8",
    descKey: "",
    desc: "Architectuur, digitale infrastructuur en platformontwikkeling",
    category: "digitaal",
  },
];

export const PARTNER_CATEGORIES: {
  id: PartnerCategory;
  title: string;
  intro: string;
}[] = [
  {
    id: "institutioneel",
    title: "Institutionele steun & subsidies",
    intro: "Overheden die de stadsboerderij structureel mogelijk maken.",
  },
  {
    id: "netwerk",
    title: "Sectorfederaties & netwerken",
    intro: "Federaties en natuurnetwerken waarmee we kennis en praktijk delen.",
  },
  {
    id: "digitaal",
    title: "Digitale transformatie & innovatie",
    intro: "Partners achter onze site, infrastructuur en digitale werking.",
  },
];
