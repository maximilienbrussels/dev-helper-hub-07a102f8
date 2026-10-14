/**
 * Dev Tools (alleen preview/lokaal): live statusmatrix van de vereiste secrets,
 * een formulier om ontbrekende sleutels tijdelijk in te vullen, en een knop om
 * alle Neon-migraties te draaien met realtime feedback.
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getDevStatus, setDevSecret, runDevMigrations, type DevStatus } from "@/lib/dev-tools.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type MigrationReport = Awaited<ReturnType<typeof runDevMigrations>>;

export function DevSecretsModal() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    setVisible(/localhost|127\.0\.0\.1|\.lovable\.app$/.test(host));
  }, []);

  const fetchStatus = useServerFn(getDevStatus);
  const saveSecret = useServerFn(setDevSecret);
  const runMigrations = useServerFn(runDevMigrations);

  async function refresh() {
    setBusy("status");
    setError(null);
    try {
      setStatus(await fetchStatus({}));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function openPanel() {
    setOpen(true);
    await refresh();
  }

  async function save(key: string) {
    const value = values[key] ?? "";
    if (!value.trim()) return;
    setBusy(key);
    setError(null);
    try {
      await saveSecret({ data: { key: key as never, value } });
      setValues((v) => ({ ...v, [key]: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function migrate() {
    setBusy("migrate");
    setError(null);
    try {
      setReport(await runMigrations({}));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-4 right-4 z-50 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-accent"
      >
        ⚙️ Dev Tools
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dev Tools — secrets &amp; migraties</DialogTitle>
            <DialogDescription>
              Alleen zichtbaar in preview/lokaal. Ingevulde sleutels blijven in het servergeheugen en worden nooit
              getoond of gelogd.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Secrets</h3>
            {(status?.secrets ?? []).map((s) => (
              <div key={s.key} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{s.key}</span>
                  <span
                    className={
                      s.present
                        ? "text-xs font-medium text-primary"
                        : "text-xs font-medium text-destructive"
                    }
                  >
                    {s.present ? (s.source === "override" ? "OVERRIDE" : "OK") : "ONTBREEKT"}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    type="password"
                    autoComplete="off"
                    placeholder={s.present ? "Overschrijven (tijdelijk)…" : "Waarde plakken…"}
                    value={values[s.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                  />
                  <Button type="button" variant="secondary" disabled={busy === s.key} onClick={() => save(s.key)}>
                    Bewaren
                  </Button>
                </div>
              </div>
            ))}
            {!status ? <p className="text-sm text-muted-foreground">Status laden…</p> : null}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Databank</h3>
            <p className="text-sm">
              Verbinding:{" "}
              <span className={status?.database.connection === "SUCCESS" ? "text-primary" : "text-destructive"}>
                {status?.database.connection ?? "—"}
              </span>
            </p>
            {status?.database.error ? (
              <p className="text-xs text-destructive">{status.database.error}</p>
            ) : null}
            {status ? (
              <ul className="text-xs text-muted-foreground">
                <li>Aanwezig: {status.database.tablesPresent.join(", ") || "—"}</li>
                <li>Ontbreekt: {status.database.tablesMissing.join(", ") || "—"}</li>
                <li>
                  Superadmin desk@delplanche.cloud:{" "}
                  {status.database.superadminInPortalAdmins ? "in portal_admins" : "niet gevonden"} — rollen:{" "}
                  {status.database.superadminRoles.join(", ") || "nog geen"}
                </li>
              </ul>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Migraties</h3>
            <p className="text-xs text-muted-foreground">{(status?.migrations ?? []).join(", ")}</p>
            <div className="flex gap-2">
              <Button type="button" onClick={migrate} disabled={busy === "migrate"}>
                {busy === "migrate" ? "Bezig…" : "Migraties uitvoeren"}
              </Button>
              <Button type="button" variant="outline" onClick={refresh} disabled={busy === "status"}>
                Status verversen
              </Button>
            </div>
            {report ? (
              <div className="rounded-md border border-border p-3 text-xs">
                <p>Verbinding: {report.connection}</p>
                {report.error ? <p className="text-destructive">{report.error}</p> : null}
                <ul className="mt-1 space-y-1">
                  {report.applied.map((a) => (
                    <li key={a.file}>
                      {a.status === "OK" ? "✅" : "❌"} {a.file} ({a.statements} statements)
                      {a.error ? <span className="text-destructive"> — {a.error}</span> : null}
                    </li>
                  ))}
                </ul>
                {report.superadmin ? (
                  <p className="mt-2">
                    Superadmin {report.superadmin.email}:{" "}
                    {report.superadmin.inPortalAdmins ? "geverifieerd" : "ontbreekt"} — rollen:{" "}
                    {report.superadmin.roles.join(", ") || "nog geen"}
                    {report.superadmin.note ? ` (${report.superadmin.note})` : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DevSecretsModal;
