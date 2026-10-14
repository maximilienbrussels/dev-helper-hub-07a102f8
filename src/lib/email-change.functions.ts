/**
 * Server functions voor het wijzigen van het e-mailadres van het eigen
 * account. Het interne UUID blijft altijd hetzelfde.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

const MESSAGES = {
  db: "De gebruikersdatabank is tijdelijk niet bereikbaar. Probeer het straks opnieuw.",
  "in-use": "Dat e-mailadres is al in gebruik bij een ander account.",
  same: "Dat is al je huidige e-mailadres.",
  mail: "We konden de bevestigingsmail niet versturen. Probeer het straks opnieuw.",
} as const;

export const requestMyEmailChange = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ context, data }) => {
    const { requestEmailChange } = await import("@/lib/email-change.server");
    const result = await requestEmailChange(context.userId, data.email);
    if (!result.ok) throw new Error(MESSAGES[result.reason]);
    return { ok: true as const, email: data.email.trim().toLowerCase() };
  });

export const confirmMyEmailChange = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string().min(10).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { confirmEmailChange } = await import("@/lib/email-change.server");
    const result = await confirmEmailChange(data.token);
    if (!result.ok) {
      throw new Error(
        result.reason === "expired"
          ? "Deze bevestigingslink is verlopen. Vraag een nieuwe aan in je account."
          : result.reason === "in-use"
            ? "Dat e-mailadres is intussen in gebruik bij een ander account."
            : "Deze bevestigingslink is niet (meer) geldig.",
      );
    }
    return { ok: true as const, email: result.email ?? null };
  });
