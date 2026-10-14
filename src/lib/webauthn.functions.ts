import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  AuthenticationResponseJSON as SwAuthenticationResponseJSON,
  RegistrationResponseJSON as SwRegistrationResponseJSON,
} from "@simplewebauthn/server";
import { requireAuth } from "@/lib/auth-middleware";

/** Registratie stap 1: opties genereren voor navigator.credentials.create(). */
export const startPasskeyRegistration = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const { webauthnContext, storeChallenge, ensureWebauthnSchema } = await import(
      "./webauthn.server"
    );
    await ensureWebauthnSchema();
    const { dbAdmin } = await import("@/lib/db-admin.server");

    const userId = context.userId as string;
    const email = (context.claims as { email?: string } | null)?.email ?? "";

    // Wie al een tweede stap heeft, moet die eerst bevestigen voor hij een
    // extra passkey toevoegt (anders omzeilt een gestolen wachtwoord de 2FA).
    if ((context.claims as { mfa?: unknown } | null)?.mfa !== true) {
      const { hasAnyFactor } = await import("./mfa.server");
      if (await hasAnyFactor(userId)) {
        throw new Error("Bevestig eerst je identiteit met je huidige tweede stap.");
      }
    }

    const { rpID, rpName } = await webauthnContext();

    const { data: existing } = await dbAdmin
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: email || userId,
      userDisplayName: email || "Klant",
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        transports: (c.transports ?? undefined) as
          ("ble" | "hybrid" | "internal" | "nfc" | "usb")[] | undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    await storeChallenge({ challenge: options.challenge, purpose: "registration", userId });

    return options;
  });

/** Registratie stap 2: verifieert het antwoord van de authenticator en slaat de credential op. */
export const finishPasskeyRegistration = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        response: z.record(z.string(), z.unknown()),
        deviceName: z.string().trim().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const { webauthnContext, consumeChallenge } = await import("./webauthn.server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");

    const userId = context.userId as string;
    const { rpID, origin } = await webauthnContext();

    const expectedChallenge = await consumeChallenge({ purpose: "registration", userId });
    if (!expectedChallenge) {
      throw new Error("Deze registratiepoging is verlopen. Probeer opnieuw.");
    }

    const verification = await verifyRegistrationResponse({
      response: data.response as unknown as SwRegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("De passkey kon niet worden geverifieerd.");
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { error } = await dbAdmin.from("webauthn_credentials").insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      device_name: data.deviceName ?? null,
      backed_up: credentialBackedUp,
    });
    if (error) throw error;

    // De nieuwe passkey telt meteen als voltooide tweede stap.
    const auth = await import("./local-auth.server");
    const user = await auth.findUserById(userId);
    const token = user ? await auth.signSession(user, { mfa: true }) : null;
    return { ok: true as const, deviceType: credentialDeviceType, token };
  });

/** Login stap 1 (publiek): geeft altijd opties terug, ongeacht of het e-mailadres bestaat. */
export const startPasskeyLogin = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(254).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
    const { webauthnContext, storeChallenge, ensureWebauthnSchema } = await import(
      "./webauthn.server"
    );
    await ensureWebauthnSchema();
    const { checkRateLimit, clientIdentifier } = await import("./rate-limit.server");
    const { getRequestHeaders } = await import("@tanstack/react-start/server");

    const headers = new Headers(getRequestHeaders() as unknown as Record<string, string>);
    const ok = await checkRateLimit("passkey-login-start", clientIdentifier(headers), 20, 60);
    if (!ok)
      throw new Error("Even geduld — te veel pogingen. Probeer opnieuw over enkele minuten.");

    const { rpID } = await webauthnContext();

    let allowCredentials:
      { id: string; transports?: ("ble" | "hybrid" | "internal" | "nfc" | "usb")[] }[] | undefined;

    if (data.email) {
      const { dbAdmin } = await import("@/lib/db-admin.server");
      const { data: profile } = await dbAdmin
        .from("app_users")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();
      if (profile) {
        const { data: creds } = await dbAdmin
          .from("webauthn_credentials")
          .select("credential_id, transports")
          .eq("user_id", profile.id);
        if (creds && creds.length > 0) {
          allowCredentials = creds.map((c) => ({
            id: c.credential_id,
            transports: (c.transports ?? undefined) as
              ("ble" | "hybrid" | "internal" | "nfc" | "usb")[] | undefined,
          }));
        }
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    await storeChallenge({
      challenge: options.challenge,
      purpose: "authentication",
      email: data.email ?? null,
    });

    return options;
  });

