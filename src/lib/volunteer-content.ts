/**
 * Vrijwilligerswerk: overzichtspagina + twee vrijwilligersprofielen.
 */

import type { Lang } from "@/lib/i18n";

export type VolunteerProfileId = "gestion-projet" | "soin-animalier";

export type VolunteerProfile = {
  id: VolunteerProfileId;
  title: Record<Lang, string>;
  lede: Record<Lang, string>;
  commitment: Record<Lang, string>;
  tasks: Record<Lang, string[]>;
  looking: Record<Lang, string[]>;
  offer: Record<Lang, string[]>;
};

export const VOLUNTEER_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    introTitle: string;
    intro: string[];
    profilesTitle: string;
    profilesIntro: string;
    discover: string;
    practicalTitle: string;
    practical: string[];
    formTitle: string;
    formIntro: string;
    back: string;
    commitment: string;
    tasks: string;
    looking: string;
    offer: string;
    apply: string;
    applyIntro: string;
  }
> = {
  nl: {
    eyebrow: "Betrokkenheid",
    title: "Vrijwilliger worden",
    lede: "Geef een paar uur per week of per maand aan de boerderij — en krijg er een stuk stad, dieren en mensen voor terug.",
    introTitle: "Waarom vrijwilligers?",
    intro: [
      "De boerderij draait op een klein team en een grote groep vrijwilligers. Zonder hen geen verzorgde dieren, geen bloeiende moestuin en geen warme onthaal in het weekend.",
      "Je hoeft geen ervaring te hebben: we leren je alles ter plaatse. Wat telt is regelmaat, zin om bij te leren en respect voor de dieren en de mensen op de site.",
    ],
    profilesTitle: "Twee profielen",
    profilesIntro:
      "We zoeken momenteel vrijwilligers voor twee heel verschillende rollen. Kies degene die het best bij je past.",
    discover: "Ontdek dit profiel",
    practicalTitle: "Praktisch",
    practical: [
      "Minimumleeftijd: 18 jaar (16 jaar in begeleiding van een volwassene).",
      "Verzekering vrijwilligerswerk is voorzien door de vzw.",
      "Werktalen: Frans en Engels. Nederlands mag altijd — de begeleiding gebeurt in het Frans.",
      "We starten met een kennismakingsgesprek en een proefdag.",
    ],
    formTitle: "Ik wil vrijwilliger worden",
    formIntro:
      "Vertel ons kort wie je bent, wat je wil doen en wanneer je beschikbaar bent. We nemen contact op voor een kennismaking.",
    back: "Alle vrijwilligersprofielen",
    commitment: "Engagement",
    tasks: "Wat je doet",
    looking: "Wat we zoeken",
    offer: "Wat je krijgt",
    apply: "Stel je kandidaat",
    applyIntro: "Vermeld dit profiel in je bericht, dan komt het meteen bij de juiste persoon terecht.",
  },
  fr: {
    eyebrow: "S'impliquer",
    title: "Devenir bénévole",
    lede: "Offrez quelques heures par semaine ou par mois à la ferme — et repartez avec un bout de ville, des animaux et des rencontres.",
    introTitle: "Pourquoi des bénévoles ?",
    intro: [
      "La ferme fonctionne avec une petite équipe et un grand groupe de bénévoles. Sans eux, pas d'animaux soignés, pas de potager florissant, pas d'accueil chaleureux le week-end.",
      "Aucune expérience n'est nécessaire : tout s'apprend sur place. Ce qui compte, c'est la régularité, l'envie d'apprendre et le respect des animaux et des personnes présentes sur le site.",
    ],
    profilesTitle: "Deux profils",
    profilesIntro:
      "Nous recherchons actuellement des bénévoles pour deux rôles très différents. Choisissez celui qui vous correspond.",
    discover: "Découvrir ce profil",
    practicalTitle: "Pratique",
    practical: [
      "Âge minimum : 18 ans (16 ans accompagné·e d'un adulte).",
      "L'assurance bénévolat est prise en charge par l'ASBL.",
      "Langues de travail : français et anglais. Le néerlandais est bienvenu — l'encadrement se fait en français.",
      "Nous démarrons par un entretien de rencontre et une journée d'essai.",
    ],
    formTitle: "Je veux devenir bénévole",
    formIntro:
      "Dites-nous en quelques lignes qui vous êtes, ce que vous aimeriez faire et vos disponibilités. Nous vous recontactons pour faire connaissance.",
    back: "Tous les profils de bénévolat",
    commitment: "Engagement",
    tasks: "Ce que vous faites",
    looking: "Ce que nous cherchons",
    offer: "Ce que vous y gagnez",
    apply: "Poser sa candidature",
    applyIntro: "Mentionnez ce profil dans votre message : il arrivera directement à la bonne personne.",
  },
  en: {
    eyebrow: "Get involved",
    title: "Become a volunteer",
    lede: "Give the farm a few hours a week or a month — and get a piece of the city, the animals and the people in return.",
    introTitle: "Why volunteers?",
    intro: [
      "The farm runs on a small team and a large group of volunteers. Without them there would be no cared-for animals, no thriving garden and no warm welcome at the weekend.",
      "No experience needed: we teach you everything on site. What counts is showing up regularly, wanting to learn and respecting the animals and people around you.",
    ],
    profilesTitle: "Two profiles",
    profilesIntro:
      "We are currently looking for volunteers in two very different roles. Pick the one that suits you.",
    discover: "Discover this profile",
    practicalTitle: "Practical",
    practical: [
      "Minimum age: 18 (16 when accompanied by an adult).",
      "Volunteer insurance is covered by the non-profit.",
      "Working languages: French and English. Dutch is always welcome — supervision is in French.",
      "We start with an introductory chat and a trial day.",
    ],
    formTitle: "I want to volunteer",
    formIntro:
      "Tell us briefly who you are, what you would like to do and when you are available. We will get in touch to meet you.",
    back: "All volunteer profiles",
    commitment: "Commitment",
    tasks: "What you do",
    looking: "What we are looking for",
    offer: "What you get",
    apply: "Apply",
    applyIntro: "Mention this profile in your message so it reaches the right person straight away.",
  },
};

