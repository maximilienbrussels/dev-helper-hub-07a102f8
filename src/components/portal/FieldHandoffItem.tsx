import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Smartphone } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createFieldHandoffLink } from "@/lib/field-handoff.functions";

/**
 * "Openen in de veld-app": maakt een eenmalige inloglink en opent de veld-app
 * met dezelfde aanmelding, zodat een medewerker daar niet opnieuw hoeft in te
 * typen. Mislukt het, dan openen we de app gewoon zonder link.
 */
export function FieldHandoffItem({ label }: { label: string }) {
  const create = useServerFn(createFieldHandoffLink);
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const res = (await create()) as { url: string | null };
      window.open(res.url ?? "https://maximilien.app/veld", "_blank", "noopener,noreferrer");
    } catch {
      window.open("https://maximilien.app/veld", "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        void open();
      }}
      disabled={busy}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
      {label}
    </DropdownMenuItem>
  );
}
