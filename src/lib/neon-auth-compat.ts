/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase-compatibele schil bovenop onze EIGEN authenticatie.
 *
 * Er is geen externe auth-provider meer: gebruikers staan in de Neon
 * Postgres-tabel `app_users`, wachtwoorden worden met bcrypt gecontroleerd en
 * de sessie is een door ons ondertekende JWT. De browser bewaart die token in
 * localStorage en stuurt hem als bearer mee met elke serverfunctie.
 */
import type { QueryBuilder } from "@/lib/db-types";
import { getNeonClient } from "@/lib/neon";
import {
  loginWithPassword,
  sessionFromToken,
  redeemAuthToken,
  resetPasswordWithToken,
  changePassword,
  updateOwnProfile,
} from "@/lib/local-auth.functions";
import {
  registerAccount,
  requestMagicLink,
  requestPasswordReset,
} from "@/lib/auth-email.functions";

const STORAGE_KEY = "maximilien.session";

export type CompatUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  email_confirmed_at?: string | null;
  identities?: { provider: string }[];
};

export type CompatSession = {
  user: CompatUser;
  access_token: string | null;
} | null;

type AuthEvent =
  | "INITIAL_SESSION"
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | "TOKEN_REFRESHED";

type AppUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
};

function toUser(raw: AppUser | null | undefined): CompatUser | null {
  if (!raw) return null;
  return {
    id: String(raw.id),
    email: raw.email ?? null,
    email_confirmed_at: raw.emailVerifiedAt ?? null,
    identities: [{ provider: "credential" }],
    user_metadata: {
      name: raw.name ?? null,
      full_name: raw.name ?? null,
      avatar_url: raw.avatarUrl ?? null,
    },
  };
}

/* ----------------------------- sessieopslag ----------------------------- */

export function readSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSessionToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* privémodus zonder opslag: sessie blijft dan enkel in het geheugen */
  }
}

let cached: CompatSession = null;
let cachedToken: string | null = null;
const listeners = new Set<(event: AuthEvent, session: CompatSession) => void>();

function emit(event: AuthEvent, session: CompatSession) {
  for (const cb of listeners) cb(event, session);
}

/** Bewaart de sessie na een geslaagde aanmelding en verwittigt de app. */
export function applySession(token: string, user: AppUser): CompatSession {
  writeSessionToken(token);
  cachedToken = token;
  cached = { user: toUser(user)!, access_token: token };
  emit("SIGNED_IN", cached);
  return cached;
}

async function loadSession(force = false): Promise<CompatSession> {
  const token = readSessionToken();
  if (!token) {
    cached = null;
    cachedToken = null;
    return null;
  }
  if (!force && cached && cachedToken === token) return cached;
  try {
    const { user } = (await sessionFromToken({ data: { token } })) as { user: AppUser | null };
    if (!user) {
      writeSessionToken(null);
      cached = null;
      cachedToken = null;
      return null;
    }
    cachedToken = token;
    cached = { user: toUser(user)!, access_token: token };
    return cached;
  } catch {
    // Server tijdelijk onbereikbaar: sessie behouden i.p.v. uitloggen.
    return cached;
  }
}

function fail(message: string) {
  return { message, status: 400 };
}

