import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { diagnoseLoginAndMail, type DiagnosticCheck } from "@/lib/login-diagnostics.functions";
import { getMissingI18nKeys } from "@/lib/i18n";
import { getMissingPortalI18nKeys } from "@/lib/portal-i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DOT = {
  ok: "bg-success",
  warn: "bg-warning",
  fail: "bg-destructive",
} as const;

const TONE = {
  ok: "border-success/30 bg-success/10 text-success",
  warn: "border-warning/40 bg-warning/15 text-warning-foreground",
  fail: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

/** Eén compacte badge per controle; details in de tooltip. */
function StatusBadge({ check }: { check: DiagnosticCheck }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
            TONE[check.status],
          )}
        >
          <span className={cn("size-2 rounded-full", DOT[check.status])} />
          {check.label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{check.detail}</p>
        {check.hint ? <p className="mt-1 text-xs opacity-80">{check.hint}</p> : null}
      </TooltipContent>
    </Tooltip>
  );
}

/** Compacte diagnose van klantenlogin en mailverzending. */
export function LoginMailDiagnostics() {
  const run = useServerFn(diagnoseLoginAndMail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["login-mail-diagnostics"],
    queryFn: () => run(),
    retry: false,
  });

  const problems = (data?.checks ?? []).filter((c) => c.status !== "ok");

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Diagnose</h2>
        </div>
        {isLoading ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Controleren…
          </span>
        ) : null}
        <TooltipProvider delayDuration={120}>
          {data?.checks.map((check) => <StatusBadge key={check.id} check={check} />)}
        </TooltipProvider>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{(error as Error).message}</p> : null}

      {problems.length ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {problems.map((c) => (
            <li key={c.id} className="break-words">
              <span className="font-semibold text-foreground">{c.label}:</span> {c.detail}
            </li>
          ))}
        </ul>
      ) : null}

      <Accordion type="single" collapsible className="mt-3">
        <AccordionItem value="setup" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">
            🔧 Setup instructies &amp; redirect-URI&apos;s
          </AccordionTrigger>
          <AccordionContent className="space-y-4 text-xs">
            <div>
              <p className="font-semibold">Redirect-URI in de Google- / GitHub-console</p>
              <p className="mt-1 text-muted-foreground">
                Neon Auth vangt de terugkeer op — zet in de provider dus het Neon-adres, niet dat
                van de website:
              </p>
              <ul className="mt-1 space-y-1 font-mono break-all text-muted-foreground">
                {(data?.redirectUris ?? []).map((u) => <li key={u}>{u}</li>)}
              </ul>
              <p className="mt-1 break-all text-muted-foreground">
                Patroon:{" "}
                <code className="rounded bg-muted px-1">
                  {(data?.authUrl || "https://…neonauth…/neondb/auth") + "/callback/{provider}"}
                </code>
              </p>
            </div>
            <div>
              <p className="font-semibold">Toegestane origins (Trusted Origins) in Neon Auth</p>
              <p className="mt-1 text-muted-foreground">
                Moet minstens <strong>https://maximilien.brussels</strong> en{" "}
                <strong>https://maximilien.site</strong> bevatten, anders weigert Neon Auth de
                aanmelding.
              </p>
              <ul className="mt-1 space-y-1 font-mono break-all text-muted-foreground">
                {(data?.origins ?? []).map((o) => <li key={o}>{o}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Mailverzending</p>
              <p className="mt-1 text-muted-foreground">
                Alle transactionele mail loopt via de Brevo HTTP-API (sleutel{" "}
                <code className="rounded bg-muted px-1">xkeysib-…</code>). Er is geen SMTP-terugval
                meer. Het afzenderdomein (no-reply@send.maximilien.site) moet in Brevo geverifieerd zijn
                met SPF en DKIM.
              </p>
            </div>
            <MissingTranslationsReport />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

/** Toont welke vertaalsleutels tijdens deze sessie ontbraken (per taal, na terugval). */
function MissingTranslationsReport() {
  const [site, setSite] = useState(getMissingI18nKeys());
  const [portal, setPortal] = useState(getMissingPortalI18nKeys());

  useEffect(() => {
    const id = window.setInterval(() => {
      setSite(getMissingI18nKeys());
      setPortal(getMissingPortalI18nKeys());
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const langs: Array<{ key: "nl" | "fr" | "en"; label: string }> = [
    { key: "nl", label: "NL" },
    { key: "fr", label: "FR" },
    { key: "en", label: "EN" },
  ];

  return (
    <div className="border-t border-border pt-3">
      <p className="font-semibold">Ontbrekende vertalingen (deze sessie)</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {(
          [
            { label: "Publieke site", data: site },
            { label: "Beheerportaal", data: portal },
          ] as const
        ).map((group) => (
          <div key={group.label} className="rounded-lg border border-border/70 p-3">
            <p className="font-semibold">{group.label}</p>
            <ul className="mt-2 space-y-1.5">
              {langs.map((l) => {
                const keys = group.data[l.key];
                return (
                  <li key={l.key}>
                    <span className="font-mono font-semibold">{l.label}</span>{" "}
                    {keys.length === 0 ? (
                      <span className="text-muted-foreground">geen</span>
                    ) : (
                      <span className="break-all text-muted-foreground">{keys.join(", ")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
