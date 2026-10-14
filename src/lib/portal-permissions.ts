import type { DataClient } from "@/lib/db-types";

type PermissionContext = {
  supabase?: DataClient;
  userId: string;
  claims?: { email?: string } | null;
};

/**
 * Werpt een fout wanneer de ingelogde medewerker het recht niet heeft.
 * Eigenaars en super-admins slagen altijd (zie permission-core.server.ts).
 */
export async function requirePermission(context: PermissionContext, permission: string) {
  const { assertPermission } = await import("@/lib/permission-core.server");
  await assertPermission({ userId: context.userId, claims: context.claims }, permission);
}
