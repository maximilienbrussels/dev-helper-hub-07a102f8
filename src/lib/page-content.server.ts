/**
 * Databanklaag voor de beheerbare "Boeken & huren"-pagina's.
 * Vangnet: zonder databank of zonder rijen gelden de statische standaarden
 * uit page-content.ts.
 */
import { DEFAULT_PAGE_CONTENT, type PageContent, type PageContentKey, type PageBlockContent } from "./page-content";
import { normalizePublicImageUrl } from "./s3.server";


export async function ensurePageContentTables(): Promise<boolean> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return false;
  const sql = db();
  await sql`
    create table if not exists page_content_pages (
      page_key text primary key,
      hero_image_url text,
      hero_title_nl text not null default '',
      hero_title_fr text not null default '',
      hero_title_en text not null default '',
      hero_text_nl text not null default '',
      hero_text_fr text not null default '',
      hero_text_en text not null default '',
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  await sql`
    create table if not exists page_content_blocks (
      id uuid primary key default gen_random_uuid(),
      page_key text not null,
      sort_order integer not null default 0,
      active boolean not null default true,
      image_url text,
      title_nl text not null default '',
      title_fr text not null default '',
      title_en text not null default '',
      text_nl text not null default '',
      text_fr text not null default '',
      text_en text not null default '',
      price numeric,
      price_label_nl text not null default '',
      price_label_fr text not null default '',
      price_label_en text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  // Meervoudige fotogalerij per pagina (achterwaarts compatibel met hero_image_url).
  await sql`alter table page_content_pages add column if not exists gallery_urls text[] not null default '{}'`;
  // Ook voor de entiteiten die later een galerij kunnen tonen.
  await sql`alter table if exists events add column if not exists gallery_urls text[] not null default '{}'`;
  await sql`alter table if exists animals add column if not exists gallery_urls text[] not null default '{}'`;
  return true;
}

/** Volledige inhoud van één pagina, met vangnet op de statische standaarden. */
export async function loadPageContent(key: PageContentKey): Promise<PageContent> {
  const fallback = DEFAULT_PAGE_CONTENT[key];
  try {
    const ok = await ensurePageContentTables();
    if (!ok) return fallback;
    const { db } = await import("./neon.server");
    const sql = db();

    const heroRows = (await sql`
      select hero_image_url, gallery_urls, hero_title_nl, hero_title_fr, hero_title_en,
             hero_text_nl, hero_text_fr, hero_text_en
      from page_content_pages where page_key = ${key} limit 1
    `) as Array<{
      hero_image_url: string | null;
      gallery_urls: string[] | null;
      hero_title_nl: string; hero_title_fr: string; hero_title_en: string;
      hero_text_nl: string; hero_text_fr: string; hero_text_en: string;
    }>;
    const heroRow = heroRows[0];
    const hero = heroRow
      ? {
          imageUrl: normalizePublicImageUrl(heroRow.hero_image_url),
          title: { nl: heroRow.hero_title_nl, fr: heroRow.hero_title_fr, en: heroRow.hero_title_en },
          text: { nl: heroRow.hero_text_nl, fr: heroRow.hero_text_fr, en: heroRow.hero_text_en },
        }
      : fallback.hero;


    const blockRows = (await sql`
      select id, sort_order, active, image_url, title_nl, title_fr, title_en,
             text_nl, text_fr, text_en, price, price_label_nl, price_label_fr, price_label_en
      from page_content_blocks where page_key = ${key} order by sort_order asc, created_at asc
    `) as Array<{
      id: string; sort_order: number; active: boolean; image_url: string | null;
      title_nl: string; title_fr: string; title_en: string;
      text_nl: string; text_fr: string; text_en: string;
      price: string | number | null;
      price_label_nl: string; price_label_fr: string; price_label_en: string;
    }>;

    const blocks: PageBlockContent[] = blockRows.length
      ? blockRows.map((r) => ({
          id: r.id,
          sortOrder: r.sort_order,
          active: r.active,
          imageUrl: normalizePublicImageUrl(r.image_url),
          title: { nl: r.title_nl, fr: r.title_fr, en: r.title_en },
          text: { nl: r.text_nl, fr: r.text_fr, en: r.text_en },
          price: r.price === null ? null : Number(r.price),
          priceLabel: { nl: r.price_label_nl, fr: r.price_label_fr, en: r.price_label_en },
        }))
      : fallback.blocks;

    return { hero, blocks, gallery: (heroRow?.gallery_urls ?? []).map(normalizePublicImageUrl).filter((u): u is string => !!u) };

  } catch (err) {
    console.warn(`[page-content] fallback gebruikt voor ${key}: ${(err as Error).message}`);
    return fallback;
  }
}

/** Volledige galerij van een pagina bewaren (volgorde telt). */
export async function savePageGallery(
  key: PageContentKey,
  urls: string[],
  updatedBy: string | null,
): Promise<void> {
  if (!(await ensurePageContentTables())) {
    throw new Error("De databank is niet verbonden — de galerij kan niet bewaard worden.");
  }
  const { db } = await import("./neon.server");
  const sql = db();
  const previous = (await sql`
    select gallery_urls from page_content_pages where page_key = ${key} limit 1
  `) as Array<{ gallery_urls: string[] | null }>;
  await sql`
    insert into page_content_pages (page_key, gallery_urls, updated_at, updated_by)
    values (${key}, ${urls}, now(), ${updatedBy})
    on conflict (page_key) do update set
      gallery_urls = excluded.gallery_urls, updated_at = now(), updated_by = excluded.updated_by
  `;
  // Verwijderde beelden ook uit de Europese bucket halen.
  const removed = (previous[0]?.gallery_urls ?? []).filter((u) => !urls.includes(u));
  if (removed.length) {
    const { deleteManyByPublicUrl } = await import("./s3.server");
    await deleteManyByPublicUrl(removed);
  }
}

