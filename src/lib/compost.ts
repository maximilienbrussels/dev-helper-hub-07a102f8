/**
 * Buurtcompost — organisch afval afgeven op de boerderij.
 */

import type { Lang } from "@/lib/i18n";

export const COMPOST_SLOTS: { day: Record<Lang, string>; time: string }[] = [
  { day: { nl: "Woensdag", fr: "Mercredi", en: "Wednesday" }, time: "14:00 – 17:00" },
  { day: { nl: "Zaterdag", fr: "Samedi", en: "Saturday" }, time: "10:00 – 16:00" },
];

export const COMPOST_YES: Record<Lang, string[]> = {
  nl: [
    "Schillen en resten van fruit en groenten",
    "Koffiegruis en koffiefilters, theeblaadjes",
    "Eierschalen (fijngebroken)",
    "Verwelkte bloemen, kamerplanten zonder pot",
    "Noten- en pitschalen",
    "Onbedrukt karton in kleine stukken",
  ],
  fr: [
    "Épluchures et restes de fruits et légumes",
    "Marc et filtres à café, feuilles de thé",
    "Coquilles d'œufs (concassées)",
    "Fleurs fanées, plantes d'intérieur sans pot",
    "Coques de noix et noyaux",
    "Carton non imprimé en petits morceaux",
  ],
  en: [
    "Fruit and vegetable peelings and leftovers",
    "Coffee grounds and filters, tea leaves",
    "Egg shells (crushed)",
    "Wilted flowers, houseplants without the pot",
    "Nut shells and stones",
    "Unprinted cardboard in small pieces",
  ],
};

export const COMPOST_NO: Record<Lang, string[]> = {
  nl: [
    "Vlees, vis, bot en zuivel",
    "Bereide maaltijden, saus, olie en vet",
    "Kattenbakvulling en dierlijke uitwerpselen",
    "Stofzuigerzakken, sigarettenpeuken, luiers",
    "Plastic zakjes, ook 'composteerbare'",
    "Behandeld of geverfd hout",
  ],
  fr: [
    "Viande, poisson, os et produits laitiers",
    "Plats préparés, sauces, huile et graisse",
    "Litière pour chats et excréments d'animaux",
    "Sacs d'aspirateur, mégots, couches",
    "Sachets en plastique, même « compostables »",
    "Bois traité ou peint",
  ],
  en: [
    "Meat, fish, bones and dairy",
    "Cooked meals, sauces, oil and fat",
    "Cat litter and animal droppings",
    "Vacuum bags, cigarette butts, nappies",
    "Plastic bags, including 'compostable' ones",
    "Treated or painted wood",
  ],
};

export const COMPOST_HOW: Record<Lang, string[]> = {
  nl: [
    "Kom langs tijdens een afgiftemoment; een compostmeester helpt je op weg.",
    "Breng je afval in een emmer of doos mee — geen plastic zakken.",
    "Snijd grote stukken op zodat de hoop sneller werkt.",
    "Je hebt geen abonnement nodig en het is gratis voor buurtbewoners.",
    "Wie wil, mag in het voorjaar rijpe compost meenemen voor de eigen tuin of balkon.",
  ],
  fr: [
    "Passez pendant un moment de dépôt ; un maître-composteur vous accompagne.",
    "Apportez vos déchets dans un seau ou une caisse — pas de sacs plastique.",
    "Coupez les gros morceaux pour accélérer le compostage.",
    "Aucun abonnement nécessaire et c'est gratuit pour les habitants du quartier.",
    "Au printemps, vous pouvez repartir avec du compost mûr pour votre jardin ou balcon.",
  ],
  en: [
    "Drop by during an opening slot; a compost master will show you the ropes.",
    "Bring your waste in a bucket or box — no plastic bags.",
    "Cut large pieces so the heap works faster.",
    "No subscription needed and it is free for people in the neighbourhood.",
    "In spring you can take home mature compost for your garden or balcony.",
  ],
};

export const COMPOST_COPY: Record<
  Lang,
  { eyebrow: string; title: string; lede: string; yes: string; no: string; how: string; when: string }
> = {
  nl: {
    eyebrow: "Buurt · Gratis",
    title: "Buurtcompost op de boerderij",
    lede: "Breng je organisch keukenafval naar de boerderij. Samen met de buurt maken we er compost van voor de moestuinen — en de dieren eten mee van wat kan.",
    yes: "Dit mag in de compost",
    no: "Dit hoort er niet in",
    how: "Zo werkt het",
    when: "Afgiftemomenten",
  },
  fr: {
    eyebrow: "Quartier · Gratuit",
    title: "Compost de quartier à la ferme",
    lede: "Apportez vos déchets organiques de cuisine à la ferme. Avec le quartier, nous en faisons du compost pour les potagers — et les animaux profitent de ce qui leur convient.",
    yes: "Ce qui va au compost",
    no: "Ce qui n'y va pas",
    how: "Comment ça marche",
    when: "Moments de dépôt",
  },
  en: {
    eyebrow: "Neighbourhood · Free",
    title: "Neighbourhood compost at the farm",
    lede: "Bring your organic kitchen waste to the farm. Together with the neighbourhood we turn it into compost for the kitchen gardens — and the animals get their share of what suits them.",
    yes: "What goes in the compost",
    no: "What does not belong",
    how: "How it works",
    when: "Drop-off times",
  },
};
