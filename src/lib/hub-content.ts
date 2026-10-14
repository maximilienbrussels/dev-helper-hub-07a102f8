/**
 * Hub landing content — one map, three locales (nl/fr/en).
 * Each subtopic has a full HubEntry per language; `getHubEntry` falls back to NL
 * when a translation is missing.
 */

import type { Lang } from "@/lib/i18n";

export type HubBlock = {
  title: string;
  body: string;
  bullets?: string[];
};

export type HubEntry = {
  eyebrow: string;
  title: string;
  lede: string;
  blocks: HubBlock[];
  cta?: { label: string; href: string };
  practical?: { label: string; value: string }[];
  faq?: { q: string; a: string }[];
  /** Page-specific contact form copy; only rendered when set. */
  contact?: { title: string; intro: string };
};

export type HubKey = "bezoekers" | "betrokkenheid" | "informatie";

type LocaleEntry = Record<Lang, HubEntry>;

/* ---------- Bezoekers / Programma's ---------- */

const BEZOEKERS: Record<string, LocaleEntry> = {
  school: {
    nl: {
      eyebrow: "Programma's · Scholen & Non-profit",
      title: "Een boerderij-dag voor jouw klas of groep",
      lede: "Educatieve animaties over dieren, biodiversiteit en voedselcyclus — op maat van kleuters tot secundair. Ook geschikt voor sociale organisaties en dagcentra.",
      blocks: [
        {
          title: "Animaties",
          body: "Onze animatoren begeleiden je groep doorheen de weides, de moestuin en de compostzone. Elke sessie combineert observatie, doen en reflectie.",
          bullets: [
            "Verzorgen van de dieren (borstelen, voederen, hokken)",
            "Zaaien, plukken en composteren in de moestuin",
            "Van korrel tot brood: bakkerij-atelier",
            "Bijen, vlinders & biodiversiteit in de stad",
          ],
        },
        {
          title: "Verhuur voor scholen",
          body: "Nood aan een eigen ruimte voor picknick of workshop? We verhuren onze onthaalruimte en overdekte zone tegen sociaal tarief.",
        },
        {
          title: "Studentstages",
          body: "We ontvangen elk jaar stagiairs uit sociaal-agogisch werk, agronomie en dierenzorg. Zie de Betrokkenheid-hub voor details.",
        },
      ],
      practical: [
        { label: "Groepsgrootte", value: "10 – 30 personen" },
        { label: "Duur", value: "2u tot een volledige dag" },
        { label: "Talen", value: "Nederlands · Frans · Engels" },
        { label: "Prijs", value: "Sociaal tarief op aanvraag" },
      ],
      cta: { label: "Vraag een offerte", href: "/contact" },
      contact: {
        title: "Vraag over een klasbezoek?",
        intro:
          "Vertel ons over je groep, de gewenste datum en het aantal leerlingen — we bezorgen je snel een offerte op maat.",
      },
      faq: [
        {
          q: "Vanaf welke leeftijd?",
          a: "Vanaf de kleuterklas — de animator past het programma aan de leeftijd aan.",
        },
        {
          q: "Ook bij regen?",
          a: "Ja. Een deel van de activiteiten gaat door onder een overdekte zone.",
        },
      ],
    },
    fr: {
      eyebrow: "Programmes · Écoles & Non-profit",
      title: "Une journée à la ferme pour votre classe ou groupe",
      lede: "Animations éducatives autour des animaux, de la biodiversité et du cycle alimentaire — adaptées de la maternelle au secondaire. Également pour les associations et centres de jour.",
      blocks: [
        {
          title: "Animations",
          body: "Nos animateurs accompagnent votre groupe à travers les prés, le potager et la zone de compost. Chaque séance combine observation, action et réflexion.",
          bullets: [
            "Soins aux animaux (brosser, nourrir, litière)",
            "Semer, récolter et composter au potager",
            "Du grain au pain : atelier boulangerie",
            "Abeilles, papillons & biodiversité urbaine",
          ],
        },
        {
          title: "Location pour écoles",
          body: "Besoin d'un espace pour pique-nique ou atelier ? Nous louons notre salle d'accueil et l'espace couvert à tarif social.",
        },
        {
          title: "Stages étudiants",
          body: "Chaque année, nous accueillons des stagiaires en travail social, agronomie et soins animaliers. Voir la hub Engagement pour les détails.",
        },
      ],
      practical: [
        { label: "Taille du groupe", value: "10 – 30 personnes" },
        { label: "Durée", value: "2h à une journée complète" },
        { label: "Langues", value: "Néerlandais · Français · Anglais" },
        { label: "Tarif", value: "Tarif social sur demande" },
      ],
      cta: { label: "Demander un devis", href: "/contact" },
      contact: {
        title: "Une question sur une visite scolaire ?",
        intro:
          "Parlez-nous de votre groupe, de la date souhaitée et du nombre d'élèves — nous vous envoyons rapidement un devis sur mesure.",
      },
      faq: [
        {
          q: "À partir de quel âge ?",
          a: "Dès la maternelle — l'animateur adapte le programme à l'âge.",
        },
        {
          q: "Même sous la pluie ?",
          a: "Oui. Une partie des activités a lieu sous un espace couvert.",
        },
      ],
    },
    en: {
      eyebrow: "Programmes · Schools & Non-profit",
      title: "A farm day for your class or group",
      lede: "Educational activities on animals, biodiversity and the food cycle — tailored from kindergarten to secondary school. Also suitable for social organisations and day centres.",
      blocks: [
        {
          title: "Activities",
          body: "Our facilitators guide your group through the pastures, vegetable garden and compost area. Each session combines observing, doing and reflecting.",
          bullets: [
            "Caring for the animals (brushing, feeding, bedding)",
            "Sowing, harvesting and composting in the garden",
            "From grain to bread: baking workshop",
            "Bees, butterflies & urban biodiversity",
          ],
        },
        {
          title: "Rental for schools",
          body: "Need your own space for a picnic or workshop? We rent our welcome room and covered area at a social rate.",
        },
        {
          title: "Student internships",
          body: "Every year we welcome interns from social work, agronomy and animal care. See the Engagement hub for details.",
        },
      ],
      practical: [
        { label: "Group size", value: "10 – 30 people" },
        { label: "Duration", value: "2h up to a full day" },
        { label: "Languages", value: "Dutch · French · English" },
        { label: "Price", value: "Social rate on request" },
      ],
      cta: { label: "Request a quote", href: "/contact" },
      contact: {
        title: "Question about a school visit?",
        intro:
          "Tell us about your group, preferred date and number of pupils — we'll send a tailored quote quickly.",
      },
      faq: [
        { q: "From what age?", a: "From kindergarten — the facilitator adapts to the group." },
        { q: "Also in the rain?", a: "Yes. Part of the programme runs under a covered area." },
      ],
    },
  },
  familie: {
    nl: {
      eyebrow: "Programma's · Familie",
      title: "Verjaardagen, workshops en boerderij-dagen voor gezinnen",
      lede: "Vier je verjaardag tussen de geiten en konijnen, of kom op woensdagnamiddag knutselen en bakken met de kinderen.",
      blocks: [
        {
          title: "Kinderverjaardagen",
          body: "Een halve dag op de boerderij met een animator, een rondleiding bij de dieren, een creatief atelier en tijd voor taart.",
          bullets: [
            "Vanaf 5 jaar",
            "Groep van 6 tot 15 kinderen",
            "Weekends van april tot oktober",
          ],
        },
        {
          title: "Kinderateliers (woensdag)",
          body: "Regelmatige woensdagnamiddagen rond seizoensthema's: zaadbommen maken, brood bakken, wolvilten, insectenhotel bouwen.",
        },
        {
          title: "Vrij bezoek",
          body: "Elke opendag kun je gratis binnenwandelen. Bekijk het rooster in de Bezoeken-hub voor actuele uren.",
        },
      ],
      practical: [
        { label: "Leeftijd", value: "3 – 12 jaar" },
        { label: "Reserveren", value: "Verplicht voor verjaardagen" },
        { label: "Toegankelijkheid", value: "Rolstoelvriendelijk op de hoofdroute" },
      ],
      cta: { label: "Reserveer een verjaardag", href: "/contact" },
      contact: {
        title: "Vraag over een verjaardag of familiedag?",
        intro:
          "Laat ons weten hoeveel kinderen, welke leeftijd en welke datum — we bevestigen snel of het past.",
      },
    },
    fr: {
      eyebrow: "Programmes · Famille",
      title: "Anniversaires, ateliers et journées à la ferme pour les familles",
      lede: "Fêtez votre anniversaire parmi les chèvres et lapins, ou venez bricoler et cuisiner avec les enfants le mercredi après-midi.",
      blocks: [
        {
          title: "Anniversaires d'enfants",
          body: "Une demi-journée à la ferme avec un animateur, une visite guidée aux animaux, un atelier créatif et un moment pour le gâteau.",
          bullets: ["Dès 5 ans", "Groupe de 6 à 15 enfants", "Week-ends d'avril à octobre"],
        },
        {
          title: "Ateliers pour enfants (mercredi)",
          body: "Mercredis après-midi réguliers autour des saisons : bombes à graines, pain, feutrage, hôtel à insectes.",
        },
        {
          title: "Visite libre",
          body: "Chaque jour d'ouverture, entrée gratuite. Voir la hub Visiter pour les horaires.",
        },
      ],
      practical: [
        { label: "Âge", value: "3 – 12 ans" },
        { label: "Réservation", value: "Obligatoire pour les anniversaires" },
        { label: "Accessibilité", value: "PMR sur le parcours principal" },
      ],
      cta: { label: "Réserver un anniversaire", href: "/contact" },
      contact: {
        title: "Une question sur un anniversaire ou une sortie en famille ?",
        intro:
          "Indiquez-nous le nombre d'enfants, leur âge et la date souhaitée — nous confirmons rapidement la disponibilité.",
      },
    },
    en: {
      eyebrow: "Programmes · Family",
      title: "Birthdays, workshops and farm days for families",
      lede: "Celebrate a birthday among the goats and rabbits, or come and craft and bake with the kids on Wednesday afternoons.",
      blocks: [
        {
          title: "Kids' birthdays",
          body: "Half a day on the farm with a host, a tour of the animals, a creative workshop and time for cake.",
          bullets: ["From age 5", "Groups of 6 to 15 children", "Weekends April – October"],
        },
        {
          title: "Wednesday workshops",
          body: "Regular Wednesday afternoons around the seasons: seed bombs, bread baking, wool felting, insect hotels.",
        },
        {
          title: "Free visit",
          body: "Every open day, entry is free. See the Visit hub for current opening hours.",
        },
      ],
      practical: [
        { label: "Age", value: "3 – 12 years" },
        { label: "Booking", value: "Required for birthdays" },
        { label: "Accessibility", value: "Wheelchair-friendly on the main route" },
      ],
      cta: { label: "Book a birthday", href: "/contact" },
      contact: {
        title: "Question about a birthday or family day?",
        intro:
          "Let us know how many children, their age and your preferred date — we'll quickly confirm availability.",
      },
    },
  },
  bedrijf: {
    nl: {
      eyebrow: "Programma's · Bedrijf",
      title: "Teambuilding met impact — buiten, in het echt",
      lede: "Wissel de vergaderzaal voor een dag op de boerderij. Samen doe-activiteiten, een lunch met producten van het huis, en een bijdrage aan een sociaal project.",
      blocks: [
        {
          title: "Teambuilding-dagen",
          body: "Teams tot 40 personen. Kies uit: dieren verzorgen, moestuin aanleggen, herstelwerk, of een 'boerderij escape'.",
        },
        {
          title: "Verhuur van ruimtes",
          body: "Onze onthaalzaal en polyvalente ruimte zijn beschikbaar voor bedrijfsvergaderingen, seminaries en workshops.",
        },
        {
          title: "Duurzame partnerschappen",
          body: "Meerjarig sponsoring, product-partnerschap of vrijwilligers-dagen voor je medewerkers. Op maat uit te werken.",
        },
      ],
      practical: [
        { label: "Groepsgrootte", value: "5 – 40 personen" },
        { label: "Impact", value: "20% gaat rechtstreeks naar het sociaal project" },
        { label: "Locatie", value: "Op 5 min. van Brussel-Centraal" },
      ],
      cta: { label: "Bespreek een teambuilding", href: "/contact" },
      contact: {
        title: "Vraag over teambuilding of verhuur voor je bedrijf?",
        intro:
          "Vertel ons over je team, de gewenste datum en het budget — we stellen een programma op maat voor.",
      },
    },
    fr: {
      eyebrow: "Programmes · Entreprise",
      title: "Un teambuilding qui a du sens — dehors, pour de vrai",
      lede: "Échangez la salle de réunion pour une journée à la ferme. Activités communes, un déjeuner avec les produits maison, et une contribution à un projet social.",
      blocks: [
        {
          title: "Journées de teambuilding",
          body: "Équipes jusqu'à 40 personnes. Au choix : soigner les animaux, aménager le potager, réparations, ou une 'ferme escape'.",
        },
        {
          title: "Location de salles",
          body: "Notre salle d'accueil et notre espace polyvalent sont disponibles pour réunions, séminaires et ateliers.",
        },
        {
          title: "Partenariats durables",
          body: "Mécénat pluriannuel, partenariat produit ou journées bénévoles pour vos collaborateurs. Sur mesure.",
        },
      ],
      practical: [
        { label: "Taille du groupe", value: "5 – 40 personnes" },
        { label: "Impact", value: "20% va directement au projet social" },
        { label: "Localisation", value: "À 5 min de Bruxelles-Central" },
      ],
      cta: { label: "Planifier un teambuilding", href: "/contact" },
      contact: {
        title: "Une question sur un teambuilding ou une location pour votre entreprise ?",
        intro:
          "Parlez-nous de votre équipe, de la date souhaitée et de votre budget — nous proposons un programme sur mesure.",
      },
    },
    en: {
      eyebrow: "Programmes · Business",
      title: "Team-building with impact — outdoors, for real",
      lede: "Swap the meeting room for a day on the farm. Shared hands-on activities, a lunch with in-house products and a contribution to a social project.",
      blocks: [
        {
          title: "Team-building days",
          body: "Teams up to 40. Choose from: animal care, garden building, repair work, or a 'farm escape'.",
        },
        {
          title: "Space rental",
          body: "Our welcome room and polyvalent space are available for company meetings, seminars and workshops.",
        },
        {
          title: "Long-term partnerships",
          body: "Multi-year sponsoring, product partnership or volunteer days for your team. Fully tailored.",
        },
      ],
      practical: [
        { label: "Group size", value: "5 – 40 people" },
        { label: "Impact", value: "20% goes straight to the social project" },
        { label: "Location", value: "5 min. from Brussels-Central" },
      ],
      cta: { label: "Discuss a team-building", href: "/contact" },
      contact: {
        title: "Question about a team-building or venue hire for your company?",
        intro:
          "Tell us about your team, preferred date and budget — we'll suggest a tailored programme.",
      },
    },
  },
};

