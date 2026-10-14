import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCertificaatBySlug } from "@/lib/academy.functions";

/**
 * Alias: /academie/:slug/certificaat -> het meest recente certificaat van de
 * ingelogde gebruiker voor die diersoort. Zonder certificaat: terug naar de
 * academie zelf, zodat de bezoeker de test kan afleggen.
 */
export const Route = createFileRoute("/academie/$slug/certificaat")({
  ssr: false,
  beforeLoad: async ({ params }) => {
    let id: string | null = null;
    try {
      const res = await getCertificaatBySlug({ data: { slug: params.slug } });
      id = res.id;
    } catch {
      id = null;
    }
    if (id) throw redirect({ to: "/certificaat/$id", params: { id } });
    throw redirect({ to: "/academy/$slug", params: { slug: params.slug } });
  },
});
