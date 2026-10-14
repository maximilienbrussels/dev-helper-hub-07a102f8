import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { fetchSubmissions, resendSubmission, type FormSubmission } from "@/lib/email-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/berichten")({
  component: BerichtenPage,
  head: () => ({
    meta: [
      { title: "Berichten & mailstatus | Portaal" },
      {
        name: "description",
        content:
          "Overzicht van alle formulierinzendingen met verzendstatus en handmatig herversturen.",
      },
    ],
  }),
});

/** Statuslabels: Brevo, SMTP-terugval, mislukt of nog in de wachtrij. */
const STATUS: Record<string, { label: string; style: string }> = {
  sent_brevo: { label: "Brevo", style: "bg-success/12 text-success border-success/30" },
  sent: { label: "Brevo", style: "bg-success/12 text-success border-success/30" },
  sent_smtp_fallback: {
    label: "SMTP-terugval",
    style: "bg-warning/20 text-warning-foreground border-warning/40",
  },
  fallback_used: {
    label: "SMTP-terugval",
    style: "bg-warning/20 text-warning-foreground border-warning/40",
  },
  failed: { label: "Mislukt", style: "bg-destructive/10 text-destructive border-destructive/30" },
  email_failed: {
    label: "Mislukt",
    style: "bg-destructive/10 text-destructive border-destructive/30",
  },
  pending: { label: "In wachtrij", style: "bg-muted text-muted-foreground border-border" },
  email_pending: { label: "In wachtrij", style: "bg-muted text-muted-foreground border-border" },
};

const FORMS = ["", "contact", "verhuur", "webshop", "academie"];
const STATUSES = ["", "pending", "sent_brevo", "sent_smtp_fallback", "failed"];

function moment(iso: string): string {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BerichtenPage() {
  const queryClient = useQueryClient();
  const load = useServerFn(fetchSubmissions);
  const resend = useServerFn(resendSubmission);

  const [form, setForm] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [since, setSince] = useState("");

  const filters = useMemo(
    () => ({
      ...(form ? { form } : {}),
      ...(status ? { status } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(since ? { since } : {}),
    }),
    [form, status, query, since],
  );

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["admin-berichten", filters],
    queryFn: () => load({ data: filters }),
    retry: false,
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => resend({ data: { id } }),
    onSuccess: (res) => {
      if (res.status === "sent_brevo") toast.success("Opnieuw verstuurd via Brevo");
      else if (res.status === "sent_smtp_fallback") toast.success("Verstuurd via SMTP-terugval");
      else toast.error(res.error ?? "Verzenden mislukt");
      queryClient.invalidateQueries({ queryKey: ["admin-berichten"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submissions: FormSubmission[] = data?.submissions ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Berichten &amp; mailstatus</h1>
          <p className="text-xs text-muted-foreground">
            Elk formulier wordt eerst bewaard en daarna verstuurd: eerst via Brevo, bij een fout
            automatisch via de SMTP-server. Mislukt alles, dan kan je hier herversturen.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-berichten"] })}
        >
          {isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Vernieuwen
        </Button>
      </div>

      {data && !data.databaseReady ? (
        <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          De databank is nog niet aangesloten, dus er worden voorlopig geen inzendingen bewaard.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error).message}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Zoek op naam, e-mail of bericht"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={form}
          onChange={(e) => setForm(e.target.value)}
        >
          {FORMS.map((f) => (
            <option key={f || "all"} value={f}>
              {f || "Alle formulieren"}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s ? (STATUS[s]?.label ?? s) : "Alle statussen"}
            </option>
          ))}
        </select>
        <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Datum</th>
              <th className="p-3">Formulier</th>
              <th className="p-3">Afzender</th>
              <th className="p-3">Onderwerp</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-4 text-muted-foreground">
                  <Loader2 className="mr-2 inline size-4 animate-spin" /> Laden…
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-muted-foreground">
                  Geen berichten gevonden.
                </td>
              </tr>
            ) : (
              submissions.map((s) => {
                const st = STATUS[s.status] ?? STATUS["pending"]!;
                return (
                  <tr key={s.id} className="align-top">
                    <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">
                      {moment(s.created_at)}
                    </td>
                    <td className="p-3 text-xs">
                      {s.form}
                      {s.category ? (
                        <span className="block text-muted-foreground">{s.category}</span>
                      ) : null}
                    </td>
                    <td className="p-3 text-xs">
                      <span className="block font-semibold">{s.name || "—"}</span>
                      <span className="text-muted-foreground">{s.email || "—"}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{s.subject || "—"}</span>
                      {s.error ? (
                        <span className="mt-1 block text-xs text-destructive">{s.error}</span>
                      ) : null}
                      {s.recipients.length ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          → {s.recipients.join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                          st.style,
                        )}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate(s.id)}
                      >
                        <Send className="size-4" />
                        Herversturen
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
