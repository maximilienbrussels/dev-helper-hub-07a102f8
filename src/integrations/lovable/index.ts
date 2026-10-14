/**
 * Compatibiliteitslaag voor sociale logins.
 *
 * Historisch liep dit via de Lovable Cloud-broker; de app draait nu volledig
 * op Neon Auth. De API blijft identiek zodat bestaande pagina's ongewijzigd
 * blijven werken.
 */
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions,
    ) => {
      const redirectTo =
        opts?.redirect_uri ?? (typeof window !== "undefined" ? window.location.origin : "/");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) return { error: new Error(error.message) };
      return { redirected: true as const };
    },
  },
};