/* ---------- Betrokkenheid / Engagement ---------- */

const BETROKKENHEID: Record<string, LocaleEntry> = {
  vrijwilligers: {
    nl: {
      eyebrow: "Betrokkenheid · Vrijwilligerswerk",
      title: "Word vrijwilliger op de boerderij",
      lede: "Vast of occasioneel — je handen zijn altijd welkom. Ontdek welke rollen bij jou passen.",
      blocks: [
        {
          title: "Wat kun je doen?",
          body: "We werken met vaste vrijwilligers voor de dagelijkse dierenzorg, en met occasionele helpers voor onze evenementen en werkdagen.",
          bullets: [
            "Dieren voederen en hokken kuisen",
            "Moestuin & compost onderhouden",
            "Onthaal en gidsen tijdens opendagen",
            "Ateliers begeleiden of foto's maken op evenementen",
          ],
        },
        {
          title: "Wat krijg je terug?",
          body: "Een warme gemeenschap, praktische kennis van stadslandbouw, en de rust van tijd doorbrengen met dieren. Vaste vrijwilligers krijgen korting in de hoevewinkel.",
        },
      ],
      practical: [
        { label: "Minimum leeftijd", value: "16 jaar" },
        { label: "Engagement", value: "Vanaf 1 halve dag per maand" },
        { label: "Verzekering", value: "Voorzien voor alle vrijwilligers" },
      ],
      cta: { label: "Meld je aan", href: "/contact" },
      contact: {
        title: "Interesse om vrijwilliger te worden?",
        intro:
          "Vertel ons wat je graag zou doen en hoeveel tijd je beschikbaar hebt — we nemen snel contact op.",
      },
    },
    fr: {
      eyebrow: "Engagement · Bénévolat",
      title: "Devenez bénévole à la ferme",
      lede: "Régulier ou ponctuel — vos mains sont toujours les bienvenues. Découvrez les rôles qui vous conviennent.",
      blocks: [
        {
          title: "Que pouvez-vous faire ?",
          body: "Nous travaillons avec des bénévoles réguliers pour les soins quotidiens, et des aides ponctuels pour les événements et journées de travail.",
          bullets: [
            "Nourrir les animaux et nettoyer les enclos",
            "Entretien du potager & compost",
            "Accueil et guidage lors des portes ouvertes",
            "Encadrement d'ateliers ou photographie",
          ],
        },
        {
          title: "Que reçoit-on ?",
          body: "Une communauté chaleureuse, une connaissance pratique de l'agriculture urbaine, et la sérénité du temps passé avec les animaux. Les bénévoles réguliers reçoivent une réduction en boutique.",
        },
      ],
      practical: [
        { label: "Âge minimum", value: "16 ans" },
        { label: "Engagement", value: "À partir d'une demi-journée par mois" },
        { label: "Assurance", value: "Prévue pour tous les bénévoles" },
      ],
      cta: { label: "S'inscrire", href: "/contact" },
      contact: {
        title: "Envie de devenir bénévole ?",
        intro:
          "Dites-nous ce que vous aimeriez faire et le temps dont vous disposez — nous vous recontactons rapidement.",
      },
    },
    en: {
      eyebrow: "Engagement · Volunteering",
      title: "Become a volunteer at the farm",
      lede: "Regular or occasional — your hands are always welcome. Find the role that fits.",
      blocks: [
        {
          title: "What can you do?",
          body: "We rely on regular volunteers for daily animal care, and on occasional helpers for events and work days.",
          bullets: [
            "Feeding animals and cleaning pens",
            "Vegetable garden & compost upkeep",
            "Welcoming and guiding on open days",
            "Facilitating workshops or photographing events",
          ],
        },
        {
          title: "What do you get back?",
          body: "A warm community, practical urban-farming know-how, and the calm of time spent with animals. Regular volunteers get a farm-shop discount.",
        },
      ],
      practical: [
        { label: "Minimum age", value: "16" },
        { label: "Commitment", value: "From a half-day per month" },
        { label: "Insurance", value: "Provided for all volunteers" },
      ],
      cta: { label: "Sign up", href: "/contact" },
      contact: {
        title: "Interested in volunteering?",
        intro:
          "Tell us what you'd like to do and how much time you have available — we'll get back to you quickly.",
      },
    },
  },
  stages: {
    nl: {
      eyebrow: "Betrokkenheid · Studentstages",
      title: "Stagemogelijkheden voor studenten",
      lede: "We ontvangen stagiairs uit sociaal-agogisch werk, agronomie, dierenzorg en communicatie. Aanvragen minstens 3 maanden op voorhand.",
      blocks: [
        {
          title: "Welke stages?",
          body: "Observatie- én meewerkstages. Je krijgt een vaste stagementor en werkt mee aan lopende projecten.",
          bullets: [
            "Sociaal-agogisch werk (bachelor / master)",
            "Agronomie en tuinbouw",
            "Dierenzorg en veterinaire opleidingen",
            "Communicatie, event en fondsenwerving",
          ],
        },
        {
          title: "Hoe aanvragen?",
          body: "Stuur ons je CV, motivatie, gewenste periode en uren via het contactformulier. We plannen een kennismakingsgesprek.",
        },
      ],
      practical: [
        { label: "Duur", value: "3 weken tot 6 maanden" },
        { label: "Talen", value: "NL, FR, EN welkom" },
        { label: "Vergoeding", value: "Onbezoldigd — verplaatsing terugbetaald" },
      ],
      cta: { label: "Stel je stage voor", href: "/contact" },
      contact: {
        title: "Een stage aanvragen?",
        intro:
          "Stuur je CV, motivatie, gewenste periode en aantal uren — we plannen snel een kennismaking.",
      },
    },
    fr: {
      eyebrow: "Engagement · Stages étudiants",
      title: "Stages pour étudiants",
      lede: "Nous accueillons des stagiaires en travail social, agronomie, soins animaliers et communication. Introduire au moins 3 mois à l'avance.",
      blocks: [
        {
          title: "Quels stages ?",
          body: "Stages d'observation et actifs. Vous recevez un tuteur de stage et participez à des projets en cours.",
          bullets: [
            "Travail social (bachelier / master)",
            "Agronomie et horticulture",
            "Soins animaliers et formations vétérinaires",
            "Communication, événements et récolte de fonds",
          ],
        },
        {
          title: "Comment postuler ?",
          body: "Envoyez-nous CV, motivation, période et horaires via le formulaire de contact. Nous planifions un entretien.",
        },
      ],
      practical: [
        { label: "Durée", value: "3 semaines à 6 mois" },
        { label: "Langues", value: "NL, FR, EN bienvenus" },
        { label: "Défraiement", value: "Non rémunéré — transport remboursé" },
      ],
      cta: { label: "Proposer votre stage", href: "/contact" },
      contact: {
        title: "Envie de faire un stage chez nous ?",
        intro:
          "Envoyez votre CV, votre motivation, la période et les horaires souhaités — nous planifions rapidement un entretien.",
      },
    },
    en: {
      eyebrow: "Engagement · Student internships",
      title: "Internship opportunities for students",
      lede: "We host interns from social work, agronomy, animal care and communication. Apply at least 3 months ahead.",
      blocks: [
        {
          title: "Which internships?",
          body: "Observation and hands-on internships. You get a dedicated mentor and work on live projects.",
          bullets: [
            "Social work (bachelor / master)",
            "Agronomy and horticulture",
            "Animal care and veterinary courses",
            "Communication, events and fundraising",
          ],
        },
        {
          title: "How to apply?",
          body: "Send us CV, motivation, target period and hours via the contact form. We'll plan a meeting.",
        },
      ],
      practical: [
        { label: "Duration", value: "3 weeks to 6 months" },
        { label: "Languages", value: "NL, FR, EN welcome" },
        { label: "Allowance", value: "Unpaid — travel reimbursed" },
      ],
      cta: { label: "Pitch your internship", href: "/contact" },
      contact: {
        title: "Want to apply for an internship?",
        intro:
          "Send your CV, motivation, preferred period and hours — we'll quickly plan a meeting.",
      },
    },
  },
};

