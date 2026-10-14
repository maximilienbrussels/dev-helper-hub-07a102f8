/**
 * "Site-instellingen & Contact" — enkel adres, telefoon en e-mail. Sociale
 * kanalen beheer je uitsluitend in de Social Media-beheerder (één bron).
 * Wat hier verandert, verandert meteen op de hele site en in de e-mails.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSiteContact } from "@/lib/site-admin.functions";
import type { SiteContact } from "@/lib/site-config";

const FIELDS: Array<{ key: keyof SiteContact; label: string; placeholder: string }> = [
  { key: "address", label: "Straat en nummer", placeholder: "Schipperijkaai 2" },
  { key: "postalCode", label: "Postcode", placeholder: "1000" },
  { key: "city", label: "Gemeente", placeholder: "Brussel" },
  { key: "phone", label: "Telefoon", placeholder: "+32 2 201 56 09" },
  { key: "email", label: "E-mailadres", placeholder: "contact@maximilien.brussels" },
];

export function SiteContactSection({ contact }: { contact: SiteContact }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<SiteContact | null>(null);
  const value = draft ?? contact;

  const mutation = useMutation({
    mutationFn: (data: SiteContact) => saveSiteContact({ data }),
    onSuccess: () => {
      toast.success("Contactgegevens bewaard.");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["site-config"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Bewaren mislukt."),
  });

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          <MapPin className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight">Site-instellingen &amp; Contact</h2>
          <p className="text-sm text-muted-foreground">
            Adres, telefoon en e-mailadres. Meteen zichtbaar in de voettekst en op de
            contactpagina.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={`contact-${f.key}`}>{f.label}</Label>
            <Input
              id={`contact-${f.key}`}
              value={value[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setDraft({ ...value, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate(value)}>
          Bewaren
        </Button>
        {draft ? (
          <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
            Annuleren
          </Button>
        ) : null}
      </div>
    </section>
  );
}
