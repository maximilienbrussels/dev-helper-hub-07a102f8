/**
 * Profielfoto's van teamleden.
 *
 * Beheerders (recht `manage_team`) uploaden een foto naar de Europese
 * Scaleway-bucket; enkel de publieke URL wordt hier bewaard. De publieke
 * pagina "Wie zijn we" leest ze zonder login.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export type TeamAvatarMap = Record<string, string>;

/** Alle foto's in één map: { personKey: publicUrl }. */
export const listTeamAvatars = createServerFn({ method: "GET" }).handler(
  async (): Promise<TeamAvatarMap> => {
    const { loadTeamAvatars } = await import("./team-avatars.server");
    return loadTeamAvatars();
  },
);

const saveSchema = z.object({
  personKey: z.string().trim().min(1).max(60),
  /** `null` verwijdert de foto. */
  imageUrl: z.string().trim().url().max(500).nullable(),
});

export const setTeamAvatar = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }): Promise<TeamAvatarMap> => {
    await requirePermission(context, "manage_team");
    const { saveTeamAvatar, loadTeamAvatars } = await import("./team-avatars.server");
    const actor = (context.claims as { email?: string } | null)?.email ?? null;
    await saveTeamAvatar(data.personKey, data.imageUrl, actor);
    return loadTeamAvatars();
  });
