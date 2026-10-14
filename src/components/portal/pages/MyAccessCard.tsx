/**
 * "Mijn toegang": toont wat de server ziet voor de huidige sessie
 * (e-mailadres, rollen, rechten) en of de opslag, e-mail en databank werken.
 * Geen enkele sleutelwaarde wordt getoond — enkel of ze aanwezig zijn.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyAccess, type AccessDiagnostics } from "@/lib/access-diagnostics.functions";

export const MY_ACCESS_QUERY_KEY = ["portal", "my-access"] as const;

function Status({ ok, label }: { ok: boolean | null; label: string }) {
  const Icon = ok === null ? AlertTriangle : ok ? CheckCircle2 : XCircle;
  const tone =
    ok === null ? "text-muted-foreground" : ok ? "text-primary" : "text-destructive";
  return (
    <li className="flex items-center gap-2 text-sm">
      <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
      <span className="min-w-0 break-words">{label}</span>
    </li>
  );
}

/** Gedeelde query, zodat andere kaarten dezelfde gegevens kunnen tonen. */
export function useMyAccess() {
  const fetchAccess = useServerFn(getMyAccess);
  return useQuery<AccessDiagnostics>({
    queryKey: MY_ACCESS_QUERY_KEY,
    queryFn: () => fetchAccess(),
    staleTime: 30_000,
  });
}

export function MyAccessCard() {
  const access = useMyAccess();

  const d = access.data;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
          <KeyRound className="h-4 w-4 text-primary" />
          Mijn toegang
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => void access.refetch()}
          disabled={access.isFetching}
        >
          {access.isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Vernieuw
        </Button>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Dit is wat de server over jouw aanmelding weet. Handig wanneer een knop zegt dat je geen
        rechten hebt.
      </p>

      {access.isLoading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laden…
        </p>
      ) : access.isError ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {(access.error as Error)?.message || "Toegang kon niet opgehaald worden."}
        </p>
      ) : d ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aanmelding
            </p>
            <ul className="space-y-1">
              <Status ok={Boolean(d.email)} label={`E-mail: ${d.email ?? "onbekend"}`} />
              <Status
                ok={d.fullAccess}
                label={
                  d.fullAccess
                    ? "Volledige toegang (eigenaar of super-admin)"
                    : `Beperkte toegang — ${d.permissions.length} rechten`
                }
              />
              <Status
                ok={d.roles.length > 0 || d.isFixedOwner}
                label={`Rollen: ${d.roles.length ? d.roles.join(", ") : "geen"}${
                  d.isFixedOwner ? " (vaste eigenaar)" : ""
                }${d.isPortalAdmin ? " (portaalbeheerder)" : ""}`}
              />
              <Status
                ok={d.database.ok}
                label={d.database.ok ? "Databank bereikbaar" : `Databank: ${d.database.error}`}
              />
              <Status
                ok={d.email_service.brevoConfigured}
                label={
                  d.email_service.brevoConfigured
                    ? "E-maildienst ingesteld"
                    : "E-maildienst: sleutel ontbreekt"
                }
              />
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Opslag
            </p>
            <ul className="space-y-1">
              <Status
                ok={d.storage.configured}
                label={
                  d.storage.configured
                    ? `Sleutels aanwezig — bucket ${d.storage.bucket} (${d.storage.region})`
                    : "Opslagsleutels ontbreken"
                }
              />
              <Status ok={d.storage.hasAccessKey} label="Toegangssleutel aanwezig" />
              <Status ok={d.storage.hasSecretKey} label="Geheime sleutel aanwezig" />
              <Status
                ok={d.storage.corsConfigured}
                label={
                  d.storage.corsConfigured === null
                    ? `Uploadrechten onbekend${d.storage.corsError ? ` — ${d.storage.corsError}` : ""}`
                    : d.storage.corsConfigured
                      ? `Uploadrechten actief (${d.storage.corsOrigins.length} adressen)`
                      : "Uploadrechten nog niet ingesteld"
                }
              />
            </ul>
          </div>
        </div>
      ) : null}

      {d ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Gecontroleerd op {new Date(d.checkedAt).toLocaleString("nl-BE")}
        </p>
      ) : null}
    </section>
  );
}
