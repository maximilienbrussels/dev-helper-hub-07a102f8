import type { Lang } from "./i18n";

/** Waarborg in cash bij aankomst. */
export const BIRTHDAY_DEPOSIT = 50;
/** Toeslag per extra kind boven de 15 (tot max. 18). */
export const EXTRA_CHILD_PRICE = 10;
export const INCLUDED_CHILDREN = 15;
export const MAX_CHILDREN = 18;

export type BirthdayPackage = {
  slug: string;
  price: number;
  /** Tijdsloten waaruit ouders kunnen kiezen. */
  slots: string[];
  /** Alleen deze weekdag is mogelijk (0 = zondag). */
  weekday: number;
  maxChildren: number | null;
  maxAdults: number | null;
  maxGuests: number | null;
  allowsExtraChildren: boolean;
  copy: Record<
    Lang,
    {
      title: string;
      day: string;
      lede: string;
      capacity: string;
      included: string[];
      schedule: { time: string; what: string }[];
    }
  >;
};

export const BIRTHDAY_PACKAGES: BirthdayPackage[] = [
  {
    slug: "woensdag",
    price: 180,
    slots: ["13:30"],
    weekday: 3,
    maxChildren: 18,
    maxAdults: 5,
    maxGuests: null,
    allowsExtraChildren: true,
    copy: {
      nl: {
        title: "Kinderfeest woensdag",
        day: "Woensdag · halve dag",
        lede: "Feest in het chalet met eigen binnenkoer, van 13.30 tot 16.30 uur.",
        capacity: "15 tot 18 kinderen · max. 5 volwassenen",
        included: [
          "Huur van het chalet met tafels, brouwerijbanken en binnenkoer",
          "Uitgeruste keuken in het onthaalgebouw (frigo, fornuis, oven, microgolf)",
          "Servies voor kinderen in voldoende aantal",
          "Sanitair en vestiaire",
          "45 minuten begeleide rondleiding met een animator",
        ],
        schedule: [
          { time: "13.30", what: "Aankomst van de organisatoren en de gasten" },
          {
            time: "13.45",
            what: "Start van de rondleiding voor de kinderen (45 min) — ouders maken het chalet klaar",
          },
          { time: "14.30", what: "Vieruurtje, cadeautjes openen, vrij spel" },
          { time: "16.00", what: "Vertrek van de gasten" },
          { time: "16.15", what: "Opruimen en vertrek van de organiserende familie" },
        ],
      },
      fr: {
        title: "Anniversaire enfants · mercredi",
        day: "Mercredi · demi-journée",
        lede: "Fête dans le chalet et sa cour, de 13h30 à 16h30.",
        capacity: "15 à 18 enfants · max. 5 adultes",
        included: [
          "Location du chalet avec tables, bancs brasseur et cour",
          "Cuisine équipée dans le bâtiment d'accueil (frigo, cuisinière, four, micro-ondes)",
          "Vaisselle pour enfants en quantité suffisante",
          "Commodités (toilettes, lavabos, vestiaire)",
          "Visite guidée de 45 minutes avec un·e animateur·rice",
        ],
        schedule: [
          { time: "13h30", what: "Arrivée des organisateur·rices et des invités" },
          {
            time: "13h45",
            what: "Début de la visite guidée pour les enfants (45 min) — préparation du chalet",
          },
          { time: "14h30", what: "Goûter, ouverture des cadeaux, jeux libres" },
          { time: "16h00", what: "Départ des invités" },
          { time: "16h15", what: "Nettoyage, rangement & départ de la famille" },
        ],
      },
      en: {
        title: "Children's party · Wednesday",
        day: "Wednesday · half day",
        lede: "Party in the chalet with its own courtyard, from 1.30 to 4.30 pm.",
        capacity: "15 to 18 children · max. 5 adults",
        included: [
          "Hire of the chalet with tables, brewery benches and courtyard",
          "Equipped kitchen in the welcome building (fridge, cooker, oven, microwave)",
          "Children's crockery in sufficient quantity",
          "Toilets and cloakroom",
          "45-minute guided farm tour with a facilitator",
        ],
        schedule: [
          { time: "1.30 pm", what: "Organisers and guests arrive" },
          {
            time: "1.45 pm",
            what: "Guided tour for the children starts (45 min) — parents set up the chalet",
          },
          { time: "2.30 pm", what: "Snack, opening presents, free play" },
          { time: "4.00 pm", what: "Guests leave" },
          { time: "4.15 pm", what: "Tidying up and departure of the hosting family" },
        ],
      },
    },
  },
  {
    slug: "zaterdag-halve-dag",
    price: 180,
    slots: ["10:00", "13:30"],
    weekday: 6,
    maxChildren: 18,
    maxAdults: 5,
    maxGuests: null,
    allowsExtraChildren: true,
    copy: {
      nl: {
        title: "Kinderfeest zaterdag",
        day: "Zaterdag · halve dag",
        lede: "Feest in de polyvalente zaal met binnenkoer — voormiddag (10.00–13.00) of namiddag (13.30–16.30).",
        capacity: "15 tot 18 kinderen · max. 5 volwassenen",
        included: [
          "Huur van de polyvalente zaal met tafels, stoelen, speelhoek en kinderboeken",
          "Uitgeruste keuken: frigo, fornuis, oven, microgolf en servies",
          "Sanitair en vestiaire",
          "45 minuten begeleide rondleiding met een animator",
        ],
        schedule: [
          { time: "10.00", what: "Aankomst van de organisatoren en de gasten" },
          {
            time: "10.15",
            what: "Start van de rondleiding voor de kinderen (45 min) — ouders maken de zaal klaar",
          },
          { time: "11.00", what: "Vieruurtje, cadeautjes openen, vrij spel" },
          { time: "12.30", what: "Vertrek van de gasten" },
          { time: "12.45", what: "Opruimen en vertrek van de organiserende familie" },
        ],
      },
      fr: {
        title: "Anniversaire enfants · samedi",
        day: "Samedi · demi-journée",
        lede: "Fête dans la salle polyvalente et sa cour — matinée (10h–13h) ou après-midi (13h30–16h30).",
        capacity: "15 à 18 enfants · max. 5 adultes",
        included: [
          "Location de la salle polyvalente : tables, chaises, coin jeux et bibliothèque enfants",
          "Cuisine équipée : frigo, cuisinière, four, micro-ondes et vaisselle",
          "Commodités (toilettes, lavabos, vestiaire)",
          "Visite guidée de 45 minutes avec un·e animateur·rice",
        ],
        schedule: [
          { time: "10h00", what: "Arrivée des organisateur·rices et des invités" },
          { time: "10h15", what: "Début de la visite guidée (45 min) — préparation de la salle" },
          { time: "11h00", what: "Goûter, ouverture des cadeaux, jeux libres" },
          { time: "12h30", what: "Départ des invités" },
          { time: "12h45", what: "Nettoyage, rangement & départ de la famille" },
        ],
      },
      en: {
        title: "Children's party · Saturday",
        day: "Saturday · half day",
        lede: "Party in the multi-purpose hall with courtyard — morning (10 am–1 pm) or afternoon (1.30–4.30 pm).",
        capacity: "15 to 18 children · max. 5 adults",
        included: [
          "Hire of the multi-purpose hall: tables, chairs, play corner and children's books",
          "Equipped kitchen: fridge, cooker, oven, microwave and crockery",
          "Toilets and cloakroom",
          "45-minute guided farm tour with a facilitator",
        ],
        schedule: [
          { time: "10.00 am", what: "Organisers and guests arrive" },
          { time: "10.15 am", what: "Guided tour starts (45 min) — parents set up the hall" },
          { time: "11.00 am", what: "Snack, opening presents, free play" },
          { time: "12.30 pm", what: "Guests leave" },
          { time: "12.45 pm", what: "Tidying up and departure of the hosting family" },
        ],
      },
    },
  },
  {
    slug: "familiefeest",
    price: 360,
    slots: ["10:00"],
    weekday: 6,
    maxChildren: null,
    maxAdults: null,
    maxGuests: 40,
    allowsExtraChildren: false,
    copy: {
      nl: {
        title: "Familiefeest zaterdag",
        day: "Zaterdag · hele dag",
        lede: "De polyvalente zaal en haar koer exclusief voor jullie familie, van 10.00 tot 16.30 uur.",
        capacity: "Maximaal 40 deelnemers",
        included: [
          "Exclusief gebruik van de grote zaal: tafels, stoelen, speelhoek en kinderboeken",
          "Uitgeruste keuken: frigo, fornuis, oven, microgolf en servies in voldoende aantal",
          "Sanitair en vestiaire",
          "1 uur begeleide rondleiding (of twee bezoeken van 45 min voor max. 18 deelnemers elk)",
        ],
        schedule: [
          { time: "10.00", what: "Aankomst van de organiserende familie — zaal klaarmaken" },
          { time: "11.00", what: "Aankomst van de gasten" },
          { time: "In overleg", what: "Begeleide rondleiding van 45 min met een animator" },
          { time: "16.00", what: "Vertrek van de gasten" },
          { time: "16.30", what: "Zaal opgeruimd en schoon achtergelaten" },
        ],
      },
      fr: {
        title: "Fête d'anniversaire famille · samedi",
        day: "Samedi · journée",
        lede: "La salle polyvalente et sa cour rien que pour votre famille, de 10h00 à 16h30.",
        capacity: "40 participant·es maximum",
        included: [
          "Usage exclusif de la grande salle : tables, chaises, coin jeux et bibliothèque",
          "Cuisine équipée : frigo, cuisinière, four, micro-ondes et vaisselle en quantité suffisante",
          "Commodités (toilettes, lavabos, vestiaire)",
          "Visite guidée d'une heure (ou deux visites de 45 min, 18 participant·es max. chacune)",
        ],
        schedule: [
          { time: "10h00", what: "Arrivée de la famille organisatrice — préparation de la salle" },
          { time: "11h00", what: "Arrivée des invités" },
          { time: "À convenir", what: "Visite guidée de 45 min avec un·e animateur·rice" },
          { time: "16h00", what: "Départ des invités" },
          { time: "16h30", what: "Salle rangée et nettoyée" },
        ],
      },
      en: {
        title: "Family birthday · Saturday",
        day: "Saturday · full day",
        lede: "The multi-purpose hall and its courtyard exclusively for your family, from 10 am to 4.30 pm.",
        capacity: "Up to 40 participants",
        included: [
          "Exclusive use of the large hall: tables, chairs, play corner and children's books",
          "Equipped kitchen: fridge, cooker, oven, microwave and plenty of crockery",
          "Toilets and cloakroom",
          "One hour of guided tour (or two 45-min tours of max. 18 participants each)",
        ],
        schedule: [
          { time: "10.00 am", what: "Hosting family arrives — setting up the hall" },
          { time: "11.00 am", what: "Guests arrive" },
          { time: "To agree", what: "45-minute guided farm tour with a facilitator" },
          { time: "4.00 pm", what: "Guests leave" },
          { time: "4.30 pm", what: "Hall tidied and cleaned" },
        ],
      },
    },
  },
];

