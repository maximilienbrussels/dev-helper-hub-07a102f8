import { createFileRoute } from "@tanstack/react-router";

/**
 * Speech-to-text proxy for the Maxim chat voice-input button.
 * The browser POSTs a WAV/webm blob as multipart form-data under "file";
 * we forward it to the Lovable AI Gateway with the workspace API key.
 */
export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { requireRouteAuth } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAuth(request);
        if ("response" in guard) return guard.response;
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("transcribe", ip, 20, 3600))) {
          return new Response("Te veel spraakopnames. Probeer straks opnieuw.", { status: 429 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const inbound = await request.formData();
        const file = inbound.get("file");
        if (!(file instanceof Blob)) {
          return new Response("file field required", { status: 400 });
        }

        // Guard against silent/empty recordings — the model 400s on those anyway.
        if (file.size < 2048) {
          return new Response("recording_too_short", { status: 400 });
        }

        const filename = (file as File).name || "recording.webm";

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, filename);
        const lang = inbound.get("language");
        if (typeof lang === "string" && /^[a-z]{2}$/.test(lang)) {
          upstream.append("language", lang);
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          return new Response(txt || "transcription failed", { status: res.status });
        }

        // Non-streaming: gateway returns JSON { text, ... }
        const data = (await res.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
