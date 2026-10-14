import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";

/** fetch met de sessietoken van de ingelogde gebruiker (voor beschermde /api-routes). */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = (data.session as { access_token?: string | null } | null)?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
