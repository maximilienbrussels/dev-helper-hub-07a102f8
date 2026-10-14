import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import {
  AUTH_INPUT_CLASS,
  AUTH_SUBMIT_CLASS,
  AuthCard,
  PasswordChecklist,
  PasswordStrengthBar,
  passwordRules,
} from "@/components/auth/PasswordRequirements";
import { useServerFn } from "@tanstack/react-start";
import { notifyPasswordChanged } from "@/lib/auth-email.functions";
import { useT } from "@/lib/i18n";

const TITLE = "Nieuw wachtwoord instellen — Maximilien";
const DESC = "Stel een nieuw wachtwoord in voor je account bij de stadsboerderij.";

export const Route = createFileRoute("/wachtwoord-herstellen")({
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
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const rules = passwordRules(password, confirm);
  const { lang } = useT();
  const notifyChanged = useServerFn(notifyPasswordChanged);

  useEffect(() => {
    // De herstellink uit onze eigen mail draagt een token in de URL; dan is er
    // (nog) geen sessie nodig om een nieuw wachtwoord te kiezen.
    const hasToken = Boolean(
      new URLSearchParams(window.location.search).get("token") ??
        new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token"),
    );
    if (hasToken) return setReady(true);
    supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("De twee wachtwoorden zijn niet gelijk.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Wachtwoord succesvol gewijzigd!");
      // Beveiligingsmelding (sjabloon 8) — mislukt stil als er nog geen sessie is.
      void notifyChanged({ data: { lang } }).catch(() => undefined);
      await router.invalidate();
      navigate({ to: "/account", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aanpassen mislukt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <AuthCard>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Accountbeveiliging</p>
        <h1 className="mt-3 font-serif text-3xl text-[color:var(--ink-forest)]">
          Nieuw wachtwoord
        </h1>

        {ready === false ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Deze pagina werkt enkel via de herstellink uit je mailbox. Vraag een nieuwe link aan.
            </p>
            <p className="mt-6 text-sm">
              <Link to="/wachtwoord-vergeten" className="underline underline-offset-4">
                Nieuwe herstellink aanvragen
              </Link>
            </p>
          </>
        ) : ready === null ? (
          <Loader2 className="mt-6 h-5 w-5 animate-spin text-primary" />
        ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="pw1" className="text-slate-700 dark:text-slate-200">
                  Nieuw wachtwoord
                </Label>
                <PasswordInput
                  id="pw1"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                  className={`mt-1.5 ${AUTH_INPUT_CLASS}`}
                />
                <PasswordChecklist rules={rules} />
              </div>
              <div>
                <Label htmlFor="pw2" className="text-slate-700 dark:text-slate-200">
                  Herhaal wachtwoord
                </Label>
                <PasswordInput
                  id="pw2"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={setConfirm}
                  className={`mt-1.5 ${AUTH_INPUT_CLASS}`}
                />
              </div>
              <PasswordStrengthBar rules={rules} />
              <Button
                type="submit"
                className={AUTH_SUBMIT_CLASS}
                disabled={loading || !rules.allValid}
              >
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Wachtwoord opslaan
              </Button>
            </form>
        )}
      </AuthCard>
    </div>
  );
}
