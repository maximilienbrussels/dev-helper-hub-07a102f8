/**
 * Beheerderskaart: zet in één klik de uploadrechten (CORS) op de Europese
 * Scaleway-bucket, zodat beelden rechtstreeks vanuit de browser geüpload
 * kunnen worden. Toont ook de huidige status, zodat meteen zichtbaar is of
 * het al goed staat.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { MY_ACCESS_QUERY_KEY } from "./MyAccessCard";

type Props = {
  /** Huidige status uit "Mijn toegang" (optioneel). */
  status?: {
    configured: boolean;
    corsConfigured: boolean | null;
    corsOrigins: string[];
    corsError: string | null;
    bucket: string;
  } | null;
};

export function S3CorsSection({ status }: Props) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [origins, setOrigins] = useState<string[] | null>(null);

  async function init() {
    setBusy(true);
    try {
      const { data } = await supabase.auth
        .getSession()
        .catch(() => ({ data: { session: null } }) as never);
      const token = data?.session?.access_token;
      const res = await fetch("/api/admin/init-s3-cors", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; bucket?: string; origins?: string[]; error?: string }
        | null;
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? `Mislukt (${res.status})`);
      }
      setOrigins(body.origins ?? []);
      toast.success(`Uploadrechten ingesteld op ${body.bucket}.`);
      void queryClient.invalidateQueries({ queryKey: MY_ACCESS_QUERY_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Instellen mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const shown = origins ?? status?.corsOrigins ?? null;
  const ok = origins ? true : (status?.corsConfigured ?? null);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Opslagrechten
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Nodig zodat foto's rechtstreeks vanuit de browser naar de Europese opslag kunnen. Eén keer
        instellen is genoeg; opnieuw uitvoeren kan geen kwaad.
      </p>

      {status ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          {!status.configured ? (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span>Opslagsleutels ontbreken — vraag ze eerst in te stellen.</span>
            </>
          ) : ok === null ? (
            <>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span>
                Status onbekend{status.corsError ? ` — ${status.corsError}` : ""}.
              </span>
            </>
          ) : ok ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Uploadrechten staan goed op {status.bucket}.</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span>Uploadrechten staan nog niet ingesteld.</span>
            </>
          )}
        </p>
      ) : null}

      <Button type="button" onClick={() => void init()} disabled={busy} className="mt-4 rounded-full">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Initialiseer Scaleway S3 Rechten
      </Button>
      {shown && shown.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {shown.map((o) => (
            <li key={o}>✓ {o}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
