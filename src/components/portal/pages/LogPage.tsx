import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, History, RotateCcw, ShieldQuestion, Trash2 } from "lucide-react";

import { usePortal } from "@/lib/portal-store";
import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { listAuditLog, listTrash, restoreItem, type TrashRow } from "@/lib/audit.functions";

const ACTION_LABEL: Record<string, string> = {
  create: "Toegevoegd",
  update: "Aangepast",
  delete: "Verwijderd",
  restore: "Hersteld",
  publish: "Gepubliceerd",
  other: "Actie",
};

const KIND_LABEL: Record<TrashRow["kind"], string> = {
  booking: "Boeking",
  media: "Media",
  product: "Product",
};

function when(value: string) {
  return new Date(value).toLocaleString("nl-BE", { dateStyle: "medium", timeStyle: "short" });
}

/** Wijzigingslogboek + prullenbak: wie deed wat, en herstel van verwijderde items. */
export function LogPage() {
  const { t } = usePortal();
  const queryClient = useQueryClient();

  const log = useQuery({
    queryKey: ["portal", "audit-log"],
    queryFn: () => listAuditLog({ data: { limit: 100 } }),
  });

  const verifications = useQuery({
    queryKey: ["portal", "audit-log", "certificate_verification"],
    queryFn: () => listAuditLog({ data: { limit: 100, entity: "certificate_verification" } }),
  });

  const trash = useQuery({
    queryKey: ["portal", "trash"],
    queryFn: () => listTrash(),
  });

  const restore = useMutation({
    mutationFn: (row: TrashRow) => restoreItem({ data: { kind: row.kind, id: row.id } }),
    onSuccess: () => {
      toast.success("Hersteld.");
      void queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader title={t("log.title")} subtitle={t("log.subtitle")} />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Trash2 className="size-4 text-muted-foreground" /> {t("log.trash")}
        </h2>
        {trash.isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : trash.data && trash.data.length > 0 ? (
          <ul className="space-y-2">
            {trash.data.map((row) => (
              <li
                key={`${row.kind}-${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {KIND_LABEL[row.kind]} · {when(row.deleted_at)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={restore.isPending}
                  onClick={() => restore.mutate(row)}
                >
                  <RotateCcw className="size-4" /> {t("log.restore")}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("log.empty")}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ShieldQuestion className="size-4 text-muted-foreground" /> Certificaatverificaties
        </h2>
        {verifications.isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : verifications.data && verifications.data.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {verifications.data.map((row) => {
              const geldig = (row.summary ?? "").includes("(geldig)");
              return (
                <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold">
                    {geldig ? (
                      <BadgeCheck className="size-4 text-[color:var(--ink-forest)]" />
                    ) : (
                      <ShieldQuestion className="size-4 text-muted-foreground" />
                    )}
                    {geldig ? "Geldig" : "Niet gevonden"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm">
                    {row.entity_id ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">{when(row.created_at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("log.empty")}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <History className="size-4 text-muted-foreground" /> {t("log.activity")}
        </h2>
        {log.isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : log.data && log.data.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {log.data.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3">
                <span className="text-sm font-semibold">
                  {ACTION_LABEL[row.action] ?? row.action}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {row.summary ?? `${row.entity} ${row.entity_id ?? ""}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.actor_email ?? "—"} · {when(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("log.empty")}</p>
        )}
      </section>
    </div>
  );
}
