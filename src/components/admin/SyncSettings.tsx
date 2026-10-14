import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoogleStatus, runGoogleSync, connectGoogle } from "@/lib/api/google";
import { getInfomaniakStatus, runInfomaniakSync } from "@/lib/api/infomaniak";

function clock(value: string | null | undefined): string {
  if (!value) return "nog niet";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "nog niet"
    : date.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
      }`}
    >
      {ok ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
      {children}
    </span>
  );
}

/** Statuspaneel voor de koppelingen met Google en Infomaniak. */
export function SyncSettings() {
  const queryClient = useQueryClient();

  const google = useQuery({
    queryKey: ["sync", "google"],
    queryFn: getGoogleStatus,
    refetchOnWindowFocus: false,
  });
  const infomaniak = useQuery({
    queryKey: ["sync", "infomaniak"],
    queryFn: getInfomaniakStatus,
    refetchOnWindowFocus: false,
  });

  const syncGoogle = useMutation({
    mutationFn: runGoogleSync,
    onSuccess: (result) => {
      toast.success(result.message);
      void queryClient.invalidateQueries({ queryKey: ["sync", "google"] });
    },
    onError: (error: Error & { code?: string }) => {
      toast.error(
        error.code === "token_expired" || error.code === "not_linked"
          ? "Google token verlopen — opnieuw inloggen vereist."
          : error.message,
      );
    },
  });

  const syncInfomaniak = useMutation({
    mutationFn: () => runInfomaniakSync(),
    onSuccess: (result) => {
      const failed = result.results.filter((r) => !r.ok);
      if (failed.length > 0) toast.error(failed.map((f) => f.message).join(" · "));
      else toast.success(result.results.map((r) => r.message).join(" · "));
      void queryClient.invalidateQueries({ queryKey: ["sync", "infomaniak"] });
    },
    onError: (error: Error & { code?: string }) =>
      toast.error(
        error.code === "invalid_api_key"
          ? "Infomaniak API-sleutel ongeldig."
          : error.code === "not_configured"
            ? "Infomaniak is nog niet ingesteld (API-sleutel of product-ID ontbreekt)."
            : error.message,
      ),
  });

  const busy = syncGoogle.isPending || syncInfomaniak.isPending;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Google</CardTitle>
          <CardDescription>Agenda en aanmelding via je Google-account.</CardDescription>
          <div>
            {google.isLoading ? (
              <span className="text-sm text-muted-foreground">Status ophalen…</span>
            ) : google.data?.linked ? (
              <Badge ok>Google gekoppeld (laatste sync: {clock(google.data.lastSyncAt)})</Badge>
            ) : (
              <Badge ok={false}>
                {google.data?.configured ? "Google nog niet gekoppeld" : "Google niet ingesteld"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {google.data && !google.data.hasRefreshToken && google.data.linked ? (
            <p className="text-sm text-muted-foreground">
              Google gaf geen blijvende toestemming. Klik op “Opnieuw koppelen” om dat te herstellen.
            </p>
          ) : null}
          {google.data?.lastStatus === "error" && google.data.lastMessage ? (
            <p className="text-sm text-destructive">{google.data.lastMessage}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || !google.data?.linked}
              onClick={() => syncGoogle.mutate()}
            >
              {syncGoogle.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Nu synchroniseren
            </Button>
            <Button size="sm" variant="outline" onClick={() => connectGoogle(window.location.pathname)}>
              {google.data?.linked ? "Opnieuw koppelen" : "Koppelen met Google"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Agenda-toegang wordt alleen hier gevraagd, en enkel wanneer je zelf koppelt. Gewoon
            aanmelden met Google vraagt uitsluitend je naam en e-mailadres.
          </p>
          {google.data?.redirectUris?.length ? (
            <p className="text-xs text-muted-foreground">
              Toegelaten terugkeeradressen: {google.data.redirectUris.join(" · ")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Infomaniak</CardTitle>
          <CardDescription>Agenda, contacten en nieuwsbrief via je Infomaniak-account.</CardDescription>
          <div>
            {infomaniak.isLoading ? (
              <span className="text-sm text-muted-foreground">Status ophalen…</span>
            ) : infomaniak.data?.ok ? (
              <Badge ok>Infomaniak actief</Badge>
            ) : (
              <Badge ok={false}>
                {infomaniak.data?.errorCode === "invalid_api_key"
                  ? "Infomaniak API-sleutel ongeldig"
                  : (infomaniak.data?.error ?? "Infomaniak niet bereikbaar")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {infomaniak.data?.domains?.length ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {infomaniak.data.domains.map((d) => (
                <li key={d.domain}>
                  {d.ok ? "🟢" : "⚪️"} {d.domain}
                </li>
              ))}
            </ul>
          ) : null}
          {infomaniak.data?.scopes?.length ? (
            <ul className="space-y-1 text-sm">
              {infomaniak.data.scopes.map((s) => (
                <li key={s.scope} className={s.last_status === "error" ? "text-destructive" : ""}>
                  {s.scope}: {s.last_message ?? "nog niet uitgevoerd"} ({clock(s.last_sync_at)})
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            size="sm"
            disabled={busy || !infomaniak.data?.configured}
            onClick={() => syncInfomaniak.mutate()}
          >
            {syncInfomaniak.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Nu synchroniseren
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
