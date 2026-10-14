import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { listClientErrors, setClientErrorResolved } from "@/lib/error-log.functions";
import { Button } from "@/components/ui/button";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { DatabaseMaintenance } from "@/components/portal/DatabaseMaintenance";

export const Route = createFileRoute("/_authenticated/foutmeldingen")({
  head: () => ({
    meta: [
      { title: "Foutmeldingen — Ferme Maximilien portaal" },
      {
        name: "description",
        content:
          "Overzicht van runtime-fouten uit de browser: melding, stacktrace, route en apparaatgegevens.",
      },
      { property: "og:title", content: "Foutmeldingen — Ferme Maximilien portaal" },
      {
        property: "og:description",
        content: "Runtime-fouten met stacktrace, route en apparaatgegevens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ErrorDashboard,
  errorComponent: AppErrorFallback,
  notFoundComponent: () => <p className="p-6 text-sm">Niet gevonden.</p>,
});

function ErrorDashboard() {
  const fetchErrors = useServerFn(listClientErrors);
  const resolveFn = useServerFn(setClientErrorResolved);
  const qc = useQueryClient();
  const [onlyReported, setOnlyReported] = useState(false);
  const [includeResolved, setIncludeResolved] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-errors", onlyReported, includeResolved],
    queryFn: () => fetchErrors({ data: { onlyReported, includeResolved, limit: 100 } }),
  });

  const resolve = useMutation({
    mutationFn: (v: { id: string; resolved: boolean }) => resolveFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-errors"] }),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Foutmeldingen</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Runtime-fouten uit de browser, met stacktrace, route en apparaatgegevens.
      </p>

      <div className="mt-6">
        <DatabaseMaintenance />
      </div>


      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={onlyReported ? "default" : "outline"}
          onClick={() => setOnlyReported((v) => !v)}
        >
          Enkel gemeld door bezoekers
        </Button>
        <Button
          size="sm"
          variant={includeResolved ? "default" : "outline"}
          onClick={() => setIncludeResolved((v) => !v)}
        >
          Toon opgeloste
        </Button>
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Laden…</p>}
      {error && (
        <p className="mt-6 text-sm text-destructive">
          Je hebt geen toegang tot de foutmeldingen of ze konden niet geladen worden.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {(data ?? []).map((row) => (
          <li key={row.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {row.error_name ? `${row.error_name}: ` : ""}
                  {row.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString("nl-BE")} · {row.route ?? "—"} ·{" "}
                  {row.boundary ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.reported && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Gemeld
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve.mutate({ id: row.id, resolved: !row.resolved })}
                >
                  {row.resolved ? "Heropenen" : "Opgelost"}
                </Button>
              </div>
            </div>

            {(row.contact_name || row.contact_email || row.contact_note) && (
              <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
                <strong>{row.contact_name ?? "Anoniem"}</strong>{" "}
                {row.contact_email ? `· ${row.contact_email}` : ""}
                {row.contact_note ? ` — ${row.contact_note}` : ""}
              </p>
            )}

            <p className="mt-2 text-[11px] text-muted-foreground">
              {row.viewport ?? "—"} · {row.language ?? "—"} · {row.user_agent ?? "—"}
            </p>

            {row.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium">Stacktrace</summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-[11px]">
                  {row.stack}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ul>

      {!isLoading && !error && (data ?? []).length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Geen fouten geregistreerd. 🎉</p>
      )}
    </main>
  );
}
