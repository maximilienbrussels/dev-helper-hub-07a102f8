import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

const SCOPES = [
  "read:products",
  "write:products",
  "read:bookings",
  "write:bookings",
  "read:animals",
  "write:maxim",
] as const;

async function resolveEmail(context: { userId: string; claims: unknown }): Promise<string | null> {
  const fromToken = (context.claims as { email?: string } | null)?.email;
  if (fromToken) return fromToken.trim().toLowerCase();
  const { db } = await import("@/lib/neon.server");
  const rows = (await db()`
    select email from profiles where id = ${context.userId}::uuid limit 1
  `) as Array<{ email: string | null }>;
  const email = rows[0]?.email;
  return email ? email.trim().toLowerCase() : null;
}

/** Enkel gebruikers met 'manage_settings' mogen API-sleutels beheren. */
async function assertManageSettings(context: { userId: string; claims: unknown }) {
  const { assertPermission } = await import("@/lib/permission-core.server");
  await assertPermission(context, "manage_settings");
}

export const SCOPE_GROUPS = [
  {
    key: "shop",
    scopes: ["read:products", "write:products"] as const,
  },
  {
    key: "bookings",
    scopes: ["read:bookings", "write:bookings"] as const,
  },
  {
    key: "maxim",
    scopes: ["read:animals", "write:maxim"] as const,
  },
] as const;

export const fetchApiKeys = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertManageSettings(context);
    const { listApiKeys } = await import("@/lib/api-keys.server");
    return listApiKeys();
  });

export const createApiKeyFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        scopes: z.array(z.enum(SCOPES)).min(1).max(SCOPES.length),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertManageSettings(context);
    const email = await resolveEmail(context);
    const { createApiKey } = await import("@/lib/api-keys.server");
    return createApiKey(data.name, data.scopes, email);
  });

export const setApiKeyActiveFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManageSettings(context);
    const { setApiKeyActive } = await import("@/lib/api-keys.server");
    await setApiKeyActive(data.id, data.active);
    return { ok: true };
  });
