import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { ExternalLink, Fingerprint, KeyRound, Loader2, MessageSquare, Send, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MLogo } from "@/components/MLogo";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { isPasskeySupported, passkeyErrorMessage } from "@/lib/auth/passkey";
import { guessDeviceNickname } from "@/hooks/usePasskeys";
import { COUNTRIES } from "@/lib/mfa-core";
import {
  checkTelegramVerification,
  confirmTotpSetup,
  getMfaStatus,
  regenerateRecoveryCodes,
  removeMfaMethod,
  sendSmsCode,
  startTelegramVerification,
  startTotpSetup,
  verifySmsCode,
  verifyTotpCode,
  type MfaStatus,
} from "@/lib/mfa.functions";
import {
  finishPasskeyLogin,
  finishPasskeyRegistration,
  startPasskeyLogin,
  startPasskeyRegistration,
} from "@/lib/webauthn.functions";

export const Route = createFileRoute("/beveiliging")({
  ssr: false,
  validateSearch: (s) => z.object({ next: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Account beveiligen — Maximilien" },
      { name: "description", content: "Stel je tweestapsverificatie in of bevestig je aanmelding bij Maximilien." },
      { property: "og:title", content: "Account beveiligen — Maximilien" },
      { property: "og:description", content: "Tweestapsverificatie voor je Maximilien-account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SecurityPage,
});

const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");
const errMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : "Er ging iets mis.");

type Method = "passkey" | "totp" | "phone";

function SecurityPage() {
  const { next } = Route.useSearch();
  const target = safeNext(next);
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [email, setEmail] = useState<string>("");
  const [method, setMethod] = useState<Method | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.assign("/auth");
      return;
    }
    setEmail(data.user.email ?? "");
    try {
      setStatus(await getMfaStatus());
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const done = useCallback(
    async (token: string | null | undefined, codes?: string[]) => {
      if (token) await supabase.auth.setSession(token);
      if (codes?.length) {
        setRecovery(codes);
        return;
      }
      toast.success("Je account is beveiligd.");
      window.location.assign(target);
    },
    [target],
  );

  if (!status) {
    return (
      <Shell>
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  if (recovery) {
    return (
      <Shell title="Bewaar je herstelcodes">
        <p className="text-sm text-muted-foreground">
          Verlies je je telefoon? Met één van deze codes kan je toch aanmelden. Elke code werkt één keer.
          Bewaar ze op een veilige plek.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-4 font-mono text-sm">
          {recovery.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void navigator.clipboard?.writeText(recovery.join("\n"))}>
            Kopiëren
          </Button>
          <Button onClick={() => window.location.assign(target)}>Ik heb ze bewaard — verder</Button>
        </div>
      </Shell>
    );
  }

  const enrolled = status.methods.passkey || status.methods.totp || status.methods.phone;

  // Al ingesteld, maar deze sessie nog niet bevestigd → tweede stap vragen.
  if (enrolled && !status.verified) {
    return (
      <Shell title="Bevestig dat jij het bent">
        <p className="text-sm text-muted-foreground">Kies je tweede stap om verder te gaan.</p>
        <VerifyStep status={status} email={email} onDone={done} />
      </Shell>
    );
  }

  if (enrolled && status.verified && !method) {
    return (
      <Shell title="Je account is beveiligd">
        <ul className="space-y-1 text-sm">
          <li>{status.methods.passkey ? "✅" : "▫️"} Passkey</li>
          <li>{status.methods.totp ? "✅" : "▫️"} Authenticator-app</li>
          <li>{status.methods.phone ? "✅" : "▫️"} Telefoonverificatie</li>
        </ul>
        <ManageMethods status={status} onRecovery={setRecovery} onChanged={load} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.location.assign(target)}>Verder</Button>
          {!status.methods.totp && (
            <Button variant="outline" onClick={() => setMethod("totp")}>
              Authenticator toevoegen
            </Button>
          )}
          {!status.methods.passkey && (
            <Button variant="outline" onClick={() => setMethod("passkey")}>
              Passkey toevoegen
            </Button>
          )}
          {!status.methods.phone && (
            <Button variant="outline" onClick={() => setMethod("phone")}>
              Telefoon toevoegen
            </Button>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Hoe wil je je account beveiligen?">
      <p className="text-sm text-muted-foreground">
        {status.required
          ? "Als medewerker van Maximilien is een tweede stap verplicht. Naast je wachtwoord bevestig je voortaan met één van deze methodes."
          : "Voeg een tweede stap toe, zodat enkel jij kan aanmelden — ook als iemand je wachtwoord kent."}
      </p>
      {!method && (
        <div className="grid gap-3">
          <Choice icon={<Fingerprint />} title="Passkey (aanbevolen)" text="Face ID, vingerafdruk of toestelpincode." onClick={() => setMethod("passkey")} />
          <Choice icon={<KeyRound />} title="Authenticator-app" text="Google Authenticator, Microsoft Authenticator, 1Password…" onClick={() => setMethod("totp")} />
          <Choice icon={<Smartphone />} title="Telefoon" text="Code per sms (België) of bevestigen via Telegram (buitenland)." onClick={() => setMethod("phone")} />
        </div>
      )}
      {method === "passkey" && <PasskeySetup onDone={done} />}
      {method === "totp" && <TotpSetup onDone={done} />}
      {method === "phone" && <PhoneFlow purpose="setup" onDone={done} />}
      {method && (
        <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setMethod(null)}>
          Andere methode kiezen
        </button>
      )}
    </Shell>
  );
}

function ManageMethods({
  status,
  onRecovery,
  onChanged,
}: {
  status: MfaStatus;
  onRecovery: (c: string[]) => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = (m: "totp" | "phone") =>
    run(async () => {
      if (!window.confirm("Deze methode verwijderen?")) return;
      await removeMfaMethod({ data: { method: m } });
      toast.success("Verwijderd.");
      await onChanged();
    });
  return (
    <div className="space-y-3 rounded-2xl border border-border p-4 text-sm">
      {status.methods.phone && (
        <div className="flex items-center justify-between gap-2">
          <span>Telefoon: {status.phone ?? "gekoppeld"}</span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove("phone")}>
            Verwijderen
          </Button>
        </div>
      )}
      {status.methods.totp && (
        <div className="flex items-center justify-between gap-2">
          <span>Authenticator-app</span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove("totp")}>
            Verwijderen
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span>Herstelcodes: nog {status.recoveryLeft} over</span>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              if (status.recoveryLeft > 0 && !window.confirm("Je oude herstelcodes werken dan niet meer. Doorgaan?")) return;
              const r = await regenerateRecoveryCodes();
              onRecovery(r.recoveryCodes);
            })
          }
        >
          {status.recoveryLeft > 0 ? "Nieuwe codes" : "Codes maken"}
        </Button>
      </div>
    </div>
  );
}

function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-5 px-5 py-10">
      <div className="flex items-center gap-3">
        <MLogo className="size-10" />
        <ShieldCheck className="size-5 text-primary" aria-hidden />
      </div>
      {title && <h1 className="font-display text-2xl">{title}</h1>}
      {children}
    </main>
  );
}

function Choice(props: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mt-0.5 text-primary [&_svg]:size-5">{props.icon}</span>
      <span>
        <span className="block font-semibold">{props.title}</span>
        <span className="block text-sm text-muted-foreground">{props.text}</span>
      </span>
    </button>
  );
}

