import type { Lang } from "@/lib/i18n";

/**
 * Maxim-contextengine: bepaalt op basis van de conversatie welke interactieve
 * inline kaart onder een antwoord van Max hoort.
 */
export type MaximCard =
  | { kind: "hours" }
  | { kind: "compost" }
  | { kind: "handoff" }
  | { kind: "link"; topic: "birthday" | "teambuilding" | "stages" | "peterschap" };

const PATTERNS: { card: MaximCard; re: RegExp }[] = [
  {
    card: { kind: "hours" },
    re: /(openingsuur|openingsuren|uren|ouvert|heures d'ouverture|horaire|opening hours|open|gesloten|ferm[ée]|closed|toegang|acc[èe]s|entrance|adres|adresse|address|gratis|gratuit|free)/i,
  },
  {
    card: { kind: "compost" },
    re: /(compost|composteren|gft|organisch afval|d[ée]chets organiques|food waste|worm)/i,
  },
  {
    card: { kind: "link", topic: "birthday" },
    re: /(verjaardag|feestje|anniversaire|birthday|kinderfeest|party)/i,
  },
  {
    card: { kind: "link", topic: "teambuilding" },
    re: /(teambuilding|team building|zaalverhuur|seminarie|s[ée]minaire|location de salle|venue|bedrijf|entreprise|company)/i,
  },
  {
    card: { kind: "link", topic: "stages" },
    re: /(stage|stages|vakantiestage|kamp|camp|holiday camp|educatie|school)/i,
  },
  {
    card: { kind: "link", topic: "peterschap" },
    re: /(peterschap|meter|parrainage|sponsor|adopt|donatie|don|donation|steun|soutien)/i,
  },
];

const HANDOFF_RE =
  /\b(medewerker|iemand spreken|mens|human|collaborateur|quelqu'un|staff member|contacteer|contacter|bel|bellen|t[ée]l[ée]phone|telefoon|klacht|plainte|complaint|offerte|devis|quote)\b/i;

/**
 * Vervoer- en routevragen krijgen NOOIT het contactformulier: daar hoort
 * reisadvies. Zonder deze uitzondering opende "below" of "bel ons" het
 * personeelsformulier bij een metro- of treinvraag.
 */
const TRANSIT_RE =
  /(metro|m[ée]tro|tram|bus|trein|train|station|gare|ijzer|yser|noord|nord|route|itin[ée]raire|richting|directions|halte|arr[êe]t|openbaar vervoer|transports? en commun|public transport|mivb|stib|nmbs|sncb|villo|fiets|v[ée]lo|bike)/i;

/** Kies maximaal één kaart voor het laatste antwoord van Max. */
export function detectMaximCard(userText: string, assistantText: string): MaximCard | null {
  const haystack = `${userText}\n${assistantText}`;
  if (TRANSIT_RE.test(haystack)) {
    for (const p of PATTERNS) if (p.re.test(haystack)) return p.card;
    return null;
  }
  if (HANDOFF_RE.test(haystack)) return { kind: "handoff" };
  for (const p of PATTERNS) if (p.re.test(haystack)) return p.card;
  return null;
}


export const LINK_TOPICS: Record<
  "birthday" | "teambuilding" | "stages" | "peterschap",
  { href: string; label: Record<Lang, string>; desc: Record<Lang, string> }
> = {
  birthday: {
    href: "/feestjes/verjaardag",
    label: {
      nl: "Bekijk verjaardagsformules",
      fr: "Voir les formules anniversaire",
      en: "See birthday packages",
    },
    desc: {
      nl: "Boerderijfeestjes voor kinderen, inclusief dierenbezoek.",
      fr: "Fêtes à la ferme pour enfants, visite des animaux incluse.",
      en: "Farm birthday parties for kids, animal visit included.",
    },
  },
  teambuilding: {
    href: "/bedrijven/teambuilding-seminaries",
    label: {
      nl: "Teambuilding & zaalverhuur",
      fr: "Team building & location de salle",
      en: "Team building & venue rental",
    },
    desc: {
      nl: "Vergaderen of samenwerken midden in de stadsboerderij.",
      fr: "Réunions et ateliers au cœur de la ferme urbaine.",
      en: "Meet and collaborate in the middle of the city farm.",
    },
  },
  stages: {
    href: "/educatie/stages",
    label: { nl: "Bekijk stageweken", fr: "Voir les stages", en: "See holiday camps" },
    desc: {
      nl: "Vakantiestages voor kinderen, per week te boeken.",
      fr: "Stages de vacances pour enfants, par semaine.",
      en: "Holiday camps for children, bookable per week.",
    },
  },
  peterschap: {
    href: "/steun/peterschap",
    label: { nl: "Word peter of meter", fr: "Devenir parrain/marraine", en: "Become a sponsor" },
    desc: {
      nl: "Steun een dier van de boerderij met een jaarlijkse bijdrage.",
      fr: "Soutenez un animal de la ferme avec une contribution annuelle.",
      en: "Support a farm animal with a yearly contribution.",
    },
  },
};

/* ------------------------------- Compost -------------------------------- */

export type CompostVerdict = "yes" | "no" | "careful" | "unknown";

const COMPOST_RULES: { verdict: Exclude<CompostVerdict, "unknown">; re: RegExp; key: string }[] = [
  {
    verdict: "no",
    key: "meat",
    re: /(vlees|vis|bot|been|viande|poisson|os|meat|fish|bone)/i,
  },
  {
    verdict: "no",
    key: "dairy",
    re: /(kaas|melk|zuivel|yoghurt|boter|fromage|lait|laitier|cheese|milk|dairy)/i,
  },
  {
    verdict: "no",
    key: "cooked",
    re: /(gekookt|saus|olie|vet|frituur|cuit|sauce|huile|graisse|cooked|oil|grease)/i,
  },
  {
    verdict: "no",
    key: "pet",
    re: /(kattenbak|hondenpoep|kattenpoep|liti[èe]re|excr[ée]ment|pet waste|cat litter|dog poo)/i,
  },
  {
    verdict: "no",
    key: "plastic",
    re: /(plastic|plastiek|zakje|blik|glas|metaal|sachet|verre|m[ée]tal|bag|glass|metal|nappy|luier)/i,
  },
  {
    verdict: "careful",
    key: "citrus",
    re: /(citroen|sinaasappel|citrus|limoen|agrume|orange|lemon|lime)/i,
  },
  {
    verdict: "careful",
    key: "bread",
    re: /(brood|pasta|rijst|pain|p[âa]tes|riz|bread|rice)/i,
  },
  {
    verdict: "yes",
    key: "veg",
    re: /(groente|fruit|schil|appel|banaan|wortel|sla|l[ée]gume|[ée]pluchure|pomme|banane|vegetable|peel|apple|salad)/i,
  },
  {
    verdict: "yes",
    key: "coffee",
    re: /(koffie|koffiedik|thee|theezakje|caf[ée]|marc|th[ée]|coffee|tea)/i,
  },
  { verdict: "yes", key: "egg", re: /(eierschaal|ei|coquille|œuf|oeuf|egg ?shell|egg)/i },
  {
    verdict: "yes",
    key: "garden",
    re: /(blad|bladeren|gras|snoeisel|tuinafval|feuille|gazon|jardin|leaves|grass|garden)/i,
  },
  {
    verdict: "yes",
    key: "paper",
    re: /(karton|papier|keukenrol|cardboard|paper|kitchen roll)/i,
  },
];

export function checkCompost(item: string): { verdict: CompostVerdict; key: string } {
  const q = item.trim();
  if (!q) return { verdict: "unknown", key: "empty" };
  for (const rule of COMPOST_RULES)
    if (rule.re.test(q)) return { verdict: rule.verdict, key: rule.key };
  return { verdict: "unknown", key: "other" };
}

export const COMPOST_COPY: Record<
  Lang,
  {
    title: string;
    placeholder: string;
    button: string;
    yes: string;
    no: string;
    careful: string;
    unknown: string;
    reasons: Record<string, string>;
    link: string;
  }
> = {
  nl: {
    title: "Compost-checker",
    placeholder: "bv. bananenschil, kaas, koffiedik…",
    button: "Checken",
    yes: "Ja, dit mag in de buurtcompost.",
    no: "Nee, dit hoort niet in de buurtcompost.",
    careful: "Mag, maar met mate.",
    unknown: "Dat weet ik niet zeker — vraag het aan een compostmeester ter plaatse.",
    reasons: {
      meat: "Vlees, vis en botten trekken ongedierte aan.",
      dairy: "Zuivel gaat rotten en veroorzaakt geurhinder.",
      cooked: "Bereide etensresten, olie en saus verstoren het proces.",
      pet: "Uitwerpselen van huisdieren kunnen ziektekiemen bevatten.",
      plastic: "Niet-composteerbaar materiaal hoort bij het restafval.",
      citrus: "Citrusschillen verzuren de hoop — beperkte hoeveelheden.",
      bread: "Brood en pasta trekken ratten aan — klein snijden en goed afdekken.",
      veg: "Groente- en fruitresten zijn ideaal groen materiaal.",
      coffee: "Koffiedik en theeblaadjes zijn uitstekend stikstofmateriaal.",
      egg: "Eierschalen fijnmaken voor een snellere afbraak.",
      garden: "Tuinafval brengt structuur in de hoop.",
      paper: "Onbedrukt karton is prima bruin materiaal.",
      other: "",
      empty: "",
    },
    link: "Lees alle compostregels",
  },
  fr: {
    title: "Vérificateur compost",
    placeholder: "ex. peau de banane, fromage, marc de café…",
    button: "Vérifier",
    yes: "Oui, c'est accepté au compost de quartier.",
    no: "Non, cela n'a pas sa place dans le compost de quartier.",
    careful: "Accepté, mais avec modération.",
    unknown: "Je n'en suis pas sûr — demandez à un maître-composteur sur place.",
    reasons: {
      meat: "La viande, le poisson et les os attirent les nuisibles.",
      dairy: "Les produits laitiers pourrissent et créent des odeurs.",
      cooked: "Restes cuits, huile et sauces perturbent le processus.",
      pet: "Les excréments d'animaux peuvent contenir des germes.",
      plastic: "Matériau non compostable : direction les déchets résiduels.",
      citrus: "Les agrumes acidifient le tas — en petites quantités.",
      bread: "Pain et pâtes attirent les rats — coupez fin et couvrez bien.",
      veg: "Épluchures de fruits et légumes : matière verte idéale.",
      coffee: "Marc de café et thé : excellent apport d'azote.",
      egg: "Écrasez les coquilles pour accélérer la dégradation.",
      garden: "Les déchets de jardin structurent le tas.",
      paper: "Le carton non imprimé est une bonne matière brune.",
      other: "",
      empty: "",
    },
    link: "Lire les règles du compost",
  },
  en: {
    title: "Compost checker",
    placeholder: "e.g. banana peel, cheese, coffee grounds…",
    button: "Check",
    yes: "Yes, this belongs in the neighbourhood compost.",
    no: "No, this does not belong in the neighbourhood compost.",
    careful: "Allowed, but in moderation.",
    unknown: "I'm not sure — ask a compost steward on site.",
    reasons: {
      meat: "Meat, fish and bones attract pests.",
      dairy: "Dairy rots and causes bad smells.",
      cooked: "Cooked leftovers, oil and sauce disturb the process.",
      pet: "Pet waste can carry pathogens.",
      plastic: "Non-compostable material belongs in residual waste.",
      citrus: "Citrus peel acidifies the heap — small amounts only.",
      bread: "Bread and pasta attract rats — cut small and cover well.",
      veg: "Fruit and vegetable scraps are ideal green material.",
      coffee: "Coffee grounds and tea are excellent nitrogen sources.",
      egg: "Crush eggshells so they break down faster.",
      garden: "Garden waste adds structure to the heap.",
      paper: "Unprinted cardboard is good brown material.",
      other: "",
      empty: "",
    },
    link: "Read all compost rules",
  },
};

/* ------------------------------- Openingsuren ---------------------------- */

export const HOURS_COPY: Record<
  Lang,
  {
    title: string;
    summer: string;
    winter: string;
    access: string;
    address: string;
    call: string;
    mail: string;
  }
> = {
  nl: {
    title: "Openingsuren & toegang",
    summer: "Zomer (1 apr – 31 okt): di–za 09:30–17:00",
    winter: "Winter (1 nov – 31 mrt): di–vr 10:00–16:30",
    access: "Vrije toegang is altijd gratis.",
    address: "Schipperijkaai 2, 1000 Brussel",
    call: "Bel +32 2 331 53 91",
    mail: "Mail ons",
  },
  fr: {
    title: "Heures d'ouverture & accès",
    summer: "Été (1 avr – 31 oct) : mar–sam 09:30–17:00",
    winter: "Hiver (1 nov – 31 mars) : mar–ven 10:00–16:30",
    access: "L'entrée libre est toujours gratuite.",
    address: "Quai du Batelage 2, 1000 Bruxelles",
    call: "Appeler +32 2 331 53 91",
    mail: "Nous écrire",
  },
  en: {
    title: "Opening hours & access",
    summer: "Summer (1 Apr – 31 Oct): Tue–Sat 09:30–17:00",
    winter: "Winter (1 Nov – 31 Mar): Tue–Fri 10:00–16:30",
    access: "Free entry during opening hours.",
    address: "Schipperijkaai 2, 1000 Brussels",
    call: "Call +32 2 331 53 91",
    mail: "Email us",
  },
};

/* --------------------------------- Handoff -------------------------------- */

export const HANDOFF_COPY: Record<
  Lang,
  {
    title: string;
    intro: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    submit: string;
    sending: string;
    done: string;
    failed: string;
    call: string;
  }
> = {
  nl: {
    title: "Een medewerker contacteren",
    intro: "Laat je gegevens achter, we antwoorden binnen twee werkdagen.",
    name: "Naam",
    email: "E-mail",
    phone: "Telefoon (optioneel)",
    message: "Je vraag",
    submit: "Doorgeven aan het team",
    sending: "Versturen…",
    done: "Bedankt! Je vraag is doorgegeven aan het team.",
    failed: "Versturen mislukt. Bel ons gerust op +32 2 331 53 91.",
    call: "Liever direct bellen?",
  },
  fr: {
    title: "Contacter un collaborateur",
    intro: "Laissez vos coordonnées, nous répondons sous deux jours ouvrables.",
    name: "Nom",
    email: "E-mail",
    phone: "Téléphone (facultatif)",
    message: "Votre question",
    submit: "Transmettre à l'équipe",
    sending: "Envoi…",
    done: "Merci ! Votre question a été transmise à l'équipe.",
    failed: "Échec de l'envoi. Appelez-nous au +32 2 331 53 91.",
    call: "Vous préférez appeler ?",
  },
  en: {
    title: "Talk to a staff member",
    intro: "Leave your details and we'll reply within two working days.",
    name: "Name",
    email: "Email",
    phone: "Phone (optional)",
    message: "Your question",
    submit: "Send to the team",
    sending: "Sending…",
    done: "Thanks! Your question has been passed to the team.",
    failed: "Sending failed. Feel free to call +32 2 331 53 91.",
    call: "Prefer to call?",
  },
};
