import { createServerFn } from "@tanstack/react-start";
import { ORG_ID, publicClient } from "@/lib/supabase-public";
import { db, one } from "@/lib/neon.server";
import { normalizePublicImageUrl } from "@/lib/s3.server";


export type OrgDTO = {
  id: number;
  name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string | null;
  vision: string | null;
  lat: number | null;
  lon: number | null;
};

export type PaymentDetailsDTO = {
  name: string;
  iban: string | null;
  bic: string | null;
  email: string;
};

export type HoursDTO = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  audience_type: string;
};

export type AnimalDTO = {
  id: number;
  name: string;
  species: string;
  description: string | null;
  image_url: string | null;
  qr_hash: string;
};

export type ProductImageDTO = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductDTO = {
  id: number;
  title: string;
  description: string | null;
  title_nl: string | null;
  title_fr: string | null;
  title_en: string | null;
  desc_nl: string | null;
  desc_fr: string | null;
  desc_en: string | null;
  is_catalog: boolean;
  image_url: string | null;
  price_cents: number;
  stock_quantity: number;
  is_packaging_free: boolean;
  c2c_eligible: boolean;
  c2c_refund_value_cents: number;
  availability: string | null;
  required_level: number | null;
  /** Extra foto's uit product_images, gesorteerd op position. */
  images: ProductImageDTO[];
};

export const getOrganisation = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrgDTO | null> => {
    try {
      return await one<OrgDTO>(
        db()`select id, name, street, house_number, postal_code, city, country, vision, lat, lon
             from organisations where id = ${ORG_ID} limit 1`,
      );
    } catch (err) {
      console.error("SSR data loading warning (organisation):", err);
      return null;
    }
  },
);

export const getPaymentDetails = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaymentDetailsDTO | null> => {
    try {
      return await one<PaymentDetailsDTO>(
        db()`select name, iban, bic, email from organisations where id = ${ORG_ID} limit 1`,
      );
    } catch (err) {
      console.error("SSR data loading warning (payment details):", err);
      return null;
    }
  },
);