/* ---------- Informatie / Visiter / Visit ---------- */

const INFORMATIE: Record<string, LocaleEntry> = {
  rooster: {
    nl: {
      eyebrow: "Bezoeken · Rooster",
      title: "Openingsuren & rooster",
      lede: "De boerderij is elke week open voor vrij bezoek. Groepen op reservatie.",
      blocks: [
        {
          title: "Vrij bezoek",
          body: "Dinsdag tot en met zaterdag, 10:00 – 16:30. Gratis toegang. Gesloten op zon- en maandag, op feestdagen en tussen kerst en nieuwjaar.",
        },
        {
          title: "Groepen op reservatie",
          body: "Scholen, gezinnen en bedrijven kunnen buiten de opendaguren terecht. Reserveer minstens 2 weken op voorhand.",
        },
        {
          title: "Evenementen",
          body: "Bekijk onze socials voor werkdagen, opendagen en jaarlijkse feesten (lente-feest in april, oogstfeest in september).",
        },
      ],
      practical: [
        { label: "Vrij bezoek", value: "Di – Za · 10:00 – 16:30" },
        { label: "Gesloten", value: "Zo, Ma, feestdagen" },
        { label: "Reservatie groepen", value: "≥ 2 weken vooraf" },
      ],
    },
    fr: {
      eyebrow: "Visiter · Horaires",
      title: "Horaires d'ouverture",
      lede: "La ferme est ouverte chaque semaine en visite libre. Groupes sur réservation.",
      blocks: [
        {
          title: "Visite libre",
          body: "Mardi au samedi, 10h00 – 16h30. Entrée gratuite. Fermé les dimanche, lundi, jours fériés et entre Noël et Nouvel An.",
        },
        {
          title: "Groupes sur réservation",
          body: "Écoles, familles et entreprises peuvent venir en dehors des heures libres. Réservation au moins 2 semaines à l'avance.",
        },
        {
          title: "Événements",
          body: "Suivez-nous sur les réseaux pour les journées de travail, portes ouvertes et fêtes annuelles (fête du printemps en avril, fête des récoltes en septembre).",
        },
      ],
      practical: [
        { label: "Visite libre", value: "Ma – Sa · 10h00 – 16h30" },
        { label: "Fermé", value: "Dim, Lun, jours fériés" },
        { label: "Groupes", value: "≥ 2 semaines à l'avance" },
      ],
    },
    en: {
      eyebrow: "Visit · Opening hours",
      title: "Opening hours & schedule",
      lede: "The farm is open weekly for free visits. Groups by reservation.",
      blocks: [
        {
          title: "Free visit",
          body: "Tuesday through Saturday, 10:00 – 16:30. Free entry. Closed Sundays, Mondays, public holidays and between Christmas and New Year.",
        },
        {
          title: "Groups by reservation",
          body: "Schools, families and companies can visit outside the open hours. Book at least 2 weeks ahead.",
        },
        {
          title: "Events",
          body: "Follow our socials for work days, open days and yearly festivities (spring feast in April, harvest feast in September).",
        },
      ],
      practical: [
        { label: "Free visit", value: "Tue – Sat · 10:00 – 16:30" },
        { label: "Closed", value: "Sun, Mon, holidays" },
        { label: "Group booking", value: "≥ 2 weeks ahead" },
      ],
    },
  },
  toegankelijkheid: {
    nl: {
      eyebrow: "Bezoeken · Toegankelijkheid",
      title: "Toegankelijkheid van de boerderij",
      lede: "We doen ons best om iedereen te ontvangen — hier vind je wat vandaag mogelijk is en waar we nog aan werken.",
      blocks: [
        {
          title: "Rolstoelgebruikers",
          body: "De hoofdroute langs de dierenweides is verhard en toegankelijk. De moestuin en het achterhof zijn deels toegankelijk (grind en drempels).",
        },
        { title: "Sanitair", body: "Aangepast toilet aanwezig aan het onthaal." },
        {
          title: "Assistentiehonden",
          body: "Altijd welkom, mits vermelding aan het onthaal — sommige dierenzones sluiten we tijdelijk af.",
        },
        {
          title: "Sensorische ondersteuning",
          body: "Op vraag voorzien we een rustige zone en beeld-woordkaarten. Neem contact op vóór je bezoek.",
        },
      ],
      practical: [
        { label: "Rolstoel", value: "Hoofdroute toegankelijk" },
        { label: "Aangepast WC", value: "Ja" },
        { label: "Parking", value: "Aangepaste plaats aan het park" },
      ],
      cta: { label: "Meld ons je noden", href: "/contact" },
      contact: {
        title: "Vraag over toegankelijkheid?",
        intro:
          "Heb je een rolstoel, kom je met een assistentiehond, of heb je een andere specifieke nood? Laat het ons vooraf weten, dan bereiden we je bezoek optimaal voor.",
      },
    },
    fr: {
      eyebrow: "Visiter · Accessibilité",
      title: "Accessibilité de la ferme",
      lede: "Nous faisons notre possible pour accueillir chacun·e — voici ce qui est possible aujourd'hui et ce sur quoi nous travaillons encore.",
      blocks: [
        {
          title: "Personnes en fauteuil",
          body: "Le parcours principal le long des enclos est en dur et accessible. Le potager et l'arrière-cour sont partiellement accessibles (gravier, seuils).",
        },
        { title: "Sanitaires", body: "Toilette adaptée à l'accueil." },
        {
          title: "Chiens d'assistance",
          body: "Toujours bienvenus, en signalant à l'accueil — certaines zones animales sont temporairement fermées.",
        },
        {
          title: "Soutien sensoriel",
          body: "Sur demande, une zone calme et des pictogrammes. Contactez-nous avant votre visite.",
        },
      ],
      practical: [
        { label: "Fauteuil roulant", value: "Parcours principal accessible" },
        { label: "WC adapté", value: "Oui" },
        { label: "Parking", value: "Place adaptée près du parc" },
      ],
      cta: { label: "Signalez vos besoins", href: "/contact" },
      contact: {
        title: "Une question sur l'accessibilité ?",
        intro:
          "Vous utilisez un fauteuil roulant, venez avec un chien d'assistance ou avez un autre besoin spécifique ? Prévenez-nous à l'avance pour préparer au mieux votre visite.",
      },
    },
    en: {
      eyebrow: "Visit · Accessibility",
      title: "Farm accessibility",
      lede: "We do our best to welcome everyone — here's what's possible today and what we're still improving.",
      blocks: [
        {
          title: "Wheelchair users",
          body: "The main route along the pastures is paved and accessible. The garden and back yard are partly accessible (gravel and thresholds).",
        },
        { title: "Sanitary", body: "Adapted toilet at the reception." },
        {
          title: "Assistance dogs",
          body: "Always welcome, please tell reception — some animal zones may be temporarily closed.",
        },
        {
          title: "Sensory support",
          body: "On request we set up a quiet zone and picture cards. Please contact us ahead of your visit.",
        },
      ],
      practical: [
        { label: "Wheelchair", value: "Main route accessible" },
        { label: "Adapted WC", value: "Yes" },
        { label: "Parking", value: "Adapted spot near the park" },
      ],
      cta: { label: "Tell us your needs", href: "/contact" },
      contact: {
        title: "Question about accessibility?",
        intro:
          "Do you use a wheelchair, come with an assistance dog, or have another specific need? Let us know in advance so we can prepare for your visit.",
      },
    },
  },
};