type DoneFn = (token: string | null | undefined, codes?: string[]) => Promise<void>;

function PasskeySetup({ onDone }: { onDone: DoneFn }) {
  const [busy, setBusy] = useState(false);
  const supported = typeof window !== "undefined" && isPasskeySupported();
  async function go() {
    setBusy(true);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const options = await startPasskeyRegistration();
      const resp = await startRegistration({ optionsJSON: options });
      const res = await finishPasskeyRegistration({ data: { response: resp, deviceName: guessDeviceNickname() } });
      await onDone(res.token);
    } catch (e) {
      const m = passkeyErrorMessage(e);
      if (m) toast.error(m);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      {!supported && (
        <p className="text-sm text-destructive">
          Deze browser ondersteunt geen passkeys (of de pagina staat in een ingebed venster). Open de site in een
          nieuw tabblad of kies een andere methode.
        </p>
      )}
      <Button onClick={() => void go()} disabled={busy || !supported}>
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Fingerprint className="mr-2 size-4" />}
        Passkey aanmaken
      </Button>
    </div>
  );
}

function TotpSetup({ onDone }: { onDone: DoneFn }) {
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    startTotpSetup()
      .then(setSetup)
      .catch((e) => toast.error(errMsg(e)));
  }, []);
  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await confirmTotpSetup({ data: { code } });
      await onDone(res.token, res.recoveryCodes);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  if (!setup) return <Loader2 className="size-5 animate-spin" />;
  return (
    <form onSubmit={confirm} className="space-y-3">
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>Open je authenticator-app en kies "Account toevoegen".</li>
        <li>Scan deze QR-code, of typ de sleutel over.</li>
        <li>Vul de 6-cijferige code in die de app toont.</li>
      </ol>
      <div className="inline-block rounded-2xl bg-card p-3 ring-1 ring-border">
        <QRCodeSVG value={setup.uri} size={168} />
      </div>
      <p className="break-all font-mono text-xs text-muted-foreground">{setup.secret}</p>
      <CodeInput value={code} onChange={setCode} />
      <Button type="submit" disabled={busy || code.length !== 6}>
        {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Bevestigen
      </Button>
    </form>
  );
}

