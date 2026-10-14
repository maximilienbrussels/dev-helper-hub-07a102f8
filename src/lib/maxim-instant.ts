import type { Lang } from "@/lib/i18n";

/**
 * Snelkoppelingen in de chat met een lokaal, vooraf geschreven antwoord.
 * Deze antwoorden verschijnen onmiddellijk (0 ms) en kosten geen enkele
 * API-aanvraag: de vraag gaat dus nooit naar de AI-provider.
 *
 * Elke snelkoppeling verwijst naar een volgende set chips (`next`), zodat het
 * gesprek zich natuurlijk verder ontrolt in plaats van statisch te blijven.
 */
export type ChipSet =
  | "default"
  | "visit"
  | "route"
  | "booking"
  | "animals"
  | "transit"
  | "origin";

export type QuickActionId =
  | "hours"
  | "address"
  | "birthday"
  | "teambuilding"
  | "compost"
  | "staff"
  | "animals"
  | "free"
  | "dogs"
  | "transport"
  | "cafeteria"
  | "prices"
  | "ownfood"
  | "reserve"
  | "contact"
  | "feeding"
  | "sponsor"
  | "bike"
  | "train"
  | "car"
  | "planroute"
  | "animalshours"
  | "quiz"
  | "party"
  | "schedule"
  | "transit"
  | "bingo"
  | "rates"
  | "livetransit"
  | "metrowait"
  | "maps"
  | "geoloc"
  | "originnorth"
  | "originyser";

type Trio = Record<Lang, string>;

