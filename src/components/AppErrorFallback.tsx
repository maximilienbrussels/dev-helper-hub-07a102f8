import { useEffect, useState } from "react";

import { persistClientError, reportLovableError } from "@/lib/lovable-error-reporting";
import { hardReload, collectDeviceInfo } from "@/lib/hard-reload";
import { useT, type Lang } from "@/lib/i18n";

const ERR_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    body: string;
    reload: string;
    reloading: string;
    home: string;
    report: string;
    formIntro: string;
    namePh: string;
    emailPh: string;
    notePh: string;
    whatWeSend: string;
    sending: string;
    sent: string;
    submit: string;
    failed: string;
  }
> = {
  nl: {
    eyebrow: "Technische fout",
    title: "Deze pagina kon niet laden",
    body: "Er ging iets mis bij het openen van de pagina. Laad opnieuw om de nieuwste versie te gebruiken.",
    reload: "Opnieuw laden",
    reloading: "Opnieuw laden…",
    home: "Naar de startpagina",
    report: "Fout melden",
    formIntro:
      "We sturen de foutmelding, de pagina en je apparaatgegevens mee zodat het team het probleem kan oplossen.",
    namePh: "Je naam (optioneel)",
    emailPh: "Je e-mailadres (optioneel)",
    notePh: "Wat deed je toen de fout verscheen?",
    whatWeSend: "Wat sturen we mee?",
    sending: "Versturen…",
    sent: "Bedankt, fout gemeld",
    submit: "Fout rapporteren",
    failed:
      "Rapporteren lukte niet. Probeer later opnieuw of mail info@fermeduparcmaximilien.be.",
  },
  fr: {
    eyebrow: "Erreur technique",
    title: "Cette page n'a pas pu se charger",
    body: "Un problème est survenu à l'ouverture de la page. Rechargez pour utiliser la dernière version.",
    reload: "Recharger",
    reloading: "Rechargement…",
    home: "Vers la page d'accueil",
    report: "Signaler l'erreur",
    formIntro:
      "Nous transmettons le message d'erreur, la page et les données de votre appareil afin que l'équipe puisse résoudre le problème.",
    namePh: "Votre nom (facultatif)",
    emailPh: "Votre adresse e-mail (facultatif)",
    notePh: "Que faisiez-vous quand l'erreur est apparue ?",
    whatWeSend: "Que transmettons-nous ?",
    sending: "Envoi…",
    sent: "Merci, erreur signalée",
    submit: "Signaler l'erreur",
    failed:
      "Le signalement a échoué. Réessayez plus tard ou écrivez à info@fermeduparcmaximilien.be.",
  },
  en: {
    eyebrow: "Technical error",
    title: "This page could not load",
    body: "Something went wrong while opening the page. Reload to use the latest version.",
    reload: "Reload",
    reloading: "Reloading…",
    home: "Go to the home page",
    report: "Report error",
    formIntro:
      "We send along the error message, the page and your device details so the team can fix the problem.",
    namePh: "Your name (optional)",
    emailPh: "Your email address (optional)",
    notePh: "What were you doing when the error appeared?",
    whatWeSend: "What do we send along?",
    sending: "Sending…",
    sent: "Thanks, error reported",
    submit: "Report error",
    failed: "Reporting failed. Try again later or email info@fermeduparcmaximilien.be.",
  },
};

export function AppErrorFallback({ error: rawError }: { error: unknown; reset?: () => void }) {
  const error = rawError instanceof Error ? rawError : new Error(String(rawError));
  const { lang } = useT();
  const c = ERR_COPY[lang] ?? ERR_COPY.nl;
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [device, setDevice] = useState<ReturnType<typeof collectDeviceInfo> | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_app_error_component" });
    setDevice(collectDeviceInfo());
  }, [error]);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const ok = await persistClientError(error, {
      boundary: "tanstack_app_error_component",
      reported: true,
      contact_name: naam || null,
      contact_email: email || null,
      contact_note: note || null,
    });
    setState(ok ? "sent" : "failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div role="alert" className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{c.eyebrow}</p>
        <pre className="my-4 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-4 text-left font-mono text-xs text-destructive">
          {error?.toString()}
          {"\n\n"}
          {error?.stack}
        </pre>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">{c.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {c.body}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            data-testid="error-reload"
            disabled={reloading}
            onClick={() => {
              setReloading(true);
              void hardReload();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {reloading ? c.reloading : c.reload}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {c.home}
          </a>
          <button
            type="button"
            data-testid="error-report-toggle"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {c.report}
          </button>
        </div>

        {open && (
          <form
            onSubmit={submitReport}
            className="mt-6 space-y-3 rounded-lg border border-border bg-card p-4 text-left"
          >
            <p className="text-xs text-muted-foreground">
              {c.formIntro}
            </p>
            <input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder={c.namePh}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.emailPh}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={c.notePh}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">{c.whatWeSend}</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px]">
                {JSON.stringify({ fout: error.message, ...(device ?? {}) }, null, 2)}
              </pre>
            </details>
            <button
              type="submit"
              data-testid="error-report-submit"
              disabled={state === "sending" || state === "sent"}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {state === "sending" ? c.sending : state === "sent" ? c.sent : c.submit}
            </button>
            {state === "failed" && (
              <p className="text-xs text-destructive">
                {c.failed}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
