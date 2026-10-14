import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { resolveLoginLink } from "@/lib/auth-email.functions";
import { applySession } from "@/lib/neon-auth-compat";
import { Button } from "@/components/ui/button";
import { MLogo } from "@/components/MLogo";

const searchSchema = z.object({
  token: z.string().optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/inloglink")({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Inloglink — Maximilien" },
      {
        name: "description",
        content: "We bevestigen je eenmalige inloglink en brengen je naar je account.",
      },
      { property: "og:title", content: "Inloglink — Maximilien" },
      { property: "og:description", content: "Je eenmalige inloglink wordt bevestigd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginLinkPage,
});

function LoginLinkPage() {
  const { token, next } = Route.useSearch();
  const resolve = useServerFn(resolveLoginLink);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setError("Deze inloglink is onvolledig. Vraag een nieuwe link aan.");
      return;
    }
    void (async () => {
      try {
        const res = (await resolve({ data: { token, next } })) as {
          token: string;
          user: Parameters<typeof applySession>[1];
          next: string;
        };
        if (!active) return;
        applySession(res.token, res.user);
        window.location.replace(res.next || "/account");
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Deze inloglink werkt niet meer. Vraag een nieuwe aan.",
        );
      }
    })();
    return () => {
      active = false;
    };
  }, [token, next]);

  return (
    <main className="grid min-h-screen place-items-center bg-[color:var(--surface-page)] px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <MLogo className="mx-auto h-12 w-auto" />
        {error ? (
          <>
            <h1 className="mt-4 text-lg font-semibold">Aanmelden lukte niet</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-6 w-full" asChild>
              <Link to="/login">Nieuwe inloglink aanvragen</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-lg font-semibold">Even geduld…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We bevestigen je inloglink en brengen je naar je account.
            </p>
            <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
          </>
        )}
      </div>
    </main>
  );
}
