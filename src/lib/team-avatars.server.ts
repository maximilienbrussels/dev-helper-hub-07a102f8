/**
 * Server-only opslag van teamprofielfoto's (Neon).
 * Enkel de publieke URL van het beeld in de Scaleway-bucket wordt bewaard.
 */
import type { TeamAvatarMap } from "./team-avatars.functions";

let ensured = false;

async function ensureTable(): Promise<boolean> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return false;
  if (ensured) return true;
  await db()`
    create table if not exists team_avatars (
      person_key text primary key,
      image_url text not null,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  ensured = true;
  return true;
}

export async function loadTeamAvatars(): Promise<TeamAvatarMap> {
  if (!(await ensureTable())) return {};
  const { db } = await import("./neon.server");
  const rows = (await db()`
    select person_key, image_url from team_avatars
  `) as { person_key: string; image_url: string }[];
  const out: TeamAvatarMap = {};
  for (const r of rows) if (r.image_url) out[r.person_key] = r.image_url;
  return out;
}

export async function saveTeamAvatar(
  personKey: string,
  imageUrl: string | null,
  actor: string | null,
): Promise<void> {
  if (!(await ensureTable())) throw new Error("Geen databankverbinding.");
  const { db } = await import("./neon.server");
  const sql = db();
  if (!imageUrl) {
    await sql`delete from team_avatars where person_key = ${personKey}`;
    return;
  }
  await sql`
    insert into team_avatars (person_key, image_url, updated_by)
    values (${personKey}, ${imageUrl}, ${actor})
    on conflict (person_key) do update
      set image_url = excluded.image_url,
          updated_by = excluded.updated_by,
          updated_at = now()
  `;
}
