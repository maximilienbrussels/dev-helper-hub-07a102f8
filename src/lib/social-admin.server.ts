/**
 * Zorgt dat de social-tabellen bestaan.
 *
 * Waarom: op productie zijn de SQL-migraties niet altijd uitgevoerd. Zonder dit
 * vangnet krijgt de beheerder `relation "social_hidden_posts" does not exist`
 * zodra hij een bericht wil verbergen. De statements zijn idempotent.
 */
let ensured: Promise<void> | null = null;

async function create(): Promise<void> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return;
  const sql = db();
  await sql`
    create table if not exists social_hidden_posts (
      id bigint generated always as identity primary key,
      platform text not null,
      post_id text not null,
      hidden_by text,
      reden text,
      created_at timestamptz not null default now(),
      constraint social_hidden_posts_unique unique (platform, post_id)
    )
  `;
  await sql`
    create index if not exists social_hidden_posts_platform_idx on social_hidden_posts(platform)
  `;
  await sql`
    create table if not exists social_posts (
      id bigint generated always as identity primary key,
      platform text not null default 'eigen',
      tekst_nl text not null default '',
      tekst_fr text not null default '',
      tekst_en text not null default '',
      media_url text,
      media_id uuid,
      link text,
      gepubliceerd_op timestamptz not null default now(),
      actief boolean not null default true,
      created_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create index if not exists social_posts_gepubliceerd_op_idx
      on social_posts(gepubliceerd_op desc)
  `;
}

/** Eén keer per serverinstantie uitvoeren; bij een fout mag het later opnieuw. */
export function ensureSocialTables(): Promise<void> {
  if (!ensured) {
    ensured = create().catch((err) => {
      ensured = null;
      throw err;
    });
  }
  return ensured;
}

/** Vangnet voor publieke reads: nooit een 500 op de bezoekerskant. */
export async function ensureSocialTablesQuiet(): Promise<void> {
  try {
    await ensureSocialTables();
  } catch (err) {
    console.warn(`[social] tabellen niet klaar: ${(err as Error).message}`);
  }
}
