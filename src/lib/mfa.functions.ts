/**
 * Tweestapsverificatie (2FA): status, instellen en controleren.
 * Een geslaagde tweede stap levert een nieuwe sessietoken op met `mfa: true`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

type Ctx = { userId: string; claims: Record<string, unknown> };

async function mfaSession(userId: string): Promise<string> {
  const auth = await import("./local-auth.server");
  const user = await auth.findUserById(userId);
  if (!user) throw new Error("Je account werd niet gevonden.");
  return auth.signSession(user, { mfa: true });
}

/** Instellen van een extra methode mag enkel als er nog geen is, of na een geslaagde tweede stap. */
async function assertMayEnroll(ctx: Ctx) {
  const mfa = await import("./mfa.server");
  if (ctx.claims["mfa"] === true) return;
  if (await mfa.hasAnyFactor(ctx.userId)) {
    throw new Error("Bevestig eerst je identiteit met je huidige tweede stap.");
  }
}

async function rate(bucket: string, id: string, max: number, win: number) {
  const { checkRateLimit } = await import("./rate-limit.server");
  if (!(await checkRateLimit(bucket, id, max, win))) {
    throw new Error("Even geduld — te veel pogingen. Probeer het over enkele minuten opnieuw.");
  }
}

async function isStaff(ctx: Ctx): Promise<boolean> {
  const { resolveAccessRaw } = await import("./permission-core.server");
  const a = await resolveAccessRaw({ userId: ctx.userId, claims: ctx.claims });
  if (a.fullAccess || a.roles.length > 0) return true;
  const { resolveTeamAccessRaw } = await import("./permission-core.server");
  return (await resolveTeamAccessRaw({ userId: ctx.userId, claims: ctx.claims })).allowed;
}

export type MfaStatus = {
  staff: boolean;
  required: boolean;
  verified: boolean;
  methods: { passkey: boolean; totp: boolean; phone: boolean };
  phone: string | null;
  phoneMethod: "sms" | "telegram" | null;
  recoveryLeft: number;
};

export const getMfaStatus = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<MfaStatus> => {
    const ctx = context as unknown as Ctx;
    const mfa = await import("./mfa.server");
    const [methods, row, staff] = await Promise.all([
      mfa.methodsFor(ctx.userId),
      mfa.getMfaRow(ctx.userId).catch(() => null),
      isStaff(ctx).catch(() => false),
    ]);
    return {
      staff,
      required: staff,
      verified: ctx.claims["mfa"] === true,
      methods,
      phone: row?.phone_verified_at ? row.phone : null,
      phoneMethod: row?.phone_verified_at ? (row.phone_method === "telegram" ? "telegram" : "sms") : null,
      recoveryLeft: row?.recovery_hashes?.length ?? 0,
    };
  });

/* ------------------------------ authenticator ----------------------------- */

export const startTotpSetup = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await assertMayEnroll(ctx);
    const { randomBase32Secret, otpauthUri } = await import("./mfa-core");
    const mfa = await import("./mfa.server");
    const secret = randomBase32Secret();
    await mfa.upsertMfa(ctx.userId, { totp_pending_enc: await mfa.encrypt(secret) });
    return { secret, uri: otpauthUri(secret, String(ctx.claims["email"] ?? "account")) };
  });

function newRecoveryCodes(): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => {
    const buf = crypto.getRandomValues(new Uint8Array(10));
    const s = Array.from(buf, (b) => alphabet[b % alphabet.length]).join("");
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  });
}

export const confirmTotpSetup = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ code: z.string().trim().min(6).max(10) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertMayEnroll(ctx);
    await rate("mfa-totp", ctx.userId, 10, 600);
    const mfa = await import("./mfa.server");
    const { verifyTotp } = await import("./mfa-core");
    const row = await mfa.getMfaRow(ctx.userId);
    const secret = row?.totp_pending_enc ? await mfa.decrypt(row.totp_pending_enc) : null;
    if (!secret) throw new Error("Start het instellen opnieuw.");
    if (!(await verifyTotp(secret, data.code))) throw new Error("Die code klopt niet. Probeer de nieuwste code.");
    const codes = newRecoveryCodes();
    await mfa.upsertMfa(ctx.userId, {
      totp_secret_enc: row!.totp_pending_enc,
      totp_pending_enc: null,
      totp_enabled_at: new Date().toISOString(),
      recovery_hashes: await Promise.all(codes.map((c) => mfa.hashCode(`rec:${c}`))),
    });
    return { token: await mfaSession(ctx.userId), recoveryCodes: codes };
  });

