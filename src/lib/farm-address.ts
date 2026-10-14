/**
 * Het officiële adres van de stadsboerderij — één bron van waarheid.
 *
 * Gebruik deze constanten overal (AI-prompt, kaarten, e-mails, SEO) zodat er
 * nooit meer een afwijkende of verouderde straatnaam kan opduiken.
 */

export const FARM_STREET_NL = "Schipperijkaai 2";
export const FARM_STREET_FR = "Quai du Batelage 2";
export const FARM_POSTAL = "1000";

export const FARM_ADDRESS: Record<"nl" | "fr" | "en", string> = {
  nl: `${FARM_STREET_NL}, ${FARM_POSTAL} Brussel`,
  fr: `${FARM_STREET_FR}, ${FARM_POSTAL} Bruxelles`,
  en: `${FARM_STREET_FR}, ${FARM_POSTAL} Brussels`,
};

/** Tweetalige schrijfwijze voor officiële vermeldingen. */
export const FARM_ADDRESS_BILINGUAL = `${FARM_STREET_NL} / ${FARM_STREET_FR}, ${FARM_POSTAL} Brussel`;

/** Tweede, kleinere ingang. */
export const FARM_SECOND_ENTRANCE: Record<"nl" | "fr" | "en", string> = {
  nl: "Willebroekkaai 21",
  fr: "Quai de Willebroek 21",
  en: "Quai de Willebroek 21",
};

/** Google Maps-bestemming (URL-veilig). */
export const FARM_MAPS_DESTINATION = "Schipperijkaai+2+1000+Brussel";
export const FARM_MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${FARM_MAPS_DESTINATION}`;

/** Coördinaten van de hoofdingang aan het kanaal. */
export const FARM_COORDS = { lat: 50.85876, lng: 4.35046 } as const;
