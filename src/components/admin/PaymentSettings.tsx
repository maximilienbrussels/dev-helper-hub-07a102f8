/**
 * Betaalinstellingen — laat "Betalen bij afhaling" toe naast Stripe en
 * beheert de instructietekst die de klant te zien krijgt.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { savePaymentSettings } from "@/lib/site-admin.functions";
import { DEFAULT_PAYMENT_SETTINGS, type PaymentSettings as PaymentSettingsValue } from "@/types/settings";

export function PaymentSettings({ payments }: { payments?: PaymentSettingsValue }) {
  const qc = useQueryClient();
  const initial = payments ?? DEFAULT_PAYMENT_SETTINGS;
  const [draft, setDraft] = useState<PaymentSettingsValue | null>(null);
  const value = draft ?? initial;

  const mutation = useMutation({
    mutationFn: (data: PaymentSettingsValue) => savePaymentSettings({ data }),
    onSuccess: () => {
      toast.success("Betaalinstellingen bewaard.");
      void qc.invalidateQueries({ queryKey: ["site-config"] });
      setDraft(null);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Bewaren mislukt."),
  });

  const update = (patch: Partial<PaymentSettingsValue>) => setDraft({ ...value, ...patch });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <Banknote className="h-5 w-5 text-[color:var(--color-terracotta)]" />
        <h2 className="text-lg font-semibold">Betalingen</h2>
      </header>

      <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Betalen bij afhaling toestaan</p>
          <p className="text-xs text-muted-foreground">
            Toont in de webshop de optie “💶 Betalen bij afhaling” naast Bancontact, kaart, Apple Pay
            en iDEAL. De bestelling krijgt dan de status “Te betalen bij afhaling”.
          </p>
        </div>
        <Switch
          checked={value.payOnPickupEnabled}
          onCheckedChange={(v) => update({ payOnPickupEnabled: v })}
          aria-label="Betalen bij afhaling toestaan"
        />
      </div>

      <div className="py-3">
        <label className="text-sm font-medium" htmlFor="pay-on-pickup-notice">
          Instructies voor betaling bij afhaling
        </label>
        <Input
          id="pay-on-pickup-notice"
          className="mt-2"
          value={value.payOnPickupNotice}
          maxLength={300}
          placeholder="Betaal contant of via Payconiq aan de kassa op de stadsboerderij."
          onChange={(e) => update({ payOnPickupNotice: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Verschijnt in de checkout, de bevestigingsmail en op de PDF-afhaalpas.
        </p>
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="button" disabled={!draft || mutation.isPending} onClick={() => mutation.mutate(value)}>
          {mutation.isPending ? "Bewaren…" : "Bewaren"}
        </Button>
      </div>
    </section>
  );
}
