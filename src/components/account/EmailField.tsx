/**
 * E-mailadres van het account: een gewoon profielveld. Wijzigen kan enkel na
 * bevestiging via een link naar het nieuwe adres — het interne account-ID
 * (en dus bestellingen, Hoefjes en historiek) blijft ongewijzigd.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMyEmailChange } from "@/lib/email-change.functions";

export function EmailField({ email, label }: { email: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const change = useMutation({
    mutationFn: async (next: string) => await requestMyEmailChange({ data: { email: next } }),
    onSuccess: (res) => {
      setOpen(false);
      setValue("");
      toast.success(
        `We stuurden een bevestigingslink naar ${res.email}. Je adres verandert pas nadat je die link volgt.`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <Label htmlFor="acc-email">{label}</Label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <Input id="acc-email" value={email ?? ""} disabled className="h-12 flex-1" />
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Annuleren" : "Wijzigen"}
        </Button>
      </div>

      {open ? (
        <div className="mt-3 space-y-2 rounded-lg border p-3">
          <Label htmlFor="acc-new-email">Nieuw e-mailadres</Label>
          <Input
            id="acc-new-email"
            type="email"
            autoComplete="email"
            placeholder="jij@voorbeeld.be"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12"
          />
          <p className="text-sm text-muted-foreground">
            We sturen een bevestigingslink naar dit adres. Je account, bestellingen en Hoefjes
            blijven volledig behouden.
          </p>
          <Button
            type="button"
            className="h-11"
            disabled={change.isPending || value.trim().length < 5}
            onClick={() => change.mutate(value.trim())}
          >
            {change.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Bevestigingslink sturen
          </Button>
        </div>
      ) : null}
    </div>
  );
}
