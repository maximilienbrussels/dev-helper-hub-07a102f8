import { createFileRoute } from "@tanstack/react-router";

/**
 * Text-to-speech voor de audiogids in de Maxim-chat. De browser stuurt de
 * tekst, wij vragen de spraak bij de Lovable AI Gateway op en streamen de
 * PCM-chunks (SSE) terug. De sleutel blijft altijd op de server.
 */
export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("speak", ip, 60, 3600))) {
          return new Response("Te veel voorleesaanvragen. Probeer straks opnieuw.", {
            status: 429,
          });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: { text?: unknown };
        try {
          body = (await request.json()) as { text?: unknown };
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const raw = typeof body.text === "string" ? body.text : "";
        // Markdown-opmaak, links en fotomarkers horen niet in de gesproken tekst.
        const text = raw
          .replace(/\[\[[^\]]*\]\]/g, " ")
          .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
          .replace(/[|#*_`>]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 2000);

        if (!text) return new Response("text required", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "alloy",
            stream_format: "sse",
            response_format: "pcm",
            instructions:
              "Spreek warm, rustig en gastvrij, als een enthousiaste gids op een stadsboerderij.",
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const txt = await upstream.text().catch(() => "");
          return new Response(txt || "speech failed", { status: upstream.status || 502 });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
