import { Link, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT, type Lang } from "@/lib/i18n";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { peekRedirect, safeRedirectPath, stashRedirect } from "@/lib/redirect";
import { useServerFn } from "@tanstack/react-start";
import { registerAccount } from "@/lib/auth-email.functions";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/components/auth/oauth-providers";
import { startOAuth, useConfiguredProviders } from "@/lib/oauth-status";


type RegCopy = {
  back: string;
  eyebrow: string;
  title: string;
  lede: string;
  confirmTitle: string;
  confirmBody: (email: string) => string;
  first: string;
  last: string;
  optional: string;
  lastHint: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  submit: string;
  google: string;
  haveAccount: string;
  loginHere: string;
  failed: string;
};

const REG_COPY: Record<Lang, RegCopy> = {
  nl: {
    back: "← Terug",
    eyebrow: "Klantenportaal",
    title: "Maak je account aan",
    lede: "Spaar Hoefjes, volg je bestellingen en bewaar je academy-certificaten.",
    confirmTitle: "Bevestig je e-mailadres",
    confirmBody: (e) => `We stuurden een bevestigingslink naar ${e}.`,
    first: "Voornaam",
    last: "Achternaam",
    optional: "(optioneel)",
    lastHint: "Nodig zodra je een certificaat aanvraagt — je kan dit later nog aanvullen.",
    email: "E-mailadres",
    emailPlaceholder: "jij@voorbeeld.be",
    password: "Wachtwoord",
    submit: "Account aanmaken",
    google: "Verder met Google",
    haveAccount: "Al een account?",
    loginHere: "Log hier in",
    failed: "Registreren mislukt.",
  },
  fr: {
    back: "← Retour",
    eyebrow: "Espace client",
    title: "Créez votre compte",
    lede: "Collectez des Sabots, suivez vos commandes et conservez vos certificats academy.",
    confirmTitle: "Confirmez votre adresse e-mail",
    confirmBody: (e) => `Nous avons envoyé un lien de confirmation à ${e}.`,
    first: "Prénom",
    last: "Nom",
    optional: "(facultatif)",
    lastHint: "Nécessaire pour demander un certificat — vous pouvez le compléter plus tard.",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.be",
    password: "Mot de passe",
    submit: "Créer mon compte",
    google: "Continuer avec Google",
    haveAccount: "Déjà un compte ?",
    loginHere: "Connectez-vous ici",
    failed: "L'inscription a échoué.",
  },
  en: {
    back: "← Back",
    eyebrow: "Customer portal",
    title: "Create your account",
    lede: "Collect Hooves, track your orders and keep your academy certificates.",
    confirmTitle: "Confirm your email address",
    confirmBody: (e) => `We sent a confirmation link to ${e}.`,
    first: "First name",
    last: "Last name",
    optional: "(optional)",
    lastHint: "Needed when you request a certificate — you can add it later.",
    email: "Email address",
    emailPlaceholder: "you@example.be",
    password: "Password",
    submit: "Create account",
    google: "Continue with Google",
    haveAccount: "Already have an account?",
    loginHere: "Log in here",
    failed: "Registration failed.",
  },
};

export const searchSchema = z.object({});


export function RegisterPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as z.infer<typeof searchSchema>;
  const redirectTo = safeRedirectPath(peekRedirect(), "/account");
  const { lang } = useT();
  const rc = REG_COPY[lang];
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | OAuthProvider>(null);
  const { available: configuredProviders } = useConfiguredProviders();
  const [sent, setSent] = useState(false);
  const [magicFallback, setMagicFallback] = useState(false);
  const createAccount = useServerFn(registerAccount);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const fullName = [voornaam.trim(), achternaam.trim()].filter(Boolean).join(" ");
    setLoading("email");
    try {
      stashRedirect(redirectTo);
      // Het account wordt server-side aangemaakt, zodat de bevestigingsmail in
      // onze eigen huisstijl vertrekt via de SMTP-server van de boerderij.
      const res = await createAccount({ data: { email, password, naam: fullName, lang } });
      const zonderMail = res?.mode === "password";
      setMagicFallback(zonderMail);
      setSent(true);
      toast.success(
        zonderMail
          ? "Je account is aangemaakt. Je kan meteen inloggen met je wachtwoord."
          : "We stuurden je een bevestigingslink per e-mail.",
      );
    } catch (err) {
      toast.error(friendlyAuthError(err instanceof Error ? err.message : rc.failed));
    } finally {
      setLoading(null);
    }
  }

  function handleOAuth(provider: OAuthProvider) {
    setLoading(provider);
    stashRedirect(redirectTo);
    startOAuth(provider, redirectTo);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--surface-page)]">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <LocalLink to={pathFor("home", lang)} className="text-sm font-semibold uppercase tracking-wider">
            {rc.back}
          </LocalLink>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{rc.eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl italic tracking-tight text-[color:var(--color-terracotta)]">
            {rc.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {rc.lede}
          </p>

          {sent ? (
            <div className="mt-8 rounded-2xl border border-border bg-card text-card-foreground p-6 text-center">
              <h2 className="text-lg font-semibold">{rc.confirmTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {magicFallback
                  ? `Je account voor ${email} staat klaar. De bevestigingsmail vertrok niet, maar je kan meteen inloggen met je wachtwoord.`
                  : rc.confirmBody(email)}

              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="reg-first">{rc.first}</Label>
                <Input
                  id="reg-first"
                  value={voornaam}
                  onChange={(e) => setVoornaam(e.target.value)}
                  required
                  className="mt-1 h-12"
                  placeholder={rc.first}
                />
              </div>
              <div>
                <Label htmlFor="reg-last">
                  {rc.last} <span className="text-muted-foreground">{rc.optional}</span>
                </Label>
                <Input
                  id="reg-last"
                  value={achternaam}
                  onChange={(e) => setAchternaam(e.target.value)}
                  className="mt-1 h-12"
                  placeholder={rc.last}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {rc.lastHint}
                </p>
              </div>
              <div>
                <Label htmlFor="reg-email">{rc.email}</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 h-12"
                  placeholder={rc.emailPlaceholder}
                />
              </div>
              <div>
                <Label htmlFor="reg-pw">{rc.password}</Label>
                <PasswordInput
                  id="reg-pw"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={setPassword}
                  required
                  className="mt-1 h-12"
                />
              </div>
              <Button
                type="submit"
                disabled={loading !== null}
                className="h-12 w-full rounded-full"
              >
                {loading === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rc.submit}
              </Button>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {OAUTH_PROVIDERS.filter((p) => configuredProviders.includes(p.id)).map(({ id, label, Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${rc.google} — ${label}`}
                    title={label}
                    onClick={() => handleOAuth(id)}
                    disabled={loading !== null}
                    className="h-12 w-14 rounded-2xl border-border bg-card"
                  >
                    {loading === id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </Button>
                ))}
              </div>
              <p className="pt-2 text-center text-xs text-muted-foreground">
                {rc.haveAccount}{" "}
                <LocalLink
                  to={pathFor("login", lang)}
                  onClick={() => stashRedirect(redirectTo)}
                  className="font-semibold text-[color:var(--color-terracotta)] underline"
                >
                  {rc.loginHere}
                </LocalLink>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
