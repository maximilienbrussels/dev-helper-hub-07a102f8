import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  fetchContactRoutes,
  saveContactRouteFn,
  deleteContactRouteFn,
  type ContactRouteRow,
} from "@/lib/email-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/**
 * Beheer van de bestemming per contactformulier: welke mailbox(en) van de
 * organisatie krijgen een inzending van deze categorie?
 */
export function ContactRoutesSection() {
  const queryClient = useQueryClient();
  const load = useServerFn(fetchContactRoutes);
  const save = useServerFn(saveContactRouteFn);
  const remove = useServerFn(deleteContactRouteFn);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contact-routes"],
    queryFn: () => load(),
    retry: false,
  });

  const [draft, setDraft] = useState<Record<string, { recipients: string; active: boolean }>>({});

  useEffect(() => {
    if (!data?.routes) return;
    const next: Record<string, { recipients: string; active: boolean }> = {};
    for (const r of data.routes as ContactRouteRow[]) {
      next[r.key] = { recipients: r.recipients.join(", "), active: r.active };
    }
    setDraft(next);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (route: ContactRouteRow) => {
      const d = draft[route.key];
      const recipients = (d?.recipients ?? "")
        .split(/[,;\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);
      if (!recipients.length) throw new Error("Vul minstens één e-mailadres in.");
      return save({
        data: {
          key: route.key,
          label: route.label,
          recipients,
          active: d?.active ?? true,
        },
      });
    },
    onSuccess: () => {
      toast.success("Mailroutering opgeslagen");
      queryClient.invalidateQueries({ queryKey: ["contact-routes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => remove({ data: { key } }),
    onSuccess: () => {
      toast.success("Categorie verwijderd");
      queryClient.invalidateQueries({ queryKey: ["contact-routes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [nieuw, setNieuw] = useState({ label: "", recipients: "" });
  const createMutation = useMutation({
    mutationFn: () => {
      const label = nieuw.label.trim();
      const recipients = nieuw.recipients
        .split(/[,;\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);
      if (!label) throw new Error("Geef de categorie een naam.");
      if (!recipients.length) throw new Error("Vul minstens één e-mailadres in.");
      const key = label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      if (!key) throw new Error("Kies een naam met letters of cijfers.");
      return save({ data: { key, label, recipients, active: true } });
    },
    onSuccess: () => {
      toast.success("Categorie toegevoegd");
      setNieuw({ label: "", recipients: "" });
      queryClient.invalidateQueries({ queryKey: ["contact-routes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const routes = (data?.routes ?? []) as ContactRouteRow[];

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Inbox className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-bold">Bestemming per contactformulier</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Kies per categorie naar welk adres — of welke adressen — een inzending gestuurd wordt.
        Meerdere adressen scheid je met een komma.
      </p>

      {data && !data.databaseReady ? (
        <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          De databank is nog niet verbonden. Je ziet de standaardadressen; wijzigingen kunnen pas
          bewaard worden zodra de databankverbinding ingesteld is.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error).message}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Laden…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {routes.map((route) => {
            const d = draft[route.key] ?? { recipients: route.recipients.join(", "), active: true };
            return (
              <li
                key={route.key}
                className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,190px)_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">{route.label}</p>
                  <p className="text-[11px] text-muted-foreground">{route.key}</p>
                </div>
                <Input
                  value={d.recipients}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [route.key]: { ...d, recipients: e.target.value },
                    }))
                  }
                  placeholder="contact@maximilien.brussels, jona@maximilien.brussels"
                  aria-label={`Ontvangers voor ${route.label}`}
                />
                <div className="flex items-center gap-2 justify-self-end">
                  <Switch
                    checked={d.active}
                    onCheckedChange={(v) =>
                      setDraft((prev) => ({ ...prev, [route.key]: { ...d, active: v } }))
                    }
                    aria-label={`Categorie ${route.label} actief`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={saveMutation.isPending || !data?.databaseReady}
                    onClick={() => saveMutation.mutate(route)}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Bewaren
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Categorie ${route.label} verwijderen`}
                    disabled={deleteMutation.isPending || !data?.databaseReady}
                    onClick={() => {
                      if (confirm(`Categorie "${route.label}" verwijderen?`)) {
                        deleteMutation.mutate(route.key);
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="mt-4 grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[minmax(0,190px)_1fr_auto] sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <Input
          value={nieuw.label}
          onChange={(e) => setNieuw({ ...nieuw, label: e.target.value })}
          placeholder="Nieuwe categorie, bv. Geboortefeestjes"
          aria-label="Naam van de nieuwe categorie"
        />
        <Input
          value={nieuw.recipients}
          onChange={(e) => setNieuw({ ...nieuw, recipients: e.target.value })}
          placeholder="naar welk e-mailadres?"
          aria-label="Ontvangers van de nieuwe categorie"
        />
        <Button
          type="submit"
          size="sm"
          className="gap-2 justify-self-end"
          disabled={createMutation.isPending || !data?.databaseReady}
        >
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Toevoegen
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Nieuwe categorieën verschijnen automatisch in de keuzelijst van het algemene
        contactformulier op de site.
      </p>
    </section>
  );
}
