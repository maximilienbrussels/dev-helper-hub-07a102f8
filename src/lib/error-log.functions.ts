import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { safeError } from "@/lib/safe-error";

const str = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null));

export const clientErrorSchema = z.object({
  message: z.string().trim().min(1).max(500),
  error_name: str(120),
  stack: str(8000),
  route: str(300),
  boundary: str(120),
  user_agent: str(400),
  viewport: str(60),
  language: str(20),
  app_version: str(60),
  reported: z.boolean().optional().default(false),
  contact_name: str(120),
  contact_email: z.string().trim().email().max(200).optional().nullable(),
  contact_note: str(2000),
});

export type ClientErrorInput = z.input<typeof clientErrorSchema>;

/** Publiek: schrijft een browserfout weg (rate-limited op IP). */
export const logClientError = createServerFn({ method: "POST" })
  .validator((d: unknown) => clientErrorSchema.parse(d))
  .handler(async ({ data }) => {
    const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
    const { getRequestHeaders } = await import("@tanstack/react-start/server");
    const ip = clientIdentifier(
      new Headers(getRequestHeaders() as unknown as Record<string, string>),
    );
    if (!(await checkRateLimit("client_error", ip, 40, 3600))) {
      return { ok: false as const };
    }

    // Neon (geen Supabase meer): fouten loggen mag nooit zelf een fout opleveren.
    try {
      const { db } = await import("@/lib/neon.server");
      await db()`
        insert into client_errors
          (message, error_name, stack, route, boundary, user_agent, viewport,
           language, app_version, reported, contact_name, contact_email, contact_note)
        values
          (${data.message}, ${data.error_name}, ${data.stack}, ${data.route}, ${data.boundary},
           ${data.user_agent}, ${data.viewport}, ${data.language}, ${data.app_version},
           ${data.reported ?? false}, ${data.contact_name}, ${data.contact_email}, ${data.contact_note})
      `;
      return { ok: true as const };
    } catch (err) {
      console.error("[client_errors] wegschrijven mislukt", err);
      return { ok: false as const };
    }
  });

/** Teamleden: lijst met recente fouten voor het dashboard. */
export const listClientErrors = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        onlyReported: z.boolean().optional().default(false),
        includeResolved: z.boolean().optional().default(false),
        limit: z.number().int().min(1).max(200).optional().default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    // Foutmeldingen bevatten contactgegevens van melders: enkel voor wie
    // het portaal mag beheren.
    await requirePermission(context, "manage_settings").catch((error) => {
      throw safeError(error);
    });
    let query = context.supabase
      .from("client_errors")
      .select(
        "id, created_at, message, error_name, stack, route, boundary, user_agent, viewport, language, reported, contact_name, contact_email, contact_note, resolved",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.onlyReported) query = query.eq("reported", true);
    if (!data.includeResolved) query = query.eq("resolved", false);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Teamleden: markeert een fout als (on)opgelost. */
export const setClientErrorResolved = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), resolved: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_settings").catch((error) => {
      throw safeError(error);
    });
    const { error } = await context.supabase
      .from("client_errors")
      .update({ resolved: data.resolved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