function CodeInput({ value, onChange, label = "Code" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={11}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\dA-Za-z-]/g, "").toUpperCase())}
        className="max-w-[12rem] font-mono text-lg tracking-widest"
      />
    </label>
  );
}

function PhoneFlow({ purpose, onDone, fixed }: { purpose: "setup" | "login"; onDone: DoneFn; fixed?: "sms" | "telegram" }) {
  const [country, setCountry] = useState(fixed === "telegram" ? "XX" : "BE");
  const isBE = fixed ? fixed === "sms" : country === "BE";
  return (
    <div className="space-y-4">
      {!fixed && (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Land</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} {c.dial && `(${c.dial})`}
              </option>
            ))}
          </select>
        </label>
      )}
      {isBE ? <SmsFlow purpose={purpose} onDone={onDone} /> : <TelegramFlow purpose={purpose} onDone={onDone} />}
    </div>
  );
}

function SmsFlow({ purpose, onDone }: { purpose: "setup" | "login"; onDone: DoneFn }) {
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    try {
      const r = await sendSmsCode({ data: { phone: purpose === "setup" ? phone : undefined, purpose } });
      setSentTo(r.sentTo);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await verifySmsCode({ data: { code } });
      await onDone(r.token);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }
  if (!sentTo) {
    return (
      <form onSubmit={send} className="space-y-3">
        {purpose === "setup" && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Gsm-nummer</span>
            <Input type="tel" autoComplete="tel" placeholder="0470 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        )}
        <Button type="submit" disabled={busy || (purpose === "setup" && phone.length < 9)}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageSquare className="mr-2 size-4" />}
          Stuur code per sms
        </Button>
      </form>
    );
  }
  return (
    <form onSubmit={verify} className="space-y-3">
      <p className="text-sm text-muted-foreground">We stuurden een code naar {sentTo}. Ze is 10 minuten geldig.</p>
      <CodeInput value={code} onChange={setCode} />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy || code.length !== 6}>
          Bevestigen
        </Button>
        <Button type="button" variant="ghost" onClick={() => void send()} disabled={busy}>
          Nieuwe code
        </Button>
      </div>
    </form>
  );
}

