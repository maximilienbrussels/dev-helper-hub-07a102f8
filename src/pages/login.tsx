import {
  Link,
  useNavigate,
  useRouter,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  OAUTH_PROVIDERS,
  type OAuthProvider,
} from "@/components/auth/oauth-providers";
import { startOAuth, useConfiguredProviders } from "@/lib/oauth-status";
import { MastodonInstanceDialog } from "@/components/auth/MastodonInstanceDialog";
import { BlueskyHandleDialog } from "@/components/auth/BlueskyHandleDialog";
import { isPasskeySupported, passkeyErrorMessage } from "@/lib/auth/passkey";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


import { z } from "zod";
import { Loader2, Mail, Fingerprint, ChevronDown } from "lucide-react";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/auth-errors";
import { peekRedirect, safeRedirectPath, stashRedirect } from "@/lib/redirect";
import { useAuth } from "@/lib/auth";
import { startPasskeyLogin, finishPasskeyLogin } from "@/lib/webauthn.functions";
import { getMfaStatus } from "@/lib/mfa.functions";
import { useServerFn } from "@tanstack/react-start";
import { requestMagicLink } from "@/lib/auth-email.functions";
import { LoginCodeForm } from "@/components/LoginCodeForm";



export const searchSchema = z.object({
  // Neon Auth / OAuth-providers keren bij een mislukte of geannuleerde
  // sociale inlog terug met ?error=... (bv. access_denied).
  error: z.string().optional(),
  reason: z.string().optional(),
  provider: z.string().optional(),
});

export type { OAuthProvider } from "@/components/auth/oauth-providers";


