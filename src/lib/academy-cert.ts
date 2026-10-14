/**
 * Dynamische certificaatconfiguratie per academie/diersoort.
 *
 * Alles wat op het A4-certificaat per dier verschilt staat hier centraal:
 * de unieke code-prefix voor de verificatie-ID en de behaalde
 * module-competenties (NL/FR/EN). Nieuwe academies werken meteen mee: zonder
 * eigen configuratie valt alles terug op een generieke, correcte tekst.
 */

import { CANONICAL_SITE_URL } from "./site-url";

export type CertLang = "nl" | "fr" | "en";

export type CertModule = { titel: string; body: string };

/**
 * Publieke canonieke basis voor de QR-verificatie (ook geldig op papier).
 * Volgt het ingestelde canonieke domein, nooit het preview-adres van het
 * moment: een gedrukt certificaat moet jaren later nog verifieerbaar zijn.
 */
export const CERT_VERIFY_BASE = `${CANONICAL_SITE_URL}/verifieer`;

export function certVerifyUrl(token: string | null | undefined, fallbackId: string) {
  return `${CERT_VERIFY_BASE}?id=${encodeURIComponent(token || fallbackId)}`;
}

/**
 * Absolute verificatie-URL op basis van de leesbare certificaatcode.
 * Dit is wat de QR-code op het A4-certificaat bevat:
 * https://maximilien.brussels/verifieer/KNJ-2026-0001?s=<handtekening>
 *
 * De handtekening is een HMAC die enkel de server kan maken; zonder een
 * geldige handtekening toont de verificatiepagina wel de gegevens, maar niet
 * het certificaatbeeld zelf.
 */
export function certVerifyCodeUrl(code: string, sig?: string | null) {
  const base = `${CERT_VERIFY_BASE}/${encodeURIComponent(String(code).replace(/^#/, ""))}`;
  return sig ? `${base}?s=${encodeURIComponent(sig)}` : base;
}

/** Unieke code-prefix per academie: #KIP-2026-0001, #HND-2026-0001, ... */
const CODE_PREFIXES: Record<string, string> = {
  kip: "KIP",
  kippen: "KIP",
  stadshond: "HND",
  hond: "HND",
  konijn: "KNJ",
  geit: "GEI",
  ezel: "EZL",
  bij: "BIJ",
  bijen: "BIJ",
  varken: "VRK",
  minivarken: "VRK",
  schaap: "SCH",
  paard: "PRD",
  pony: "PON",
  eend: "END",
  kwartel: "KWR",
  gans: "GNS",
  kalkoen: "KLK",
  cavia: "CAV",
  rat: "RAT",
  "tamme-rat": "RAT",
  kat: "KAT",
  duif: "DUF",
  alpaca: "ALP",
  vis: "VIS",
  "aquarium-goudvis": "VIS",
  compost: "CMP",
  moestuin: "MOE",
};

export function academyCodePrefix(slug: string | undefined | null): string {
  const key = (slug ?? "").trim().toLowerCase();
  const prefix = CODE_PREFIXES[key];
  if (prefix) return prefix;
  const letters = key.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return letters.slice(0, 3) || "CER";
}

/** Generieke competenties — gelden voor élke diersoort zonder eigen lijst. */
const GENERIC: Record<CertLang, CertModule[]> = {
  nl: [
    {
      titel: "Dierenwelzijn, voeding & verzorging",
      body: "Basisbehoeften, dagelijkse voeding, drinkwater en gezondheidscontrole.",
    },
    {
      titel: "Gedrag & lichaamstaal",
      body: "Sociale structuur, stresssignalen en veilige benadering van de dieren.",
    },
    {
      titel: "Huisvesting & hygiënestandaarden",
      body: "Inrichting, strooisel, reiniging en preventie van ziektes.",
    },
  ],
  fr: [
    {
      titel: "Bien-être animal, alimentation & soins",
      body: "Besoins de base, alimentation quotidienne, eau et contrôle de santé.",
    },
    {
      titel: "Comportement & langage corporel",
      body: "Structure sociale, signaux de stress et approche sécurisée des animaux.",
    },
    {
      titel: "Hébergement & normes d'hygiène",
      body: "Aménagement, litière, nettoyage et prévention des maladies.",
    },
  ],
  en: [
    {
      titel: "Animal welfare, feeding & care",
      body: "Basic needs, daily feeding, drinking water and health checks.",
    },
    {
      titel: "Behaviour & body language",
      body: "Social structure, stress signals and safe handling of the animals.",
    },
    {
      titel: "Housing & hygiene standards",
      body: "Layout, bedding, cleaning and disease prevention.",
    },
  ],
};

type ModulesBySlug = Record<string, Partial<Record<CertLang, CertModule[]>>>;