/** Login stap 2 (publiek): verifieert het antwoord en levert een verify-token op om de sessie te starten. */
export const finishPasskeyLogin = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(254).optional(),
        response: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");
    const { webauthnContext, consumeChallengeValue, challengeFromResponse } = await import(
      "./webauthn.server"
    );
    const { checkRateLimit, clientIdentifier } = await import("./rate-limit.server");
    const { getRequestHeaders } = await import("@tanstack/react-start/server");

    const headers = new Headers(getRequestHeaders() as unknown as Record<string, string>);
    const ok = await checkRateLimit("passkey-login-finish", clientIdentifier(headers), 20, 60);
    if (!ok)
      throw new Error("Even geduld — te veel pogingen. Probeer opnieuw over enkele minuten.");

    const { rpID, origin } = await webauthnContext();
    const credentialId = (data.response as { id?: string }).id;
    if (!credentialId) throw new Error("Geen passkey gevonden.");

    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { data: stored } = await dbAdmin
      .from("webauthn_credentials")
      .select("id, user_id, credential_id, public_key, counter, transports")
      .eq("credential_id", credentialId)
      .maybeSingle();

    if (!stored) throw new Error("Geen passkey gevonden voor dit toestel.");

    const expectedChallenge = await consumeChallengeValue(
      challengeFromResponse(data.response),
      "authentication",
    );
    if (!expectedChallenge) {
      throw new Error("Deze inlogpoging is verlopen. Probeer opnieuw.");
    }

    const verification = await verifyAuthenticationResponse({
      response: data.response as unknown as SwAuthenticationResponseJSON,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.credential_id,
        publicKey: isoBase64URL.toBuffer(stored.public_key),
        counter: Number(stored.counter),
        transports: (stored.transports ?? undefined) as
          ("ble" | "hybrid" | "internal" | "nfc" | "usb")[] | undefined,
      },
    });

    if (!verification.verified) {
      throw new Error("De passkey kon niet worden geverifieerd.");
    }

    await dbAdmin
      .from("webauthn_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", stored.id);

    const { data: profile } = await dbAdmin
      .from("app_users")
      .select("email")
      .eq("id", stored.user_id)
      .maybeSingle();
    const email = profile?.email;
    if (!email) throw new Error("Geen account gevonden voor deze passkey.");

    // Direct inloggen: een passkey is zelf al een sterke tweede factor, dus de
    // sessie krijgt meteen `mfa: true`.
    const auth = await import("./local-auth.server");
    const user = await auth.findUserById(String(stored.user_id));
    if (!user) throw new Error("Geen account gevonden voor deze passkey.");
    const session = await auth.signSession(user, { mfa: true });
    return { email, token: session, user };
  });

/** Lijst van eigen passkeys, via de RLS-context van de gebruiker. */
export const listMyPasskeys = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { ensureWebauthnSchema } = await import("./webauthn.server");
    await ensureWebauthnSchema();
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { data, error } = await dbAdmin
      .from("webauthn_credentials")
      .select("id, device_name, transports, backed_up, created_at, last_used_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

/** Verwijdert een eigen passkey, via de RLS-context van de gebruiker. */
export const deleteMyPasskey = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { error } = await dbAdmin
      .from("webauthn_credentials")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true as const };
  });

/** Hernoemt een eigen passkey (bv. "iPhone van Max"), via de RLS-context. */
export const renameMyPasskey = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(60) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { error } = await dbAdmin
      .from("webauthn_credentials")
      .update({ device_name: data.name })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true as const };
  });
