import { createFileRoute, useNavigate, useRouter, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { safeRedirectPath } from "@/lib/redirect";

const searchSchema = z.object({
  token_hash: z.string().optional(),
  type: z.enum(["email", "recovery"]).optional(),
  next: z.string().optional(),
});

const TITLE = "E-mailadres bevestigen — Maximilien";
const DESC = "Bevestig je e-mailadres of herstellink voor je account bij de stadsboerderij.";

export const Route = createFileRoute("/bevestigen")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: searchSchema,
  ssr: false,
  component: ConfirmPage,
});

function ConfirmPage() {
  const search = useSearch({ from: "/bevestigen" });
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      if (!search.token_hash || !search.type) {
        setError("Deze link is onvolledig. Vraag een nieuwe link aan.");
        return;
      }
      const { error: err } = await supabase.auth.verifyOtp({
        token_hash: search.token_hash,
        type: search.type,
      });
      if (err) {
        setError("Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.");
        return;
      }
      await router.invalidate();
      const target = safeRedirectPath(
        search.next,
        search.type === "recovery" ? "/wachtwoord-herstellen" : "/account",
      );
      navigate({ to: target, replace: true });
    })();
  }, [navigate, router, search.next, search.token_hash, search.type]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <h1 className="font-serif text-2xl text-[color:var(--ink-forest)]">Link werkt niet</h1>
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <Link to="/wachtwoord-vergeten" className="underline underline-offset-4">
                Nieuwe herstellink aanvragen
              </Link>
              <Link
                to="/login"
                className="underline underline-offset-4"
              >
                Terug naar inloggen
              </Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Even geduld — we controleren je link…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
