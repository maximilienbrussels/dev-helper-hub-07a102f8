import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  memberId: z.string().min(3).max(64),
  memberName: z.string().min(1).max(120).default("Lid"),
  hooiBalance: z.number().int().min(0).max(1_000_000).default(0),
  tier: z.string().min(1).max(60).optional(),
  locale: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/wallet/google/pass")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }

        const { readWalletCredentials, createMemberSaveUrl } = await import(
          "@/lib/google-wallet.server"
        );

        const creds = readWalletCredentials();
        if (!creds) {
          return Response.json(
            {
              error: "wallet_not_configured",
              message:
                "Google Wallet secrets niet geconfigureerd (GOOGLE_WALLET_ISSUER_ID / GOOGLE_WALLET_CLIENT_EMAIL / GOOGLE_WALLET_KEY).",
            },
            { status: 503 },
          );
        }

        try {
          const saveUrl = await createMemberSaveUrl(input, creds);
          return Response.json({ success: true, saveUrl });
        } catch (err) {
          console.error("google wallet member pass sign failed", err);
          return Response.json(
            { error: "signing_failed", message: "Kon de pas niet ondertekenen." },
            { status: 500 },
          );
        }
      },
    },
  },
});