type QuickAction = {
  id: QuickActionId;
  label: Trio;
  /** Direct antwoord van Maxim; null = wél naar het taalmodel sturen. */
  answer: Trio | null;
  /** Warme vervolgvraag die het gesprek open houdt. */
  followUp?: Trio;
  /** Welke chips daarna verschijnen. */
  next?: ChipSet;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "hours",
    label: {
      nl: "🕒 Openingsuren & toegang",
      fr: "🕒 Heures d'ouverture & accès",
      en: "🕒 Opening hours & access",
    },
    answer: {
      nl: "We zijn open van dinsdag t/m zaterdag van 09:30 tot 17:00 (winter: di–vr 10:00–16:30). Vrije toegang is altijd gratis!",
      fr: "Nous sommes ouverts du mardi au samedi de 09:30 à 17:00 (hiver : mar–ven 10:00–16:30). L'entrée libre est toujours gratuite !",
      en: "We're open Tuesday to Saturday from 09:30 to 17:00 (winter: Tue–Fri 10:00–16:30). Free entry, always!",
    },
    followUp: {
      nl: "Plan je een gezinsuitstapje met kinderen, of kom je graag eens rustig alleen wandelen?",
      fr: "Vous préparez une sortie en famille, ou vous venez plutôt flâner tranquillement ?",
      en: "Are you planning a family outing, or would you rather come for a quiet stroll?",
    },
    next: "visit",
  },
  {
    id: "address",
    label: {
      nl: "📍 Adres & bereikbaarheid",
      fr: "📍 Adresse & accès",
      en: "📍 Address & getting here",
    },
    answer: {
      nl: "Je vindt ons op Schipperijkaai 2, 1000 Brussel — vlak bij het Maximiliaanpark en op wandelafstand van Brussel-Noord.",
      fr: "Nous sommes au Quai du Batelage 2, 1000 Bruxelles — juste à côté du parc Maximilien, à quelques minutes à pied de Bruxelles-Nord.",
      en: "You'll find us at Schipperijkaai/Quai du Batelage 2, 1000 Brussels — right by Maximilien Park, a short walk from Brussels-North.",
    },
    followUp: {
      nl: "Kom je met de fiets, het openbaar vervoer of de auto? Dan leg ik je meteen de vlotste route uit!",
      fr: "Vous venez à vélo, en transports en commun ou en voiture ? Je vous explique tout de suite le trajet le plus simple !",
      en: "Coming by bike, public transport or car? I'll gladly point you to the easiest route!",
    },
    next: "route",
  },
  {
    id: "birthday",
    label: {
      nl: "🎂 Verjaardagsfeestje boeken",
      fr: "🎂 Réserver un anniversaire",
      en: "🎂 Book a birthday party",
    },
    answer: {
      nl: "Je kan bij ons een unieke ruimte huren of een fantastisch woensdagmiddagfeestje tussen de dieren organiseren!",
      fr: "Chez nous, vous pouvez louer un lieu unique ou organiser une super fête du mercredi après-midi parmi les animaux !",
      en: "You can rent a one-of-a-kind space here, or throw a wonderful Wednesday-afternoon party among the animals!",
    },
    followUp: {
      nl: "Zoek je informatie over een kinderfeestje of wil je eerder een zaal huren voor een evenement?",
      fr: "Cherchez-vous des infos sur une fête d'enfants, ou plutôt une salle pour un événement ?",
      en: "Are you after a children's party, or rather a hall for an event?",
    },
    next: "booking",
  },
  {
    id: "animals",
    label: {
      nl: "🐓 Onze dieren ontmoeten",
      fr: "🐓 Rencontrer nos animaux",
      en: "🐓 Meet our animals",
    },
    answer: {
      nl: "Onze geiten, schapen, pony's, alpaca's en pluimvee wonen hier écht: elk met een eigen karakter en eigen rustplekjes.",
      fr: "Nos chèvres, moutons, poneys, alpagas et volailles vivent vraiment ici : chacun avec son caractère et ses coins de repos.",
      en: "Our goats, sheep, ponies, alpacas and poultry truly live here — each with their own character and quiet corners.",
    },
    followUp: {
      nl: "Wil je weten wanneer ze buiten staan, of denk je aan een peterschap voor een van hen?",
      fr: "Voulez-vous savoir quand ils sont dehors, ou pensez-vous à un parrainage ?",
      en: "Want to know when they're outside, or are you thinking about sponsoring one of them?",
    },
    next: "animals",
  },
  {
    id: "teambuilding",
    label: {
      nl: "🏛️ Zaalverhuur info",
      fr: "🏛️ Location de salle",
      en: "🏛️ Venue rental",
    },
    answer: {
      nl: "Onze zaal en het erf zijn te huur voor teambuilding, vergaderingen en seminaries — midden in het groen, op tien minuten van het Noordstation.",
      fr: "Notre salle et la cour se louent pour du team building, des réunions et des séminaires — en pleine verdure, à dix minutes de la gare du Nord.",
      en: "Our hall and farmyard are available for team building, meetings and seminars — surrounded by greenery, ten minutes from Brussels-North.",
    },
    followUp: {
      nl: "Weet je al met hoeveel mensen je komt, of mag ik je eerst de mogelijkheden meegeven?",
      fr: "Savez-vous déjà combien vous serez, ou puis-je d'abord vous présenter les possibilités ?",
      en: "Do you know your group size yet, or shall I walk you through the options first?",
    },
    next: "booking",
  },
  {
    id: "free",
    label: {
      nl: "🎟️ Is de toegang gratis?",
      fr: "🎟️ L'entrée est-elle gratuite ?",
      en: "🎟️ Is entry free?",
    },
    answer: {
      nl: "Helemaal! De boerderij is een vrije ontmoetingsplek voor iedereen in de stad, dus toegang is altijd 100% gratis.",
      fr: "Totalement ! La ferme est un lieu de rencontre ouvert à toute la ville, donc l'entrée est toujours 100% gratuite.",
      en: "Completely! The farm is an open meeting place for everyone in the city, so entry is always 100% free.",
    },
    followUp: {
      nl: "Zien we je binnenkort in het groen? Ik vertel je graag wat er die dag te doen is.",
      fr: "On vous voit bientôt dans la verdure ? Je vous dis volontiers ce qu'il y a à faire ce jour-là.",
      en: "See you soon among the greenery? I'm happy to tell you what's on that day.",
    },
    next: "visit",
  },
  {
    id: "dogs",
    label: {
      nl: "🐶 Mogen honden mee?",
      fr: "🐶 Les chiens sont-ils admis ?",
      en: "🐶 Are dogs allowed?",
    },
    answer: {
      nl: "Honden zijn heel welkom op het terrein, maar wel steeds aan een korte leiband zodat de diertjes niet schrikken.",
      fr: "Les chiens sont les bienvenus sur le site, mais toujours en laisse courte pour ne pas effrayer nos animaux.",
      en: "Dogs are very welcome on site, always on a short lead so our animals don't get startled.",
    },
    followUp: {
      nl: "Kom je binnenkort gezellig langs voor een wandeling?",
      fr: "Vous passez bientôt pour une balade ?",
      en: "Are you popping by for a walk soon?",
    },
    next: "animals",
  },
  {
    id: "transport",
    label: {
      nl: "🚌 Openbaar vervoer & parkeren",
      fr: "🚌 Transports & parking",
      en: "🚌 Public transport & parking",
    },
    answer: {
      nl: "Brussel-Noord ligt op tien minuten wandelen en metro Yser/IJzer brengt je vlot tot bij ons; parkeren doe je in de buurtstraten.",
      fr: "Bruxelles-Nord est à dix minutes à pied et le métro Yser vous amène facilement jusqu'ici ; le stationnement se fait dans les rues voisines.",
      en: "Brussels-North is a ten-minute walk and metro Yser brings you close by; parking is in the surrounding streets.",
    },
    followUp: {
      nl: "Wil je liever de fiets-, trein- of autoroute in detail?",
      fr: "Préférez-vous l'itinéraire à vélo, en train ou en voiture en détail ?",
      en: "Would you like the bike, train or car route in detail?",
    },
    next: "route",
  },
  {
    id: "cafeteria",
    label: {
      nl: "☕ Cafetaria & picknick",
      fr: "☕ Cafétéria & pique-nique",
      en: "☕ Cafeteria & picnic",
    },
    answer: {
      nl: "Je mag je picknick gerust meebrengen en op het erf neerzetten; bij activiteiten schenken we vaak iets warms in de zaal.",
      fr: "Vous pouvez apporter votre pique-nique et vous installer dans la cour ; lors d'activités, nous servons souvent une boisson chaude dans la salle.",
      en: "Feel free to bring a picnic and settle in the farmyard; during activities we often serve something warm in the hall.",
    },
    followUp: {
      nl: "Kom je met kinderen of eerder voor een rustig momentje tussen de dieren?",
      fr: "Venez-vous avec des enfants, ou plutôt pour un moment calme près des animaux ?",
      en: "Coming with children, or rather for a quiet moment near the animals?",
    },
    next: "visit",
  },
  {
    id: "prices",
    label: {
      nl: "💶 Tarieven verjaardagsfeestjes",
      fr: "💶 Tarifs anniversaires",
      en: "💶 Birthday party rates",
    },
    answer: null,
    next: "booking",
  },
  {
    id: "ownfood",
    label: {
      nl: "🍰 Eigen eten/drinken meebrengen?",
      fr: "🍰 Apporter ses boissons/gâteaux ?",
      en: "🍰 Bring your own food/drinks?",
    },
    answer: {
      nl: "Je eigen taart en drankjes zijn welkom voor je gezelschap — enkel de dieren houden het strikt bij hun eigen voeding.",
      fr: "Votre gâteau et vos boissons sont les bienvenus pour votre groupe — seuls les animaux gardent strictement leur propre alimentation.",
      en: "Your own cake and drinks are welcome for your group — only the animals stick strictly to their own diet.",
    },
    followUp: {
      nl: "Wil je dat ik je meteen bij de reserveringsaanvraag help?",
      fr: "Voulez-vous que je vous aide tout de suite avec la demande de réservation ?",
      en: "Shall I help you straight away with the booking request?",
    },
    next: "booking",
  },
  {
    id: "reserve",
    label: {
      nl: "📅 Reservering aanvragen",
      fr: "📅 Demander une réservation",
      en: "📅 Request a booking",
    },
    answer: null,
    next: "booking",
  },
  {
    id: "contact",
    label: {
      nl: "✉️ Contact opnemen",
      fr: "✉️ Nous contacter",
      en: "✉️ Get in touch",
    },
    answer: {
      nl: "Bel ons gerust op +32 2 331 53 91 of mail naar info@lafermeduparcmaximilien.be — er antwoordt altijd iemand van het team.",
      fr: "Appelez-nous au +32 2 331 53 91 ou écrivez à info@lafermeduparcmaximilien.be — quelqu'un de l'équipe vous répond toujours.",
      en: "Call us on +32 2 331 53 91 or email info@lafermeduparcmaximilien.be — someone from the team always replies.",
    },
    followUp: {
      nl: "Waarover gaat je vraag precies? Dan stuur ik je naar de juiste collega.",
      fr: "De quoi s'agit-il exactement ? Je vous orienterai vers la bonne personne.",
      en: "What's your question about? I'll point you to the right colleague.",
    },
    next: "default",
  },
  {
    id: "feeding",
    label: {
      nl: "🥕 Mogen we de dieren voederen?",
      fr: "🥕 Peut-on nourrir les animaux ?",
      en: "🥕 May we feed the animals?",
    },
    answer: {
      nl: "Onze diertjes krijgen een strikt gebalanceerd dieet, dus eigen voer of brood laten we beter thuis — maar van je aandacht genieten ze ontzettend!",
      fr: "Nos animaux suivent un régime strictement équilibré, donc mieux vaut laisser pain et nourriture à la maison — mais ils adorent votre attention !",
      en: "Our animals follow a strictly balanced diet, so bread and treats are best left at home — but they truly love your attention!",
    },
    followUp: {
      nl: "Kom je ze snel dag zeggen?",
      fr: "Vous venez leur dire bonjour bientôt ?",
      en: "Coming to say hello to them soon?",
    },
    next: "animals",
  },
  {
    id: "sponsor",
    label: {
      nl: "🌱 Dierenpeterschap / sponsoring",
      fr: "🌱 Parrainage d'animaux",
      en: "🌱 Animal sponsorship",
    },
    answer: null,
    next: "animals",
  },
  {
    id: "bike",
    label: { nl: "🚲 Met de fiets", fr: "🚲 À vélo", en: "🚲 By bike" },
    answer: {
      nl: "Langs het kanaal fiets je zo tot aan het Maximiliaanpark, en aan de ingang staat een fietsenstalling klaar.",
      fr: "En suivant le canal, vous arrivez directement au parc Maximilien, et un parking vélo vous attend à l'entrée.",
      en: "Follow the canal straight to Maximilien Park; bike parking waits at the entrance.",
    },
    followUp: {
      nl: "Kom je alleen of met een groepje?",
      fr: "Vous venez seul·e ou en petit groupe ?",
      en: "Coming alone or with a small group?",
    },
    next: "visit",
  },
  {
    id: "train",
    label: { nl: "🚆 Trein & metro", fr: "🚆 Train & métro", en: "🚆 Train & metro" },
    answer: {
      nl: "Stap uit in Brussel-Noord en wandel tien minuutjes door het park, of neem metro Yser/IJzer tot vlak bij het erf.",
      fr: "Descendez à Bruxelles-Nord et marchez dix minutes dans le parc, ou prenez le métro Yser tout près de la ferme.",
      en: "Get off at Brussels-North and walk ten minutes through the park, or take metro Yser right by the farm.",
    },
    followUp: {
      nl: "Wil je weten wat er die dag te doen is?",
      fr: "Voulez-vous savoir ce qu'il y a à faire ce jour-là ?",
      en: "Want to know what's on that day?",
    },
    next: "visit",
  },
  {
    id: "car",
    label: { nl: "🚗 Met de auto", fr: "🚗 En voiture", en: "🚗 By car" },
    answer: {
      nl: "Met de auto rij je tot Schipperijkaai 2 en parkeer je in de buurtstraten; het is er drukker, dus de trein of fiets is vaak vlotter.",
      fr: "En voiture, rejoignez le Quai du Batelage 2 et garez-vous dans les rues voisines ; c'est chargé, donc train ou vélo est souvent plus simple.",
      en: "By car, head to Schipperijkaai 2 and park in the nearby streets; it's busy, so train or bike is often smoother.",
    },
    followUp: {
      nl: "Kom je met kinderen? Dan tip ik je graag de leukste route op het erf.",
      fr: "Vous venez avec des enfants ? Je vous conseille volontiers le plus beau parcours.",
      en: "Coming with kids? I'll happily suggest the nicest route around the farm.",
    },
    next: "visit",
  },
  {
    id: "compost",
    label: {
      nl: "🌱 Buurtcompost info",
      fr: "🌱 Infos compost de quartier",
      en: "🌱 Neighbourhood compost info",
    },
    answer: {
      nl: "Je kan je groenafval afgeven op woensdag van 14:00 tot 17:00 en zaterdag van 10:00 tot 16:00. Twijfel je over iets? Check het hier even.\n\n[[compost-checker]]",
      fr: "Vous pouvez déposer vos déchets verts le mercredi de 14:00 à 17:00 et le samedi de 10:00 à 16:00. Un doute sur un déchet ? Vérifiez-le ici.\n\n[[compost-checker]]",
      en: "You can drop off your green waste on Wednesday 14:00–17:00 and Saturday 10:00–16:00. Not sure about an item? Check it here.\n\n[[compost-checker]]",
    },
    next: "default",
  },
  {
    id: "staff",
    label: {
      nl: "📞 Contacteer een medewerker",
      fr: "📞 Contacter un collaborateur",
      en: "📞 Talk to a staff member",
    },
    answer: {
      nl: "Natuurlijk! Bel ons op +32 2 331 53 91 of mail naar info@lafermeduparcmaximilien.be. Laat hieronder je vraag achter en het team antwoordt je persoonlijk.",
      fr: "Bien sûr ! Appelez-nous au +32 2 331 53 91 ou écrivez à info@lafermeduparcmaximilien.be. Laissez votre question ci-dessous et l'équipe vous répondra personnellement.",
      en: "Of course! Call us on +32 2 331 53 91 or email info@lafermeduparcmaximilien.be. Leave your question below and the team will get back to you personally.",
    },
    next: "default",
  },
  {
    id: "planroute",
    label: {
      nl: "🗺️ Maak een bezoekroute voor mij",
      fr: "🗺️ Créez-moi un parcours de visite",
      en: "🗺️ Plan a visit route for me",
    },
    answer: null,
    next: "visit",
  },
  {
    id: "animalshours",
    label: {
      nl: "🐓 Dieren & openingsuren",
      fr: "🐓 Animaux & heures d'ouverture",
      en: "🐓 Animals & opening hours",
    },
    answer: {
      nl: "Onze geiten, schapen, pony's, alpaca's en kippen zijn er van dinsdag t/m zaterdag van 09:30 tot 17:00 (winter: di–vr 10:00–16:30), en de toegang blijft gratis.",
      fr: "Nos chèvres, moutons, poneys, alpagas et poules vous attendent du mardi au samedi de 09:30 à 17:00 (hiver : mar–ven 10:00–16:30), et l'entrée reste gratuite.",
      en: "Our goats, sheep, ponies, alpacas and hens are here Tuesday to Saturday, 09:30–17:00 (winter: Tue–Fri 10:00–16:30), and entry stays free.",
    },
    followUp: {
      nl: "Wil je weten wanneer ze gevoederd worden, of zal ik een routetje op maat maken?",
      fr: "Voulez-vous savoir quand ils sont nourris, ou je vous prépare un parcours sur mesure ?",
      en: "Want to know their feeding times, or shall I put together a route for you?",
    },
    next: "animals",
  },
  {
    id: "quiz",
    label: {
      nl: "🧩 Doe de mini-boerderijquiz!",
      fr: "🧩 Faites le mini-quiz de la ferme !",
      en: "🧩 Try the mini farm quiz!",
    },
    answer: null,
    next: "animals",
  },
  {
    id: "party",
    label: {
      nl: "🎂 Feestje of zaal huren",
      fr: "🎂 Fête ou location de salle",
      en: "🎂 Party or venue rental",
    },
    answer: {
      nl: "Voor een kinderfeestje tussen de dieren of een zaal voor je team zit je hier goed — het erf en de zaal zijn allebei te huur. [Bekijk verjaardagsformules](/feestjes/verjaardag)",
      fr: "Pour une fête d'enfants parmi les animaux ou une salle pour votre équipe, c'est ici — la cour et la salle se louent. [Voir les formules anniversaire](/feestjes/verjaardag)",
      en: "For a children's party among the animals or a hall for your team, you're in the right place — both the farmyard and the hall are available. [See birthday options](/feestjes/verjaardag)",
    },
    followUp: {
      nl: "Gaat het om een kinderfeestje of eerder om een groep volwassenen?",
      fr: "S'agit-il d'une fête d'enfants ou plutôt d'un groupe d'adultes ?",
      en: "Is it a children's party, or rather a group of adults?",
    },
    next: "booking",
  },
  {
    id: "schedule",
    label: {
      nl: "🗺️ Maak een bezoekschema (Tabel)",
      fr: "🗺️ Créez un programme de visite (tableau)",
      en: "🗺️ Build a visit schedule (table)",
    },
    answer: null,
    next: "visit",
  },
  {
    id: "transit",
    label: {
      nl: "🚌 Hoe er te geraken (OV Route)",
      fr: "🚌 Comment venir (transports)",
      en: "🚌 How to get here (public transport)",
    },
    answer: {
      nl: [
        "Je vindt ons aan Schipperijkaai 2 / Quai du Batelage 2, 1000 Brussel (tweede ingang: Willebroekkaai 21). Zo geraak je vlot bij ons:",
        "",
        "1. 🚇 **Metro 2 of 6** tot halte **IJzer / Yser** — daarna 5 minuten wandelen.",
        "2. 🚆 **Trein** tot **Brussel-Noord** — 10 minuten wandelen langs het kanaal.",
        "3. 🚊 **Tram 51** stopt vlakbij het Maximiliaanpark.",
        "4. 🚌 **Bus 46 en 58**, of De Lijn **R14, R24, R28, R41**.",
        "5. 🚶 Volg het kanaal tot je de houten poort van de boerderij ziet.",
      ].join("\n"),
      fr: [
        "Nous sommes au Quai du Batelage 2 / Schipperijkaai 2, 1000 Bruxelles (deuxième entrée : Quai de Willebroek 21). Voici comment venir :",
        "",
        "1. 🚇 **Métro 2 ou 6** jusqu'à **Yser / IJzer** — puis 5 minutes à pied.",
        "2. 🚆 **Train** jusqu'à **Bruxelles-Nord** — 10 minutes à pied le long du canal.",
        "3. 🚊 **Tram 51** s'arrête tout près du parc Maximilien.",
        "4. 🚌 **Bus 46 et 58**, ou De Lijn **R14, R24, R28, R41**.",
        "5. 🚶 Longez le canal jusqu'au portail en bois de la ferme.",
      ].join("\n"),
      en: [
        "You'll find us at Quai du Batelage 2 / Schipperijkaai 2, 1000 Brussels (second entrance: Quai de Willebroek 21). Here's how to reach us:",
        "",
        "1. 🚇 **Metro 2 or 6** to **IJzer / Yser** — then a 5-minute walk.",
        "2. 🚆 **Train** to **Brussels-North** — a 10-minute walk along the canal.",
        "3. 🚊 **Tram 51** stops right by Maximilian Park.",
        "4. 🚌 **Bus 46 and 58**, or De Lijn **R14, R24, R28, R41**.",
        "5. 🚶 Follow the canal until you see the farm's wooden gate.",
      ].join("\n"),
    },
    followUp: {
      nl: "Kom je met de metro of liever met de fiets? Dan stem ik mijn tips daarop af.",
      fr: "Vous venez en métro ou plutôt à vélo ? J'adapte mes conseils.",
      en: "Are you coming by metro or rather by bike? I'll tailor my tips.",
    },
    next: "route",
  },
  {
    id: "bingo",
    label: {
      nl: "🧩 Boerderij Bingo voor kinderen",
      fr: "🧩 Bingo de la ferme pour enfants",
      en: "🧩 Farm bingo for kids",
    },
    answer: {
      nl: [
        "Leuk! Hier is jullie Boerderij Bingo — vink af tijdens het bezoek:",
        "",
        "- [ ] 🐐 Groet de geiten bij het houten hek",
        "- [ ] 🐝 Vind de 3 bijenkorven in de bloementuin",
        "- [ ] 🐓 Tel hoeveel hanen je hoort kraaien",
        "- [ ] 🍏 Vind de fruitbomen in de boomgaard",
        "- [ ] 🪱 Bekijk het compostsysteem bij de moestuin",
      ].join("\n"),
      fr: [
        "Chouette ! Voici votre Bingo de la ferme — à cocher pendant la visite :",
        "",
        "- [ ] 🐐 Salue les chèvres près de la barrière en bois",
        "- [ ] 🐝 Trouve les 3 ruches dans le jardin fleuri",
        "- [ ] 🐓 Compte les coqs que tu entends chanter",
        "- [ ] 🍏 Repère les arbres du verger",
        "- [ ] 🪱 Observe le compost près du potager",
      ].join("\n"),
      en: [
        "Lovely! Here's your Farm Bingo — tick them off during your visit:",
        "",
        "- [ ] 🐐 Greet the goats by the wooden gate",
        "- [ ] 🐝 Find the 3 beehives in the flower garden",
        "- [ ] 🐓 Count how many roosters you hear crowing",
        "- [ ] 🍏 Spot the fruit trees in the orchard",
        "- [ ] 🪱 Look at the compost system by the vegetable garden",
      ].join("\n"),
    },
    followUp: {
      nl: "Hoe oud zijn de kinderen? Dan maak ik er een route bij op hun maat.",
      fr: "Quel âge ont les enfants ? Je prépare un parcours adapté.",
      en: "How old are the children? I'll add a route that suits them.",
    },
    next: "visit",
  },
  {
    id: "rates",
    label: {
      nl: "💶 Tarieven & zaalverhuur",
      fr: "💶 Tarifs & location de salle",
      en: "💶 Rates & venue rental",
    },
    answer: null,
    next: "booking",
  },
  {
    id: "livetransit",
    label: {
      nl: "🚆 Live Metro & Trein",
      fr: "🚆 Métro & train en direct",
      en: "🚆 Live metro & train",
    },
    answer: {
      nl: [
        "Zo geraak je vlot bij ons aan **Schipperijkaai 2, 1000 Brussel**:",
        "",
        "1. 🚇 Metro **2 of 6** tot **IJzer / Yser** — daarna 5 minuten wandelen langs het kanaal.",
        "2. 🚆 Trein tot **Brussel-Noord** — 10 minuten wandelen langs het water.",
        "3. 🚊 Tram **51** en bus **46 / 58** stoppen vlak bij het Maximiliaanpark.",
        "",
        "[📍 Route in Google Maps](https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel)",
      ].join("\n"),
      fr: [
        "Voici comment nous rejoindre au **Quai du Batelage 2, 1000 Bruxelles** :",
        "",
        "1. 🚇 Métro **2 ou 6** jusqu'à **Yser / IJzer** — puis 5 minutes à pied le long du canal.",
        "2. 🚆 Train jusqu'à **Bruxelles-Nord** — 10 minutes à pied au bord de l'eau.",
        "3. 🚊 Tram **51** et bus **46 / 58** s'arrêtent tout près du parc Maximilien.",
        "",
        "[📍 Itinéraire dans Google Maps](https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel)",
      ].join("\n"),
      en: [
        "Here's how to reach us at **Quai du Batelage 2, 1000 Brussels**:",
        "",
        "1. 🚇 Metro **2 or 6** to **Yser / IJzer** — then a 5-minute walk along the canal.",
        "2. 🚆 Train to **Brussels-North** — a 10-minute walk by the water.",
        "3. 🚊 Tram **51** and buses **46 / 58** stop right by Maximilian Park.",
        "",
        "[📍 Route in Google Maps](https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel)",
      ].join("\n"),
    },
    followUp: {
      nl: "Vertrek je van een ander punt? Typ je gemeente of station, dan zoek ik de route.",
      fr: "Vous partez d'ailleurs ? Tapez votre commune ou votre gare et je cherche l'itinéraire.",
      en: "Setting off from somewhere else? Type your town or station and I'll find the route.",
    },
    next: "transit",
  },

  {
    id: "metrowait",
    label: {
      nl: "🚇 Metro IJzer wachttijd",
      fr: "🚇 Attente métro Yser",
      en: "🚇 Metro IJzer waiting time",
    },
    answer: null,
    next: "transit",
  },
  {
    id: "maps",
    label: {
      nl: "📍 Open in Google Maps",
      fr: "📍 Ouvrir dans Google Maps",
      en: "📍 Open in Google Maps",
    },
    answer: {
      nl: "Zet je navigatie op **Schipperijkaai 2, 1000 Brussel** — de houten poort aan het kanaal is onze hoofdingang. [📍 Open in Google Maps](https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel)",
      fr: "Mettez votre GPS sur **Quai du Batelage 2, 1000 Bruxelles** — le portail en bois au bord du canal est notre entrée principale. [📍 Ouvrir dans Google Maps](https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel)",
      en: "Set your navigation to **Quai du Batelage 2, 1000 Brussels** — the wooden gate by the canal is our main entrance. [📍 Open in Google Maps](https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel)",
    },
    followUp: {
      nl: "Kom je met de auto of stap je liever af aan IJzer?",
      fr: "Vous venez en voiture ou descendez-vous plutôt à Yser ?",
      en: "Coming by car, or hopping off at IJzer instead?",
    },
    next: "transit",
  },
  {
    id: "geoloc",
    label: {
      nl: "📍 Deel mijn live locatie",
      fr: "📍 Partager ma position en direct",
      en: "📍 Share my live location",
    },
    answer: null,
    next: "transit",
  },
  {
    id: "originnorth",
    label: {
      nl: "🚆 Station Brussel-Noord",
      fr: "🚆 Gare de Bruxelles-Nord",
      en: "🚆 Brussels-North station",
    },
    answer: {
      nl: "Vanaf Brussel-Noord wandel je in een goede 10 minuten langs het kanaal tot aan onze houten poort op Schipperijkaai 2. [📍 Route vanaf Brussel-Noord](https://www.google.com/maps/dir/?api=1&origin=Brussel-Noord+station&destination=Schipperijkaai+2+1000+Brussel)",
      fr: "Depuis Bruxelles-Nord, comptez une bonne dizaine de minutes à pied le long du canal jusqu'à notre portail en bois, Quai du Batelage 2. [📍 Itinéraire depuis Bruxelles-Nord](https://www.google.com/maps/dir/?api=1&origin=Brussel-Noord+station&destination=Schipperijkaai+2+1000+Brussel)",
      en: "From Brussels-North it's a pleasant 10-minute walk along the canal to our wooden gate at Quai du Batelage 2. [📍 Route from Brussels-North](https://www.google.com/maps/dir/?api=1&origin=Brussel-Noord+station&destination=Schipperijkaai+2+1000+Brussel)",
    },
    followUp: {
      nl: "Kom je alleen of met kinderen mee?",
      fr: "Venez-vous seul·e ou avec des enfants ?",
      en: "Are you coming on your own or with children?",
    },
    next: "transit",
  },
  {
    id: "originyser",
    label: {
      nl: "🚇 Metro IJzer (Brussel)",
      fr: "🚇 Métro Yser (Bruxelles)",
      en: "🚇 Metro Yser (Brussels)",
    },
    answer: {
      nl: "Vanaf metro IJzer (lijn 2 en 6) sta je na een wandeling van amper 5 minuten langs het kanaal bij ons voor de deur. [📍 Route vanaf IJzer](https://www.google.com/maps/dir/?api=1&origin=Metro+IJzer+Brussel&destination=Schipperijkaai+2+1000+Brussel)",
      fr: "Depuis le métro Yser (lignes 2 et 6), 5 petites minutes de marche le long du canal suffisent pour arriver chez nous. [📍 Itinéraire depuis Yser](https://www.google.com/maps/dir/?api=1&origin=Metro+IJzer+Brussel&destination=Schipperijkaai+2+1000+Brussel)",
      en: "From metro Yser (lines 2 and 6) it's barely a 5-minute stroll along the canal to our gate. [📍 Route from Yser](https://www.google.com/maps/dir/?api=1&origin=Metro+IJzer+Brussel&destination=Schipperijkaai+2+1000+Brussel)",
    },
    followUp: {
      nl: "Woon je in de buurt of kom je van verder weg?",
      fr: "Habitez-vous dans le quartier ou venez-vous de plus loin ?",
      en: "Do you live nearby, or are you coming from further away?",
    },
    next: "transit",
  },
];