export const verifyTotpCode = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ code: z.string().trim().min(6).max(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await rate("mfa-verify", ctx.userId, 10, 600);
    const mfa = await import("./mfa.server");
    const { verifyTotp } = await import("./mfa-core");
    const row = await mfa.getMfaRow(ctx.userId);
    const code = data.code.toUpperCase();
    if (row?.totp_secret_enc && /^\d{6}$/.test(code.replace(/\s/g, ""))) {
      const secret = await mfa.decrypt(row.totp_secret_enc);
      if (secret && (await verifyTotp(secret, code))) return { token: await mfaSession(ctx.userId) };
    }
    // Herstelcode (eenmalig)
    if (row && /^[A-Z0-9]{5}-?[A-Z0-9]{5}$/.test(code)) {
      const norm = code.includes("-") ? code : `${code.slice(0, 5)}-${code.slice(5)}`;
      const h = await mfa.hashCode(`rec:${norm}`);
      if (row.recovery_hashes.includes(h)) {
        await mfa.upsertMfa(ctx.userId, { recovery_hashes: row.recovery_hashes.filter((x) => x !== h) });
        return { token: await mfaSession(ctx.userId) };
      }
    }
    throw new Error("Die code klopt niet.");
  });

/* ---------------------------------- sms ---------------------------------- */

export const sendSmsCode = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        phone: z.string().trim().max(30).optional(),
        purpose: z.enum(["setup", "login"]),
        channel: z.enum(["sms", "whatsapp"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const mfa = await import("./mfa.server");
    const core = await import("./mfa-core");
    let phone: string | null;
    let channel: "sms" | "whatsapp" = data.channel ?? "sms";
    if (data.purpose === "setup") {
      await assertMayEnroll(ctx);
      if (channel === "whatsapp") {
        phone = mfa.normalizeE164(data.phone ?? "");
        if (!phone || phone.startsWith("+32")) {
          throw new Error("Vul een geldig internationaal nummer in met landcode (bv. +33 6 12 34 56 78).");
        }
      } else {
        phone = core.normalizeBelgianMobile(data.phone ?? "");
        if (!phone) throw new Error("Vul een geldig Belgisch gsm-nummer in (bv. 0470 12 34 56).");
      }
    } else {
      const row = await mfa.getMfaRow(ctx.userId);
      if (!row?.phone_verified_at || !row.phone || (row.phone_method !== "sms" && row.phone_method !== "whatsapp")) {
        throw new Error("Er is geen gsm-nummer gekoppeld.");
      }
      phone = row.phone;
      channel = row.phone_method === "whatsapp" ? "whatsapp" : "sms";
    }
    await rate("mfa-sms", ctx.userId, 5, 3600);
    const code = core.randomSixDigits();
    await mfa.createCode({
      userId: ctx.userId,
      kind: "sms",
      purpose: data.purpose,
      code,
      phone,
      country: channel === "whatsapp" ? "INTL" : "BE",
      ttlSeconds: 600,
    });
    if (channel === "whatsapp") await mfa.sendWhatsapp(phone, `Maximilien – je verificatiecode is: ${code}`);
    else await mfa.sendSms(phone, `Uw verificatiecode is: ${code}`);
    return { sentTo: `${phone.slice(0, 5)} •• •• ${phone.slice(-2)}` };
  });

