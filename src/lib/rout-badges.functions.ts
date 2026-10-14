import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export const badgeInputSchema = z.object({
  recipient_handle: z.string().trim().min(1, "Vul een ROUT-handle in.").max(64).regex(/^@?[A-Za-z0-9][A-Za-z0-9._-]*$/, "Ongeldige handle."),
  badge_slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/, "Alleen kleine letters, cijfers en streepjes."),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum als JJJJ-MM-DD."),
  metadata: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1000).optional(),
    verification_url: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
  }),
  idempotency_key: z.string().uuid().optional(),
});

/** issueBadge(input): stuurt een certificaat als badge naar het ROUT-profiel. */
export const issueBadge = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => badgeInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "view_academy");
    const { issueRoutBadge } = await import("./rout-extras.server");
    return issueRoutBadge(data, String(context.userId));
  });

export const fetchIssuedBadges = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "view_academy");
    const { listIssuedBadges, routBadgesEnabled } = await import("./rout-extras.server");
    return {
      enabled: routBadgesEnabled(),
      configured: Boolean(process.env["ROUT_API_KEY"]),
      rows: (await listIssuedBadges()).map((r) => ({ ...r, issue_date: String(r.issue_date).slice(0, 10), created_at: String(r.created_at) })),
    };
  });