/** Welke chips horen bij welke gesprekscontext. */
export const CHIP_SETS: Record<ChipSet, QuickActionId[]> = {
  default: ["schedule", "livetransit", "bingo", "party"],
  visit: ["free", "dogs", "transport", "cafeteria"],
  route: ["bike", "train", "car", "hours"],
  booking: ["prices", "ownfood", "reserve", "contact"],
  animals: ["feeding", "dogs", "sponsor", "hours"],
  transit: ["geoloc", "bike", "metrowait", "maps"],
  origin: ["geoloc", "originnorth", "originyser", "bike", "car"],
};

const byId = new Map(QUICK_ACTIONS.map((a) => [a.id, a]));

export function quickAction(id: QuickActionId): QuickAction | undefined {
  return byId.get(id);
}

/** De chips van een context, in de juiste volgorde. */
export function chipsFor(set: ChipSet): QuickAction[] {
  return CHIP_SETS[set].map((id) => byId.get(id)).filter((a): a is QuickAction => Boolean(a));
}

/**
 * Het onmiddellijke antwoord voor een snelkoppeling (met vervolgvraag), of null.
 * `live` bevat de gegevens die het team in het portaal beheert: het adres en
 * de telefoon worden dan overal in het antwoord vervangen.
 */
export function instantAnswer(
  id: QuickActionId,
  lang: Lang,
  live?: { address?: string; phone?: string; email?: string },
): string | null {
  const action = byId.get(id);
  if (!action?.answer) return null;
  let answer = action.answer[lang] ?? action.answer.nl;
  if (live?.address) {
    answer = answer
      .replace(/Schipperijkaai 2, 1000 Brussel/g, live.address)
      .replace(/Quai du Batelage 2, 1000 Bruxelles/g, live.address);
  }
  if (live?.phone) answer = answer.replace(/\+32 2 201 56 09/g, live.phone);
  if (live?.email) answer = answer.replace(/contact@maximilien\.brussels/g, live.email);
  const follow = action.followUp ? (action.followUp[lang] ?? action.followUp.nl) : null;
  return follow ? `${answer} ${follow}` : answer;
}

/** Welke chipset na deze snelkoppeling getoond wordt. */
export function nextChipSet(id: QuickActionId): ChipSet {
  return byId.get(id)?.next ?? "default";
}

/** Begroeting die strikt de taal van de pagina volgt. */
export const GREETING: Record<Lang, string> = {
  nl: "Hallo! Ik ben Maxim, jouw gids op Maximilien. Waarmee kan ik je helpen?",
  fr: "Bonjour ! Je suis Maxim, votre guide à Maximilien. Comment puis-je vous aider ?",
  en: "Hello! I am Maxim, your guide at Maximilien. How can I help you today?",
};

/** Infomaniak AI brand badge. */
export const PRIVACY_BADGE: Record<Lang, { label: string; tooltip: string }> = {
  nl: {
    label: "Euria AI · Infomaniak",
    tooltip: "100% Zwitserse AI & AVG/GDPR-conform. Nul cookies, nul tracking.",
  },
  fr: {
    label: "Euria AI · Infomaniak",
    tooltip: "IA 100% suisse et conforme au RGPD. Zéro cookie, zéro tracking.",
  },
  en: {
    label: "Euria AI · Infomaniak",
    tooltip: "100% Swiss AI and GDPR-compliant. Zero cookies, zero tracking.",
  },
};
