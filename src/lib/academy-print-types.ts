/** Gedeelde types voor het certificaat aan de balie (client-veilig). */
export type DeskCertificate = {
  id: string;
  volgnummer: number;
  score: string;
  volledigeNaam: string;
  behaaldOp: string;
  publicToken: string | null;
  shortCode: string | null;
  printedAt: string | null;
  printCount: number;
  academy: {
    id: string;
    slug: string;
    diersoort_naam: string;
    diersoort_naam_fr: string | null;
    diersoort_naam_en: string | null;
    badge_icon: string | null;
  } | null;
};
