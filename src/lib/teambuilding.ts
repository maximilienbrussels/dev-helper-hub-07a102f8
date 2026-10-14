/**
 * Teambuilding — twee formules zoals op de oude site:
 * "à la ferme" (stadsboerderij, tot 100 personen) en "à la campagne"
 * (Sterrebeek, tot 200 personen). Prijs per persoon, halve of hele dag.
 */

import type { Lang } from "@/lib/i18n";

export type TeamBuildingSlug = "ferme" | "campagne";
export type TeamBuildingDuration = "half" | "full";

export const TEAMBUILDING_HOURS: Record<TeamBuildingDuration, number> = {
  half: 3,
  full: 6,
};

export type TeamBuildingFormula = {
  slug: TeamBuildingSlug;
  /** Vanafprijs per persoon (excl. catering). */
  pricePerPerson: number;
  minPeople: number;
  maxPeople: number;
  copy: Record<
    Lang,
    {
      title: string;
      place: string;
      lede: string;
      activities: string[];
      includes: string[];
    }
  >;
};

export const TEAMBUILDING_FORMULAS: TeamBuildingFormula[] = [
  {
    slug: "ferme",
    pricePerPerson: 50,
    minPeople: 10,
    maxPeople: 100,
    copy: {
      nl: {
        title: "Teambuilding op de stadsboerderij",
        place: "Schipperijkaai 2, 1000 Brussel — 5 min. van Brussel-Centraal",
        lede: "Een dag met de handen in de aarde, midden in de stad. Je team werkt samen aan echte boerderijtaken en sluit af rond de tafel.",
        activities: [
          "Moestuinatelier: zaaien, planten en oogsten voor de solidaire verdeling",
          "Dierenverzorging onder begeleiding van onze animatoren",
          "Bouwatelier: insectenhotels, bakken of composteerruimte",
          "Kookmoment met de oogst van de dag",
          "Boerderijquiz en rondleiding over biodiversiteit in de stad",
        ],
        includes: [
          "Twee animatoren voor de hele duur",
          "Al het materiaal en werkkledij",
          "Gefilterd water, koffie en thee",
          "Onthaalzaal of polyvalente ruimte bij regen",
          "Sanitair, vestiaire en fietsenstalling",
        ],
      },
      fr: {
        title: "Team building à la ferme urbaine",
        place: "Quai du Batelage 2, 1000 Bruxelles — à 5 min de Bruxelles-Central",
        lede: "Une journée les mains dans la terre, en pleine ville. Votre équipe collabore sur de vraies tâches de ferme et termine autour de la table.",
        activities: [
          "Atelier potager : semer, planter et récolter pour la distribution solidaire",
          "Soin des animaux encadré par nos animateurs",
          "Atelier construction : hôtels à insectes, bacs ou espace compost",
          "Moment cuisine avec la récolte du jour",
          "Quiz de la ferme et visite guidée sur la biodiversité urbaine",
        ],
        includes: [
          "Deux animateurs pendant toute la durée",
          "Tout le matériel et les vêtements de travail",
          "Eau filtrée, café et thé",
          "Salle d'accueil ou espace polyvalent en cas de pluie",
          "Sanitaires, vestiaires et parking vélos",
        ],
      },
      en: {
        title: "Team building at the urban farm",
        place: "Quai du Batelage 2, 1000 Brussels — 5 min from Brussels-Central",
        lede: "A day with your hands in the soil, right in the city. Your team works together on real farm tasks and finishes around the table.",
        activities: [
          "Kitchen-garden workshop: sowing, planting and harvesting for the solidarity distribution",
          "Animal care guided by our facilitators",
          "Building workshop: insect hotels, planters or the compost area",
          "Cooking session with the day's harvest",
          "Farm quiz and guided tour on urban biodiversity",
        ],
        includes: [
          "Two facilitators for the whole session",
          "All materials and work clothing",
          "Filtered water, coffee and tea",
          "Reception room or multipurpose space if it rains",
          "Toilets, cloakroom and bicycle parking",
        ],
      },
    },
  },
  {
    slug: "campagne",
    pricePerPerson: 50,
    minPeople: 15,
    maxPeople: 200,
    copy: {
      nl: {
        title: "Teambuilding op het platteland",
        place: "Sterrebeek, op 20 min. van Brussel",
        lede: "Meer ruimte, meer groen en plaats voor grote groepen. Weiden, boomgaard en een grote schuur voor het gezamenlijke slot.",
        activities: [
          "Landbouwparcours in de weiden en de boomgaard",
          "Hooi- en oogstateliers per subteam",
          "Vuurkorf, brood bakken en kookwedstrijd",
          "Oriëntatietocht met opdrachten rond natuur en samenwerking",
          "Sportieve boerenspelen voor grote groepen",
        ],
        includes: [
          "Animatoren volgens groepsgrootte (1 per 20 personen)",
          "Materiaal, werkkledij en laarzen",
          "Schuur en overdekte ruimte bij slecht weer",
          "Parking op het terrein",
          "Water, koffie en thee",
        ],
      },
      fr: {
        title: "Team building à la campagne",
        place: "Sterrebeek, à 20 min de Bruxelles",
        lede: "Plus d'espace, plus de vert et de la place pour les grands groupes. Prairies, verger et une grande grange pour la clôture commune.",
        activities: [
          "Parcours agricole dans les prairies et le verger",
          "Ateliers foin et récolte par sous-équipes",
          "Feu de camp, pain cuit sur place et concours de cuisine",
          "Course d'orientation avec défis nature et coopération",
          "Jeux de ferme sportifs pour grands groupes",
        ],
        includes: [
          "Animateurs selon la taille du groupe (1 pour 20 personnes)",
          "Matériel, vêtements de travail et bottes",
          "Grange et espace couvert en cas de mauvais temps",
          "Parking sur le site",
          "Eau, café et thé",
        ],
      },
      en: {
        title: "Team building in the countryside",
        place: "Sterrebeek, 20 min from Brussels",
        lede: "More space, more green and room for large groups. Meadows, an orchard and a large barn for the closing session.",
        activities: [
          "Farming trail through the meadows and orchard",
          "Hay and harvest workshops in sub-teams",
          "Campfire, freshly baked bread and a cooking contest",
          "Orienteering course with nature and cooperation challenges",
          "Sporty farm games for large groups",
        ],
        includes: [
          "Facilitators based on group size (1 per 20 people)",
          "Materials, work clothing and boots",
          "Barn and covered space in bad weather",
          "On-site parking",
          "Water, coffee and tea",
        ],
      },
    },
  },
];

