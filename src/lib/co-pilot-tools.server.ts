/**
 * Server-side uitvoerders voor de AI Co-Pilot-tools. Elke tool wijzigt precies
 * één record, geeft de vorige én nieuwe waarde terug (voor "Ongedaan maken")
 * en een korte, mensvriendelijke locatie-omschrijving voor de actiekaart.
 */
import { PUBLIC_SITE_URL, pathFor as publicPathFor } from "./routes-i18n";

export type CoPilotToolName =
  | "update_site_setting"
  | "update_service_price"
  | "update_pricing_item"
  | "add_opening_exception"
  | "update_page_hero"
  | "update_product_media"
  | "update_email_template_media";

export type ToolPreview = {
  imageUrl?: string;
  location: string;
  liveUrl?: string;
  testMailTemplateId?: string;
};

export type ToolResult = {
  targetTable: string;
  targetId: string | null;
  previousValue: unknown;
  newValue: unknown;
  preview: ToolPreview;
};

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

/* ------------------------------- 1. site-instellingen ------------------------------ */

async function updateSiteSetting(args: {
  field: "address" | "announcement" | "emergency";
  value: string;
}): Promise<ToolResult> {
  const db = await sql();
  const { ensureSiteTables } = await import("./site-config.server");
  await ensureSiteTables();

  if (args.field === "address") {
    const rows = (await db`select value from site_settings where key = 'contact' limit 1`) as Array<{
      value: Record<string, unknown>;
    }>;
    const previous = rows[0]?.value ?? {};
    const next = { ...previous, address: args.value };
    await db`
      insert into site_settings (key, value, updated_at) values ('contact', ${JSON.stringify(next)}::jsonb, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `;
    return {
      targetTable: "site_settings",
      targetId: "contact",
      previousValue: previous,
      newValue: next,
      preview: { location: "Adresgegevens (footer & contactpagina)", liveUrl: `${PUBLIC_SITE_URL}${publicPathFor("contact", "nl")}` },
    };
  }

  if (args.field === "announcement") {
    const rows = (await db`
      select id, message_nl, message_fr, message_en, active from site_announcements order by updated_at desc limit 1
    `) as Array<{ id: string; message_nl: string; message_fr: string; message_en: string; active: boolean }>;
    const previous = rows[0] ?? null;
    let id = previous?.id ?? null;
    if (id) {
      await db`
        update site_announcements
        set message_nl = ${args.value}, message_fr = ${args.value}, message_en = ${args.value}, active = true, updated_at = now()
        where id = ${id}::uuid
      `;
    } else {
      const inserted = (await db`
        insert into site_announcements (active, message_nl, message_fr, message_en)
        values (true, ${args.value}, ${args.value}, ${args.value})
        returning id
      `) as Array<{ id: string }>;
      id = inserted[0]?.id ?? null;
    }
    return {
      targetTable: "site_announcements",
      targetId: id,
      previousValue: previous,
      newValue: { message_nl: args.value, message_fr: args.value, message_en: args.value, active: true },
      preview: { location: "Aankondigingsbalk (bovenaan de website)", liveUrl: PUBLIC_SITE_URL },
    };
  }

  // emergency
  const rows = (await db`select value from site_settings where key = 'maintenance' limit 1`) as Array<{
    value: Record<string, unknown>;
  }>;
  const previous = rows[0]?.value ?? {};
  const next = { ...previous, enabled: true, message_nl: args.value, message_fr: args.value, message_en: args.value };
  await db`
    insert into site_settings (key, value, updated_at) values ('maintenance', ${JSON.stringify(next)}::jsonb, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  return {
    targetTable: "site_settings",
    targetId: "maintenance",
    previousValue: previous,
    newValue: next,
    preview: { location: "Noodmelding / onderhoudsmodus (volledige website)", liveUrl: PUBLIC_SITE_URL },
  };
}

/* -------------------------------- 2. diensten & tarieven ---------------------------- */

async function updateServicePrice(args: { serviceId?: string; title?: string; price: number }): Promise<ToolResult> {
  const db = await sql();
  let rows: Array<{ id: string; title_nl: string; price: number }>;
  if (args.serviceId) {
    rows = (await db`select id, title_nl, price from services where id = ${args.serviceId}::uuid limit 1`) as typeof rows;
  } else {
    const needle = `%${(args.title ?? "").trim()}%`;
    rows = (await db`
      select id, title_nl, price from services
      where title_nl ilike ${needle} or title_fr ilike ${needle} or title_en ilike ${needle}
      limit 1
    `) as typeof rows;
  }
  const row = rows[0];
  if (!row) throw new Error("Geen dienst gevonden met die naam of dat id.");
  await db`update services set price = ${args.price}, updated_at = now() where id = ${row.id}::uuid`;
  return {
    targetTable: "services",
    targetId: row.id,
    previousValue: { price: row.price },
    newValue: { price: args.price },
    preview: { location: `Dienst "${row.title_nl}" (Diensten & tarieven)`, liveUrl: `${PUBLIC_SITE_URL}/nl/verhuur` },
  };
}

async function updatePricingItem(args: { key: string; amount: number }): Promise<ToolResult> {
  const db = await sql();
  const rows = (await db`select amount from pricing_items where key = ${args.key} limit 1`) as Array<{
    amount: number;
  }>;
  const previous = rows[0]?.amount ?? null;
  await db`
    insert into pricing_items (key, amount, updated_at) values (${args.key}, ${args.amount}, now())
    on conflict (key) do update set amount = excluded.amount, updated_at = now()
  `;
  return {
    targetTable: "pricing_items",
    targetId: args.key,
    previousValue: { amount: previous },
    newValue: { amount: args.amount },
    preview: { location: `Tarief "${args.key}"` },
  };
}

/* -------------------------------- 3. openingsuitzonderingen ------------------------- */

async function addOpeningException(args: {
  dateFrom: string;
  dateTo?: string;
  closed: boolean;
  note?: string;
}): Promise<ToolResult> {
  const db = await sql();
  const dateTo = args.dateTo || args.dateFrom;
  const note = args.note ?? "";
  const inserted = (await db`
    insert into opening_exceptions (date_from, date_to, closed, reason_nl, reason_fr, reason_en)
    values (${args.dateFrom}::date, ${dateTo}::date, ${args.closed}, ${note}, ${note}, ${note})
    returning id
  `) as Array<{ id: string }>;
  return {
    targetTable: "opening_exceptions",
    targetId: inserted[0]?.id ?? null,
    previousValue: null,
    newValue: { dateFrom: args.dateFrom, dateTo, closed: args.closed, note },
    preview: { location: `Openingsuitzondering ${args.dateFrom}${dateTo !== args.dateFrom ? ` – ${dateTo}` : ""}`, liveUrl: `${PUBLIC_SITE_URL}/nl/bezoek` },
  };
}

/* --------------------------------- 4. pagina-hero ------------------------------------ */

async function updatePageHero(args: { pageSlug: string; imageUrl: string }): Promise<ToolResult> {
  const { loadPageContent, savePageHero } = await import("./page-content.server");
  const key = args.pageSlug as never;
  const current = await loadPageContent(key);
  await savePageHero(
    key,
    {
      heroImageUrl: args.imageUrl,
      titleNl: current.hero.title.nl,
      titleFr: current.hero.title.fr,
      titleEn: current.hero.title.en,
      textNl: current.hero.text.nl,
      textFr: current.hero.text.fr,
      textEn: current.hero.text.en,
    },
    null,
  );
  return {
    targetTable: "page_content_pages",
    targetId: args.pageSlug,
    previousValue: { heroImageUrl: current.hero.imageUrl },
    newValue: { heroImageUrl: args.imageUrl },
    preview: {
      imageUrl: args.imageUrl,
      location: `Hero-banner op /nl/${args.pageSlug}`,
      liveUrl: `${PUBLIC_SITE_URL}/nl/${args.pageSlug}`,
    },
  };
}

/* --------------------------------- 5. productmedia ------------------------------------ */

async function updateProductMedia(args: { productId: string; imageUrl: string }): Promise<ToolResult> {
  const db = await sql();
  const rows = (await db`select image_url from products where id = ${Number(args.productId)} limit 1`) as Array<{
    image_url: string | null;
  }>;
  if (!rows.length) throw new Error("Product niet gevonden.");
  await db`update products set image_url = ${args.imageUrl} where id = ${Number(args.productId)}`;
  return {
    targetTable: "products",
    targetId: args.productId,
    previousValue: { imageUrl: rows[0]!.image_url },
    newValue: { imageUrl: args.imageUrl },
    preview: { imageUrl: args.imageUrl, location: `Productfoto (product #${args.productId})`, liveUrl: `${PUBLIC_SITE_URL}/nl/webshop` },
  };
}

