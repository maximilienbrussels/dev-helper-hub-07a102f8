import type { Lang } from "@/lib/i18n";

/** Twee sporen door de Academy: kinderen/jongeren en 16+/volwassenen. */
export const DOELGROEPEN = ["kids", "16plus"] as const;
export type Doelgroep = (typeof DOELGROEPEN)[number];

/** Waarde zoals opgeslagen bij een vraag: een spoor, of voor allebei. */
export const VRAAG_DOELGROEPEN = ["kids", "16plus", "beide"] as const;
export type VraagDoelgroep = (typeof VRAAG_DOELGROEPEN)[number];

const STORAGE_KEY = "academy.doelgroep";

type Copy = {
  title: string;
  sub: string;
  kids: string;
  kidsSub: string;
  adult: string;
  adultSub: string;
  switch: string;
};

const COPY: Record<Lang, Copy> = {
  nl: {
    title: "Voor wie is deze test?",
    sub: "Kies je spoor. Je kan later altijd wisselen.",
    kids: "Kinderen & jongeren",
    kidsSub: "6 – 15 jaar · eenvoudige taal, herkennen en verzorgen",
    adult: "16+ & volwassenen",
    adultSub: "Biologie, welzijn, wetgeving en ecologie in detail",
    switch: "Ander spoor",
  },
  fr: {
    title: "Pour qui est ce test ?",
    sub: "Choisis ton parcours. Tu peux changer à tout moment.",
    kids: "Enfants & jeunes",
    kidsSub: "6 – 15 ans · langage simple, reconnaître et soigner",
    adult: "16+ & adultes",
    adultSub: "Biologie, bien-être, législation et écologie en détail",
    switch: "Autre parcours",
  },
  en: {
    title: "Who is this test for?",
    sub: "Pick your track. You can switch at any time.",
    kids: "Children & teens",
    kidsSub: "Ages 6 – 15 · simple language, spotting and caring",
    adult: "16+ & adults",
    adultSub: "Biology, welfare, legislation and ecology in depth",
    switch: "Other track",
  },
};

export function doelgroepCopy(lang: Lang): Copy {
  return COPY[lang] ?? COPY.nl;
}

export function doelgroepLabel(d: Doelgroep, lang: Lang): string {
  const c = doelgroepCopy(lang);
  return d === "kids" ? c.kids : c.adult;
}

export function readDoelgroep(): Doelgroep | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "kids" || v === "16plus" ? v : null;
  } catch {
    return null;
  }
}

export function storeDoelgroep(d: Doelgroep) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, d);
  } catch {
    /* privémodus: keuze geldt dan enkel voor deze sessie */
  }
}