export type HouseRule = {
  id: "deposit" | "eco" | "catering" | "access" | "language" | "cancel";
  copy: Record<Lang, { title: string; body: string[] }>;
};

export const BIRTHDAY_HOUSE_RULES: HouseRule[] = [
  {
    id: "deposit",
    copy: {
      nl: {
        title: `€ ${BIRTHDAY_DEPOSIT} waarborg in cash`,
        body: [
          `Bij aankomst geef je € ${BIRTHDAY_DEPOSIT} cash als waarborg af, bovenop de huurprijs.`,
          "Je krijgt de waarborg volledig terug als de ruimte proper is (geveegd en gedweild), het afval gesorteerd is en je op het afgesproken uur vertrekt.",
        ],
      },
      fr: {
        title: `Caution de € ${BIRTHDAY_DEPOSIT} en cash`,
        body: [
          `À votre arrivée, une caution de € ${BIRTHDAY_DEPOSIT} en cash est demandée, en plus du prix de location.`,
          "Elle vous est restituée intégralement si les lieux sont rendus propres (balayés et lavés), les poubelles triées et l'horaire respecté.",
        ],
      },
      en: {
        title: `€ ${BIRTHDAY_DEPOSIT} cash deposit`,
        body: [
          `On arrival a € ${BIRTHDAY_DEPOSIT} cash deposit is required, on top of the rental price.`,
          "It is returned in full if the space is left clean (swept and mopped), the waste sorted and you leave at the agreed time.",
        ],
      },
    },
  },
  {
    id: "eco",
    copy: {
      nl: {
        title: "Ecologische regels — geen wegwerpdecoratie",
        body: [
          "Geen plastic wegwerpborden of -bekers.",
          "Geen ballonnen, piñatas of confetti.",
          "We beperken de impact van onze activiteiten op het milieu en op de dieren; breng dus geen voorwerpen voor eenmalig gebruik mee.",
        ],
      },
      fr: {
        title: "Règles écologiques — pas de décoration jetable",
        body: [
          "Pas d'assiettes ni de gobelets en plastique jetables.",
          "Pas de ballons, de piñatas ni de confettis.",
          "Nous limitons l'impact de nos activités sur l'environnement et les animaux : évitez tout objet à usage unique.",
        ],
      },
      en: {
        title: "Eco rules — no single-use decoration",
        body: [
          "No disposable plastic plates or cups.",
          "No balloons, piñatas or confetti.",
          "We limit the impact of our activities on the environment and the animals, so please leave single-use items at home.",
        ],
      },
    },
  },
  {
    id: "catering",
    copy: {
      nl: {
        title: "Eten en drinken breng je zelf mee",
        body: [
          "De boerderij voorziet geen eten of drank.",
          "Taart, vieruurtje of picknick breng je zelf mee — de uitgeruste keuken staat ter beschikking.",
        ],
      },
      fr: {
        title: "Nourriture et boissons à apporter",
        body: [
          "La ferme ne fournit ni nourriture ni boissons.",
          "Gâteau, goûter ou pique-nique sont à apporter — la cuisine équipée est à votre disposition.",
        ],
      },
      en: {
        title: "Bring your own food and drinks",
        body: [
          "The farm provides neither food nor drinks.",
          "Cake, snacks or a picnic are up to you — the equipped kitchen is available.",
        ],
      },
    },
  },
  {
    id: "access",
    copy: {
      nl: {
        title: "Ingang per seizoen",
        body: [
          "Organisatoren (de familie): altijd via de kleine ingang, Willebroekkaai 21.",
          "Gasten in de zomer (01/04 – 31/10): hoofdingang, Batelagekaai 2.",
          "Gasten in de winter (01/11 – 31/03): kleine ingang, Willebroekkaai 21.",
        ],
      },
      fr: {
        title: "Accès selon la saison",
        body: [
          "Organisateur·rices (la famille) : toujours par la petite entrée, 21 Quai de Willebroeck.",
          "Invités en été (01/04 – 31/10) : entrée principale, 2 Quai du Batelage.",
          "Invités en hiver (01/11 – 31/03) : petite entrée, 21 Quai de Willebroeck.",
        ],
      },
      en: {
        title: "Entrance by season",
        body: [
          "Organisers (the family): always via the small entrance, Quai de Willebroeck 21.",
          "Guests in summer (01/04 – 31/10): main entrance, Quai du Batelage 2.",
          "Guests in winter (01/11 – 31/03): small entrance, Quai de Willebroeck 21.",
        ],
      },
    },
  },
  {
    id: "language",
    copy: {
      nl: {
        title: "Taal van de rondleiding",
        body: ["De begeleide rondleidingen worden momenteel enkel in het Frans aangeboden."],
      },
      fr: {
        title: "Langue de la visite",
        body: ["Les visites guidées sont pour le moment proposées uniquement en français."],
      },
      en: {
        title: "Language of the tour",
        body: ["Guided tours are currently offered in French only."],
      },
    },
  },
  {
    id: "cancel",
    copy: {
      nl: {
        title: "Annuleringsvoorwaarden",
        body: [
          `Bij elke annulering houden we € ${BIRTHDAY_DEPOSIT} administratiekosten in.`,
          "Annuleer je meer dan 3 weken voor het feest, dan betalen we € 130 terug.",
          "Binnen de 3 weken voor het feest is geen terugbetaling meer mogelijk.",
          "Verwittig ons zo snel mogelijk bij wijziging, verhindering of meer dan 30 minuten vertraging.",
        ],
      },
      fr: {
        title: "Conditions d'annulation",
        body: [
          `Pour toute annulation, € ${BIRTHDAY_DEPOSIT} de frais administratifs sont retenus.`,
          "En cas d'annulation plus de 3 semaines avant l'événement, € 130 sont remboursés.",
          "Dans les 3 semaines précédant l'événement, aucun remboursement n'est possible.",
          "Prévenez-nous au plus vite en cas de modification, d'empêchement ou de retard de plus de 30 minutes.",
        ],
      },
      en: {
        title: "Cancellation terms",
        body: [
          `For any cancellation, € ${BIRTHDAY_DEPOSIT} in administrative costs is withheld.`,
          "Cancel more than 3 weeks before the party and € 130 is refunded.",
          "Within 3 weeks of the party no refund is possible.",
          "Let us know as soon as possible about changes, cancellations or delays of more than 30 minutes.",
        ],
      },
    },
  },
];

/** Totaalprijs inclusief toeslag vanaf het 16e kind. */
export function birthdayTotal(pkg: BirthdayPackage, children: number): number {
  if (!pkg.allowsExtraChildren) return pkg.price;
  const capped = Math.min(Math.max(children, 0), MAX_CHILDREN);
  const extra = Math.max(capped - INCLUDED_CHILDREN, 0);
  return pkg.price + extra * EXTRA_CHILD_PRICE;
}
