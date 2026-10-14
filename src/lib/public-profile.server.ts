/** Openbaar profiel — server-only helpers. */
import { db } from "./neon.server";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function randomPublicId(): string {
  const b = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
}

export type ProfileRow = {
  user_id: string;
  public_id: string;
  username: string | null;
  is_public: boolean;
  show_name: boolean;
  show_timeline: boolean;
  show_badges: boolean;
  show_certificates: boolean;
  show_hooi: boolean;
  show_follows: boolean;
  bio: string | null;
};

export async function ensureProfile(userId: string): Promise<ProfileRow> {
  const cur = (await db()`select * from public.app_public_profiles where user_id = ${userId}::uuid`) as ProfileRow[];
  if (cur[0]) return cur[0];
  for (let i = 0; i < 5; i++) {
    const rows = (await db()`
      insert into public.app_public_profiles (user_id, public_id)
      values (${userId}::uuid, ${randomPublicId()})
      on conflict do nothing
      returning *`) as ProfileRow[];
    if (rows[0]) return rows[0];
    const again = (await db()`select * from public.app_public_profiles where user_id = ${userId}::uuid`) as ProfileRow[];
    if (again[0]) return again[0];
  }
  throw new Error("Profiel aanmaken mislukt.");
}
