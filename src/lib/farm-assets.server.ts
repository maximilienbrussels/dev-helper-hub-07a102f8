/**
 * Brug tussen de mediabibliotheek en de fotokaarten van Maxim.
 *
 * Een beeld in de bibliotheek met categorie "animal" of "zone" en als titel
 * de sleutel van een kaart (bv. `geiten`) vervangt de vaste foto. Nieuwe
 * titels worden extra kaarten, zodat het team dieren of zones kan toevoegen
 * zonder dat er code moet veranderen.
 */
import { FARM_ASSETS, type FarmAsset } from "@/config/farmAssets";

type MediaRow = {
  id: string;
  title: string | null;
  filename: string;
  category: string;
  description: string | null;
  alt_text: string | null;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Alle fotokaarten: de vaste lijst, aangevuld/overschreven door de bibliotheek. */
export async function loadFarmAssets(): Promise<Record<string, FarmAsset>> {
  const merged: Record<string, FarmAsset> = { ...FARM_ASSETS };
  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return merged;
    const rows = (await db()`
      select id::text as id, title, filename, category, description, alt_text
      from media_assets
      where category in ('animal', 'zone')
      order by created_at desc
    `) as MediaRow[];

    for (const row of rows) {
      const key = slugify(row.title?.trim() || row.filename);
      if (!key) continue;
      const existing = merged[key];
      const category: FarmAsset["category"] = row.category === "zone" ? "zone" : "animal";
      merged[key] = {
        id: key,
        title: row.title?.trim() || existing?.title || key,
        category: existing?.category ?? category,
        imagePath: `/api/public/media/${row.id}`,
        alt: row.alt_text?.trim() || existing?.alt || row.title || key,
        description: row.description?.trim() || existing?.description || "",
        ...(existing?.locationTag ? { locationTag: existing.locationTag } : {}),
        keywords: existing?.keywords ?? [key, ...key.split("-")],
      };
    }
  } catch (error) {
    console.error("[farm-assets] bibliotheek niet beschikbaar:", error);
  }
  return merged;
}

/** Kennisblok voor Maxim: aankondiging, nieuws en de beschikbare fotokaarten. */
export async function maximKnowledgeBlock(): Promise<string> {
  const parts: string[] = [];

  try {
    const { loadSiteConfig } = await import("./site-config.server");
    const config = await loadSiteConfig();
    const a = config.announcement;
    if (a?.active) {
      const msg = a.message.nl || a.message.fr || a.message.en;
      if (msg.trim()) parts.push(`- ACTUELE AANKONDIGING: ${msg.trim()}`);
    }
    const c = config.contact;
    parts.push(
      `- CONTACT: ${c.address}, ${c.postalCode} ${c.city} — telefoon ${c.phone}, e-mail ${c.email}.`,
    );
    if (config.maintenance.enabled) {
      parts.push("- LET OP: de site staat momenteel in onderhoud.");
    }
  } catch (error) {
    console.error("[maxim] siteconfiguratie niet beschikbaar:", error);
  }

  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (hasDatabase()) {
      const news = (await db()`
        select title, coalesce(summary, '') as summary
        from news_posts
        where published = true
        order by published_at desc nulls last
        limit 3
      `) as Array<{ title: string; summary: string }>;
      if (news.length) {
        parts.push(
          `- BOERDERIJNIEUWS: ${news
            .map((n) => `${n.title}${n.summary ? ` — ${n.summary}` : ""}`)
            .join(" | ")}`,
        );
      }
    }
  } catch {
    // Nieuws is optioneel: zonder tabel blijft Maxim gewoon werken.
  }

  try {
    const assets = await loadFarmAssets();
    const ids = Object.keys(assets).join(", ");
    if (ids) {
      parts.push(
        `- BESCHIKBARE FOTOKAARTEN (gebruik exact [[foto:id]]): ${ids}. Gebruik nooit een andere id.`,
      );
    }
    const fiches = Object.values(assets)
      .filter((a) => a.description)
      .map((a) => `${a.title}: ${a.description}${a.locationTag ? ` (${a.locationTag})` : ""}`);
    if (fiches.length) parts.push(`- FICHES: ${fiches.join(" | ")}`);
  } catch (error) {
    console.error("[maxim] fotokaarten niet beschikbaar:", error);
  }

  return parts.join("\n");
}
