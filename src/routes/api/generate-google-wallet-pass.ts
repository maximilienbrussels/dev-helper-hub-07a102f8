import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  ticketId: z.string().min(3).max(64),
  participantName: z.string().min(1).max(120),
  eventTitle: z.string().min(1).max(160),
  eventDate: z.string().min(1).max(80),
  passType: z.enum(["ticket", "pickup", "certificate"]).default("ticket"),
  locale: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/generate-google-wallet-pass")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }

        const { readWalletCredentials, createSaveUrl } = await import(
          "@/lib/google-wallet.server"
        );

        const creds = readWalletCredentials();
        if (!creds) {
          return Response.json(
            {
              error: "wallet_not_configured",
              message:
                "Google Wallet is nog niet geconfigureerd (GOOGLE_WALLET_CLIENT_EMAIL / GOOGLE_WALLET_KEY ontbreken).",
            },
            { status: 503 },
          );
        }

        try {
          const saveUrl = await createSaveUrl(input, creds);
          return Response.json({ success: true, saveUrl });
        } catch (err) {
          console.error("google-wallet sign failed", err);
          return Response.json(
            { error: "signing_failed", message: "Kon de pas niet ondertekenen." },
            { status: 500 },
          );
        }
      },
    },
  },
});
