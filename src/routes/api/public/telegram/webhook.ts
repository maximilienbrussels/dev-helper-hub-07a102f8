/**
 * Telegram-bot voor automatische telefoonverificatie (buitenland).
 * /start <token> → knop "Verify My Phone Number" (request_contact);
 * gedeeld eigen contact → aanvraag goedgekeurd met het echte nummer.
 */
import { createFileRoute } from "@tanstack/react-router";

type TgUpdate = {
  message?: {
    chat?: { id: number };
    from?: { id: number };
    text?: string;
    contact?: { phone_number?: string; user_id?: number };
  };
};

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const mfa = await import("@/lib/mfa.server");
        const expected = await mfa.telegramWebhookSecret().catch(() => "");
        const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!expected || !safeEqual(got, expected)) return new Response("Unauthorized", { status: 401 });

        const update = (await request.json().catch(() => ({}))) as TgUpdate;
        const msg = update.message;
        const chatId = msg?.chat?.id;
        if (!msg || typeof chatId !== "number") return Response.json({ ok: true });

        await mfa.ensureMfaSchema();
        const { db } = await import("@/lib/neon.server");

        const start = msg.text?.match(/^\/start\s+([a-f0-9]{36})$/);
        if (start) {
          const hash = await mfa.hashCode(start[1]);
          const rows = (await db()`
            update public.app_mfa_codes set tg_chat_id = ${chatId}
             where kind = 'telegram' and status = 'pending' and code_hash = ${hash} and expires_at > now()
             returning id`) as { id: string }[];
          if (!rows[0]) {
            await mfa.telegramCall("sendMessage", {
              chat_id: chatId,
              text: "Deze verificatielink is verlopen of al gebruikt. Vraag een nieuwe aan op de website.",
            });
          } else {
            await mfa.telegramCall("sendMessage", {
              chat_id: chatId,
              text: "Tik op de knop hieronder om je telefoonnummer te bevestigen.",
              reply_markup: {
                keyboard: [[{ text: "Verify My Phone Number", request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true,
              },
            });
          }
          return Response.json({ ok: true });
        }

        if (msg.contact) {
          // Enkel het eigen contact telt: anders kan iemand andermans nummer doorsturen.
          if (!msg.from || msg.contact.user_id !== msg.from.id) {
            await mfa.telegramCall("sendMessage", { chat_id: chatId, text: "Deel je eigen nummer via de knop." });
            return Response.json({ ok: true });
          }
          const phone = mfa.normalizeE164(msg.contact.phone_number ?? "");
          const rows = (await db()`
            select c.id, c.purpose, c.user_id, m.phone as known_phone, m.phone_method
              from public.app_mfa_codes c
              left join public.app_mfa m on m.user_id = c.user_id
             where c.kind = 'telegram' and c.status = 'pending' and c.tg_chat_id = ${chatId} and c.expires_at > now()
             order by c.created_at desc limit 1`) as {
            id: string;
            purpose: string;
            known_phone: string | null;
          }[];
          const row = rows[0];
          let ok = Boolean(row && phone);
          if (ok && row.purpose === "login" && row.known_phone && row.known_phone !== phone) ok = false;
          if (ok && row && phone) {
            await db()`
              update public.app_mfa_codes set status = 'approved', phone = ${phone},
                     country = ${phone.startsWith("+32") ? "BE" : "INTL"}, decided_by = 'telegram', decided_at = now()
               where id = ${row.id}::uuid`;
          }
          await mfa.telegramCall("sendMessage", {
            chat_id: chatId,
            text: ok
              ? "✅ Je nummer is bevestigd. Je kan terug naar de website."
              : "Dit nummer kon niet bevestigd worden. Vraag een nieuwe link aan op de website.",
            reply_markup: { remove_keyboard: true },
          });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
