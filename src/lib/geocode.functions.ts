import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AddressSuggestion = {
  label: string;
  street: string;
  postal_code: string;
  city: string;
};

type PhotonFeature = {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
};

// Server-side wrapper rond de gratis Photon geocoding API (geen API-key nodig).
// We houden dit als server function zodat de front-end geen CORS-issues heeft
// en we de request/response kunnen normaliseren.
export const searchAddress = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ q: z.string().trim().min(2).max(120) }).parse(d))
  .handler(async ({ data }): Promise<AddressSuggestion[]> => {
    const url = `https://photon.komoot.io/api?q=${encodeURIComponent(
      data.q,
    )}&lang=nl&limit=6&layer=house&layer=street`;

    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    } catch {
      throw new Error("Adres opzoeken mislukt.");
    }
    if (!res.ok) throw new Error("Adres opzoeken mislukt.");

    const json = (await res.json()) as { features?: PhotonFeature[] };
    const features = json.features ?? [];

    const seen = new Set<string>();
    const results: AddressSuggestion[] = [];
    for (const f of features) {
      const p = f.properties;
      const streetName = p.street ?? p.name ?? "";
      const houseNumber = p.housenumber ?? "";
      const street = [streetName, houseNumber].filter(Boolean).join(" ");
      const city = p.city ?? p.town ?? p.village ?? "";
      const postal_code = p.postcode ?? "";
      if (!street && !city) continue;
      const label = [street, postal_code, city].filter(Boolean).join(", ");
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ label, street, postal_code, city });
    }
    return results;
  });