export const VOLUNTEER_PROFILES: VolunteerProfile[] = [
  {
    id: "gestion-projet",
    title: {
      nl: "Vrijwilliger projectbeheer & animatie",
      fr: "Bénévole gestion de projet et animation",
      en: "Project management & activities volunteer",
    },
    lede: {
      nl: "Je ondersteunt het team bij projecten, evenementen en animaties voor scholen, families en buurtbewoners.",
      fr: "Vous accompagnez l'équipe dans les projets, les événements et les animations pour les écoles, les familles et le quartier.",
      en: "You support the team on projects, events and workshops for schools, families and the neighbourhood.",
    },
    commitment: {
      nl: "Minstens één dagdeel per week, in overleg. Vaak in het weekend of tijdens evenementen.",
      fr: "Au moins une demi-journée par semaine, à convenir. Souvent le week-end ou lors d'événements.",
      en: "At least one half-day a week, to be agreed. Often at weekends or during events.",
    },
    tasks: {
      nl: [
        "Mee animaties voorbereiden en begeleiden (moestuin, compost, bijen, dieren).",
        "Onthaal van groepen en families op de site.",
        "Logistiek van evenementen: opbouw, standen, afbraak.",
        "Communicatie: foto's, korte teksten, affiches en socialemedia-inhoud.",
        "Administratieve ondersteuning van lopende projecten.",
      ],
      fr: [
        "Préparer et coanimer des animations (potager, compost, abeilles, animaux).",
        "Accueillir les groupes et les familles sur le site.",
        "Assurer la logistique des événements : montage, stands, démontage.",
        "Communication : photos, textes courts, affiches et contenus pour les réseaux.",
        "Soutien administratif des projets en cours.",
      ],
      en: [
        "Help prepare and co-run workshops (garden, compost, bees, animals).",
        "Welcome groups and families on site.",
        "Event logistics: set-up, stands, take-down.",
        "Communication: photos, short texts, posters and social media content.",
        "Administrative support for ongoing projects.",
      ],
    },
    looking: {
      nl: [
        "Je spreekt vlot Frans; Nederlands of Engels is een plus.",
        "Je werkt graag met kinderen en met groepen.",
        "Je bent georganiseerd en houdt het hoofd koel op een drukke dag.",
        "Je bent beschikbaar in het weekend of tijdens de schoolvakanties.",
      ],
      fr: [
        "Vous parlez couramment français ; le néerlandais ou l'anglais est un plus.",
        "Vous aimez travailler avec des enfants et des groupes.",
        "Vous êtes organisé·e et gardez la tête froide un jour de forte affluence.",
        "Vous êtes disponible le week-end ou pendant les congés scolaires.",
      ],
      en: [
        "You speak fluent French; Dutch or English is a plus.",
        "You enjoy working with children and groups.",
        "You are organised and keep calm on a busy day.",
        "You are available at weekends or during school holidays.",
      ],
    },
    offer: {
      nl: [
        "Een opleiding in educatie rond stadslandbouw.",
        "Een plek in een team dat je snel bij naam kent.",
        "Vrijwilligersverzekering en terugbetaling van je vervoer.",
        "Een attest voor je cv of je opleiding.",
      ],
      fr: [
        "Une formation à l'animation en agriculture urbaine.",
        "Une place dans une équipe où l'on vous appelle vite par votre prénom.",
        "Assurance bénévolat et remboursement des déplacements.",
        "Une attestation pour votre CV ou votre formation.",
      ],
      en: [
        "Training in urban-farming education.",
        "A place in a team that knows you by name within a week.",
        "Volunteer insurance and travel reimbursement.",
        "A certificate for your CV or your studies.",
      ],
    },
  },
  {
    id: "soin-animalier",
    title: {
      nl: "Vrijwilliger dierenverzorging",
      fr: "Bénévole soin animalier",
      en: "Animal care volunteer",
    },
    lede: {
      nl: "Je zorgt mee voor de schapen, geiten, ezels, kippen, konijnen en varkens van de boerderij.",
      fr: "Vous participez aux soins des moutons, chèvres, ânes, poules, lapins et cochons de la ferme.",
      en: "You help care for the farm's sheep, goats, donkeys, chickens, rabbits and pigs.",
    },
    commitment: {
      nl: "Vaste shift van een halve dag per week, het hele jaar door — ook bij regen en vrieskou.",
      fr: "Un créneau fixe d'une demi-journée par semaine, toute l'année — y compris sous la pluie et par le gel.",
      en: "A fixed half-day shift each week, all year round — rain, frost included.",
    },
    tasks: {
      nl: [
        "Voederen en drinkwater voorzien, ochtend of avond.",
        "Stallen en hokken uitmesten en instrooien.",
        "Dagelijkse observatie: gedrag, eetlust, wondjes — en melden wat opvalt.",
        "Weides en paden onderhouden, afsluitingen nakijken.",
        "Bezoekers de juiste omgang met de dieren uitleggen.",
      ],
      fr: [
        "Distribuer la nourriture et l'eau, matin ou soir.",
        "Curer et pailler les box et enclos.",
        "Observation quotidienne : comportement, appétit, blessures — et signaler ce qui sort de l'ordinaire.",
        "Entretenir les prairies et les chemins, vérifier les clôtures.",
        "Expliquer aux visiteurs la bonne attitude envers les animaux.",
      ],
      en: [
        "Feeding and watering, morning or evening.",
        "Mucking out and bedding the stalls and pens.",
        "Daily observation: behaviour, appetite, injuries — and reporting anything unusual.",
        "Maintaining paddocks and paths, checking fences.",
        "Explaining to visitors how to behave around the animals.",
      ],
    },
    looking: {
      nl: [
        "Je bent fysiek in orde: tillen, kruiwagens, buiten werken.",
        "Je bent betrouwbaar — dieren wachten niet.",
        "Je respecteert de instructies van de dierenverzorgers, ook als een dier ziek is.",
        "Ervaring is niet nodig, geduld en regelmaat wel.",
      ],
      fr: [
        "Vous êtes en bonne condition physique : port de charges, brouettes, travail extérieur.",
        "Vous êtes fiable — les animaux n'attendent pas.",
        "Vous respectez les consignes des soigneurs, y compris quand un animal est malade.",
        "Aucune expérience requise, mais de la patience et de la régularité.",
      ],
      en: [
        "You are physically fit: lifting, wheelbarrows, outdoor work.",
        "You are reliable — animals don't wait.",
        "You follow the keepers' instructions, including when an animal is ill.",
        "No experience required, but patience and consistency are.",
      ],
    },
    offer: {
      nl: [
        "Praktische opleiding in dierenverzorging op een stadsboerderij.",
        "Werkkledij en materiaal ter plaatse.",
        "Vrijwilligersverzekering en terugbetaling van je vervoer.",
        "Een attest voor je cv of je opleiding.",
      ],
      fr: [
        "Une formation pratique aux soins animaliers en ferme urbaine.",
        "Vêtements de travail et matériel sur place.",
        "Assurance bénévolat et remboursement des déplacements.",
        "Une attestation pour votre CV ou votre formation.",
      ],
      en: [
        "Hands-on training in animal care on an urban farm.",
        "Work clothes and equipment provided on site.",
        "Volunteer insurance and travel reimbursement.",
        "A certificate for your CV or your studies.",
      ],
    },
  },
];

export function getVolunteerProfile(id: string): VolunteerProfile | undefined {
  return VOLUNTEER_PROFILES.find((p) => p.id === id);
}
