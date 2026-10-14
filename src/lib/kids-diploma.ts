/**
 * Kids-spoor (<16 jaar): volledig anoniem.
 *
 * Privacy-uitgangspunt (GDPR / minderjarigen): voor kinderen slaan we NIETS op
 * de server op. Geen account, geen naam, geen e-mail, geen certificaatrij in de
 * database. Het diploma leeft enkel in localStorage op het toestel van het kind
 * en kan door het kind gewist worden.
 */

const KEY = "ferme.kids.diplomas";

export type KidsDiploma = {
  slug: string;
  /** Diersoort zoals getoond, geen persoonsgegeven. */
  academy: string;
  /** Alleen een (optionele) voornaam of bijnaam, uitsluitend lokaal bewaard. */
  voornaam: string;
  ok: number;
  totaal: number;
  /** ISO-datum, lokaal. */
  datum: string;
  /** Leesbare diplomacode met KND-voorvoegsel (bv. KND-2026-0042). */
  code?: string;
};

/** Leest de lokaal bewaarde diploma's (leeg bij SSR of geblokkeerde storage). */
export function readKidsDiplomas(): KidsDiploma[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as KidsDiploma[]) : [];
  } catch {
    return [];
  }
}

/** Bewaart of vervangt het diploma voor één academy, uitsluitend lokaal. */
export function saveKidsDiploma(d: KidsDiploma): void {
  if (typeof window === "undefined") return;
  try {
    const rest = readKidsDiplomas().filter((x) => x.slug !== d.slug);
    window.localStorage.setItem(KEY, JSON.stringify([...rest, d]));
  } catch {
    /* storage kan geblokkeerd zijn; het diploma blijft dan enkel op het scherm */
  }
}

/** Wist alle lokaal bewaarde kinderdiploma's. */
export function clearKidsDiplomas(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* niets te doen */
  }
}

/** Deelt via de native share-sheet; valt terug op klembord. Bevat nooit een naam. */
export async function shareAchievement(text: string, url?: string): Promise<"shared" | "copied"> {
  const link = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const nav: Navigator | undefined = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof nav.share === "function") {
    await nav.share({ text, url: link });
    return "shared";
  }
  await nav?.clipboard?.writeText(`${text} ${link}`.trim());
  return "copied";
}
