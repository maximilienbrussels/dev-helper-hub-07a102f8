import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";

/**
 * Geeft de auth/database-client terug, of `null` wanneer er (nog) geen
 * auth-provider geconfigureerd is.
 *
 * Tijdens de migratie naar Neon mag een ontbrekende auth-configuratie de app
 * nooit laten crashen: publieke pagina's moeten blijven werken.
 */
export async function getAuthClient(): Promise<typeof supabase | null> {
  if (typeof window === "undefined") return null;
  try {
    // Trigger de lazy proxy zodat een ontbrekende config hier al wordt
    // afgehandeld. Een dynamische import helpt niet: dezelfde client wordt op
    // meerdere client-only routes al statisch geïmporteerd.
    void supabase.auth;
    return supabase;
  } catch {
    return null;
  }
}
