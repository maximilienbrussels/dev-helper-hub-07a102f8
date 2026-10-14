import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { safeError, userError } from "@/lib/safe-error";

/**
 * Alle schrijfacties van de webshop-beheerder. De browser schrijft nooit
 * rechtstreeks naar de database: elke actie loopt hier langs een
 * rechtencontrole, validatie en het wijzigingslogboek.
 */

async function sql() {
  const { ensureShopTables } = await import("./shop-admin.server");
  await ensureShopTables();
  const { db } = await import("./neon.server");
  return db();
}

async function log(
  context: { userId: string; claims: unknown },
  entry: { action: "create" | "update" | "delete" | "restore"; entity: string; entityId?: string | number | null; summary: string; details?: unknown },
) {
  const { recordAudit } = await import("./audit.server");
  await recordAudit({
    actorId: context.userId,
    actorEmail: (context.claims as { email?: string } | null)?.email ?? null,
    ...entry,
  });
}

const text = (max: number) => z.string().trim().max(max);

/* --------------------------------------------------------------- producten */

const productCreate = z.object({
  title: text(160).min(1, "Geef een naam op."),
  description: text(2000).optional().default(""),
  price_cents: z.number().int().min(0).max(10_000_00),
  stock_quantity: z.number().int().min(0).max(1_000_000).default(0),
  is_catalog: z.boolean().default(true),
  organisation_id: z.number().int().positive().default(1),
});

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => productCreate.parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      const rows = (await db`
        insert into products (title, title_nl, description, desc_nl, price_cents,
                              stock_quantity, is_catalog, organisation_id)
        values (${data.title}, ${data.title}, ${data.description || null}, ${data.description || null},
                ${data.price_cents}, ${data.stock_quantity}, ${data.is_catalog}, ${data.organisation_id})
        returning id
      `) as Array<{ id: number }>;
      await log(context, {
        action: "create",
        entity: "product",
        entityId: rows[0]?.id ?? null,
        summary: `Product "${data.title}" aangemaakt`,
        details: { after: data },
      });
      return { id: rows[0]?.id ?? null };
    } catch (error) {
      throw safeError(error, "Het product kon niet aangemaakt worden.");
    }
  });

const productPatch = z.object({
  id: z.number().int().positive(),
  patch: z
    .object({
      title: text(160).optional(),
      title_nl: text(160).optional(),
      title_fr: text(160).nullable().optional(),
      title_en: text(160).nullable().optional(),
      description: text(2000).nullable().optional(),
      desc_nl: text(2000).nullable().optional(),
      desc_fr: text(2000).nullable().optional(),
      desc_en: text(2000).nullable().optional(),
      price_cents: z.number().int().min(0).max(10_000_00).optional(),
      stock_quantity: z.number().int().min(0).max(1_000_000).optional(),
      is_catalog: z.boolean().optional(),
      availability: text(40).nullable().optional(),
      required_level: z.number().int().min(0).max(10).nullable().optional(),
    })
    .refine((p) => Object.keys(p).length > 0, "Niets om op te slaan."),
});

const PRODUCT_FIELDS = [
  "title",
  "title_nl",
  "title_fr",
  "title_en",
  "description",
  "desc_nl",
  "desc_fr",
  "desc_en",
  "price_cents",
  "stock_quantity",
  "is_catalog",
  "availability",
  "required_level",
] as const;

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => productPatch.parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      const before = (await db`select * from products where id = ${data.id}`) as Array<Record<string, unknown>>;
      if (before.length === 0) throw userError("Dit product bestaat niet (meer).");

      const patch = data.patch as Record<string, unknown>;
      for (const field of PRODUCT_FIELDS) {
        if (!(field in patch)) continue;
        const value = patch[field] as never;
        // Eén kolom per statement: de HTTP-driver ondersteunt geen dynamische SQL.
        switch (field) {
          case "title": await db`update products set title = ${value} where id = ${data.id}`; break;
          case "title_nl": await db`update products set title_nl = ${value} where id = ${data.id}`; break;
          case "title_fr": await db`update products set title_fr = ${value} where id = ${data.id}`; break;
          case "title_en": await db`update products set title_en = ${value} where id = ${data.id}`; break;
          case "description": await db`update products set description = ${value} where id = ${data.id}`; break;
          case "desc_nl": await db`update products set desc_nl = ${value} where id = ${data.id}`; break;
          case "desc_fr": await db`update products set desc_fr = ${value} where id = ${data.id}`; break;
          case "desc_en": await db`update products set desc_en = ${value} where id = ${data.id}`; break;
          case "price_cents": await db`update products set price_cents = ${value} where id = ${data.id}`; break;
          case "stock_quantity": await db`update products set stock_quantity = ${value} where id = ${data.id}`; break;
          case "is_catalog": await db`update products set is_catalog = ${value} where id = ${data.id}`; break;
          case "availability": await db`update products set availability = ${value} where id = ${data.id}`; break;
          case "required_level": await db`update products set required_level = ${value} where id = ${data.id}`; break;
        }
      }
      await log(context, {
        action: "update",
        entity: "product",
        entityId: data.id,
        summary: `Product "${String(before[0]?.["title"] ?? data.id)}" aangepast`,
        details: { before: before[0], after: patch },
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "Opslaan lukte niet.");
    }
  });

