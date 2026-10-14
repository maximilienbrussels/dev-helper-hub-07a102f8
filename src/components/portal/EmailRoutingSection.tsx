import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  cleanupSubmissionsFn,
  deleteSubmissionFn,
  fetchEmailRoutingSettings,
  resendSubmission,
  saveFallbackEmailFn,
  updateSubmissionRecipient,
  type FormSubmission,
} from "@/lib/email-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; style: string }> = {
  sent: { label: "Verzonden", style: "bg-success/12 text-success border-success/30" },
  sent_brevo: { label: "Verzonden", style: "bg-success/12 text-success border-success/30" },
  sent_smtp_fallback: {
    label: "Verzonden (oud)",
    style: "bg-success/12 text-success border-success/30",
  },
  fallback_used: {
    label: "Via vangnet",
    style: "bg-warning/20 text-warning-foreground border-warning/40",
  },
  pending: { label: "In wachtrij", style: "bg-muted text-muted-foreground border-border" },
  email_pending: { label: "In wachtrij", style: "bg-muted text-muted-foreground border-border" },
  failed: {
    label: "Mislukt",
    style: "bg-destructive/10 text-destructive border-destructive/30",
  },
  email_failed: {
    label: "Mislukt",
    style: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

type Tab = "all" | "pending" | "sent" | "failed";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Alles" },
  { key: "pending", label: "In wachtrij" },
  { key: "sent", label: "Verzonden" },
  { key: "failed", label: "Mislukt" },
];

const PER_PAGE = 8;

function group(status: string): Tab {
  if (status.startsWith("sent") || status === "fallback_used") return "sent";
  if (status.includes("failed")) return "failed";
  return "pending";
}

function moment(iso: string): string {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Globaal vangnetadres + compact logboek van élke formulierinzending, met
 * filters, paginering en acties per regel (adres wijzigen, opnieuw versturen,
 * verwijderen).
 */
export function EmailRoutingSection() {
  const queryClient = useQueryClient();
  const load = useServerFn(fetchEmailRoutingSettings);
  const saveFallback = useServerFn(saveFallbackEmailFn);
  const resend = useServerFn(resendSubmission);
  const updateRecipient = useServerFn(updateSubmissionRecipient);
  const removeRow = useServerFn(deleteSubmissionFn);
  const cleanup = useServerFn(cleanupSubmissionsFn);

  const { data, isLoading, error } = useQuery({
    queryKey: ["email-routing"],
    queryFn: () => load(),
    retry: false,
  });

  const [fallback, setFallback] = useState("");
  useEffect(() => {
    if (data?.fallback) setFallback(data.fallback);
  }, [data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["email-routing"] });

  const saveMutation = useMutation({
    mutationFn: () => saveFallback({ data: { email: fallback.trim() } }),
    onSuccess: () => {
      toast.success("Vangnetadres opgeslagen");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resendMutation = useMutation({
    mutationFn: (input: { id: string; to?: string }) =>
      resend({ data: { id: input.id, ...(input.to ? { to: input.to } : {}) } }),
    onSuccess: (res) => {
      if (res.status.startsWith("sent")) toast.success("Opnieuw verstuurd via Brevo");
      else toast.error(res.error ?? "Verzenden mislukt");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: (input: { id: string; email: string }) => updateRecipient({ data: input }),
    onSuccess: () => {
      toast.success("Adres aangepast");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeRow({ data: { id } }),
    onSuccess: () => {
      toast.success("Regel verwijderd");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cleanupMutation = useMutation({
    mutationFn: (scope: "failed" | "sent") => cleanup({ data: { scope } }),
    onSuccess: (res) => {
      toast.success(`${res.removed} regel(s) opgeruimd`);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submissions: FormSubmission[] = data?.submissions ?? [];
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<FormSubmission | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(
    () => (tab === "all" ? submissions : submissions.filter((s) => group(s.status) === tab)),
    [submissions, tab],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: submissions.length, pending: 0, sent: 0, failed: 0 };
    for (const s of submissions) c[group(s.status)] += 1;
    return c;
  }, [submissions]);

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">E-mail &amp; notificaties</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={cleanupMutation.isPending}
            onClick={() => cleanupMutation.mutate("failed")}
          >
            <Sparkles className="size-4" />
            Testlogs opschonen
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Vernieuwen</span>
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Komt een melding niet aan bij de gekozen mailbox, dan gaat ze automatisch naar dit
        vangnetadres met <strong>[HERSTEL/FALLBACK]</strong> in het onderwerp. Elke inzending blijft
        hieronder bewaard.
      </p>

      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error).message}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:max-w-md">
        <Label htmlFor="fallback-email">Globaal vangnetadres</Label>
        <div className="flex gap-2">
          <Input
            id="fallback-email"
            type="email"
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
            placeholder="contact@maximilien.brussels"
          />
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !fallback.trim()}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Bewaren
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Laatste inzendingen</p>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(0);
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-semibold",
                tab === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Laden…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Geen inzendingen in deze weergave.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {rows.map((s) => {
            const st = STATUS[s.status] ?? STATUS["pending"]!;
            return (
              <li key={s.id} className="p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{moment(s.created_at)}</span>
                  <span className="truncate font-semibold">{s.subject || s.form}</span>
                  <span className="truncate text-xs text-muted-foreground">{s.email}</span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                      st.style,
                    )}
                  >
                    {st.label}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      title="Adres wijzigen"
                      aria-label="Adres wijzigen"
                      onClick={() => {
                        setEditing(s);
                        setEditValue(s.email ?? "");
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Opnieuw versturen"
                      aria-label="Opnieuw versturen"
                      disabled={resendMutation.isPending}
                      onClick={() => resendMutation.mutate({ id: s.id })}
                    >
                      <RotateCw className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Verwijderen"
                      aria-label="Verwijderen"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Deze regel definitief verwijderen?")) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {s.error || s.recipients.length ? (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-b-0">
                      <AccordionTrigger className="py-1 text-xs font-semibold hover:no-underline">
                        🔍 Details / foutmelding
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 text-xs">
                        {s.recipients.length ? (
                          <p className="text-muted-foreground">→ {s.recipients.join(", ")}</p>
                        ) : null}
                        {s.error ? (
                          <p className="mt-1 break-words text-destructive">{s.error}</p>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="icon"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            aria-label="Vorige"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span>
            {current + 1} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            aria-label="Volgende"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adres wijzigen</DialogTitle>
            <DialogDescription>
              Corrigeer een verkeerd getypt e-mailadres en verstuur de melding meteen opnieuw.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="naam@voorbeeld.be"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={editMutation.isPending || !editValue.trim()}
              onClick={() => {
                if (!editing) return;
                editMutation.mutate({ id: editing.id, email: editValue.trim() });
                setEditing(null);
              }}
            >
              Enkel bewaren
            </Button>
            <Button
              className="gap-2"
              disabled={resendMutation.isPending || !editValue.trim()}
              onClick={() => {
                if (!editing) return;
                resendMutation.mutate({ id: editing.id, to: editValue.trim() });
                setEditing(null);
              }}
            >
              {resendMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCw className="size-4" />
              )}
              Bewaren &amp; opnieuw versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
