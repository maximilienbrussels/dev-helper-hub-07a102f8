import type { Lang } from "@/lib/i18n";

/** Coördinaten van de boerderij (Schipperijkaai 2, 1000 Brussel). */
export const MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=50.8621%2C4.3487&destination_place_id=&travelmode=transit";

const LABEL: Record<Lang, string> = {
  nl: "📍 Open in Google Maps",
  fr: "📍 Ouvrir dans Google Maps",
  en: "📍 Open in Google Maps",
};

/** Herkent een antwoord over bereikbaarheid / openbaar vervoer. */
export function isTransitAnswer(text: string): boolean {
  return /(metro|métro|tram|bus\s?\d|ijzer|yser|werfkaai|batelage|brussel-noord|bruxelles-nord|brussels-north|nmbs|sncb|mivb|stib)/i.test(
    text,
  );
}

export function MapsLinkButton({ lang }: { lang: Lang }) {
  return (
    <a
      href={MAPS_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="mt-2 ml-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-page)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-terracotta)] ring-1 ring-border transition hover:brightness-95"
    >
      {LABEL[lang] ?? LABEL.nl}
    </a>
  );
}