/** Vertalingen van de inlogpagina (NL/FR/EN). */
const LOGIN_COPY = {
  nl: {
    back: "← Terug",
    portal: "Klantenportaal",
    title: "Welkom bij Maximilien",
    intro: "Log in of maak een account aan om je Hoefjes, badges en spaarvoordelen te bekijken.",
    mailboxTitle: "Check je mailbox!",
    mailboxBody: "We hebben een magische inloglink gestuurd naar",
    mailboxBody2: "Klik op de link om verder te gaan.",
    otherEmail: "Andere e-mail gebruiken",
    email: "E-mailadres",
    emailPlaceholder: "jij@voorbeeld.be",
    sendLink: "Stuur eenmalige inloglink",
    or: "of",
    passkey: "Inloggen met Passkey",
    oauth: "Inloggen met",
    withPassword: "Inloggen met wachtwoord",
    password: "Wachtwoord",
    forgot: "Wachtwoord vergeten?",
    noAccount: "Nog geen account?",
    register: "Registreer hier",
    oauthCancelled: "Inloggen geannuleerd — je bent niet ingelogd.",
    oauthFailed: (name: string) => `Inloggen via ${name} is mislukt. Probeer het opnieuw.`,
    oauthNotConfigured: (name: string) =>
      `Inloggen via ${name} is momenteel niet beschikbaar. Probeer een inloglink via e-mail.`,
    oauthGeneric: "Inloggen met de externe provider is mislukt. Probeer het opnieuw.",
    passkeyOk: "Passkey bevestigd — je wordt aangemeld.",
    passkeyNone: "Er is geen passkey gevonden op dit toestel.",
    passkeyUnsupported: "Passkeys worden niet ondersteund door deze browser.",
    passkeyNotOnDevice: "Passkeys worden niet ondersteund op dit toestel.",
    magicSentToast: "Check je mailbox! We hebben een magische inloglink gestuurd.",
    unknownError: "Onbekende fout",
    bluesky: {
      title: "Vul je Bluesky-handle in",
      description:
        "Bluesky is gedecentraliseerd. Met je handle vinden we jouw eigen server en sturen we je daarheen om in te loggen.",
      label: "Je Bluesky-handle",
      placeholder: "alice.bsky.social",
      examples: "Bijvoorbeeld:",
      submit: "Doorgaan met inloggen →",
    },
  },
  fr: {
    back: "← Retour",
    portal: "Espace client",
    title: "Bienvenue chez Maximilien",
    intro: "Connectez-vous ou créez un compte pour voir vos Sabots, badges et avantages.",
    mailboxTitle: "Vérifiez votre boîte mail !",
    mailboxBody: "Nous avons envoyé un lien de connexion à",
    mailboxBody2: "Cliquez sur le lien pour continuer.",
    otherEmail: "Utiliser une autre adresse",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@exemple.be",
    sendLink: "Envoyer un lien de connexion",
    or: "ou",
    passkey: "Se connecter avec une passkey",
    oauth: "Se connecter avec",
    withPassword: "Se connecter avec un mot de passe",
    password: "Mot de passe",
    forgot: "Mot de passe oublié ?",
    noAccount: "Pas encore de compte ?",
    register: "Inscrivez-vous ici",
    oauthCancelled: "Connexion annulée — vous n'êtes pas connecté.",
    oauthFailed: (name: string) => `La connexion via ${name} a échoué. Veuillez réessayer.`,
    oauthNotConfigured: (name: string) =>
      `La connexion via ${name} est indisponible pour le moment. Utilisez un lien de connexion par e-mail.`,
    oauthGeneric: "La connexion via le fournisseur externe a échoué. Veuillez réessayer.",
    passkeyOk: "Passkey confirmée — connexion en cours.",
    passkeyNone: "Aucune passkey trouvée sur cet appareil.",
    passkeyUnsupported: "Les passkeys ne sont pas prises en charge par ce navigateur.",
    passkeyNotOnDevice: "Les passkeys ne sont pas prises en charge sur cet appareil.",
    magicSentToast: "Vérifiez votre boîte mail ! Nous avons envoyé un lien de connexion.",
    unknownError: "Erreur inconnue",
    bluesky: {
      title: "Indiquez votre identifiant Bluesky",
      description:
        "Bluesky est décentralisé. Grâce à votre identifiant, nous trouvons votre propre serveur et vous y redirigeons pour la connexion.",
      label: "Votre identifiant Bluesky",
      placeholder: "alice.bsky.social",
      examples: "Par exemple :",
      submit: "Continuer la connexion →",
    },
  },
  en: {
    back: "← Back",
    portal: "Customer portal",
    title: "Welcome to Maximilien",
    intro: "Log in or create an account to view your Hooves, badges and rewards.",
    mailboxTitle: "Check your mailbox!",
    mailboxBody: "We sent a magic login link to",
    mailboxBody2: "Click the link to continue.",
    otherEmail: "Use another e-mail",
    email: "E-mail address",
    emailPlaceholder: "you@example.com",
    sendLink: "Send one-time login link",
    or: "or",
    passkey: "Sign in with a passkey",
    oauth: "Sign in with",
    withPassword: "Sign in with a password",
    password: "Password",
    forgot: "Forgot your password?",
    noAccount: "No account yet?",
    register: "Register here",
    oauthCancelled: "Sign-in cancelled — you are not signed in.",
    oauthFailed: (name: string) => `Signing in with ${name} failed. Please try again.`,
    oauthNotConfigured: (name: string) =>
      `Signing in with ${name} is unavailable right now. Use an e-mail login link instead.`,
    oauthGeneric: "Signing in with the external provider failed. Please try again.",
    passkeyOk: "Passkey confirmed — signing you in.",
    passkeyNone: "No passkey was found on this device.",
    passkeyUnsupported: "Passkeys are not supported by this browser.",
    passkeyNotOnDevice: "Passkeys are not supported on this device.",
    magicSentToast: "Check your mailbox! We sent you a magic login link.",
    unknownError: "Unknown error",
    bluesky: {
      title: "Enter your Bluesky handle",
      description:
        "Bluesky is decentralised. Your handle lets us find your own server and send you there to sign in.",
      label: "Your Bluesky handle",
      placeholder: "alice.bsky.social",
      examples: "For example:",
      submit: "Continue signing in →",
    },
  },
} as const;

