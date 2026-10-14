import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, Plus, Trash2 } from "lucide-react";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/lib/use-permissions";
import {
  addOrderRecipient,
  removeOrderRecipient,
  updateOrderRecipient,
} from "@/lib/shop-admin.functions";

type Recipient = {
  id: string;
  label: string;
  email: string | null;
  phone: string | null;
  notify_email: boolean;
  notify_sms: boolean;
  active: boolean;
};

/** Wie wordt hoe verwittigd bij een nieuwe bestelling (e-mail en/of sms). */
export function OrderNotifications() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ label: "", email: "", phone: "" });

  const recipients = useQuery({
    queryKey: ["portal", "order-recipients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_notification_recipients")
        .select("id, label, email, phone, notify_email, notify_sms, active")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Recipient[];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["portal", "order-recipients"] });

  const add = useMutation({
    mutationFn: async () => {
      if (!draft.label.trim()) throw new Error("Geef een naam op.");
      if (!draft.email.trim() && !draft.phone.trim()) {
        throw new Error("Vul een e-mailadres of telefoonnummer in.");
      }
      await addOrderRecipient({
        data: {
          label: draft.label.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim(),
        },
      });
    },
    onSuccess: () => {
      toast.success("Ontvanger toegevoegd.");
      setDraft({ label: "", email: "", phone: "" });
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Toevoegen mislukt."),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { notify_email?: boolean; notify_sms?: boolean; active?: boolean };
    }) => {
      await updateOrderRecipient({ data: { id, patch } });
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message || "Opslaan mislukt."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await removeOrderRecipient({ data: { id } });
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message || "Verwijderen mislukt."),
  });

  if (!can("manage_orders")) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <BellRing className="size-4 text-muted-foreground" /> Meldingen bij nieuwe bestellingen
      </h2>
      <p className="text-sm text-muted-foreground">
        Kies wie verwittigd wordt en hoe: per e-mail, per sms, of allebei.
      </p>

      <div className="space-y-2">
        {recipients.data?.map((r) => (
          <article
            key={r.id}
            className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0">
              <p className="font-semibold">{r.label}</p>
              <p className="truncate text-sm text-muted-foreground">
                {[r.email, r.phone].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-[11px]" htmlFor={`mail-${r.id}`}>
                  E-mail
                </Label>
                <Switch
                  id={`mail-${r.id}`}
                  checked={r.notify_email}
                  disabled={!r.email}
                  onCheckedChange={(v) => update.mutate({ id: r.id, patch: { notify_email: v } })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[11px]" htmlFor={`sms-${r.id}`}>
                  Sms
                </Label>
                <Switch
                  id={`sms-${r.id}`}
                  checked={r.notify_sms}
                  disabled={!r.phone}
                  onCheckedChange={(v) => update.mutate({ id: r.id, patch: { notify_sms: v } })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[11px]" htmlFor={`act-${r.id}`}>
                  Actief
                </Label>
                <Switch
                  id={`act-${r.id}`}
                  checked={r.active}
                  onCheckedChange={(v) => update.mutate({ id: r.id, patch: { active: v } })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Verwijder ${r.label}`}
                onClick={() => remove.mutate(r.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-4 sm:items-end">
        <div>
          <Label htmlFor="rec-label">Naam</Label>
          <Input
            id="rec-label"
            value={draft.label}
            maxLength={80}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="rec-mail">E-mailadres</Label>
          <Input
            id="rec-mail"
            type="email"
            value={draft.email}
            maxLength={160}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="rec-phone">Telefoon (sms)</Label>
          <Input
            id="rec-phone"
            value={draft.phone}
            maxLength={32}
            placeholder="+324…"
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          <Plus className="size-4" /> Toevoegen
        </Button>
      </div>
    </section>
  );
}
