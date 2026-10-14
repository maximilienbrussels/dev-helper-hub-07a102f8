/**
 * Serverfuncties voor de beheerbare "Boeken & huren"-pagina's.
 *
 * Publiek: `fetchPageContent` (leesbaar zonder login — de publieke site
 * heeft die inhoud nodig, met de statische standaarden als vangnet).
 * Beheer: alles achter `manage_services`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "./portal-permissions";
import { recordAudit } from "./audit.server";
import {
  DEFAULT_PAGE_CONTENT,
  PAGE_CONTENT_KEYS,
  PAGE_CONTENT_LABELS,
  type PageContent,
  type PageContentKey,
} from "./page-content";

function actorEmail(context: unknown): string | null {
  return ((context as { claims?: { email?: string } | null })?.claims?.email as string) ?? null;
}

const pageKeySchema = z.enum(PAGE_CONTENT_KEYS);

/* ------------------------------ publiek ------------------------------- */

/** Volledige inhoud van één "Boeken & huren"-pagina (fail-safe). */
export const fetchPageContent = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ key: pageKeySchema }).parse(d))
  .handler(async ({ data }): Promise<PageContent> => {
    try {
      const { loadPageContent } = await import("./page-content.server");
      return await loadPageContent(data.key);
    } catch {
      return DEFAULT_PAGE_CONTENT[data.key];
    }
  });

/* ------------------------------- beheer -------------------------------- */

const heroSchema = z.object({
  key: pageKeySchema,
  heroImageUrl: z.string().max(2000).nullable().default(null),
  titleNl: z.string().max(200).default(""),
  titleFr: z.string().max(200).default(""),
  titleEn: z.string().max(200).default(""),
  textNl: z.string().max(2000).default(""),
  textFr: z.string().max(2000).default(""),
  textEn: z.string().max(2000).default(""),
});

/** Hero (afbeelding + titel/tekst) van een pagina bewaren. */
export const savePageHeroContent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => heroSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_services");
    const { savePageHero } = await import("./page-content.server");
    const email = actorEmail(context);
    await savePageHero(
      data.key,
      {
        heroImageUrl: data.heroImageUrl || null,
        titleNl: data.titleNl,
        titleFr: data.titleFr,
        titleEn: data.titleEn,
        textNl: data.textNl,
        textFr: data.textFr,
        textEn: data.textEn,
      },
      email,
    );
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "page_content_hero",
      entityId: data.key,
      summary: `Hero van ${PAGE_CONTENT_LABELS[data.key]} bijgewerkt`,
    });
    return { ok: true };
  });

const blockSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  pageKey: pageKeySchema,
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  imageUrl: z.string().max(2000).nullable().default(null),
  titleNl: z.string().max(200).default(""),
  titleFr: z.string().max(200).default(""),
  titleEn: z.string().max(200).default(""),
  textNl: z.string().max(2000).default(""),
  textFr: z.string().max(2000).default(""),
  textEn: z.string().max(2000).default(""),
  price: z.number().min(0).max(1000000).nullable().default(null),
  priceLabelNl: z.string().max(80).default(""),
  priceLabelFr: z.string().max(80).default(""),
  priceLabelEn: z.string().max(80).default(""),
});

/** Blok (kaart) toevoegen of bewerken. */
export const savePageBlockContent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => blockSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await requirePermission(context, "manage_services");
    const { upsertPageBlock } = await import("./page-content.server");
    const email = actorEmail(context);
    const id = await upsertPageBlock(
      {
        id: data.id,
        pageKey: data.pageKey,
        sortOrder: data.sortOrder,
        active: data.active,
        imageUrl: data.imageUrl || null,
        titleNl: data.titleNl,
        titleFr: data.titleFr,
        titleEn: data.titleEn,
        textNl: data.textNl,
        textFr: data.textFr,
        textEn: data.textEn,
        price: data.price,
        priceLabelNl: data.priceLabelNl,
        priceLabelFr: data.priceLabelFr,
        priceLabelEn: data.priceLabelEn,
      },
      email,
    );
    await recordAudit({
      actorEmail: email,
      action: data.id ? "update" : "create",
      entity: "page_content_block",
      entityId: id,
      summary: `Blok "${data.titleNl || data.titleFr || data.titleEn}" op ${PAGE_CONTENT_LABELS[data.pageKey]}`,
    });
    return { id };
  });

const deleteSchema = z.object({ id: z.string().uuid() });

/** Blok verwijderen. */
export const deletePageBlockContent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_services");
    const { deletePageBlock } = await import("./page-content.server");
    await deletePageBlock(data.id);
    await recordAudit({
      actorEmail: actorEmail(context),
      action: "delete",
      entity: "page_content_block",
      entityId: data.id,
      summary: "Blok verwijderd",
    });
    return { ok: true };
  });

const reorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });

/** Volgorde van blokken op een pagina bewaren. */
export const reorderPageBlockContent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => reorderSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_services");
    const { reorderPageBlocks } = await import("./page-content.server");
    await reorderPageBlocks(data.ids);
    await recordAudit({
      actorEmail: actorEmail(context),
      action: "update",
      entity: "page_content_block",
      entityId: "reorder",
      summary: "Volgorde van blokken bijgewerkt",
    });
    return { ok: true };
  });

const gallerySchema = z.object({
  key: pageKeySchema,
  urls: z.array(z.string().min(1).max(2000)).max(60),
});

/** Fotogalerij van een pagina bewaren (volgorde + verwijderde beelden opruimen). */
export const savePageGalleryContent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => gallerySchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_services");
    const { savePageGallery } = await import("./page-content.server");
    const email = actorEmail(context);
    await savePageGallery(data.key, data.urls, email);
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "page_content_gallery",
      entityId: data.key,
      summary: `Galerij bijgewerkt (${data.urls.length} foto's)`,
    });
    return { ok: true };
  });

export { PAGE_CONTENT_KEYS, PAGE_CONTENT_LABELS };
export type { PageContentKey };
