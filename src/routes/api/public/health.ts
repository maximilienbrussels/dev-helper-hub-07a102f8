import { createFileRoute } from "@tanstack/react-router";

/**
 * Diagnose-endpoint voor deploys (Vercel e.a.).
 * Geeft nooit secrets terug — enkel of ze aanwezig zijn en of de DB antwoordt.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const env = {
          NEON_DATABASE_URL: Boolean(
            process.env["NEON_DATABASE_URL"] ?? process.env["DATABASE_URL"],
          ),
          BREVO_API_KEY: Boolean(process.env["BREVO_API_KEY"]),
        };

        let database: { ok: boolean; error?: string } = { ok: false };
        try {
          const { db } = await import("@/lib/neon.server");
          await db()`select 1`;
          database = { ok: true };
        } catch (error) {
          console.error("[health] databank onbereikbaar:", error);
          database = { ok: false, error: "unavailable" };
        }

        const ok = env.NEON_DATABASE_URL && database.ok;
        return new Response(JSON.stringify({ ok, env, database }, null, 2), {
          status: ok ? 200 : 503,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});
