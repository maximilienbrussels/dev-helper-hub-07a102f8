import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { MLogo } from "@/components/MLogo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nieuw wachtwoord — Maximilien" },
      {
        name: "description",
        content: "Kies een nieuw wachtwoord voor je toegang tot het beheerportaal.",
      },
      { property: "og:title", content: "Nieuw wachtwoord — Maximilien" },
      {
        property: "og:description",
        content: "Stel een nieuw wachtwoord in voor het beheerportaal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Minstens 8 tekens").max(72),
    confirm: z.string().min(8).max(72),
  })
  .refine((v) => v.password === v.confirm, { message: "Wachtwoorden verschillen" });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const rules = passwordRules(password, confirm);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Wachtwoord succesvol gewijzigd!");
    navigate({
      to: "/$lang/$",
      params: { lang: "nl", _splat: "vandaag" },
      replace: true,
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" aria-label="Terug naar de hoofdsite">
            <MLogo className="mx-auto h-12 w-auto" />
          </Link>
          <h1 className="font-display mt-3 text-xl font-bold">Nieuw wachtwoord</h1>
          <p className="text-sm text-muted-foreground">Kies een sterk wachtwoord.</p>
        </div>
        <AuthCard>
          {ready ? (
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <Label htmlFor="np" className="text-slate-700 dark:text-slate-200">
                  Nieuw wachtwoord
                </Label>
                <PasswordInput
                  id="np"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                  className={`mt-1.5 ${AUTH_INPUT_CLASS}`}
                />
                <PasswordChecklist rules={rules} />
              </div>
              <div>
                <Label htmlFor="np2" className="text-slate-700 dark:text-slate-200">
                  Bevestig wachtwoord
                </Label>
                <PasswordInput
                  id="np2"
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
                disabled={busy || !rules.allValid}
              >
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Wachtwoord opslaan
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Deze link is ongeldig of verlopen. Vraag een nieuwe herstellink aan via het
              aanmeldscherm.
            </p>
          )}
        </AuthCard>
      </div>
    </main>
  );
}
