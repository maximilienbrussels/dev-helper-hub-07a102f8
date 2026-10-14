import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Send,
  ServerCog,
} from "lucide-react";
import { usePermissions } from "@/lib/use-permissions";
import { PageHeader } from "@/components/portal/portal-ui";
import {
  clearSmtpConfig,
  fetchEmailAdmin,
  saveSmtpConfig,
  sendEmailTemplateTests,
  type EmailEvent,
  type EmailTestResult,
  type TestMailLang,
  type TestTemplateKind,
} from "@/lib/email-admin.functions";
import { sendSystemTestEmail } from "@/lib/email.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ContactRoutesSection } from "@/components/portal/ContactRoutesSection";
import { EmailRoutingSection } from "@/components/portal/EmailRoutingSection";
import { LoginMailDiagnostics } from "@/components/portal/LoginMailDiagnostics";
import { EmailTemplatesSection } from "@/components/portal/EmailTemplatesSection";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-success/12 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  skipped: "bg-warning/20 text-warning-foreground border-warning/40",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Verzonden",
  failed: "Mislukt",
  skipped: "Overgeslagen",
};

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmailPage() {
  const { can, isLoading: rightsLoading } = usePermissions();
  const queryClient = useQueryClient();

  const load = useServerFn(fetchEmailAdmin);
  const save = useServerFn(saveSmtpConfig);
  const reset = useServerFn(clearSmtpConfig);
  const test = useServerFn(sendSystemTestEmail);
  const sendTemplateTests = useServerFn(sendEmailTemplateTests);

  const { data, isLoading, error } = useQuery({
    queryKey: ["email-admin"],
    queryFn: () => load(),
    retry: false,
  });

  const [form, setForm] = useState({
    host: "",
    port: "465",
    username: "",
    password: "",
    from_address: "",
    from_name: "",
    secure: true,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      host: data.config.host,
      port: String(data.config.port ?? 465),
      username: data.config.username,
      password: "",
      from_address: data.config.fromAddress,
      from_name: data.config.fromName,
      secure: data.config.secure,
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          host: form.host.trim(),
          port: Number((form.port.match(/\d+/) ?? ["465"])[0]),
          username: form.username.trim(),
          password: form.password,
          from_address: form.from_address.trim(),
          from_name: form.from_name.trim(),
          secure: form.secure,
        },
      }),
    onSuccess: () => {
      toast.success("Mailinstellingen opgeslagen");
      setForm((f) => ({ ...f, password: "" }));
      queryClient.invalidateQueries({ queryKey: ["email-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => reset({}),
    onSuccess: () => {
      toast.success("Terug naar de environment variables");
      queryClient.invalidateQueries({ queryKey: ["email-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const TEMPLATE_OPTIONS: { value: TestTemplateKind; label: string }[] = [
    { value: "pickup_ticket", label: "Afhaalticket" },
    { value: "booking_confirmation", label: "Boekingsbevestiging" },
    { value: "auth_code", label: "Inlogcode" },
    { value: "general_notice", label: "Algemene mededeling" },
  ];
  const LANG_OPTIONS: { value: TestMailLang; label: string }[] = [
    { value: "nl", label: "NL" },
    { value: "fr", label: "FR" },
    { value: "en", label: "EN" },
  ];

  const [templateTestTo, setTemplateTestTo] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<TestTemplateKind[]>(["pickup_ticket"]);
  const [selectedLangs, setSelectedLangs] = useState<TestMailLang[]>(["nl"]);
  const [templateResults, setTemplateResults] = useState<EmailTestResult[] | null>(null);

  const toggleTemplate = (value: TestTemplateKind) =>
    setSelectedTemplates((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  const toggleLang = (value: TestMailLang) =>
    setSelectedLangs((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const templateTestMutation = useMutation({
    mutationFn: () =>
      sendTemplateTests({
        data: { to: templateTestTo.trim(), templates: selectedTemplates, langs: selectedLangs },
      }),
    onSuccess: (res) => {
      setTemplateResults(res.results);
      const failed = res.results.filter((r) => !r.sent);
      if (failed.length === 0) toast.success(`${res.results.length} testmail(s) verstuurd`);
      else toast.error(`${failed.length} van ${res.results.length} testmail(s) mislukt`);
      queryClient.invalidateQueries({ queryKey: ["email-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [testLog, setTestLog] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const testMutation = useMutation({
    mutationFn: () => test({ data: testTo.trim() ? { to: testTo.trim() } : {} }),
    onSuccess: (res) => {
      setTestLog(res.log);
      if (res.sent) toast.success(`Testmail verstuurd naar ${res.to}`);
      else toast.error(res.error ?? "Verzenden mislukt");
      queryClient.invalidateQueries({ queryKey: ["email-admin"] });
    },
    onError: (e: Error) => {
      setTestLog(e.message);
      toast.error(e.message);
    },
  });

  if (!rightsLoading && !can("manage_rights")) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border p-12 text-center">
        <Lock className="size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">Geen toegang</p>
        <p className="text-sm text-muted-foreground">
          Enkel beheerders kunnen de mailinstellingen bekijken.
        </p>
      </div>
    );
  }

  const config = data?.config;
  const events: EmailEvent[] = data?.events ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="E-mail & mailserver"
        subtitle="Instellingen, testmail en foutmeldingen van uitgaande mails"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["email-admin"] })}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Vernieuwen</span>
          </Button>
        }
      />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as Error).message}
        </p>
      ) : null}

      <LoginMailDiagnostics />

      <EmailRoutingSection />

      <EmailTemplatesSection />

      {/* Testmails per sjabloon */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Testmails versturen</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Verstuur elk gekozen sjabloon in elke gekozen taal naar één adres, om de volledige
          mailweergave te controleren zonder echte bestelling of boeking.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="template-test-to">Ontvanger</Label>
            <Input
              id="template-test-to"
              type="email"
              value={templateTestTo}
              onChange={(e) => setTemplateTestTo(e.target.value)}
              placeholder="naam@voorbeeld.be"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Sjablonen</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEMPLATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTemplate(opt.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-semibold",
                    selectedTemplates.includes(opt.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Talen</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleLang(opt.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-semibold",
                    selectedLangs.includes(opt.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="mt-4 gap-2"
          disabled={
            templateTestMutation.isPending ||
            !templateTestTo.trim() ||
            selectedTemplates.length === 0 ||
            selectedLangs.length === 0
          }
          onClick={() => templateTestMutation.mutate()}
        >
          {templateTestMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Testmails versturen
        </Button>

        {templateResults ? (
          <ul className="mt-4 space-y-1.5">
            {templateResults.map((r, i) => (
              <li
                key={`${r.template}-${r.lang}-${i}`}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                  r.sent ? STATUS_STYLE.sent : STATUS_STYLE.failed,
                )}
              >
                <span className="font-semibold">
                  {r.template} · {r.lang.toUpperCase()}
                </span>
                <span>{r.sent ? "Verzonden" : `Mislukt${r.error ? `: ${r.error}` : ""}`}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ContactRoutesSection />

      {/* Status */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ServerCog className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Status</h2>
          {config ? (
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                config.complete ? STATUS_STYLE.sent : STATUS_STYLE.failed,
              )}
            >
              {config.complete ? "Klaar om te versturen" : "Onvolledig ingesteld"}
            </span>
          ) : null}
        </div>
        {isLoading || !config ? (
          <p className="mt-3 text-sm text-muted-foreground">Laden…</p>
        ) : (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Bron</dt>
              <dd className="font-medium">
                {config.source === "database"
                  ? "Deze beheerpagina"
                  : config.source === "environment"
                    ? "Environment variables"
                    : "Niets ingesteld"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Server</dt>
              <dd className="font-medium break-all">
                {config.host || "—"}
                {config.port ? `:${config.port}` : ""} ({config.secure ? "SSL" : "STARTTLS"})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Afzender</dt>
              <dd className="font-medium break-all">
                {config.fromName} &lt;{config.fromAddress}&gt;
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase">Wachtwoord</dt>
              <dd className="font-medium">
                {config.passwordSet ? "Ingesteld (verborgen)" : "Niet ingesteld"}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Testmail naar dit adres (leeg = mijn eigen adres)"
            aria-label="Ontvanger van de testmail"
            className="sm:max-w-xs"
          />
          <Button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {testMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Testmail versturen
          </Button>
        </div>
        {data?.preview ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Je zit in de preview-omgeving: daar vertrekt er geen echte mail. Test op de
            gepubliceerde site.
          </p>
        ) : null}
        {testLog ? (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
            {testLog}
          </pre>
        ) : null}
      </section>

      {/* Instellingen */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Mailserver instellen</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Deze waarden overschrijven de environment variables SMTP_HOST, SMTP_PORT, SMTP_USER,
          SMTP_PASS en SMTP_FROM. Het wachtwoord wordt enkel server-side bewaard en nooit
          teruggestuurd naar de browser.
        </p>

        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="smtp-host">SMTP_HOST</Label>
            <Input
              id="smtp-host"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="smtp.voorbeeld.be"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="smtp-port">SMTP_PORT</Label>
            <Input
              id="smtp-port"
              inputMode="numeric"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              placeholder="465"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="smtp-user">SMTP_USER</Label>
            <Input
              id="smtp-user"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="smtp-pass">SMTP_PASS</Label>
            <Input
              id="smtp-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={config?.passwordSet ? "•••••••• (laat leeg om te behouden)" : ""}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="smtp-from">SMTP_FROM (adres)</Label>
            <Input
              id="smtp-from"
              value={form.from_address}
              onChange={(e) => setForm({ ...form, from_address: e.target.value })}
              placeholder="noreply@maximilien.brussels"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="smtp-from-name">Afzendernaam</Label>
            <Input
              id="smtp-from-name"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              placeholder="Maximilien"
              autoComplete="off"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:col-span-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">Directe SSL-verbinding</p>
              <p className="text-xs text-muted-foreground">
                Aan voor poort 465, uit voor poort 587 (STARTTLS).
              </p>
            </div>
            <Switch
              checked={form.secure}
              onCheckedChange={(v) => setForm({ ...form, secure: v })}
              aria-label="Directe SSL-verbinding"
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full gap-2 sm:w-auto"
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Opslaan
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              Terug naar environment variables
            </Button>
          </div>
        </form>

        {data ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(data.envPresent).map(([key, present]) => (
              <span
                key={key}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  present ? STATUS_STYLE.sent : STATUS_STYLE.skipped,
                )}
              >
                {key}: {present ? "ingesteld" : "leeg"}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Logboek */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-bold">Laatste verzendpogingen</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nog geen mails verstuurd sinds het logboek actief is.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                      STATUS_STYLE[ev.status],
                    )}
                  >
                    {ev.status === "sent" ? (
                      <CheckCircle2 className="size-3" />
                    ) : (
                      <AlertTriangle className="size-3" />
                    )}
                    {STATUS_LABEL[ev.status] ?? ev.status}
                  </span>
                  <span className="text-xs font-semibold">{ev.kind}</span>
                  <span className="text-xs text-muted-foreground">{ev.recipient_masked}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {formatMoment(ev.created_at)}
                  </span>
                </div>
                {ev.subject ? <p className="mt-1.5 text-sm break-words">{ev.subject}</p> : null}
                {ev.error_message ? (
                  <p className="mt-1.5 text-xs break-words text-destructive">
                    <strong>{ev.error_code}</strong> — {ev.error_message}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