/* --------------------------------- 6. e-mail media ------------------------------------ */

async function updateEmailTemplateMedia(args: {
  templateId: string;
  headerImageUrl?: string;
  bannerUrl?: string;
}): Promise<ToolResult> {
  const db = await sql();
  const rows = (await db`
    select header_image_url, banner_url from email_template_media where template_id = ${args.templateId} limit 1
  `) as Array<{ header_image_url: string | null; banner_url: string | null }>;
  const previous = rows[0] ?? { header_image_url: null, banner_url: null };
  const next = {
    header_image_url: args.headerImageUrl ?? previous.header_image_url,
    banner_url: args.bannerUrl ?? previous.banner_url,
  };
  await db`
    insert into email_template_media (template_id, header_image_url, banner_url, updated_at)
    values (${args.templateId}, ${next.header_image_url}, ${next.banner_url}, now())
    on conflict (template_id) do update set
      header_image_url = excluded.header_image_url, banner_url = excluded.banner_url, updated_at = now()
  `;
  return {
    targetTable: "email_template_media",
    targetId: args.templateId,
    previousValue: previous,
    newValue: next,
    preview: {
      imageUrl: next.header_image_url ?? next.banner_url ?? undefined,
      location: `Header van sjabloon "${args.templateId}" (NL/FR/EN)`,
      testMailTemplateId: args.templateId,
    },
  };
}

