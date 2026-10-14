/**
 * Databankonderhoud: voert de SQL-migraties uit op de verbonden databank.
 *
 * Waarom deze knop bestaat: op de gepubliceerde site worden migraties niet
 * automatisch uitgevoerd, waardoor beheerpagina's fouten gaven als
 * `relation "social_hidden_posts" does not exist`. De statements zijn
 * idempotent, dus meermaals uitvoeren is veilig.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchDatabaseStatus, runDatabaseUpdate } from "@/lib/db-maintenance.functions";

export function DatabaseMaintenance() {
  const statusFn = useServerFn(fetchDatabaseStatus);
  const runFn = useServerFn(runDatabaseUpdate);

  const status = useQuery({
    queryKey: ["db-status"],
    queryFn: () => statusFn(),
    retry: false,
  });

  const run = useMutation({
    mutationFn: () => runFn({}),
    onSuccess: (res) => {
      const failed = res.applied.filter((a) => a.status === "FAILED");
      if (res.connection === "FAILED") toast.error(res.error ?? "Geen databankverbinding");
      else if (failed.length) toast.error(`${failed.length} migratie(s) mislukt`);
      else toast.success("Databank bijgewerkt");
      void status.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Database className="size-4 text-muted-foreground" /> Databank bijwerken
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Maakt ontbrekende tabellen en kolommen aan. Veilig om meermaals te gebruiken — bestaande
        gegevens blijven staan.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {status.isLoading
          ? "Status wordt opgehaald…"
          : status.data?.connected
            ? `Verbonden — ${status.data.tables.length} tabellen aanwezig.`
            : "Nog geen databankverbinding gevonden."}
      </p>
      <Button className="mt-3 gap-2" disabled={run.isPending} onClick={() => run.mutate()}>
        {run.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Databank bijwerken
      </Button>
      {run.data ? (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
          {run.data.applied
            .map((a) => `${a.status === "OK" ? "✓" : "✗"} ${a.file}${a.error ? ` — ${a.error}` : ""}`)
            .join("\n")}
        </pre>
      ) : null}
    </section>
  );
}