export function LoginPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as z.infer<typeof searchSchema>;
  const { t, lang } = useT();
  // Zonder taalcode in het adres tonen we de inlogpagina altijd in het Nederlands.
  const pathname = useRouterState({ select: (s: { location: { pathname: string } }) => s.location.pathname });
  const urlLang = pathname.split("/").filter(Boolean)[0];
  const copyLang: "nl" | "fr" | "en" =
    urlLang === "fr" ? "fr" : urlLang === "en" ? "en" : "nl";
  const c = LOGIN_COPY[copyLang] ?? LOGIN_COPY.nl;
  const sendMagicLink = useServerFn(requestMagicLink);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "magic" | "passkey" | "password" | OAuthProvider>(
    null,
  );
  const [magicSent, setMagicSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unavailable, setUnavailable] = useState<OAuthProvider[]>([]);
  const { available: configuredProviders } = useConfiguredProviders();
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [mastodonOpen, setMastodonOpen] = useState(false);
  const [blueskyOpen, setBlueskyOpen] = useState(false);



  const { isLoggedIn, loading: authLoading } = useAuth();
  const redirectTo = safeRedirectPath(peekRedirect(), "/mijn-hoefjes");

  // Al ingelogd? Meteen door naar de doelpagina.
  useEffect(() => {
    if (!authLoading && isLoggedIn) navigate({ to: redirectTo, replace: true });
  }, [authLoading, isLoggedIn, redirectTo]);

  // OAuth-fout of annulering bij terugkeer van Google/GitHub: toon een toast
  // en haal de error-parameter uit de URL zodat hij niet blijft hangen.
  useEffect(() => {
    if (!search.error) return;
    const code = search.error.toLowerCase();
    const reason = (search.reason ?? "").toLowerCase();
    const providerName =
      search.provider === "google"
        ? "Google"
        : search.provider === "github"
          ? "GitHub"
          : search.provider === "mastodon"
            ? "Mastodon"
            : search.provider === "bluesky"
              ? "Bluesky"
              : search.provider === "rout" || reason.startsWith("rout-")
                ? "ROUT"
                : null;
    const cancelled =
      code === "access_denied" ||
      code.includes("cancel") ||
      reason.endsWith("-geweigerd") ||
      reason.includes("access_denied");

    if (reason === "rout-email-in-gebruik") {
      toast.error(
        "Er bestaat al een account met dit e-mailadres. Bevestig je e-mailadres bij ROUT of meld je eerst aan en koppel ROUT daarna in je instellingen.",
      );
    } else if (reason === "rout-email-ontbreekt") {
      toast.error("ROUT gaf geen e-mailadres door. Sta het delen van je e-mailadres toe en probeer opnieuw.");
    } else if (reason === "rout-login-nodig") {
      toast.error("Meld je opnieuw aan bij ROUT om verder te gaan.");
    } else if (reason === "rout-onbereikbaar") {
      toast.error("ROUT is even niet bereikbaar. Probeer het straks opnieuw.");
    } else if (reason === "rout-state") {
      toast.error("De aanmelding is verlopen. Probeer opnieuw met ROUT.");
    } else
    toast.error(
      cancelled
        ? c.oauthCancelled
        : reason.endsWith("-niet-geconfigureerd")
          ? c.oauthNotConfigured(providerName ?? "OAuth")
          : providerName
            ? c.oauthFailed(providerName)
            : c.oauthGeneric,
    );
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("reason");
    url.searchParams.delete("provider");
    window.history.replaceState(null, "", url.toString());
  }, [search.error, search.reason, search.provider, c]);

  useEffect(() => {
    setPasskeySupported(isPasskeySupported());
  }, []);

  // Stil aanmelden met ROUT (prompt=none), één keer per browsersessie.
  // Bij login_required komen we terug met ?rout=login_required en blijft de knop staan.
  useEffect(() => {
    if (authLoading || isLoggedIn || search.error) return;
    if (!configuredProviders.includes("rout")) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("rout") === "login_required") {
      sessionStorage.setItem("rout_silent_tried", "1");
      url.searchParams.delete("rout");
      window.history.replaceState(null, "", url.toString());
      return;
    }
    if (sessionStorage.getItem("rout_silent_tried")) return;
    sessionStorage.setItem("rout_silent_tried", "1");
    const next = url.pathname + url.search;
    window.location.assign(`/api/auth/rout?silent=1&next=${encodeURIComponent(next)}`);
  }, [authLoading, isLoggedIn, configuredProviders, search.error]);

  async function afterAuth() {
    await router.invalidate();
    // Optionele 2FA voor bezoekers: wie ze instelde, bevestigt eerst de tweede stap.
    try {
      const status = await getMfaStatus();
      const enrolled = status.methods.passkey || status.methods.totp || status.methods.phone;
      if ((status.required || enrolled) && !status.verified) {
        window.location.assign(`/beveiliging?next=${encodeURIComponent(redirectTo || "/account")}`);
        return;
      }
    } catch {
      /* status onbekend: gewoon verder */
    }
    navigate({ to: redirectTo, replace: true });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading("magic");
    try {
      stashRedirect(redirectTo);
      // Onze eigen inloglink-mail (sjabloon 7) in de taal van de bezoeker.
      await sendMagicLink({ data: { email, lang, next: redirectTo } });
      setMagicSent(true);
      toast.success(c.magicSentToast);
    } catch (err) {
      toast.error(friendlyAuthError(err instanceof Error ? err.message : c.unknownError));
    } finally {
      setLoading(null);
    }
  }

  function handleOAuth(provider: OAuthProvider) {
    // Mastodon is gedecentraliseerd: eerst de eigen server van de bezoeker vragen.
    if (provider === "mastodon") {
      setMastodonOpen(true);
      return;
    }
    // Bluesky vertrekt van de handle: daarmee vinden we de eigen server (PDS).
    if (provider === "bluesky") {
      setBlueskyOpen(true);
      return;
    }
    setLoading(provider);
    // Echte serverflow: de client secret blijft altijd op de server.
    stashRedirect(redirectTo);
    startOAuth(provider, redirectTo);
  }



  async function handlePasskey() {
    setLoading("passkey");
    try {
      if (!isPasskeySupported()) {
        throw new Error(c.passkeyNotOnDevice);
      }
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const options = await startPasskeyLogin({ data: { email: email || undefined } });
      let attResp;
      try {
        attResp = await startAuthentication({ optionsJSON: options });
      } catch (err) {
        // Prompt weggeklikt: rustig stoppen, geen foutmelding.
        const message = passkeyErrorMessage(err);
        if (!message) return;
        throw new Error(c.passkeyNone);
      }
      const result = await finishPasskeyLogin({
        data: { email: email || undefined, response: attResp },
      });
      toast.success(c.passkeyOk);
      // Direct aanmelden: het handoff-token opent meteen de sessie.
      const next = redirectTo || "/account";
      await supabase.auth.setSession(result.token);
      window.location.assign(next);
    } catch (err) {
      const message = passkeyErrorMessage(err);
      if (message) toast.error(friendlyAuthError(message));
    } finally {
      setLoading(null);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading("password");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await afterAuth();
    } catch (err) {
      toast.error(friendlyAuthError(err instanceof Error ? err.message : c.unknownError));
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)] text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <LocalLink to={pathFor("home", lang)} className="text-sm font-semibold uppercase tracking-wider">
            {c.back}
          </LocalLink>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{c.portal}</p>
          <h1 className="font-serif mt-3 text-4xl italic tracking-tight text-[color:var(--color-terracotta)]">
            {c.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {c.intro}
          </p>

          {magicSent ? (
            <div className="mt-8 rounded-2xl border border-border bg-card text-foreground p-6 text-center">
              <Mail className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-3 text-lg font-semibold">{c.mailboxTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.mailboxBody} <strong>{email}</strong>. {c.mailboxBody2}
              </p>
              <LoginCodeForm email={email} next={redirectTo} className="mt-5" />
              <Button variant="ghost" className="mt-4 text-xs" onClick={() => setMagicSent(false)}>
                {c.otherEmail}
              </Button>
            </div>
          ) : (

            <div className="mt-8 space-y-4">
              {/* Primaire methode: sociale login — minimalistische ronde icoonknoppen */}
              {(() => {
                const providers = OAUTH_PROVIDERS.filter(
                  (p) => configuredProviders.includes(p.id) && !unavailable.includes(p.id),
                );
                return providers.length ? (
                  <>
                    <div className="flex justify-center gap-4">
                      {providers.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          aria-label={`${c.oauth} ${label}`}
                          title={`${c.oauth} ${label}`}
                          disabled={busy}
                          onClick={() => handleOAuth(id)}
                          className="grid size-14 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary hover:shadow-md active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                        >
                          {loading === id ? (
                            <Loader2 className="size-5 animate-spin" />
                          ) : (
                            <Icon className="size-6" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      {c.or}
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  </>
                ) : null;
              })()}

              {/* Optie A: Magic Link */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <Label htmlFor="email-magic">{c.email}</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    autoComplete="email webauthn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 h-12 bg-card text-foreground placeholder:text-muted-foreground"
                    placeholder={c.emailPlaceholder}
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full h-12 rounded-full">
                  {loading === "magic" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {c.sendLink}
                </Button>
              </form>

              {/* Optie B: Passkey — altijd zichtbaar, uitgeschakeld indien niet ondersteund */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block w-full">
                      <Button
                        type="button"
                        className="h-12 w-full rounded-full"
                        onClick={handlePasskey}
                        disabled={busy || !passkeySupported}
                      >
                        {loading === "passkey" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Fingerprint className="mr-2 h-4 w-4" />
                        )}
                        {c.passkey}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!passkeySupported && (
                    <TooltipContent>{c.passkeyUnsupported}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <MastodonInstanceDialog
                open={mastodonOpen}
                onOpenChange={setMastodonOpen}
                onConfirm={(instance) => {
                  setLoading("mastodon");
                  stashRedirect(redirectTo);
                  startOAuth("mastodon", redirectTo, instance);
                }}
              />

              <BlueskyHandleDialog
                open={blueskyOpen}
                onOpenChange={setBlueskyOpen}
                copy={c.bluesky}
                onConfirm={(handle) => {
                  setLoading("bluesky");
                  stashRedirect(redirectTo);
                  startOAuth("bluesky", redirectTo, handle);
                }}
              />

              {/* Optie C: klassiek wachtwoord — inklapbaar */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showPassword ? "rotate-180" : ""}`}
                  />
                  {c.withPassword}
                </button>
                {showPassword && (
                  <form onSubmit={handlePassword} className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="pw">{c.password}</Label>
                      <PasswordInput
                        id="pw"
                        autoComplete="current-password"
                        value={password}
                        onChange={setPassword}
                        required
                        minLength={8}
                        className="mt-1 bg-card text-foreground"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={busy || !email}
                      className="w-full h-11 rounded-full"
                    >
                      {loading === "password" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {c.withPassword}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      <Link to="/wachtwoord-vergeten" className="underline underline-offset-4">
                        {c.forgot}
                      </Link>
                    </p>
                  </form>
                )}
              </div>

              <p className="pt-4 text-center text-xs text-muted-foreground">
                {c.noAccount}{" "}
                <LocalLink
                  to={pathFor("register", lang)}
                  onClick={() => stashRedirect(redirectTo)}
                  className="font-semibold text-[color:var(--color-terracotta)] underline"
                >
                  {c.register}
                </LocalLink>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
