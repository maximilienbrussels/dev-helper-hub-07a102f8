/**
 * Server-only ophalen van de betaalgegevens van de vzw, voor gebruik in mails.
 * Bestandsnaam eindigt op .server.ts zodat dit nooit in een browserbundel komt.
 */

const ORG_ID = 1;

const FALLBACK = {
  naam: "ASBL Maximilien",
  iban: "BE00 0000 0000 0000",
  bic: "GEBABEBB",
};

export async function getOrganisation(): Promise<{
  naam: string;
  iban: string;
  bic: string;
}> {
  try {
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { data } = await dbAdmin
      .from("organisations")
      .select("name, iban, bic")
      .eq("id", ORG_ID)
      .maybeSingle();
    if (!data) return FALLBACK;
    return {
      naam: data.name ?? FALLBACK.naam,
      iban: data.iban ?? FALLBACK.iban,
      bic: data.bic ?? FALLBACK.bic,
    };
  } catch {
    return FALLBACK;
  }
}
