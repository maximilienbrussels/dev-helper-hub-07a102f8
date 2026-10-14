import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getAuthClient } from "@/lib/auth-client";
import { takeRedirect } from "@/lib/redirect";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  hoefjes: number;
  avatarUrl: string | null;
};

type AuthContextValue = {
  isLoggedIn: boolean;
  loading: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function loadProfile(authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  }) {
    const meta = authUser.user_metadata ?? {};
    let base: AuthUser = {
      id: authUser.id,
      email: authUser.email ?? null,
      name: (meta.full_name as string) ?? (meta.name as string) ?? null,
      role: "customer",
      hoefjes: 0,
      avatarUrl: (meta.avatar_url as string) ?? null,
    };
    const sb = await getAuthClient();
    const { data } = !sb
      ? { data: null }
      : await sb
          .from("profiles")
          .select("first_name, last_name, full_name, email, role, hoefjes_balance, avatar_url")
          .eq("id", authUser.id)
          .maybeSingle();
    if (data) {
      base = {
        ...base,
        name: combineName(data.first_name, data.last_name, data.full_name) ?? base.name,
        email: data.email ?? base.email,
        role: data.role ?? base.role,
        hoefjes: data.hoefjes_balance ?? 0,
        avatarUrl: data.avatar_url ?? base.avatarUrl,
      };
    }
    setUser(base);
  }

  async function refresh() {
    const sb = await getAuthClient();
    const data = sb ? (await sb.auth.getUser()).data : { user: null };
    if (data.user) await loadProfile(data.user);
    else setUser(null);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      const sb = await getAuthClient();
      if (!sb) {
        setLoading(false);
        return;
      }
      const { data } = await sb.auth.getUser();
      if (!active) return;
      if (data.user) await loadProfile(data.user);
      setLoading(false);
      const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }
        if (session?.user) {
          void loadProfile(session.user);
          setLoading(false);
          // Terug naar de pagina waar de gebruiker vandaan kwam (OAuth-redirect / magic link)
          if (event === "SIGNED_IN") {
            const target = takeRedirect();
            if (target && target !== window.location.pathname + window.location.search) {
              navigate({ to: target, replace: true });
            }
          }
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const sb = await getAuthClient();
    await sb?.auth.signOut();
    setUser(null);
    navigate({ to: "/", replace: true });
  }

  const value = useMemo<AuthContextValue>(
    () => ({ isLoggedIn: !!user, loading, user, signOut, refresh }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth moet binnen AuthProvider gebruikt worden");
  return ctx;
}

export function initials(name: string | null, email: string | null) {
  const src = (name ?? email ?? "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Combineert voornaam/achternaam tot een weergavenaam, met full_name als terugval. */
export function combineName(
  first: string | null | undefined,
  last: string | null | undefined,
  fallback?: string | null,
): string | null {
  const combined = [first ?? "", last ?? ""]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(" ");
  return combined || (fallback ?? "").trim() || null;
}

/** Splitst een volledige naam in voornaam/achternaam (eerste woord = voornaam). */
export function splitName(name: string | null | undefined): {
  first_name: string;
  last_name: string;
} {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") };
}

/** Voornaam: eerste woord van de naam, anders het deel vóór de @ in het e-mailadres. */
export function firstName(name: string | null, email: string | null) {
  const raw = (name ?? "").trim().split(/\s+/)[0];
  const base = raw || (email ?? "").split("@")[0] || "";
  const cleaned = base.split(/[._-]+/).filter(Boolean)[0] ?? "";
  if (!cleaned) return "vriend";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
