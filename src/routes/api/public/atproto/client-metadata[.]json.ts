import { createFileRoute } from "@tanstack/react-router";

/**
 * Publiek client-metadata document voor AT Protocol (Bluesky).
 * De URL van dit bestand is meteen onze `client_id`; zo is er geen centrale
 * developer console nodig.
 */
export const Route = createFileRoute("/api/public/atproto/client-metadata.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { siteOrigin } = await import("@/lib/google-oauth.server");
        const { clientMetadataDocument } = await import("@/lib/bluesky-oauth.server");
        const doc = clientMetadataDocument(siteOrigin(request));
        return new Response(JSON.stringify(doc, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
