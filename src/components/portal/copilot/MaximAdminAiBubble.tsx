/**
 * Zwevende "Maxim AI"-bubbel in het beheerportaal. Vervangt de aparte
 * Co-Pilot-pagina: het gesprek blijft open terwijl de beheerder tussen
 * portaalpagina's navigeert (de component blijft in de shell gemonteerd).
 */
import { useState } from "react";
import { Sparkles, X } from "lucide-react";

import euriaLogoAsset from "@/assets/euria-logo.jpg.asset.json";
import { AdminCoPilot } from "@/components/portal/copilot/AdminCoPilot";
import { cn } from "@/lib/utils";

export function MaximAdminAiBubble() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Paneel blijft gemonteerd zodat het gesprek bewaard blijft. */}
      <div
        className={cn(
          "fixed right-4 bottom-24 z-50 w-[min(26rem,calc(100vw-2rem))] origin-bottom-right transition-all lg:bottom-24",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="flex max-h-[min(38rem,calc(100vh-10rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <header className="flex items-start justify-between gap-3 border-b border-border bg-accent/10 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <img
                  src={euriaLogoAsset.url}
                  alt=""
                  className="size-4 shrink-0 rounded-md object-cover"
                />
                Maxim AI Assistent
              </p>
              <p className="text-xs text-muted-foreground">
                Aangedreven door Europese Infomaniak AI
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Sluiten"
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <AdminCoPilot embedded />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Maxim AI Assistent"
        title="Maxim AI"
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground shadow-xl transition hover:brightness-110 active:scale-95 lg:bottom-6"
      >
        <Sparkles className="size-5" />
      </button>
    </>
  );
}