/** Zacht verwijderen: het product verdwijnt uit de webshop maar blijft 30 dagen herstelbaar. */
export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      const rows = (await db`
        update products set deleted_at = now() where id = ${data.id}
        returning title, image_url
      `) as Array<{ title: string | null; image_url: string | null }>;
      // Foto's blijven bewaard zolang het product herstelbaar is.
      await log(context, {
        action: "delete",
        entity: "product",
        entityId: data.id,
        summary: `Product "${rows[0]?.title ?? data.id}" naar de prullenbak`,
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "Verwijderen lukte niet.");
    }
  });

/* ------------------------------------------------------------ productfoto's */

export const addProductImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z
      .object({
        product_id: z.number().int().positive(),
        media_id: z.string().uuid().optional(),
        url: z.string().url().max(500).optional(),
        alt: text(200).optional(),
        file_key: z.string().max(512).optional(),
      })
      .refine((v) => v.media_id || v.url, "Kies een afbeelding of geef een link op.")
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      const { storageUrlForMedia } = await import("./media-url.server");
      const resolvedUrl = data.url ?? (await storageUrlForMedia(data.media_id));
      const next = (await db`
        select coalesce(max(position) + 1, 0) as pos from product_images where product_id = ${data.product_id}
      `) as Array<{ pos: number }>;
      const position = next[0]?.pos ?? 0;
      await db`
        insert into product_images (product_id, media_id, url, alt, position, file_key, is_primary)
        values (${data.product_id}, ${data.media_id ?? null}, ${resolvedUrl ?? null},
                ${data.alt ?? null}, ${position}, ${data.file_key ?? null}, ${position === 0})
      `;
      await log(context, {
        action: "create",
        entity: "product_image",
        entityId: data.product_id,
        summary: `Foto toegevoegd aan product ${data.product_id}`,
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De foto kon niet toegevoegd worden.");
    }
  });

/** Ontkoppelt een foto van het product; het bestand blijft in de opslag staan. */
export const removeProductImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      await db`delete from product_images where id = ${data.id}`;
      await log(context, {
        action: "delete",
        entity: "product_image",
        entityId: data.id,
        summary: `Productfoto ${data.id} ontkoppeld`,
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De foto kon niet verwijderd worden.");
    }
  });

/** Ontkoppelt de foto én wist het bronbestand definitief uit de opslag. */
export const deleteProductImageFile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      const rows = (await db`
        select url, file_key from product_images where id = ${data.id}
      `) as Array<{ url: string | null; file_key: string | null }>;
      const row = rows[0];
      await db`delete from product_images where id = ${data.id}`;
      if (row?.file_key) {
        const { deleteMediaObjects } = await import("./scaleway-media.server");
        await deleteMediaObjects([row.file_key]).catch((error: unknown) => {
          console.error("[shop] bestand wissen mislukt:", error);
        });
      } else if (row?.url) {
        const { deleteByPublicUrl } = await import("./s3.server");
        await deleteByPublicUrl(row.url).catch((error: unknown) => {
          console.error("[shop] bestand wissen mislukt:", error);
        });
      }
      await log(context, {
        action: "delete",
        entity: "product_image",
        entityId: data.id,
        summary: `Productfoto ${data.id} definitief verwijderd`,
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De foto kon niet definitief verwijderd worden.");
    }
  });

/** Zet (of wist) de hoofd- of hoverfoto van een product. */
export const setProductImageRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        product_id: z.number().int().positive(),
        role: z.enum(["primary", "hover"]),
        value: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      if (data.role === "primary") {
        await db`update product_images set is_primary = false where product_id = ${data.product_id}`;
        if (data.value) {
          await db`update product_images set is_primary = true, is_hover = false where id = ${data.id}`;
        }
      } else {
        await db`update product_images set is_hover = false where product_id = ${data.product_id}`;
        if (data.value) {
          await db`update product_images set is_hover = true, is_primary = false where id = ${data.id}`;
        }
      }
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De rol van de foto kon niet bewaard worden.");
    }
  });

export const reorderProductImages = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z.object({ ids: z.array(z.number().int().positive()).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const db = await sql();
      for (const [index, id] of data.ids.entries()) {
        await db`update product_images set position = ${index} where id = ${id}`;
      }
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De volgorde kon niet bewaard worden.");
    }
  });


/* ------------------------------------------------- meldingen bij bestellingen */