export const verifySmsCode = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ code: z.string().trim().regex(/^\d{6}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const mfa = await import("./mfa.server");
    const row = await mfa.latestPendingSms(ctx.userId);
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("Deze code is verlopen. Vraag een nieuwe aan.");
    }
    if (row.attempts >= 5) {
      await mfa.setCodeStatus(row.id, "used");
      throw new Error("Te veel foute pogingen. Vraag een nieuwe code aan.");
    }
    if ((await mfa.hashCode(data.code)) !== row.code_hash) {
      await mfa.bumpAttempts(row.id);
      throw new Error("Die code klopt niet.");
    }
    await mfa.setCodeStatus(row.id, "used");
    if (row.purpose === "setup") {
      await assertMayEnroll(ctx);
      await mfa.upsertMfa(ctx.userId, {
        phone: row.phone,
        phone_country: row.country === "INTL" ? "INTL" : "BE",
        phone_method: row.country === "INTL" ? "whatsapp" : "sms",
        phone_verified_at: new Date().toISOString(),
      });
    }
    return { token: await mfaSession(ctx.userId) };
  });

/* ---------------------- buitenland: automatisch via Telegram ---------------------- */

export const startTelegramVerification = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ purpose: z.enum(["setup", "login"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const mfa = await import("./mfa.server");
    if (data.purpose === "setup") await assertMayEnroll(ctx);
    else {
      const row = await mfa.getMfaRow(ctx.userId);
      if (!row?.phone_verified_at || row.phone_method !== "telegram") throw new Error("Deze methode is niet ingesteld.");
    }
    await rate("mfa-telegram", ctx.userId, 8, 3600);
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const id = await mfa.createCode({ userId: ctx.userId, kind: "telegram", purpose: data.purpose, code: token, ttlSeconds: 15 * 60 });
    // Het token staat enkel gehasht in de databank; de bot zoekt via de hash.
    return { requestId: id, link: `https://t.me/${mfa.TELEGRAM_BOT_USERNAME}?start=${token}` };
  });

export const checkTelegramVerification = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const mfa = await import("./mfa.server");
    const row = await mfa.getCode(data.requestId, ctx.userId);
    if (!row || row.kind !== "telegram") throw new Error("Aanvraag niet gevonden.");
    if (row.status === "rejected") return { status: "rejected" as const, token: null };
    if (row.status !== "approved") {
      const expired = new Date(row.expires_at).getTime() < Date.now();
      return { status: expired ? ("expired" as const) : ("pending" as const), token: null };
    }
    await mfa.setCodeStatus(row.id, "used");
    if (row.purpose === "setup") {
      await mfa.upsertMfa(ctx.userId, {
        phone: row.phone,
        phone_country: row.country,
        phone_method: "telegram",
        phone_verified_at: new Date().toISOString(),
      });
    }
    return { status: "approved" as const, token: await mfaSession(ctx.userId) };
  });

export const removeMfaMethod = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ method: z.enum(["totp", "phone"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    if (ctx.claims["mfa"] !== true) throw new Error("Bevestig eerst je tweede stap.");
    const mfa = await import("./mfa.server");
    const m = await mfa.methodsFor(ctx.userId);
    const left = [m.passkey, m.totp && data.method !== "totp", m.phone && data.method !== "phone"].filter(Boolean).length;
    if (left === 0 && (await isStaff(ctx))) {
      throw new Error("Medewerkers moeten minstens één tweede stap behouden.");
    }
    if (data.method === "totp") {
      await mfa.upsertMfa(ctx.userId, {
        totp_secret_enc: null,
        totp_enabled_at: null,
        ...(left === 0 ? { recovery_hashes: [] } : {}),
      });
    } else {
      await mfa.upsertMfa(ctx.userId, { phone: null, phone_verified_at: null, phone_method: null, phone_country: null });
    }
    return { ok: true as const };
  });

/** Nieuwe herstelcodes maken (vervangt de oude). Kan met elke tweede stap. */
export const regenerateRecoveryCodes = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    if (ctx.claims["mfa"] !== true) throw new Error("Bevestig eerst je tweede stap.");
    const mfa = await import("./mfa.server");
    if (!(await mfa.hasAnyFactor(ctx.userId))) throw new Error("Stel eerst een tweede stap in.");
    await rate("mfa-recovery", ctx.userId, 5, 3600);
    const codes = newRecoveryCodes();
    await mfa.upsertMfa(ctx.userId, {
      recovery_hashes: await Promise.all(codes.map((c) => mfa.hashCode(`rec:${c}`))),
    });
    return { recoveryCodes: codes };
  });
