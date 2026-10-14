/**
 * Serverfunctie die een ondertekende Google Wallet-pas-URL teruggeeft.
 * De browser krijgt nooit de RSA-sleutel te zien.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  id: z.string().min(3).max(64),
  type: z.enum(["pickup_ticket", "booking", "certificate"]),
  title: z.object({ nl: z.string(), fr: z.string(), en: z.string() }),
  subtitle: z.object({ nl: z.string(), fr: z.string(), en: z.string() }).optional(),
  recipientName: z.string().max(120).optional(),
  eventDate: z.string().max(40).optional(),
  verificationUrl: z.string().url(),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export type WalletPassInput = z.infer<typeof schema>;

export const googleWalletPassUrl = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { generateGoogleWalletPassUrl } = await import("@/lib/google-wallet.server");
    const url = await generateGoogleWalletPassUrl(data);
    return { url, configured: url !== null };
  });
