import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { FIELD_HOSTNAME } from "@/lib/app-mode";

/**
 * Eenmalige overstap van het desktopbeheer naar de veld-app.
 *
 * Browsers houden hun opslag per adres gescheiden, dus een sessie op
 * maximilien.site geldt niet op maximilien.app. Deze functie maakt daarom een
 * kort geldige inloglink voor hetzelfde account, zodat een medewerker op zijn
 * telefoon niet opnieuw hoeft in te typen.
 */
export const createFieldHandoffLink = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ url: string | null }> => {
    const { resolveTeamAccess } = await import("@/lib/permission-core.server");
    const access = await resolveTeamAccess({ userId: context.userId, claims: context.claims });
    if (!access.allowed || !access.email) return { url: null };

    const { mintMagicToken } = await import("@/lib/auth-token.server");
    const minted = await mintMagicToken(access.email, undefined, 300);
    if (!minted) return { url: null };

    const url = `https://${FIELD_HOSTNAME}/inloglink?token=${encodeURIComponent(
      minted.token,
    )}&next=${encodeURIComponent("/veld")}`;
    return { url };
  });
