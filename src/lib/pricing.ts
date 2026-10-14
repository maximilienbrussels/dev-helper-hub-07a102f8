/**
 * Eén bron van waarheid voor alle tarieven.
 *
 * De statische bestanden (rental-spaces, birthday-packages, ...) blijven het
 * vangnet: zolang er geen rij in `pricing_items` staat, gelden hun waarden.
 * Zodra het team een tarief aanpast in het portaal, verandert zowel de
 * publieke weergave als de berekening bij het betalen.
 */
import { RENTAL_SPACES } from "./rental-spaces";
import { BIRTHDAY_PACKAGES, BIRTHDAY_DEPOSIT, EXTRA_CHILD_PRICE } from "./birthday-packages";
import { SCHOOL_ANIMATIONS } from "./school-animations";
import { TEAMBUILDING_FORMULAS } from "./teambuilding";
import { SEMINAR_FORMATS } from "./seminars";
import { CAMP_PRICES } from "./farm-camps";

export type PricingMap = Record<string, number>;

export type PricingItem = {
  key: string;
  amount: number;
  label: { nl: string; fr: string; en: string };
};

function item(key: string, amount: number, nl: string, fr = nl, en = nl): PricingItem {
  return { key, amount, label: { nl, fr, en } };
}

/** Alle bekende tarieven met hun standaardwaarde uit de code. */
export const PRICING_DEFAULT_ITEMS: PricingItem[] = [
  ...RENTAL_SPACES.flatMap((s) => {
    const rows: PricingItem[] = [
      item(`rental.${s.slug}.full`, s.fullDay, `${s.copy.nl.title} — hele dag`, `${s.copy.fr.title} — journée`, `${s.copy.en.title} — full day`),
    ];
    if (s.halfDay !== null) {
      rows.unshift(
        item(`rental.${s.slug}.half`, s.halfDay, `${s.copy.nl.title} — halve dag`, `${s.copy.fr.title} — demi-journée`, `${s.copy.en.title} — half day`),
      );
    }
    return rows;
  }),
  ...BIRTHDAY_PACKAGES.map((p) =>
    item(`birthday.${p.slug}`, p.price, p.copy.nl.title, p.copy.fr.title, p.copy.en.title),
  ),
  item("birthday.deposit", BIRTHDAY_DEPOSIT, "Kinderfeestje — waarborg", "Fête d'enfants — caution", "Children's party — deposit"),
  item("birthday.extraChild", EXTRA_CHILD_PRICE, "Kinderfeestje — extra kind", "Fête d'enfants — enfant supplémentaire", "Children's party — extra child"),
  ...SCHOOL_ANIMATIONS.map((a) =>
    item(`animation.${a.slug}`, a.price, a.copy.nl.title, a.copy.fr.title, a.copy.en.title),
  ),
  ...TEAMBUILDING_FORMULAS.map((f) =>
    item(
      `teambuilding.${f.slug}.perPerson`,
      f.pricePerPerson,
      `${f.copy.nl.title} — per persoon`,
      `${f.copy.fr.title} — par personne`,
      `${f.copy.en.title} — per person`,
    ),
  ),
  ...SEMINAR_FORMATS.map((f) =>
    item(`seminar.${f.id}.from`, f.fromPrice, `${f.copy.nl.title} — vanaf`, `${f.copy.fr.title} — à partir de`, `${f.copy.en.title} — from`),
  ),
  item("camp.week", CAMP_PRICES.normal[1], "Vakantiestage — één week", "Stage — une semaine", "Holiday camp — one week"),
  item("camp.week.social", CAMP_PRICES.social[1], "Vakantiestage — sociaal tarief", "Stage — tarif social", "Holiday camp — social rate"),
  item("booking.teambuilding", 450, "Teambuilding — halve dag (groep)", "Team building — demi-journée (groupe)", "Team building — half day (group)"),
  item("booking.peterschap_maand", 60, "Peterschap — per jaar", "Parrainage — par an", "Sponsorship — per year"),
];

export const PRICING_DEFAULTS: PricingMap = Object.fromEntries(
  PRICING_DEFAULT_ITEMS.map((i) => [i.key, i.amount]),
);

/** Tarief opzoeken met de code-waarde als vangnet. */
export function priceOf(map: PricingMap | undefined, key: string, fallback?: number): number {
  const value = map?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback ?? PRICING_DEFAULTS[key] ?? 0;
}
