/**
 * Eenvoudige, regelgebaseerde FAQ-bot.
 *
 * Werkt 100% offline: geen API-sleutel, geen netwerk, geen tokens. Wordt
 * gebruikt wanneer het team de AI-motor uitschakelt of wanneer de AI-provider
 * faalt (fout, time-out, rate limit of opgebruikt tegoed).
 */

export type StaticBotLang = "nl" | "fr" | "en";

type Rule = {
  id: string;
  keywords: string[];
  reply: Record<StaticBotLang, string>;
};

const RULES: Rule[] = [
  {
    id: "openingstijden",
    keywords: ["open", "sluit", "uur", "wanneer", "zondag", "heure", "ouvert", "ferme", "hours", "when"],
    reply: {
      nl: "We zijn open van dinsdag t/m zaterdag van 09:30 tot 17:00 (winter: dinsdag t/m vrijdag 10:00–16:30). Op zondag en maandag zijn we gesloten.",
      fr: "Nous sommes ouverts du mardi au samedi de 09:30 à 17:00 (hiver : mardi à vendredi 10:00–16:30). Fermé le dimanche et le lundi.",
      en: "We're open Tuesday to Saturday from 09:30 to 17:00 (winter: Tuesday to Friday 10:00–16:30). Closed on Sunday and Monday.",
    },
  },
  {
    id: "locatie",
    keywords: ["adres", "route", "waar", "metro", "parking", "parkeren", "adresse", "où", "ou est", "address", "where", "parken"],
    reply: {
      nl: "Je vindt ons op Schipperijkaai 2, 1000 Brussel. Metro 2 of 6 tot IJzer/Yser (5 minuten wandelen) of Brussel-Noord (10 minuten). Parkeren doe je best in de buurtstraten.",
      fr: "Nous sommes au Quai du Batelage 2, 1000 Bruxelles. Métro 2 ou 6 jusqu'à Yser (5 minutes à pied) ou Bruxelles-Nord (10 minutes). Stationnement dans les rues avoisinantes.",
      en: "You'll find us at Quai du Batelage 2, 1000 Brussels. Metro 2 or 6 to Yser (5 minutes' walk) or Brussels-North (10 minutes). Park in the surrounding streets.",
    },
  },
  {
    id: "huisdieren",
    keywords: ["hond", "dieren", "kat", "meenemen", "chien", "chat", "animaux", "dog", "cat", "pets"],
    reply: {
      nl: "Honden mogen mee op het terrein, altijd aan een korte leiband zodat onze dieren niet schrikken. Andere huisdieren laat je beter thuis.",
      fr: "Les chiens sont admis sur le site, toujours en laisse courte pour ne pas effrayer nos animaux. Les autres animaux domestiques restent de préférence à la maison.",
      en: "Dogs are welcome on site, always on a short lead so our animals aren't startled. Other pets are best left at home.",
    },
  },
  {
    id: "voeren",
    keywords: ["voeren", "eten", "aaien", "geiten", "ezel", "nourrir", "manger", "chèvre", "âne", "feed", "goat", "donkey"],
    reply: {
      nl: "Onze dieren krijgen een strikt gebalanceerd dieet, dus eigen voer meebrengen mag niet. Rustig aaien en kijken mag zeker wel!",
      fr: "Nos animaux suivent un régime strictement équilibré : il n'est pas permis d'apporter votre propre nourriture. Les caresses tranquilles sont bien sûr les bienvenues !",
      en: "Our animals follow a strictly balanced diet, so please don't bring your own food. Gentle petting and watching are very welcome!",
    },
  },
  {
    id: "prijzen",
    keywords: ["prijs", "gratis", "kost", "ticket", "reserveren", "prix", "gratuit", "coût", "réserver", "price", "free", "cost", "book"],
    reply: {
      nl: "De vrije toegang is altijd 100% gratis. Voor workshops, verjaardagsfeestjes of zaalverhuur reserveer je via info@fermeduparcmaximilien.be.",
      fr: "L'entrée libre est toujours 100% gratuite. Pour les ateliers, anniversaires ou locations de salle, réservez via info@fermeduparcmaximilien.be.",
      en: "Free entry is always 100% free. For workshops, birthday parties or venue hire, book via info@fermeduparcmaximilien.be.",
    },
  },
];

const FALLBACK: Record<StaticBotLang, string> = {
  nl: "Ik werk momenteel in de eenvoudige modus. Voor specifieke vragen kun je ons bereiken via info@fermeduparcmaximilien.be of bekijk onze praktische info pagina.",
  fr: "Je fonctionne actuellement en mode simplifié. Pour des questions spécifiques, contactez-nous via info@fermeduparcmaximilien.be ou consultez notre page d'infos pratiques.",
  en: "I'm currently running in simple mode. For specific questions, reach us at info@fermeduparcmaximilien.be or check our practical information page.",
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Beste regel voor deze vraag, of null wanneer niets matcht. */
export function matchRule(question: string): Rule | null {
  const text = normalise(question);
  let best: { rule: Rule; score: number } | null = null;
  for (const rule of RULES) {
    const score = rule.keywords.filter((k) => text.includes(normalise(k))).length;
    if (score > 0 && (!best || score > best.score)) best = { rule, score };
  }
  return best?.rule ?? null;
}

export const StaticBot = {
  /** Antwoord zonder enige API-aanroep. */
  reply(question: string, lang: StaticBotLang = "nl"): string {
    const rule = matchRule(question ?? "");
    return rule ? rule.reply[lang] : FALLBACK[lang];
  },
};
