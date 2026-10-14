import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Fingerprint, KeyRound, Loader2, Mail } from "lucide-react";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { BlueskyIcon, GitHubIcon, GoogleIcon, MastodonIcon } from "@/components/auth/ProviderIcons";
import { MastodonInstanceDialog } from "@/components/auth/MastodonInstanceDialog";
import { BlueskyHandleDialog } from "@/components/auth/BlueskyHandleDialog";
import { startOAuth } from "@/lib/oauth-status";
import { stashRedirect } from "@/lib/redirect";

import { MLogo } from "@/components/MLogo";
import { useServerFn } from "@tanstack/react-start";
import {
  requestTeamLoginCode,
  requestTeamPasswordReset,
  setBrevoKeyForSession,
} from "@/lib/auth-email.functions";
import { requestActivationCode, activateAccount } from "@/lib/activation.functions";
import { startPasskeyLogin, finishPasskeyLogin } from "@/lib/webauthn.functions";
import { LoginCodeForm } from "@/components/LoginCodeForm";
import { DevSecretsModal } from "@/components/DevSecretsModal";
import { diagnoseBrevo } from "@/lib/brevo-diagnostics.functions";
import { checkPortalAccess } from "@/lib/portal-access.functions";
import { getPublicUrl } from "@/lib/urls";
import { resolveAppMode, postLoginPathFor } from "@/lib/app-mode";
import { isPasskeySupported, passkeyErrorMessage } from "@/lib/auth/passkey";
import { deliveryReasonMessage } from "@/lib/auth-errors";

type BrevoProbe = { url: string; status: number; ok: boolean; ms: number; body: string } | null;
type BrevoDiagnosis = {
  env: Record<string, unknown>;
  route: string;
  account: BrevoProbe;
  testSend: BrevoProbe;
  verdict: string;
};

/** Toont de volledige Brevo-diagnose (geen sleutels, enkel status en reden). */
function BrevoDiagnosticsPanel({ diag }: { diag: BrevoDiagnosis }) {
  return (
    <div className="mt-3 space-y-2 rounded-md border border-border bg-surface p-3 text-left text-[11px]">
      <p className="text-xs font-semibold">Brevo-diagnose</p>
      <p className="text-muted-foreground">{diag.verdict}</p>
      <p>
        <span className="font-semibold">Route:</span> {diag.route}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
        {JSON.stringify(diag.env, null, 2)}
      </pre>
      {diag.account ? (
        <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
          {`account ${diag.account.status} (${diag.account.ms}ms)\n${diag.account.body}`}
        </pre>
      ) : null}
      {diag.testSend ? (
        <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
          {`testmail ${diag.testSend.status} (${diag.testSend.ms}ms)\n${diag.testSend.body}`}
        </pre>
      ) : null}
    </div>
  );
}



export const Route = createFileRoute("/auth/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Medewerkerslogin — Maximilien" },
      {
        name: "description",
        content:
          "Beveiligde toegang tot het beheerportaal van Maximilien voor medewerkers en beheerders.",
      },
      { property: "og:title", content: "Medewerkerslogin — Maximilien" },
      {
        property: "og:description",
        content: "Beveiligde toegang tot het beheerportaal voor medewerkers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(255),
  password: z.string().min(8, "Minstens 8 tekens").max(72),
});

const emailOnly = z.string().trim().email("Vul een geldig e-mailadres in").max(255);