export const TEAMBUILDING_CATERING: Record<Lang, string[]> = {
  nl: [
    "Ontbijt met lokaal brood en confituur — op aanvraag",
    "Warme of koude lunch met producten van het seizoen — op aanvraag",
    "Pauzes met koffie, thee en cake — op aanvraag",
    "Aperitief en barbecue om af te sluiten — op aanvraag",
  ],
  fr: [
    "Petit-déjeuner avec pain local et confiture — sur demande",
    "Lunch chaud ou froid avec des produits de saison — sur demande",
    "Pauses café, thé et cake — sur demande",
    "Apéritif et barbecue pour clôturer — sur demande",
  ],
  en: [
    "Breakfast with local bread and jam — on request",
    "Hot or cold lunch with seasonal produce — on request",
    "Breaks with coffee, tea and cake — on request",
    "Aperitif and barbecue to finish — on request",
  ],
};

export const TEAMBUILDING_NOTES: Record<Lang, string[]> = {
  nl: [
    "Prijs vanaf € 50 per persoon, afhankelijk van formule, duur en catering.",
    "Halve dag = 3 uur, hele dag = 6 uur inclusief pauzes.",
    "Alle activiteiten gaan door in NL, FR of EN — je kiest de taal bij de aanvraag.",
    "De opbrengst gaat integraal naar de werking van de boerderij en haar sociale projecten.",
  ],
  fr: [
    "Prix à partir de 50 € par personne, selon la formule, la durée et le catering.",
    "Demi-journée = 3 heures, journée = 6 heures pauses comprises.",
    "Toutes les activités se déroulent en FR, NL ou EN — vous choisissez lors de la demande.",
    "Les recettes financent intégralement la ferme et ses projets sociaux.",
  ],
  en: [
    "From €50 per person, depending on the formula, duration and catering.",
    "Half day = 3 hours, full day = 6 hours including breaks.",
    "All activities run in EN, FR or NL — you pick the language when requesting.",
    "All proceeds go to the farm and its social projects.",
  ],
};

export function getTeamBuilding(slug: string): TeamBuildingFormula | undefined {
  return TEAMBUILDING_FORMULAS.find((f) => f.slug === slug);
}