function messageOf(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : "";
  return raw && !/^\[object/.test(raw) ? raw : fallback;
}

/* -------------------------------- auth ---------------------------------- */

export const neonAuthCompat = {
  async getUser() {
    const session = await loadSession();
    return { data: { user: session?.user ?? null }, error: null as any };
  },

  async getSession() {
    const session = await loadSession();
    return { data: { session }, error: null as any };
  },

  async getClaims() {
    const session = await loadSession();
    return {
      data: session ? { claims: { sub: session.user.id, email: session.user.email } } : null,
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = (await loginWithPassword({ data: { email, password } })) as {
        token: string;
        user: AppUser;
      };
      const session = applySession(res.token, res.user);
      return { data: { user: session?.user ?? null, session }, error: null };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: fail(messageOf(error, "E-mailadres of wachtwoord klopt niet.")),
      };
    }
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
  }) {
    const naam =
      (options?.data?.["full_name"] as string) ?? (options?.data?.["name"] as string) ?? undefined;
    try {
      await registerAccount({ data: { email, password, naam } });
      // Bevestiging verloopt via de mail; er is (nog) geen sessie.
      return { data: { user: null, session: null }, error: null };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: fail(messageOf(error, "Registreren mislukt. Probeer het opnieuw.")),
      };
    }
  },

  async signInWithOAuth({ provider }: { provider: string; options?: { redirectTo?: string } }) {
    return {
      data: null,
      error: fail(
        `Aanmelden met ${provider} is momenteel niet beschikbaar. Gebruik je e-mailadres of vraag een inloglink aan.`,
      ),
    };
  },

  async signInWithOtp({
    email,
    options,
  }: {
    email: string;
    options?: { emailRedirectTo?: string };
  }) {
    try {
      const next = options?.emailRedirectTo?.startsWith("/") ? options.emailRedirectTo : "/account";
      await requestMagicLink({ data: { email, next } });
      return { data: { ok: true }, error: null };
    } catch (error) {
      return {
        data: null,
        error: fail(messageOf(error, "De inloglink kon niet worden verstuurd.")),
      };
    }
  },

  async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
    try {
      await requestPasswordReset({ data: { email } });
      return { data: { ok: true }, error: null };
    } catch (error) {
      return {
        data: null,
        error: fail(messageOf(error, "De herstelmail kon niet worden verstuurd.")),
      };
    }
  },

  async updateUser(attrs: {
    password?: string;
    current_password?: string;
    data?: Record<string, unknown>;
  }) {
    try {
      if (attrs.password) {
        const params = new URLSearchParams(
          typeof window === "undefined" ? "" : window.location.search,
        );
        const hash = new URLSearchParams(
          typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""),
        );
        const token = params.get("token") ?? hash.get("token");
        if (token) {
          const res = (await resetPasswordWithToken({
            data: { token, password: attrs.password },
          })) as { token: string; user: AppUser };
          const session = applySession(res.token, res.user);
          return { data: { user: session?.user ?? null }, error: null };
        }
        await changePassword({
          data: { password: attrs.password, currentPassword: attrs.current_password },
        });
      }
      if (attrs.data) {
        const res = (await updateOwnProfile({
          data: {
            name: (attrs.data["full_name"] as string) ?? (attrs.data["name"] as string),
            avatarUrl: attrs.data["avatar_url"] as string | undefined,
          },
        })) as { user: AppUser | null };
        if (res.user && cachedToken) {
          cached = { user: toUser(res.user)!, access_token: cachedToken };
        }
      }
      const session = await loadSession(true);
      emit("USER_UPDATED", session);
      return { data: { user: session?.user ?? null }, error: null };
    } catch (error) {
      return { data: { user: null }, error: fail(messageOf(error, "Aanpassen mislukt.")) };
    }
  },

  /** Inloglink/bevestigingslink inwisselen voor een sessie. */
  async verifyOtp({ token_hash, type }: { token_hash: string; type: string; email?: string }) {
    try {
      const res = (await redeemAuthToken({
        data: { token: token_hash, kind: type === "recovery" ? "verify" : "magic" },
      })) as { token: string; user: AppUser };
      const session = applySession(res.token, res.user);
      return { data: { user: session?.user ?? null, session }, error: null };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: fail(messageOf(error, "Deze link is verlopen of al gebruikt.")),
      };
    }
  },

  /** Sessie zetten met een token die elders al werd opgehaald. */
  async setSession(tokens?: { access_token?: string } | string | unknown) {
    const token =
      typeof tokens === "string"
        ? tokens
        : ((tokens as { access_token?: string } | undefined)?.access_token ?? null);
    if (token) writeSessionToken(token);
    const session = await loadSession(true);
    emit(session ? "SIGNED_IN" : "SIGNED_OUT", session);
    return { data: { session }, error: null };
  },

  async signOut() {
    writeSessionToken(null);
    cached = null;
    cachedToken = null;
    emit("SIGNED_OUT", null);
    return { error: null };
  },

  onAuthStateChange(cb: (event: AuthEvent, session: CompatSession) => void) {
    listeners.add(cb);
    void loadSession().then((session) => cb(session ? "SIGNED_IN" : "INITIAL_SESSION", session));

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      void loadSession(true).then((session) => cb(session ? "SIGNED_IN" : "SIGNED_OUT", session));
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(cb);
            if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
          },
        },
      },
    };
  },
};

/** Supabase-compatibele client: auth lokaal, data via de Neon Data API. */
export const neonSupabaseCompat = {
  auth: neonAuthCompat,
  from: (table: string): QueryBuilder => (getNeonClient() as any).from(table) as QueryBuilder,
  rpc: (fn: string, args?: Record<string, unknown>): Promise<{ data: any; error: any }> =>
    (getNeonClient() as any).rpc(fn, args),
  channel: () => ({
    on() {
      return this;
    },
    subscribe() {
      return this;
    },
    unsubscribe() {
      return Promise.resolve("ok");
    },
  }),
  removeChannel: () => Promise.resolve("ok"),
};