/** Specifieke competenties per diersoort. */
const MODULES: ModulesBySlug = {
  kip: {
    nl: [
      { titel: "Voeding & legproces", body: "Legkorrel, grit, drinkwater en het ritme van het ei." },
      { titel: "Pikorde & gedrag", body: "Rangorde in de ren, stresssignalen en veilig oppakken." },
      { titel: "Hok, uitloop & hygiëne", body: "Zitstokken, legnesten, strooisel en preventie van bloedluis." },
    ],
    fr: [
      { titel: "Alimentation & ponte", body: "Granulés, grit, eau et rythme de la ponte." },
      { titel: "Hiérarchie & comportement", body: "Ordre social, signaux de stress et manipulation sûre." },
      { titel: "Poulailler, parcours & hygiène", body: "Perchoirs, pondoirs, litière et prévention du pou rouge." },
    ],
    en: [
      { titel: "Feeding & laying", body: "Layer pellets, grit, water and the rhythm of the egg." },
      { titel: "Pecking order & behaviour", body: "Social rank, stress signals and safe handling." },
      { titel: "Coop, run & hygiene", body: "Perches, nest boxes, bedding and red mite prevention." },
    ],
  },
  konijn: {
    nl: [
      { titel: "Voeding & knaagbehoefte", body: "Onbeperkt hooi, verse groenten en gezond gebit." },
      { titel: "Huisvesting & ren", body: "Ruimte om te hoppen, schuilplaats en veilige bodem." },
      { titel: "Gezondheidscheck", body: "Vacht, nagels, oren, eetlust en signalen van pijn." },
    ],
    fr: [
      { titel: "Alimentation & besoin de ronger", body: "Foin à volonté, légumes frais et dents saines." },
      { titel: "Hébergement & enclos", body: "Espace pour bondir, cachette et sol sécurisé." },
      { titel: "Contrôle de santé", body: "Pelage, griffes, oreilles, appétit et signes de douleur." },
    ],
    en: [
      { titel: "Feeding & gnawing needs", body: "Unlimited hay, fresh greens and healthy teeth." },
      { titel: "Housing & run", body: "Room to hop, a hideout and a safe floor." },
      { titel: "Health check", body: "Coat, nails, ears, appetite and signs of pain." },
    ],
  },
  stadshond: {
    nl: [
      { titel: "Hond in de stad", body: "Wandelen aan de leiband, verkeer, drukte en opruimen." },
      { titel: "Lichaamstaal & contact", body: "Kalmeringssignalen, veilig groeten en kinderen leren lezen." },
      { titel: "Verzorging & welzijn", body: "Beweging, rust, voeding en de wettelijke plichten van de baas." },
    ],
    fr: [
      { titel: "Le chien en ville", body: "Promenade en laisse, circulation, foule et ramassage." },
      { titel: "Langage corporel & contact", body: "Signaux d'apaisement, salutation sûre et lecture du chien." },
      { titel: "Soins & bien-être", body: "Exercice, repos, alimentation et devoirs du maître." },
    ],
    en: [
      { titel: "Dogs in the city", body: "Leash walking, traffic, crowds and cleaning up." },
      { titel: "Body language & contact", body: "Calming signals, safe greeting and reading the dog." },
      { titel: "Care & welfare", body: "Exercise, rest, food and the owner's legal duties." },
    ],
  },
  geit: {
    nl: [
      { titel: "Voeding & herkauwen", body: "Ruwvoer, mineralen en een gezonde pens." },
      { titel: "Kuddegedrag & klimmen", body: "Rangorde, nieuwsgierigheid en veilige verrijking." },
      { titel: "Stal, weide & klauwen", body: "Droge ligplaats, afrastering en klauwverzorging." },
    ],
    fr: [
      { titel: "Alimentation & rumination", body: "Fourrage, minéraux et bonne santé du rumen." },
      { titel: "Comportement du troupeau & escalade", body: "Hiérarchie, curiosité et enrichissement sécurisé." },
      { titel: "Étable, pâture & onglons", body: "Lieu de repos sec, clôtures et entretien des onglons." },
    ],
    en: [
      { titel: "Feeding & rumination", body: "Roughage, minerals and a healthy rumen." },
      { titel: "Herd behaviour & climbing", body: "Social rank, curiosity and safe enrichment." },
      { titel: "Stable, pasture & hooves", body: "Dry resting area, fencing and hoof care." },
    ],
  },
  ezel: {
    nl: [
      { titel: "Voeding & hoefverzorging", body: "Vezelrijk voer, geen overgewicht en regelmatig bekappen." },
      { titel: "Gedrag & vertrouwen", body: "Ezels bevriezen bij stress: rust, geduld en leiden." },
      { titel: "Huisvesting & weidebeheer", body: "Droge schuilstal, gezelschap en beperkt gras." },
    ],
    fr: [
      { titel: "Alimentation & soins des sabots", body: "Aliments riches en fibres, prévention du surpoids et parage régulier." },
      { titel: "Comportement & confiance", body: "Les ânes se figent sous le stress : calme, patience et conduite." },
      { titel: "Hébergement & gestion des pâtures", body: "Abri sec, compagnie et accès limité à l'herbe." },
    ],
    en: [
      { titel: "Feeding & hoof care", body: "Fibre-rich feed, preventing excess weight and regular hoof trimming." },
      { titel: "Behaviour & trust", body: "Donkeys freeze under stress: calm, patience and leading." },
      { titel: "Housing & pasture management", body: "Dry shelter, companionship and limited grass." },
    ],
  },
  bij: {
    nl: [
      { titel: "Het bijenvolk", body: "Koningin, werksters, darren en de jaarcyclus van de kast." },
      { titel: "Bestuiving & dracht", body: "Drachtplanten, nectar, stuifmeel en biodiversiteit in de stad." },
      { titel: "Veilig imkeren", body: "Kastinspectie, beschermkledij en zwermpreventie." },
    ],
    fr: [
      { titel: "La colonie d'abeilles", body: "Reine, ouvrières, faux-bourdons et cycle annuel de la ruche." },
      { titel: "Pollinisation & ressources florales", body: "Plantes mellifères, nectar, pollen et biodiversité en ville." },
      { titel: "Apiculture en sécurité", body: "Inspection de la ruche, vêtements de protection et prévention de l'essaimage." },
    ],
    en: [
      { titel: "The bee colony", body: "Queen, workers, drones and the hive's annual cycle." },
      { titel: "Pollination & forage", body: "Forage plants, nectar, pollen and urban biodiversity." },
      { titel: "Safe beekeeping", body: "Hive inspection, protective clothing and swarm prevention." },
    ],
  },
  minivarken: {
    nl: [
      { titel: "Voeding & wroeten", body: "Gebalanceerd rantsoen, geen keukenafval en wroetruimte." },
      { titel: "Intelligentie & gedrag", body: "Sociale groep, verrijking en signalen van verveling." },
      { titel: "Stal, modder & huid", body: "Modderbad tegen zonnebrand, droge ligplek en hygiëne." },
    ],
    fr: [
      { titel: "Alimentation & fouissage", body: "Ration équilibrée, pas de déchets de cuisine et espace pour fouir." },
      { titel: "Intelligence & comportement", body: "Groupe social, enrichissement et signes d'ennui." },
      { titel: "Abri, boue & peau", body: "Bain de boue contre les coups de soleil, lieu de repos sec et hygiène." },
    ],
    en: [
      { titel: "Feeding & rooting", body: "Balanced diet, no kitchen waste and space to root." },
      { titel: "Intelligence & behaviour", body: "Social group, enrichment and signs of boredom." },
      { titel: "Shelter, mud & skin", body: "Mud bath against sunburn, dry resting area and hygiene." },
    ],
  },
  schaap: {
    nl: [
      { titel: "Voeding & begrazing", body: "Gras, hooi, mineralen en rotatiebegrazing." },
      { titel: "Kuddegedrag", body: "Vluchtdier, veilig drijven en rustig benaderen." },
      { titel: "Scheren, klauwen & gezondheid", body: "Vachtverzorging, klauwbekapping en parasietencontrole." },
    ],
    fr: [
      { titel: "Alimentation & pâturage", body: "Herbe, foin, minéraux et pâturage tournant." },
      { titel: "Comportement du troupeau", body: "Animal de fuite, conduite sûre et approche calme." },
      { titel: "Tonte, onglons & santé", body: "Entretien de la laine, parage des onglons et contrôle des parasites." },
    ],
    en: [
      { titel: "Feeding & grazing", body: "Grass, hay, minerals and rotational grazing." },
      { titel: "Herd behaviour", body: "Prey animal, safe herding and calm approach." },
      { titel: "Shearing, hooves & health", body: "Coat care, hoof trimming and parasite checks." },
    ],
  },
  paard: {
    nl: [
      { titel: "Voeding & wateropname", body: "Ruwvoer eerst, vaste tijden en risico op koliek." },
      { titel: "Gedrag & veiligheid", body: "Blinde hoeken, naderen langs de schouder en leiden." },
      { titel: "Stal, weide & hoeven", body: "Bewegingsruimte, gezelschap en dagelijkse hoefzorg." },
    ],
    fr: [
      { titel: "Alimentation & hydratation", body: "Fourrage en priorité, horaires réguliers et risque de coliques." },
      { titel: "Comportement & sécurité", body: "Angles morts, approche par l'épaule et conduite." },
      { titel: "Écurie, pâture & sabots", body: "Espace pour bouger, compagnie et soins quotidiens des sabots." },
    ],
    en: [
      { titel: "Feeding & water intake", body: "Roughage first, regular feeding times and colic risk." },
      { titel: "Behaviour & safety", body: "Blind spots, approaching at the shoulder and leading." },
      { titel: "Stable, pasture & hooves", body: "Room to move, companionship and daily hoof care." },
    ],
  },
};

/**
 * Competenties voor een academie in de gevraagde taal.
 * Valt nooit terug op Nederlandstalige dierinhoud: ontbreekt een vertaling,
 * dan gebruiken we de professionele generieke tekst in de gekozen taal.
 */
export function academyModules(slug: string | undefined | null, lang: CertLang): CertModule[] {
  const key = (slug ?? "").trim().toLowerCase();
  const aliases: Record<string, string> = { kippen: "kip", hond: "stadshond", bijen: "bij", varken: "minivarken", pony: "paard" };
  const entry = MODULES[aliases[key] ?? key];
  return entry?.[lang] ?? GENERIC[lang];
}