const REGISTRY: Record<HubKey, Record<string, LocaleEntry>> = {
  bezoekers: BEZOEKERS,
  betrokkenheid: BETROKKENHEID,
  informatie: INFORMATIE,
};

export function getHubEntry(hub: HubKey, slug: string, lang: Lang = "nl"): HubEntry | undefined {
  const loc = REGISTRY[hub]?.[slug];
  if (!loc) return undefined;
  return loc[lang] ?? loc.nl;
}

export function hasHubSlug(hub: HubKey, slug: string): boolean {
  return Boolean(REGISTRY[hub]?.[slug]);
}

export function listHubSlugs(hub: HubKey): string[] {
  return Object.keys(REGISTRY[hub] ?? {});
}

/* ---------- Top-level menu (mega-menu + mobile accordion) ---------- */

type MenuLabelDict = Record<Lang, { label: string; hint?: string }>;

type MenuItem = { href: string; i18n: MenuLabelDict };

type MenuHub = { key: string; i18n: Record<Lang, string>; items: MenuItem[] };

const MENU: MenuHub[] = [
  {
    key: "bezoeken",
    i18n: { nl: "Bezoeken", fr: "Visiter", en: "Visit" },
    items: [
      {
        href: "/informatie/rooster",
        i18n: {
          nl: { label: "Rooster & openingsuren", hint: "Wanneer kun je langskomen?" },
          fr: { label: "Horaires d'ouverture", hint: "Quand nous rendre visite ?" },
          en: { label: "Opening hours", hint: "When can you drop by?" },
        },
      },
      {
        href: "/informatie/toegankelijkheid",
        i18n: {
          nl: { label: "Toegankelijkheid", hint: "Wat is mogelijk voor iedereen?" },
          fr: { label: "Accessibilité", hint: "Ce qui est possible pour chacun·e" },
          en: { label: "Accessibility", hint: "What's possible for everyone" },
        },
      },
      {
        href: "/contact",
        i18n: {
          nl: { label: "Locatie & contact", hint: "Adres, route en bereikbaarheid" },
          fr: { label: "Localisation & contact", hint: "Adresse, itinéraire, contact" },
          en: { label: "Location & contact", hint: "Address, route and contact" },
        },
      },
    ],
  },
  {
    key: "programmas",
    i18n: { nl: "Programma's", fr: "Programmes", en: "Programmes" },
    items: [
      {
        href: "/bezoekers/school",
        i18n: {
          nl: { label: "School & Non-profit", hint: "Educatieve animaties & sociale groepen" },
          fr: { label: "École & Non-profit", hint: "Animations éducatives & groupes sociaux" },
          en: { label: "School & Non-profit", hint: "Educational activities & social groups" },
        },
      },
      {
        href: "/bezoekers/familie",
        i18n: {
          nl: { label: "Familie & Feest", hint: "Verjaardagen, ateliers, vrij bezoek" },
          fr: { label: "Famille & Fête", hint: "Anniversaires, ateliers, visite libre" },
          en: { label: "Family & Celebrations", hint: "Birthdays, workshops, free visits" },
        },
      },
      {
        href: "/vakantiestages",
        i18n: {
          nl: { label: "Vakantiestages", hint: "Een week boerderij voor 6 tot 10 jaar" },
          fr: { label: "Stages à la ferme", hint: "Une semaine à la ferme, 6 à 10 ans" },
          en: { label: "Holiday camps", hint: "A week at the farm, ages 6 to 10" },
        },
      },
      {
        href: "/bezoekers/bedrijf",
        i18n: {
          nl: { label: "Bedrijf & Teambuilding", hint: "Team-dagen met sociale impact" },
          fr: { label: "Entreprise & Teambuilding", hint: "Journées d'équipe à impact social" },
          en: { label: "Business & Team-building", hint: "Team days with social impact" },
        },
      },
      {
        href: "/verhuur",
        i18n: {
          nl: { label: "Verhuur & Privéverhuur", hint: "Ruimtes voor jouw event" },
          fr: { label: "Location & Location privée", hint: "Espaces pour votre événement" },
          en: { label: "Rental & Private hire", hint: "Spaces for your event" },
        },
      },
    ],
  },
  {
    key: "betrokkenheid",
    i18n: { nl: "Betrokkenheid", fr: "Engagement", en: "Engagement" },
    items: [
      {
        href: "/betrokkenheid/vrijwilligers",
        i18n: {
          nl: { label: "Vrijwilligerswerk", hint: "Word deel van het team" },
          fr: { label: "Bénévolat", hint: "Rejoignez l'équipe" },
          en: { label: "Volunteering", hint: "Join the team" },
        },
      },
      {
        href: "/betrokkenheid/stages",
        i18n: {
          nl: { label: "Studentstages", hint: "Sociaal, agronomie, dierenzorg" },
          fr: { label: "Stages étudiants", hint: "Social, agronomie, animaux" },
          en: { label: "Student internships", hint: "Social work, agronomy, animals" },
        },
      },
      {
        href: "/steun",
        i18n: {
          nl: { label: "Sponsoring & Donatie", hint: "Steun onze werking (Wero, overschrijving)" },
          fr: { label: "Mécénat & Don", hint: "Soutenez notre action" },
          en: { label: "Sponsoring & Donation", hint: "Support our work" },
        },
      },
    ],
  },
  {
    key: "over-ons",
    i18n: { nl: "Over Ons", fr: "À propos", en: "About us" },
    items: [
      {
        href: "/wie-zijn-we",
        i18n: {
          nl: {
            label: "Missie, Team & Historie",
            hint: "Wie we zijn, wat we doen, waar we vandaan komen",
          },
          fr: { label: "Mission, Équipe & Histoire", hint: "Qui nous sommes et d'où nous venons" },
          en: { label: "Mission, Team & History", hint: "Who we are and where we come from" },
        },
      },
    ],
  },
  {
    key: "shop",
    i18n: { nl: "Shop", fr: "Boutique", en: "Shop" },
    items: [
      {
        href: "/webshop",
        i18n: {
          nl: { label: "Webshop", hint: "Lokaal assortiment van de boerderij" },
          fr: { label: "Boutique", hint: "Produits locaux de la ferme" },
          en: { label: "Shop", hint: "Local farm products" },
        },
      },
    ],
  },
];

export type ResolvedHub = {
  key: string;
  label: string;
  items: { label: string; href: string; hint?: string }[];
};

export function getHubMenu(lang: Lang): ResolvedHub[] {
  return MENU.map((h) => ({
    key: h.key,
    label: h.i18n[lang] ?? h.i18n.nl,
    items: h.items.map((it) => ({
      href: it.href,
      label: (it.i18n[lang] ?? it.i18n.nl).label,
      hint: (it.i18n[lang] ?? it.i18n.nl).hint,
    })),
  }));
}

/** Backwards-compat export for anything still importing HUB_MENU. */
export const HUB_MENU = getHubMenu("nl");