/* ---------------------------------------------------------------------------------- */

export const TOOL_HANDLERS: Record<CoPilotToolName, (args: never) => Promise<ToolResult>> = {
  update_site_setting: updateSiteSetting as never,
  update_service_price: updateServicePrice as never,
  update_pricing_item: updatePricingItem as never,
  add_opening_exception: addOpeningException as never,
  update_page_hero: updatePageHero as never,
  update_product_media: updateProductMedia as never,
  update_email_template_media: updateEmailTemplateMedia as never,
};

/** Voert één tool uit en logt de actie in `co_pilot_actions`. */
export async function runCoPilotTool(
  tool: CoPilotToolName,
  args: Record<string, unknown>,
  adminEmail: string | null,
): Promise<{ id: string } & ToolResult> {
  const handler = TOOL_HANDLERS[tool];
  if (!handler) throw new Error(`Onbekende tool: ${tool}`);
  const result = await handler(args as never);
  const db = await sql();
  const inserted = (await db`
    insert into co_pilot_actions (admin_email, tool, target_table, target_id, previous_value, new_value)
    values (
      ${adminEmail}, ${tool}, ${result.targetTable}, ${result.targetId},
      ${JSON.stringify(result.previousValue ?? null)}::jsonb, ${JSON.stringify(result.newValue ?? null)}::jsonb
    )
    returning id
  `) as Array<{ id: string }>;
  return { id: inserted[0]!.id, ...result };
}

/** Herstelt een eerder uitgevoerde actie op basis van `previous_value`. */
export async function undoCoPilotAction(actionId: string): Promise<{ ok: true }> {
  const db = await sql();
  const rows = (await db`
    select tool, target_table, target_id, previous_value, undone_at from co_pilot_actions where id = ${actionId}::uuid limit 1
  `) as Array<{
    tool: CoPilotToolName;
    target_table: string;
    target_id: string | null;
    previous_value: unknown;
    undone_at: string | null;
  }>;
  const row = rows[0];
  if (!row) throw new Error("Actie niet gevonden.");
  if (row.undone_at) throw new Error("Deze actie is al ongedaan gemaakt.");

  const prev = row.previous_value as Record<string, unknown> | null;
  switch (row.target_table) {
    case "site_settings": {
      await db`update site_settings set value = ${JSON.stringify(prev ?? {})}::jsonb, updated_at = now() where key = ${row.target_id}`;
      break;
    }
    case "site_announcements": {
      if (prev && row.target_id) {
        await db`
          update site_announcements set
            message_nl = ${prev["message_nl"] as string}, message_fr = ${prev["message_fr"] as string},
            message_en = ${prev["message_en"] as string}, active = ${Boolean(prev["active"])}, updated_at = now()
          where id = ${row.target_id}::uuid
        `;
      }
      break;
    }
    case "services": {
      await db`update services set price = ${Number((prev as { price: number } | null)?.price ?? 0)}, updated_at = now() where id = ${row.target_id}::uuid`;
      break;
    }
    case "pricing_items": {
      const amount = (prev as { amount: number | null } | null)?.amount;
      if (amount === null || amount === undefined) {
        await db`delete from pricing_items where key = ${row.target_id}`;
      } else {
        await db`update pricing_items set amount = ${amount}, updated_at = now() where key = ${row.target_id}`;
      }
      break;
    }
    case "opening_exceptions": {
      if (row.target_id) await db`delete from opening_exceptions where id = ${row.target_id}::uuid`;
      break;
    }
    case "page_content_pages": {
      const heroImageUrl = (prev as { heroImageUrl: string | null } | null)?.heroImageUrl ?? null;
      if (row.target_id) {
        await db`update page_content_pages set hero_image_url = ${heroImageUrl}, updated_at = now() where page_key = ${row.target_id}`;
      }
      break;
    }
    case "products": {
      const imageUrl = (prev as { imageUrl: string | null } | null)?.imageUrl ?? null;
      if (row.target_id) await db`update products set image_url = ${imageUrl} where id = ${Number(row.target_id)}`;
      break;
    }
    case "email_template_media": {
      const p = prev as { header_image_url: string | null; banner_url: string | null } | null;
      if (row.target_id) {
        await db`
          update email_template_media set header_image_url = ${p?.header_image_url ?? null}, banner_url = ${p?.banner_url ?? null}, updated_at = now()
          where template_id = ${row.target_id}
        `;
      }
      break;
    }
    default:
      throw new Error("Deze actie kan niet automatisch ongedaan gemaakt worden.");
  }

  await db`update co_pilot_actions set undone_at = now() where id = ${actionId}::uuid`;
  return { ok: true };
}