function TelegramFlow({ purpose, onDone }: { purpose: "setup" | "login"; onDone: DoneFn }) {
  const [req, setReq] = useState<{ requestId: string; link: string } | null>(null);
  const [state, setState] = useState<"idle" | "waiting" | "rejected" | "expired">("idle");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    setBusy(true);
    try {
      const r = await startTelegramVerification({ data: { purpose } });
      setReq(r);
      setState("idle");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!req) return;
    let stopped = false;
    timer.current = setInterval(async () => {
      try {
        const r = await checkTelegramVerification({ data: { requestId: req.requestId } });
        if (stopped) return;
        if (r.status === "approved") {
          stopped = true;
          if (timer.current) clearInterval(timer.current);
          await onDone(r.token);
        } else if (r.status !== "pending") {
          stopped = true;
          if (timer.current) clearInterval(timer.current);
          setState(r.status);
        }
      } catch {
        /* volgende poging */
      }
    }, 1500);
    return () => {
      stopped = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [req, onDone]);

  if (!req) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Verificatielink klaarmaken…
      </p>
    );
  }

  if (state === "expired" || state === "rejected") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {state === "expired" ? "Deze link is verlopen." : "Dit nummer kon niet bevestigd worden."}
        </p>
        <Button variant="outline" onClick={() => void start()} disabled={busy}>
          Nieuwe link
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>Tik op "Verifieer via Telegram". Telegram opent een gesprek met @Maximiliebot.</li>
        <li>Tik in Telegram op <strong>Start</strong>.</li>
        <li>Tik op <strong>Verify My Phone Number</strong> en deel je nummer.</li>
      </ol>
      <Button asChild size="lg" className="w-full">
        <a href={req.link} target="_blank" rel="noopener noreferrer" onClick={() => setState("waiting")}>
          <Send className="mr-2 size-4" /> Verifieer via Telegram <ExternalLink className="ml-2 size-4 opacity-70" />
        </a>
      </Button>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {state === "waiting"
          ? "Wachten op bevestiging in Telegram… Je gaat automatisch verder."
          : "Deze pagina gaat vanzelf verder zodra je nummer bevestigd is."}
      </p>
      <p className="text-xs text-muted-foreground">De link is 15 minuten geldig en werkt maar één keer.</p>
    </div>
  );
}

function VerifyStep({ status, email, onDone }: { status: MfaStatus; email: string; onDone: DoneFn }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);

  async function passkey() {
    setBusy(true);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const options = await startPasskeyLogin({ data: { email: email || undefined } });
      const resp = await startAuthentication({ optionsJSON: options });
      const r = await finishPasskeyLogin({ data: { email: email || undefined, response: resp } });
      await onDone(r.token);
    } catch (e) {
      const m = passkeyErrorMessage(e);
      if (m) toast.error(m);
    } finally {
      setBusy(false);
    }
  }
  async function totp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await verifyTotpCode({ data: { code } });
      await onDone(r.token);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {status.methods.passkey && (
        <Button onClick={() => void passkey()} disabled={busy}>
          <Fingerprint className="mr-2 size-4" /> Bevestig met passkey
        </Button>
      )}
      {(status.methods.totp || status.recoveryLeft > 0) && (
        <form onSubmit={totp} className="space-y-2">
          <CodeInput value={code} onChange={setCode} label="Code uit je authenticator-app of herstelcode" />
          <Button type="submit" variant="outline" disabled={busy || code.length < 6}>
            Bevestigen
          </Button>
        </form>
      )}
      {status.methods.phone &&
        (phoneMode ? (
          <PhoneFlow purpose="login" onDone={onDone} fixed={status.phoneMethod === "telegram" ? "telegram" : "sms"} />
        ) : (
          <Button variant="outline" onClick={() => setPhoneMode(true)}>
            <Smartphone className="mr-2 size-4" />{" "}
            {status.phoneMethod === "telegram" ? "Bevestig via Telegram" : "Bevestig via sms"}
          </Button>
        ))}
    </div>
  );
}
