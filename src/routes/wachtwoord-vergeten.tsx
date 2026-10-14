import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/auth-email.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TITLE = "Wachtwoord vergeten — Maximilien";
const DESC = "Vraag een herstellink aan om een nieuw wachtwoord in te stellen voor je account.";

export const Route = createFileRoute("/wachtwoord-vergeten")({
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
  component: ForgotPage,
});

function ForgotPage() {
  const send = useServerFn(requestPasswordReset);
  const { lang } = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await send({ data: { email, lang } });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aanvraag mislukt. Probeer straks opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Accountbeveiliging</p>
        <h1 className="mt-3 font-serif text-3xl text-[color:var(--ink-forest)]">
          Wachtwoord vergeten
        </h1>

        {sent ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Bestaat er een account met dit e-mailadres, dan is er een herstellink onderweg. Check
            ook je spammap — de link blijft één uur geldig.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Vul je e-mailadres in en we sturen je een link om een nieuw wachtwoord in te stellen.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <Label htmlFor="reset-email">E-mailadres</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 rounded-none"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-none">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Stuur herstellink
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="underline underline-offset-4"
          >
            Terug naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
