import type { Lang } from "@/lib/i18n";

/** Warme wachtberichtjes in plaats van generieke typbolletjes. */
export const TYPING_LINES: Record<Lang, string[]> = {
  nl: [
    "Maxim vraagt het even aan de boer...",
    "Maxim kijkt op de MIVB-borden...",
    "Maxim stapt even naar de moestuin...",
    "Maxim geeft de geiten nog snel een aai...",
  ],
  fr: [
    "Maxim demande vite au fermier...",
    "Maxim regarde les écrans de la STIB...",
    "Maxim fait un saut au potager...",
    "Maxim caresse encore une chèvre...",
  ],
  en: [
    "Maxim is asking the farmer...",
    "Maxim is checking the metro boards...",
    "Maxim is popping over to the veg garden...",
    "Maxim is giving the goats a quick cuddle...",
  ],
};

export function randomTypingLine(lang: Lang): string {
  const lines = TYPING_LINES[lang] ?? TYPING_LINES.nl;
  return lines[Math.floor(Math.random() * lines.length)]!;
}

/** Dagdeelgroet op basis van de lokale Brusselse tijd. */
function dayPart(lang: Lang, hour: number): string {
  const key = hour < 12 ? 0 : hour < 18 ? 1 : 2;
  const table: Record<Lang, string[]> = {
    nl: ["Goedemorgen", "Goedemiddag", "Goedenavond"],
    fr: ["Bonjour", "Bon après-midi", "Bonsoir"],
    en: ["Good morning", "Good afternoon", "Good evening"],
  };
  return (table[lang] ?? table.nl)[key]!;
}

/** Bouwt de openingsgroet met live weer en tijdstip. */
export function buildGreeting(
  lang: Lang,
  weather: { temperature: number; condition: string } | null,
  now: Date = new Date(),
): string {
  const hour = Number(
    new Intl.DateTimeFormat("nl-BE", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Brussels",
    }).format(now),
  );
  const hello = dayPart(lang, Number.isFinite(hour) ? hour : now.getHours());

  const tail: Record<Lang, string> = {
    nl: "Zoek je de snelste route naar de boerderij, of wil je een bezoek plannen?",
    fr: "Cherchez-vous le trajet le plus rapide vers la ferme, ou souhaitez-vous planifier une visite ?",
    en: "Are you looking for the fastest route to the farm, or would you like to plan a visit?",
  };

  if (!weather) {
    const plain: Record<Lang, string> = {
      nl: `${hello}! 🌿 Leuk dat je er bent. ${tail.nl}`,
      fr: `${hello} ! 🌿 Ravi de vous voir. ${tail.fr}`,
      en: `${hello}! 🌿 Lovely to see you. ${tail.en}`,
    };
    return plain[lang] ?? plain.nl;
  }

  const w = `${weather.temperature}°C`;
  const cond = weather.condition.toLowerCase();
  const rich: Record<Lang, string> = {
    nl: `${hello}! 🌿 Het is nu ${w} en ${cond} in Brussel. De dieren genieten van het buitenweer! ${tail.nl}`,
    fr: `${hello} ! 🌿 Il fait ${w} et ${cond} à Bruxelles. Les animaux profitent du plein air ! ${tail.fr}`,
    en: `${hello}! 🌿 It's ${w} and ${cond} in Brussels right now. The animals are enjoying the outdoors! ${tail.en}`,
  };
  return rich[lang] ?? rich.nl;
}

type Pill = { label: string; send: string };

const P = (label: string): Pill => ({ label, send: label });

/** 2 tot 3 contextuele snelle antwoorden bij elk bericht van Maxim. */
export function suggestReplies(answer: string, lang: Lang): Pill[] {
  const t = answer.toLowerCase();
  const l = (nl: string, fr: string, en: string) =>
    P(lang === "fr" ? fr : lang === "en" ? en : nl);

  if (/route|metro|métro|trein|train|bus|tram|fiets|vélo|velo|auto|voiture|car|station/.test(t)) {
    return [
      l("Hoe lang duurt dat ongeveer?", "Ça prend combien de temps ?", "How long does that take?"),
      l("Is er parking in de buurt?", "Y a-t-il un parking à proximité ?", "Is there parking nearby?"),
      l("Wanneer zijn jullie open?", "Quels sont vos horaires ?", "When are you open?"),
    ];
  }
  if (/dier|geit|ezel|konijn|animal|chèvre|chevre|âne|ane|pony|schaap|mouton|alpaca/.test(t)) {
    return [
      l("Mag ik de dieren voeren?", "Puis-je nourrir les animaux ?", "May I feed the animals?"),
      l("Wanneer is het voedertijd?", "Quand a lieu le nourrissage ?", "When is feeding time?"),
      l("Mag mijn hond mee?", "Mon chien peut-il venir ?", "Can I bring my dog?"),
    ];
  }
  if (/verjaardag|feest|anniversaire|birthday|stage|workshop|teambuilding|zaal|salle/.test(t)) {
    return [
      l("Wat kost dat?", "Quel est le prix ?", "What does it cost?"),
      l("Hoe reserveer ik?", "Comment réserver ?", "How do I book?"),
      l("Voor hoeveel personen?", "Pour combien de personnes ?", "For how many people?"),
    ];
  }
  if (/open|uur|heure|hour|gesloten|fermé|ferme le|closed/.test(t)) {
    return [
      l("Is de toegang gratis?", "L'entrée est-elle gratuite ?", "Is entry free?"),
      l("Hoe raak ik er met het openbaar vervoer?", "Comment venir en transports en commun ?", "How do I get there by public transport?"),
      l("Wat kan ik daar doen?", "Que peut-on y faire ?", "What can I do there?"),
    ];
  }
  return [
    l("Wat kan ik daar zien?", "Que peut-on y voir ?", "What can I see there?"),
    l("Hoe raak ik er?", "Comment s'y rendre ?", "How do I get there?"),
    l("Wanneer zijn jullie open?", "Quels sont vos horaires ?", "When are you open?"),
  ];
}