export async function savePageHero(
  key: PageContentKey,
  data: {
    heroImageUrl: string | null;
    titleNl: string; titleFr: string; titleEn: string;
    textNl: string; textFr: string; textEn: string;
  },
  updatedBy: string | null,
): Promise<void> {
  if (!(await ensurePageContentTables())) {
    throw new Error("De databank is niet verbonden — de pagina-inhoud kan niet bewaard worden.");
  }
  const { db } = await import("./neon.server");
  await db()`
    insert into page_content_pages (
      page_key, hero_image_url, hero_title_nl, hero_title_fr, hero_title_en,
      hero_text_nl, hero_text_fr, hero_text_en, updated_at, updated_by
    ) values (
      ${key}, ${data.heroImageUrl}, ${data.titleNl}, ${data.titleFr}, ${data.titleEn},
      ${data.textNl}, ${data.textFr}, ${data.textEn}, now(), ${updatedBy}
    )
    on conflict (page_key) do update set
      hero_image_url = excluded.hero_image_url,
      hero_title_nl = excluded.hero_title_nl, hero_title_fr = excluded.hero_title_fr, hero_title_en = excluded.hero_title_en,
      hero_text_nl = excluded.hero_text_nl, hero_text_fr = excluded.hero_text_fr, hero_text_en = excluded.hero_text_en,
      updated_at = now(), updated_by = excluded.updated_by
  `;
}

export type BlockInput = {
  id: string | null;
  pageKey: PageContentKey;
  sortOrder: number;
  active: boolean;
  imageUrl: string | null;
  titleNl: string; titleFr: string; titleEn: string;
  textNl: string; textFr: string; textEn: string;
  price: number | null;
  priceLabelNl: string; priceLabelFr: string; priceLabelEn: string;
};

/** Zorgt dat de bestaande statische standaardblokken eerst in de databank staan
 *  wanneer een pagina voor het eerst bewerkt wordt (anders "verdwijnen" ze). */
async function seedDefaultsIfEmpty(key: PageContentKey): Promise<void> {
  const { db } = await import("./neon.server");
  const sql = db();
  const rows = (await sql`select count(*)::int as n from page_content_blocks where page_key = ${key}`) as Array<{ n: number }>;
  if ((rows[0]?.n ?? 0) > 0) return;
  for (const b of DEFAULT_PAGE_CONTENT[key].blocks) {
    await sql`
      insert into page_content_blocks (
        page_key, sort_order, active, image_url, title_nl, title_fr, title_en,
        text_nl, text_fr, text_en, price, price_label_nl, price_label_fr, price_label_en
      ) values (
        ${key}, ${b.sortOrder}, ${b.active}, ${b.imageUrl},
        ${b.title.nl}, ${b.title.fr}, ${b.title.en},
        ${b.text.nl}, ${b.text.fr}, ${b.text.en},
        ${b.price}, ${b.priceLabel.nl}, ${b.priceLabel.fr}, ${b.priceLabel.en}
      )
    `;
  }
}

export async function upsertPageBlock(input: BlockInput, updatedBy: string | null): Promise<string> {
  if (!(await ensurePageContentTables())) {
    throw new Error("De databank is niet verbonden — het blok kan niet bewaard worden.");
  }
  const { db } = await import("./neon.server");
  const sql = db();
  if (!input.id) await seedDefaultsIfEmpty(input.pageKey);

  const rows = (await sql`
    insert into page_content_blocks (
      id, page_key, sort_order, active, image_url, title_nl, title_fr, title_en,
      text_nl, text_fr, text_en, price, price_label_nl, price_label_fr, price_label_en,
      updated_at, updated_by
    ) values (
      coalesce(${input.id}::uuid, gen_random_uuid()), ${input.pageKey}, ${input.sortOrder}, ${input.active},
      ${input.imageUrl}, ${input.titleNl}, ${input.titleFr}, ${input.titleEn},
      ${input.textNl}, ${input.textFr}, ${input.textEn}, ${input.price},
      ${input.priceLabelNl}, ${input.priceLabelFr}, ${input.priceLabelEn}, now(), ${updatedBy}
    )
    on conflict (id) do update set
      sort_order = excluded.sort_order, active = excluded.active, image_url = excluded.image_url,
      title_nl = excluded.title_nl, title_fr = excluded.title_fr, title_en = excluded.title_en,
      text_nl = excluded.text_nl, text_fr = excluded.text_fr, text_en = excluded.text_en,
      price = excluded.price,
      price_label_nl = excluded.price_label_nl, price_label_fr = excluded.price_label_fr, price_label_en = excluded.price_label_en,
      updated_at = now(), updated_by = excluded.updated_by
    returning id
  `) as Array<{ id: string }>;
  return rows[0]!.id;
}

export async function deletePageBlock(id: string): Promise<void> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) throw new Error("De databank is niet verbonden.");
  const rows = (await db()`
    select image_url from page_content_blocks where id = ${id}::uuid
  `) as Array<{ image_url: string | null }>;
  await db()`delete from page_content_blocks where id = ${id}::uuid`;
  // Opruimen in de Europese bucket zodat er geen weesbestanden achterblijven.
  const { deleteByPublicUrl } = await import("./s3.server");
  await deleteByPublicUrl(rows[0]?.image_url ?? null);
}

export async function reorderPageBlocks(ids: string[]): Promise<void> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) throw new Error("De databank is niet verbonden.");
  const sql = db();
  for (let i = 0; i < ids.length; i++) {
    await sql`update page_content_blocks set sort_order = ${i}, updated_at = now() where id = ${ids[i]}::uuid`;
  }
}
