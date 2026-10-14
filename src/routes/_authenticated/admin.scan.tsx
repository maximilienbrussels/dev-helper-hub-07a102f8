import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CheckCircle2, Loader2, ScanLine, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { PickupScanner } from "@/components/portal/PickupScanner";
import { redeemPickupQr, type RedeemResult } from "@/lib/orders/pickup.functions";


const searchSchema = z.object({
  orderId: z.string().optional(),
  token: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/admin/scan")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ScanPage,
  head: () => ({
    meta: [
      { title: "Afhaal-QR scannen | Portaal" },
      { name: "description", content: "Controleer en registreer een afhaal-QR-code van een webshopbestelling." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function euro(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function ScanPage() {
  const { orderId, token } = Route.useSearch();
  const redeem = useServerFn(redeemPickupQr);
  const [state, setState] = useState<RedeemResult | { ok: "loading" } | { ok: "error"; message: string } | null>(
    null,
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const started = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId || !token) return;
    const key = `${orderId}:${token}`;
    if (started.current === key) return;
    started.current = key;
    setState({ ok: "loading" });
    redeem({ data: { orderId, token } })
      .then(setState)
      .catch((e: unknown) =>
        setState({ ok: "error", message: e instanceof Error ? e.message : "Controle mislukt." }),
      );
  }, [orderId, token, redeem]);

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <header className="flex items-center gap-2">
        <ScanLine className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl">Afhaal-QR</h1>
      </header>

      {!orderId || !token ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Start de camera en richt op de QR-code van de klant of op een certificaat. Werkt de
            camera niet? Dan kan je in het scanvenster de code van 6 tekens intikken.
          </p>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Camera className="size-5" /> Camera starten
          </button>
        </div>
      ) : null}

      {cameraOpen ? <PickupScanner onClose={() => setCameraOpen(false)} /> : null}


      {state && state.ok === "loading" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Code wordt gecontroleerd…
        </p>
      )}

      {state && state.ok === false && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-destructive bg-destructive/10 p-5 text-destructive"
        >
          <p className="flex items-center gap-2 text-lg font-bold">
            <TriangleAlert className="h-6 w-6" /> ⚠️ Ongeldige of reeds gebruikte QR-code!
          </p>
          <p className="mt-2 text-sm">
            {state.reason === "used"
              ? "Deze bestelling werd al eerder afgehaald."
              : state.reason === "cancelled"
                ? "Deze bestelling is geannuleerd."
                : "De handtekening van deze code klopt niet. Geef de bestelling niet mee."}
          </p>
        </div>
      )}

      {state && state.ok === "error" && (
        <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {state && state.ok === true && (
        <div className="rounded-2xl border-2 border-success bg-success/10 p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-success">
            <CheckCircle2 className="h-7 w-7" /> OPGEHAALD ✓
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bestelling {state.order.reference ?? "—"} · {state.order.customerName ?? "klant"}
          </p>
          {state.order.wasPayOnPickup && (
            <p className="mt-3 rounded-xl border border-warning/50 bg-warning/20 px-3 py-2 text-sm font-semibold text-warning-foreground">
              💶 Nog te innen aan de kassa: {euro(state.order.totalCents)}
            </p>
          )}
          {state.order.byo && (
            <p className="mt-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
              🌱 Klant brengt eigen verpakking mee — geen zak nodig.
            </p>
          )}
          <ul className="mt-4 space-y-1 text-sm">
            {state.order.items.map((it, i) => (
              <li key={i}>
                {it.quantity} × {it.title}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-base">{euro(state.order.totalCents)}</p>
        </div>
      )}
    </main>
  );
}
