/**
 * Publieke server-side databaseclient.
 *
 * Leest rechtstreeks via de Neon SQL-verbinding (server-only) met een
 * PostgREST-compatibele API, zodat bestaande publieke queries onveranderd
 * blijven werken. Enkel gebruiken voor publieke, niet-gevoelige data.
 *
 * Staat in een eigen module: bestanden met createServerFn worden gesplitst,
 * waardoor helpers op moduleniveau daar verdwijnen (ReferenceError bij SSR).
 */
import { dbAdmin } from "@/lib/db-admin.server";
import type { DataClient } from "@/lib/db-types";

export function publicClient(): DataClient {
  return dbAdmin;
}

/** Vaste organisatie-id van de boerderij. */
export const ORG_ID = 1;