function AuthPage() {
  const navigate = useNavigate();
  const postLoginPath = postLoginPathFor(resolveAppMode());
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "forgot" | "activate">("signIn");
  const [activationStep, setActivationStep] = useState<1 | 2>(1);
  const [activationCode, setActivationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [activationHint, setActivationHint] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [customerSession, setCustomerSession] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [brevoPrompt, setBrevoPrompt] = useState(false);
  const [mastodonOpen, setMastodonOpen] = useState(false);
  const [blueskyOpen, setBlueskyOpen] = useState(false);
  const [brevoKey, setBrevoKey] = useState("");
  const [canDiagnose, setCanDiagnose] = useState(false);
  const [diag, setDiag] = useState<BrevoDiagnosis | null>(null);
  const loginCode = useServerFn(requestTeamLoginCode);
  const saveBrevoKey = useServerFn(setBrevoKeyForSession);
  const teamReset = useServerFn(requestTeamPasswordReset);
  const askActivation = useServerFn(requestActivationCode);
  const finishActivation = useServerFn(activateAccount);
  const runDiagnose = useServerFn(diagnoseBrevo);
  const checkAccess = useServerFn(checkPortalAccess);

  async function routeAuthenticatedUser(): Promise<boolean> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return false;

    let staff = false;
    try {
      const access = await checkAccess();
      if (access?.mfa) {
        await navigate({
          href: `/beveiliging?next=${encodeURIComponent(postLoginPath)}`,
          replace: true,
        });
        return true;
      }
      staff = Boolean(access?.allowed);
    } catch {
      const { data: rpc } = await supabase.rpc("is_staff", { _user_id: data.user.id });
      staff = Boolean(rpc);
    }

    if (staff) {
      await navigate({ to: postLoginPath, replace: true });
      return true;
    }

    setCustomerSession(true);
    return false;
  }

  /** Diepe Brevo-diagnose (enkel hoofdbeheerder): toont de exacte faalreden. */
  async function diagnose(sendTest: boolean) {
    setBusy(true);
    try {
      const res = await runDiagnose({ data: { email: email.trim().toLowerCase(), sendTest } });
      setDiag(res as BrevoDiagnosis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Diagnose mislukt.");
    } finally {
      setBusy(false);
    }
  }


  /** Stap 1: whitelistcheck + activatiecode versturen. */
  async function startActivation(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailOnly.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      const res = await askActivation({ data: { email: parsed.data, lang: "nl", next: postLoginPath } });
      setActivationStep(2);
      setActivationHint(res.devCode ?? null);
      setCanDiagnose(Boolean(res.canDiagnose) && !res.delivered);

      if (res.delivered) toast.success("Activatiecode verstuurd naar je werkmailbox.");
      else if (res.devCode) toast.info(`Mailen lukte niet — je code is ${res.devCode}`);
      else toast.error(deliveryReasonMessage(res.reason ?? null), { duration: 10000 });
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Geen toegang. Vraag een beheerder om een uitnodiging.",
      );
    } finally {
      setBusy(false);
    }
  }

  /** Stap 2: code controleren, wachtwoord instellen en meteen aanmelden. */
  async function completeActivation(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Kies een wachtwoord van minstens 8 tekens.");
    setBusy(true);
    try {
      const res = await finishActivation({
        data: {
          email: email.trim().toLowerCase(),
          code: activationCode,
          password: newPassword,
          next: postLoginPath,
        },
      });
      toast.success("Account geactiveerd. Je wordt aangemeld.");
      if (res.url) {
        window.location.replace(res.url);
        return;
      }
      setMode("signIn");
      setActivationStep(1);
      setPassword(newPassword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activatie mislukt.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setPasskeySupported(isPasskeySupported());
  }, []);

  useEffect(() => {
    let active = true;

    async function route() {
      if (!active) return;
      await routeAuthenticatedUser();
    }

    void route();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void route();
      if (event === "SIGNED_OUT") setCustomerSession(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, checkAccess]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        const raw = error.message ?? "";
        const storing = /tijdelijk niet beschikbaar|onbereikbaar|databank/i.test(raw);
        toast.error(
          error.status === 429
            ? "Te veel pogingen. Probeer het straks opnieuw."
            : storing
              ? raw
              : "Aanmelden mislukt. Controleer je e-mailadres en wachtwoord.",
        );
        return;
      }
      // Niet afhankelijk zijn van timing van onAuthStateChange: controleer de
      // zojuist aangemaakte sessie meteen en stuur admins direct door.
      await routeAuthenticatedUser();
    } catch (err) {
      // Nooit blijven hangen: elke onverwachte fout stopt de spinner én toont
      // een verklaring in plaats van een eindeloos draaiende knop.
      toast.error(err instanceof Error ? err.message : "Aanmelden mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagic(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailOnly.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      const res = await loginCode({ data: { email: parsed.data, lang: "nl", next: postLoginPath } });
      setMagicSent(true);
      setDevCode(res.devCode ?? null);
      setDevUrl(res.devUrl ?? null);
      setCanDiagnose(Boolean(res.canDiagnose) && !res.delivered);
      if (res.delivered) {
        toast.success("Inlogcode verstuurd naar je werkmailbox.");
      } else if (res.devCode) {
        toast.info(`Mailen lukte niet — je inlogcode is ${res.devCode}`, { duration: 30000 });
      } else {
        toast.error(deliveryReasonMessage(res.reason ?? null), { duration: 10000 });
      }
      if (!res.delivered && res.preview) setBrevoPrompt(true);

    } catch (error) {
      console.error("[auth] inlogcode aanvragen mislukt", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Versturen mislukt. Probeer later opnieuw.",
      );
    } finally {
      setBusy(false);
    }
  }

  /** Tijdelijke Brevo-sleutel bewaren en meteen opnieuw proberen te mailen. */
  async function submitBrevoKey(e: React.FormEvent) {
    e.preventDefault();
    if (brevoKey.trim().length < 10) return toast.error("Plak een volledige Brevo API-sleutel.");
    setBusy(true);
    try {
      await saveBrevoKey({ data: { key: brevoKey.trim() } });
      setBrevoKey("");
      setBrevoPrompt(false);
      toast.success("Sleutel bewaard voor deze sessie. We proberen opnieuw te mailen.");
      const res = await loginCode({ data: { email, lang: "nl" } });
      setDevCode(res.devCode ?? null);
      setDevUrl(res.devUrl ?? null);
      if (res.delivered) toast.success("Mail verstuurd via Brevo.");
      else toast.error("Brevo weigerde de sleutel. Gebruik de code op het scherm.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sleutel bewaren mislukt.");
    } finally {
      setBusy(false);
    }
  }

  /** Aanmelden met Face ID / vingerafdruk (WebAuthn). */
  async function signInWithPasskey() {
    setBusy(true);
    try {
      if (!isPasskeySupported()) {
        throw new Error(
          "Passkeys worden niet ondersteund op dit apparaat/browser (HTTPS vereist).",
        );
      }
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const options = await startPasskeyLogin({ data: { email: email || undefined } });
      const response = await startAuthentication({ optionsJSON: options });
      const result = await finishPasskeyLogin({
        data: { email: email || undefined, response },
      });
      await supabase.auth.setSession(result.token);
      toast.success("Passkey bevestigd — je bent aangemeld.");
      window.location.assign(postLoginPath);
    } catch (err) {
      // Annuleren (NotAllowedError) reset enkel de knop; echte fouten krijgen
      // een begrijpelijke melding (bv. SecurityError → HTTPS vereist).
      const message = passkeyErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailOnly.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      await teamReset({ data: { email: parsed.data, lang: "nl" } });
      setResetSent(true);
    } catch {
      toast.error("Versturen mislukt. Probeer later opnieuw.");
    } finally {
      setBusy(false);
    }
  }


  async function signOutCustomer() {
    await supabase.auth.signOut();
    setCustomerSession(false);
    toast.success("Uitgelogd. Je kan nu aanmelden als medewerker.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link to="/" aria-label="Terug naar de hoofdsite">
            <MLogo className="mx-auto h-12 w-auto" />
          </Link>
          <h1 className="font-display mt-3 text-xl font-bold">Maximilien</h1>
          <p className="text-sm text-muted-foreground">
            {postLoginPath === "/veld" ? "Veld-app voor medewerkers" : "Beheerportaal voor medewerkers"}
          </p>
        </div>

        {customerSession ? (
          <div className="rounded-lg border border-border bg-card p-5 text-center text-sm">
            <p className="font-semibold">Je bent ingelogd als klant</p>
            <p className="mt-1 text-muted-foreground">
              Log eerst uit om toegang te krijgen tot het {postLoginPath === "/veld" ? "veldportaal" : "beheerportaal"}.
            </p>
            <Button className="mt-4 w-full" onClick={() => void signOutCustomer()}>
              Uitloggen
            </Button>
            <Button variant="outline" className="mt-2 w-full" asChild>
              <Link to="/account">Naar mijn account</Link>
            </Button>
          </div>
        ) : magicSent ? (
          <div className="rounded-lg border border-border bg-card p-5 text-center text-sm">
            <p className="font-semibold">Check je mailbox</p>
            <p className="mt-1 text-muted-foreground">
              Als {email} een teamadres is, staat er een eenmalige 6-cijferige inlogcode of
              magische link in je mailbox.
            </p>
            {devCode ? (
              <div className="mt-4 rounded-md border border-dashed border-primary/50 bg-primary/5 p-3 text-left">
                <p className="text-xs font-semibold">Mailen lukte niet — gebruik deze code</p>
                <p className="mt-1 text-center text-2xl font-bold tracking-[0.35em]">{devCode}</p>
                {devUrl ? (
                  <a
                    href={devUrl}
                    className="mt-2 block text-center text-xs font-semibold text-primary underline"
                  >
                    Of open de inloglink meteen
                  </a>
                ) : null}
              </div>
            ) : null}
            {brevoPrompt ? (
              <form onSubmit={submitBrevoKey} className="mt-4 space-y-2 text-left">
                <p className="text-xs text-muted-foreground">
                  Brevo API-sleutel is ontbrekend of onjuist. Plak hier tijdelijk een sleutel om
                  live verzending te testen.
                </p>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="xkeysib-…"
                  value={brevoKey}
                  onChange={(e) => setBrevoKey(e.target.value)}
                />
                <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
                  <KeyRound className="size-4" /> Sleutel testen
                </Button>
              </form>
            ) : null}
            {canDiagnose ? (
              <div className="mt-4 text-left">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => void diagnose(false)}
                  >
                    Brevo diagnose
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => void diagnose(true)}
                  >
                    Testmail
                  </Button>
                </div>
                {diag ? <BrevoDiagnosticsPanel diag={diag} /> : null}
              </div>
            ) : null}
            <LoginCodeForm email={email} next={postLoginPath} className="mt-4" />

            <Button variant="outline" className="mt-4 w-full" onClick={() => setMagicSent(false)}>
              Terug naar aanmelden
            </Button>
          </div>

        ) : resetSent ? (
          <div className="rounded-lg border border-border bg-card p-5 text-center text-sm">
            <p className="font-semibold">Check je mailbox</p>
            <p className="mt-1 text-muted-foreground">
              Als <strong>{email}</strong> gekoppeld is aan een medewerkersaccount, is er een
              herstellink verzonden. Check ook je spam-folder of vraag een beheerder om een
              uitnodiging.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                setResetSent(false);
                setMode("signIn");
              }}
            >
              Terug naar aanmelden
            </Button>
          </div>
        ) : mode === "signIn" ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Aanmelden</h2>

            {/* Eén uniforme rij ronde icoonknoppen — identiek aan het klantenportaal. */}
            <div className="mt-5 flex justify-center gap-4">
              {(
                [
                  { id: "google", label: "Google", Icon: GoogleIcon },
                  { id: "github", label: "GitHub", Icon: GitHubIcon },
                  { id: "mastodon", label: "Mastodon", Icon: MastodonIcon },
                  { id: "bluesky", label: "Bluesky", Icon: BlueskyIcon },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={`Inloggen met ${label}`}
                  title={`Inloggen met ${label}`}
                  disabled={busy}
                  onClick={() => {
                    if (id === "mastodon") {
                      setMastodonOpen(true);
                      return;
                    }
                    if (id === "bluesky") {
                      setBlueskyOpen(true);
                      return;
                    }
                    stashRedirect(postLoginPath);
                    startOAuth(id, postLoginPath);
                  }}
                  className="grid size-14 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary hover:shadow-md active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                >
                  <Icon className="size-6" />
                </button>
              ))}
            </div>

            <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> of{" "}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="mt-4 space-y-3" onSubmit={signIn}>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pw">Wachtwoord</Label>
                <PasswordInput id="pw" value={password} onChange={setPassword} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Aanmelden
              </Button>
            </form>

            {/* Secundaire manieren: ronde icoonknoppen, rustig en klein. */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={busy}
                title="Inlogcode via e-mail"
                aria-label="Inlogcode via e-mail"
                onClick={(e) => void sendMagic(e)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold transition-colors hover:border-primary hover:bg-muted disabled:opacity-60"
              >
                <Mail className="size-4 shrink-0" /> Code via mail
              </button>

              {passkeySupported ? (
                <button
                  type="button"
                  disabled={busy}
                  title="Inloggen met Passkey"
                  aria-label="Inloggen met Passkey"
                  onClick={() => void signInWithPasskey()}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface transition-colors hover:border-primary hover:bg-muted disabled:opacity-60"
                >
                  <Fingerprint className="size-5" />
                </button>
              ) : null}
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Ontvang een eenmalige 6-cijferige inlogcode of magische link in je werkmailbox.
            </p>

            <div className="mt-4 flex items-center justify-center gap-3 text-[11px]">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Wachtwoord vergeten?
              </button>
              <span className="h-3 w-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  setMode("activate");
                  setActivationStep(1);
                  setActivationHint(null);
                  setActivationCode("");
                  setNewPassword("");
                }}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Eerste keer inloggen?
              </button>
            </div>

          </div>
        ) : mode === "activate" ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Account activeren</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enkel uitgenodigde werkadressen kunnen een account activeren.
            </p>
            {activationStep === 1 ? (
              <form className="mt-4 space-y-3" onSubmit={startActivation}>
                <div>
                  <Label htmlFor="aemail">Werk-e-mailadres</Label>
                  <Input
                    id="aemail"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Activatiecode versturen
                </Button>
              </form>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={completeActivation}>
                {canDiagnose ? (
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled={busy}
                      onClick={() => void diagnose(false)}
                    >
                      Brevo diagnose
                    </Button>
                    {diag ? <BrevoDiagnosticsPanel diag={diag} /> : null}
                  </div>
                ) : null}

                {activationHint ? (
                  <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-3 text-center">
                    <p className="text-xs font-semibold">Mailen lukte niet — gebruik deze code</p>
                    <p className="mt-1 text-2xl font-bold tracking-[0.35em]">{activationHint}</p>
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="acode">Activatiecode</Label>
                  <Input
                    id="acode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={activationCode}
                    onChange={(e) =>
                      setActivationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="text-center text-lg tracking-[0.4em]"
                  />
                </div>
                <div>
                  <Label htmlFor="apw">Nieuw wachtwoord</Label>
                  <PasswordInput id="apw" value={newPassword} onChange={setNewPassword} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Account activeren
                </Button>
              </form>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("signIn");
                setActivationStep(1);
              }}
              className="mt-3 w-full text-center text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Terug naar aanmelden
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-bold">Wachtwoord vergeten</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Vul je werk-e-mailadres in. We sturen je een link om een nieuw wachtwoord te kiezen.
            </p>
            <form className="mt-4 space-y-3" onSubmit={sendReset}>
              <div>
                <Label htmlFor="femail">E-mail</Label>
                <Input
                  id="femail"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Herstellink versturen
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setMode("signIn")}
              className="mt-3 w-full text-center text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Terug naar aanmelden
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Toegang is uitsluitend op uitnodiging. Vraag een beheerder om een uitnodiging voor je
          werk-e-mailadres.
        </p>

        <a
          href={getPublicUrl("/")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-3 text-center text-xs font-semibold text-foreground hover:bg-surface"
        >
          Ben je bezoeker of klant? Ga naar de website
          <ArrowRight className="size-3.5 shrink-0" />
        </a>
      </div>
      <MastodonInstanceDialog
        open={mastodonOpen}
        onOpenChange={setMastodonOpen}
        onConfirm={(instance) => {
          stashRedirect(postLoginPath);
          startOAuth("mastodon", postLoginPath, instance);
        }}
      />
      <BlueskyHandleDialog
        open={blueskyOpen}
        onOpenChange={setBlueskyOpen}
        copy={{
          title: "Vul je Bluesky-handle in",
          description:
            "Bluesky is gedecentraliseerd. Met je handle vinden we jouw eigen server en sturen we je daarheen om in te loggen.",
          label: "Je Bluesky-handle",
          placeholder: "alice.bsky.social",
          examples: "Bijvoorbeeld:",
          submit: "Doorgaan met inloggen →",
        }}
        onConfirm={(handle) => {
          stashRedirect(postLoginPath);
          startOAuth("bluesky", postLoginPath, handle);
        }}
      />
      <DevSecretsModal />
    </main>
  );
}
