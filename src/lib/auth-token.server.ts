/**
 * Compatibiliteitslaag: de tokens voor inloglinks, bevestigingen en
 * wachtwoordherstel komen nu uit onze eigen Postgres-tabel
 * (`public.app_auth_tokens`, zie local-auth.server.ts). Deze module houdt de
 * oude functienamen in leven voor bestaande aanroepers.
 */
import {
  consumeLoginCode as localConsumeLoginCode,
  findUserByEmail,
  mintLoginCode as localMintLoginCode,
  mintToken,
  randomToken as localRandomToken,
} from "./local-auth.server";

export const randomToken = localRandomToken;

/** Zoekt het user-id bij een e-mailadres. */
export async function userIdByEmail(email: string): Promise<string | null> {
  return (await findUserByEmail(email))?.id ?? null;
}

/** Maakt een herstel-token aan (null wanneer het adres onbekend is). */
export async function mintResetToken(
  email: string,
  ttlSeconds = 3600,
): Promise<{ token: string } | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const token = await mintToken({ kind: "reset", email, ttlSeconds, userId: user.id });
  return token ? { token } : null;
}

/** Maakt een inloglink-token aan (dient ook als bevestigingslink). */
export async function mintMagicToken(
  email: string,
  _name?: string,
  ttlSeconds = 3600,
): Promise<{ token: string } | null> {
  const token = await mintToken({ kind: "magic", email, ttlSeconds });
  return token ? { token } : null;
}

export async function mintLoginCode(email: string, ttlSeconds = 900): Promise<string | null> {
  return localMintLoginCode(email, ttlSeconds);
}

export async function consumeLoginCode(email: string, code: string): Promise<boolean> {
  return localConsumeLoginCode(email, code);
}