/** Dubbele rijen wegfilteren (seed-data bevat herhalingen) en sorteren op dag. */
function normaliseHours(rows: HoursDTO[]): HoursDTO[] {
  const seen = new Map<string, HoursDTO>();
  for (const r of rows) {
    const key = `${r.audience_type}|${r.day_of_week}|${r.open_time}|${r.close_time}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  return [...seen.values()].sort((a, b) => a.day_of_week - b.day_of_week);
}

export const getHours = createServerFn({ method: "GET" }).handler(async (): Promise<HoursDTO[]> => {
  try {
    const rows = (await db()`select day_of_week, open_time, close_time, audience_type
             from operational_hours where organisation_id = ${ORG_ID}`) as HoursDTO[];
    if (rows.length > 0) return normaliseHours(rows);
  } catch (err) {
    console.error("SSR data loading warning (hours):", err);
  }
  // Openingsuren zijn publieke data en staan ook in de hoofddatabase. Zonder
  // deze tweede weg toont de homepage een leeg/onbruikbaar urenblok wanneer
  // de Neon-connectie ontbreekt.
  try {
    const { data, error } = await publicClient()
      .from("operational_hours")
      .select("day_of_week, open_time, close_time, audience_type")
      .eq("organisation_id", ORG_ID);
    if (error) throw error;
    return normaliseHours((data ?? []) as HoursDTO[]);
  } catch (err) {
    console.error("SSR data loading warning (hours fallback):", err);
    return [];
  }
});

export const getAnimals = createServerFn({ method: "GET" }).handler(
  async (): Promise<AnimalDTO[]> => {
    try {
      const rows = (await db()`select id, name, species, description, image_url, qr_hash
             from animals where organisation_id = ${ORG_ID} order by id`) as AnimalDTO[];
      return rows.map((a) => ({ ...a, image_url: normalizePublicImageUrl(a.image_url) }));
    } catch (err) {
      console.error("SSR data loading warning (animals):", err);
      return [];
    }
  },
);


type ProductImageRow = {
  product_id: number;
  id: number;
  media_id: string | null;
  url: string | null;
  alt: string | null;
  position: number;
};

/** Bouwt de publieke foto-URL: expliciete url wint, anders via de media-API. */
function resolveImageUrl(row: ProductImageRow): string | null {
  if (row.url) return normalizePublicImageUrl(row.url);
  if (row.media_id) return `/api/public/media/${row.media_id}`;
  return null;
}


export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductDTO[]> => {
    try {
      const products = (await db()`select id, title, description, title_nl, title_fr, title_en,
             desc_nl, desc_fr, desc_en, is_catalog, image_url, price_cents, stock_quantity,
             is_packaging_free, c2c_eligible, c2c_refund_value_cents, availability, required_level
             from products
             where organisation_id = ${ORG_ID} and is_catalog = true
             order by id`) as ProductDTO[];
      if (products.length === 0) return [];

      const ids = products.map((p) => p.id);
      // Hoofdfoto eerst, dan de hoverfoto, dan de handmatige volgorde. De
      // rolkolommen bestaan niet in oudere databanken: dan vallen we terug.
      const imageRows = (await db()`select product_id, id, media_id, url, alt, position
             from product_images
             where product_id = any(${ids})
             order by product_id, is_primary desc, is_hover desc, position`
        .catch(
          () => db()`select product_id, id, media_id, url, alt, position
             from product_images
             where product_id = any(${ids})
             order by product_id, position`,
        )) as ProductImageRow[];

      const imagesByProduct = new Map<number, ProductImageDTO[]>();
      for (const row of imageRows) {
        const url = resolveImageUrl(row);
        if (!url) continue;
        const list = imagesByProduct.get(row.product_id) ?? [];
        list.push({ id: row.id, url, alt: row.alt, position: row.position });
        imagesByProduct.set(row.product_id, list);
      }

      return products.map((p) => ({
        ...p,
        image_url: normalizePublicImageUrl(p.image_url),
        images: imagesByProduct.get(p.id) ?? [],
      }));
    } catch (err) {
      console.error("SSR data loading warning (products):", err);
      return [];
    }
  },
);


export type OpenStatus = {
  open: boolean;
  /** "10:00 – 17:00", of null wanneer er vandaag geen publieke uren zijn */
  todayLabel: string | null;
  /** i18n key voor een korte statusfrase */
  statusKey:
    | "status.open"
    | "status.closingSoon"
    | "status.openingSoon"
    | "status.closed"
    | "status.closedNextDay"
    | "status.closedNoTime";
  /** variabelen voor de statusfrase (minuten / HH:mm) */
  vars?: Record<string, string | number>;
  /** weekdag (0 = zondag) van het eerstvolgende openingsmoment, indien gekend */
  nextOpenDow?: number;
  /** aantal dagen tot dat openingsmoment (0 = vandaag) */
  nextOpenInDays?: number;
  /** openingsuur van dat moment, "HH:mm" */
  nextOpenTime?: string;
};

/** Huidige dag + minuten sinds middernacht in Brussel, ongeacht de tijdzone van de bezoeker. */
function brusselsNow(now: Date): { dow: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dow = Math.max(0, days.indexOf(get("weekday")));
  const hour = Number(get("hour")) % 24;
  return { dow, minutes: hour * 60 + Number(get("minute")) };
}

const toMinutes = (time: string): number | null => {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const hhmm = (time: string) => time.slice(0, 5);

/**
 * Vaste seizoensuren van de boerderij als de databank (tijdelijk) geen rijen
 * teruggeeft. Zomer (apr–okt): di–za 09:30–17:00. Winter (nov–mrt): di–vr 10:00–16:30.
 */
export function fallbackPublicHours(now = new Date()): HoursDTO[] {
  const month = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", month: "numeric" }).format(now),
  );
  const summer = month >= 4 && month <= 10;
  const days = summer ? [2, 3, 4, 5, 6] : [2, 3, 4, 5];
  return days.map((day_of_week) => ({
    day_of_week,
    open_time: summer ? "09:30:00" : "10:00:00",
    close_time: summer ? "17:00:00" : "16:30:00",
    audience_type: "public",
  })) as HoursDTO[];
}

export function computeOpenStatus(hours: HoursDTO[], now = new Date()): OpenStatus {
  const fromDb = hours.filter((h) => h.audience_type === "public" && h.open_time && h.close_time);
  const publicHours = fromDb.length > 0 ? fromDb : fallbackPublicHours(now);
  const { dow, minutes: nowM } = brusselsNow(now);

  /** Eerstvolgende openingsmoment (vanaf morgen), met dag en uur, of null. */
  const nextOpening = (): { time: string; dow: number; inDays: number } | null => {
    for (let i = 1; i <= 7; i++) {
      const day = (dow + i) % 7;
      const blocks = publicHours
        .filter((h) => h.day_of_week === day && toMinutes(h.open_time) !== null)
        .sort((a, b) => (toMinutes(a.open_time) as number) - (toMinutes(b.open_time) as number));
      const first = blocks[0];
      if (first) return { time: hhmm(first.open_time), dow: day, inDays: i };
    }
    return null;
  };

  const closed = (todayLabel: string | null): OpenStatus => {
    const next = nextOpening();
    if (!next) return { open: false, todayLabel, statusKey: "status.closedNoTime" };
    return {
      open: false,
      todayLabel,
      statusKey: "status.closedNextDay",
      vars: { time: next.time },
      nextOpenDow: next.dow,
      nextOpenInDays: next.inDays,
      nextOpenTime: next.time,
    };
  };

  // Meerdere blokken per dag mogelijk (bv. voor- en namiddag).
  const todayBlocks = publicHours
    .filter((h) => h.day_of_week === dow)
    .map((h) => ({ open: toMinutes(h.open_time), close: toMinutes(h.close_time), raw: h }))
    .filter((b) => b.open !== null && b.close !== null && b.close > b.open)
    .sort((a, b) => (a.open as number) - (b.open as number));

  if (todayBlocks.length === 0) return closed(null);

  const first = todayBlocks[0];
  const last = todayBlocks[todayBlocks.length - 1];
  const todayLabel = `${hhmm(first.raw.open_time)} – ${hhmm(last.raw.close_time)}`;

  const current = todayBlocks.find((b) => nowM >= (b.open as number) && nowM < (b.close as number));
  if (current) {
    const minsLeft = (current.close as number) - nowM;
    if (minsLeft <= 30) {
      return { open: true, todayLabel, statusKey: "status.closingSoon", vars: { mins: minsLeft } };
    }
    return { open: true, todayLabel, statusKey: "status.open" };
  }

  const upcoming = todayBlocks.find((b) => nowM < (b.open as number));
  if (upcoming) {
    const time = hhmm(upcoming.raw.open_time);
    const minsUntil = (upcoming.open as number) - nowM;
    return {
      open: false,
      todayLabel,
      statusKey: minsUntil <= 60 ? "status.openingSoon" : "status.closed",
      vars: { time },
    };
  }

  // Na sluitingstijd → eerstvolgende dag.
  return closed(todayLabel);
}
