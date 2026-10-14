import { shuffle } from "./academy-shuffle";

/** Minimale vraagvorm die de selectie nodig heeft. */
export type SelectieVraag = {
  id: string;
  module: number | null;
  doelgroep: string | null;
  variant_groep: string | null;
  verplicht: boolean;
  moeilijkheid: number | null;
};

export type SelectieOpties = {
  /** "kids" = één ronde, "16plus" = drie rondes. */
  doelgroep: "kids" | "16plus";
  /** Gewenst aantal vragen in de test (kan lager uitvallen bij te weinig aanbod). */
  aantal: number;
};

/** Aantal rondes per spoor: kinderen doen één doorloop, 16+ drie rondes. */
export function aantalRondes(doelgroep: "kids" | "16plus"): number {
  return doelgroep === "kids" ? 1 : 3;
}

/** Vragen die bij dit spoor horen ("beide" telt voor allebei). */
export function voorSpoor<T extends SelectieVraag>(
  alle: T[],
  doelgroep: "kids" | "16plus",
): T[] {
  return alle.filter((v) => {
    const d = (v.doelgroep ?? "beide").trim() || "beide";
    return d === doelgroep || d === "beide";
  });
}

/** Minimumdekking voor een inhoudelijk volwaardige, publiceerbare vragenbank. */
export function controleerPool<T extends SelectieVraag>(alle: T[]) {
  const kids = voorSpoor(alle, "kids");
  const adult = voorSpoor(alle, "16plus");
  const adultPerRonde = [1, 2, 3].map((module) =>
    adult.filter((v) => (v.module ?? 1) === module).length,
  );
  return {
    kids: kids.length,
    adult: adult.length,
    adultPerRonde,
    publiceerbaar: kids.length >= 8 && adult.length >= 15 && adultPerRonde.every((n) => n >= 5),
  };
}

/**
 * Houdt hoogstens één vraag per variantgroep over. `gezien` wordt gedeeld over
 * de rondes heen, zodat niemand dezelfde vraag anders verwoord terugkrijgt.
 */
function zonderDubbeleVarianten<T extends SelectieVraag>(rijen: T[], gezien: Set<string>): T[] {
  const uit: T[] = [];
  for (const v of rijen) {
    const groep = v.variant_groep?.trim();
    if (groep) {
      if (gezien.has(groep)) continue;
      gezien.add(groep);
    }
    uit.push(v);
  }
  return uit;
}

/** Oplopend in moeilijkheid: ronde 1 het makkelijkst, ronde 3 het zwaarst. */
function opMoeilijkheid<T extends SelectieVraag>(rijen: T[], oplopend: boolean): T[] {
  return [...rijen].sort((a, b) => {
    const x = a.moeilijkheid ?? 2;
    const y = b.moeilijkheid ?? 2;
    return oplopend ? x - y : y - x;
  });
}

/**
 * Kiest de vragen voor één examenpoging.
 *
 * - uitsluitend vragen van het gekozen spoor (of "beide"); bij te weinig
 *   aanbod wordt de test korter in plaats van dat er vragen van een andere
 *   leeftijd binnensluipen;
 * - verplichte vragen komen altijd eerst;
 * - hoogstens één vraag per variantgroep in de héle test;
 * - bij 16+ drie rondes die oplopen in moeilijkheid.
 */
export function kiesVragen<T extends SelectieVraag>(alle: T[], opties: SelectieOpties): T[] {
  const pool = voorSpoor(alle, opties.doelgroep);
  const rondes = aantalRondes(opties.doelgroep);
  const gezieneVarianten = new Set<string>();

  if (rondes === 1) {
    const kandidaten = zonderDubbeleVarianten(
      [
        ...shuffle(pool.filter((v) => v.verplicht)),
        ...opMoeilijkheid(shuffle(pool.filter((v) => !v.verplicht)), true),
      ],
      gezieneVarianten,
    );
    return kandidaten.slice(0, opties.aantal).map((v) => ({ ...v, module: 1 }) as T);
  }

  const perRonde = Math.max(1, Math.round(opties.aantal / rondes));
  const gekozen: T[] = [];
  const gebruikt = new Set<string>();

  for (const m of [1, 2, 3]) {
    const vanRonde = pool.filter((v) => (v.module ?? 1) === m && !gebruikt.has(v.id));
    const kandidaten = zonderDubbeleVarianten(
      [
        ...shuffle(vanRonde.filter((v) => v.verplicht)),
        ...opMoeilijkheid(shuffle(vanRonde.filter((v) => !v.verplicht)), m < 3),
      ],
      gezieneVarianten,
    ).slice(0, perRonde);
    for (const v of kandidaten) gebruikt.add(v.id);
    gekozen.push(...kandidaten.map((v) => ({ ...v, module: m }) as T));
  }

  // Rondes met te weinig eigen vragen aanvullen uit de overige vragen van
  // hetzelfde spoor — nooit uit een ander leeftijdsspoor.
  if (gekozen.length < opties.aantal) {
    const rest = zonderDubbeleVarianten(
      shuffle(pool.filter((v) => !gebruikt.has(v.id))),
      gezieneVarianten,
    );
    for (const v of rest) {
      if (gekozen.length >= opties.aantal) break;
      const telPerRonde = [1, 2, 3].map((m) => gekozen.filter((g) => g.module === m).length);
      const magerste = (telPerRonde.indexOf(Math.min(...telPerRonde)) + 1) as 1 | 2 | 3;
      gebruikt.add(v.id);
      gekozen.push({ ...v, module: magerste } as T);
    }
  }

  // Binnen elke ronde willekeurige volgorde, rondes blijven 1 -> 2 -> 3.
  const uit: T[] = [];
  for (const m of [1, 2, 3]) uit.push(...shuffle(gekozen.filter((v) => v.module === m)));
  return uit;
}