const recipientInput = z.object({
  label: text(120).min(1, "Geef een naam op."),
  email: z.string().trim().email("Ongeldig e-mailadres.").max(200).optional().or(z.literal("")),
  phone: text(40).optional(),
});

export const addOrderRecipient = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => recipientInput.parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_orders");
      const email = data.email?.trim() || null;
      const phone = data.phone?.trim() || null;
      if (!email && !phone) throw userError("Vul een e-mailadres of telefoonnummer in.");
      const db = await sql();
      await db`
        insert into order_notification_recipients (label, email, phone, notify_email, notify_sms)
        values (${data.label}, ${email}, ${phone}, ${Boolean(email)}, ${Boolean(phone)})
      `;
      await log(context, {
        action: "create",
        entity: "order_recipient",
        summary: `Ontvanger "${data.label}" toegevoegd`,
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De ontvanger kon niet toegevoegd worden.");
    }
  });

export const updateOrderRecipient = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: z.object({
          notify_email: z.boolean().optional(),
          notify_sms: z.boolean().optional(),
          active: z.boolean().optional(),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_orders");
      const db = await sql();
      const { notify_email, notify_sms, active } = data.patch;
      if (notify_email !== undefined)
        await db`update order_notification_recipients set notify_email = ${notify_email} where id = ${data.id}::uuid`;
      if (notify_sms !== undefined)
        await db`update order_notification_recipients set notify_sms = ${notify_sms} where id = ${data.id}::uuid`;
      if (active !== undefined)
        await db`update order_notification_recipients set active = ${active} where id = ${data.id}::uuid`;
      await log(context, {
        action: "update",
        entity: "order_recipient",
        entityId: data.id,
        summary: "Meldingsvoorkeuren aangepast",
        details: { after: data.patch },
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "Opslaan lukte niet.");
    }
  });

export const removeOrderRecipient = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_orders");
      const db = await sql();
      await db`delete from order_notification_recipients where id = ${data.id}::uuid`;
      await log(context, {
        action: "delete",
        entity: "order_recipient",
        entityId: data.id,
        summary: "Ontvanger verwijderd",
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "Verwijderen lukte niet.");
    }
  });


/* -------------------------------------------------------------- lezen (portaal) */

export const getPortalProducts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    try {
      await requirePermission(context, "view_shop");
      const { listPortalProducts } = await import("./shop-admin.server");
      return await listPortalProducts();
    } catch (error) {
      throw safeError(error, "De producten konden niet geladen worden.");
    }
  });

export const getShopOrders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    try {
      await requirePermission(context, "manage_orders");
      const { listPortalOrders } = await import("./shop-admin.server");
      return await listPortalOrders();
    } catch (error) {
      throw safeError(error, "De bestellingen konden niet geladen worden.");
    }
  });

export const getPortalProductImages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((input: unknown) => z.object({ productId: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "view_shop");
      const { listPortalProductImages } = await import("./shop-admin.server");
      return await listPortalProductImages(data.productId);
    } catch (error) {
      throw safeError(error, "De foto's konden niet geladen worden.");
    }
  });

/* --------------------------------------------------------- webshop-hero (banner) */

export const getShopHero = createServerFn({ method: "GET" }).handler(async () => {
  const { loadShopHero } = await import("./shop-admin.server");
  return loadShopHero();
});

const shopHeroInput = z
  .object({
    media_id: z.string().uuid().optional(),
    url: z.string().url().max(500).optional(),
    alt: text(200).optional(),
  })
  .refine((v) => v.media_id || v.url, "Kies een afbeelding of geef een link op.");

export const updateShopHero = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => shopHeroInput.parse(input))
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, "manage_products");
      const { saveShopHero } = await import("./shop-admin.server");
      const { storageUrlForMedia } = await import("./media-url.server");
      const email = (context.claims as { email?: string } | null)?.email ?? null;
      await saveShopHero(
        {
          url: data.url ?? (await storageUrlForMedia(data.media_id)),
          mediaId: data.media_id ?? null,
          alt: data.alt ?? null,
        },
        email,
      );
      await log(context, {
        action: "update",
        entity: "shop_hero",
        summary: "Webshop-hero aangepast",
        details: { after: data },
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De hero-afbeelding kon niet opgeslagen worden.");
    }
  });

/** Webshop-hero leegmaken: de webshop valt terug op het standaardbeeld. */
export const clearShopHero = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    try {
      await requirePermission(context, "manage_products");
      const { saveShopHero } = await import("./shop-admin.server");
      const email = (context.claims as { email?: string } | null)?.email ?? null;
      await saveShopHero({ url: null, mediaId: null, alt: null }, email);
      await log(context, {
        action: "update",
        entity: "shop_hero",
        summary: "Webshop-hero verwijderd (standaardbeeld actief)",
        details: { after: null },
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "De hero-afbeelding kon niet verwijderd worden.");
    }
  });
