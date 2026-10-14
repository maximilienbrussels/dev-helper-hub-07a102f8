/**
 * Balie-pagina "Afhalingen": code intikken of een openstaande bestelling
 * rechtstreeks afvinken. Gebruikt dezelfde validatie als de camerascan.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, PackageCheck, Search, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  listPendingPickups,
  markPickupCollected,
  redeemPickupCode,
  type PendingPickup,
  type RedeemResult,
} from "@/lib/orders/pickup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableCard,
  CardList,
  DataCard,
  CardRow,
  Pagination,
  theadClass,
  rowClass,
  usePaged,
} from "@/components/portal/portal-ui";


function euro(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function reasonText(reason: "invalid" | "used" | "cancelled"): string {
  return reason === "used"
    ? "Deze bestelling werd al afgehaald."
    : reason === "cancelled"
      ? "Deze bestelling is geannuleerd."
      : "Geen openstaande bestelling met deze code.";
}

export function PickupsPage() {
  const listFn = useServerFn(listPendingPickups);
  const redeemFn = useServerFn(redeemPickupCode);
  const markFn = useServerFn(markPickupCollected);
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [last, setLast] = useState<RedeemResult | null>(null);

  const pending = useQuery({
    queryKey: ["portal", "pending-pickups"],
    queryFn: () => listFn(),
  });

  function handle(result: RedeemResult) {
    setLast(result);
    if (result.ok) {
      toast.success(
        `Afgehaald ✓ ${result.order.reference ?? ""} — ${result.order.customerName ?? "klant"}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["portal", "pending-pickups"] });
    } else {
      toast.error(reasonText(result.reason));
    }
  }

  const redeem = useMutation({
    mutationFn: (value: string) => redeemFn({ data: { code: value } }),
    onSuccess: (result) => {
      handle(result);
      if (result.ok) setCode("");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Controle mislukt."),
  });

  const mark = useMutation({
    mutationFn: (orderId: number) => markFn({ data: { orderId } }),
    onSuccess: handle,
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Controle mislukt."),
  });

  const rows: PendingPickup[] = pending.data ?? [];
  const paged = usePaged(rows, 25);


  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <PackageCheck className="size-5 text-primary" />
        <h1 className="font-display text-xl font-bold">Afhalingen</h1>
      </header>

      {/* Handmatige code */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Code onder de QR intikken</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tik de korte code (bv. <span className="font-mono">8F3A2</span>) of de volledige
          referentie in en bevestig de afhaling.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const value = code.trim();
            if (value.length >= 3) redeem.mutate(value);
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="8F3A2"
            autoComplete="off"
            aria-label="Afhaalcode"
            className="font-mono text-lg tracking-[0.2em] uppercase sm:max-w-xs"
          />
          <Button type="submit" disabled={redeem.isPending || code.trim().length < 3}>
            {redeem.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Controleren &amp; afboeken
          </Button>
        </form>

        {last ? (
          last.ok ? (
            <div className="mt-4 rounded-xl border-2 border-primary bg-primary/10 p-4">
              <p className="flex items-center gap-2 font-bold text-primary">
                <CheckCircle2 className="size-5" /> Afgehaald ✓
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {last.order.reference ?? "—"} · {last.order.customerName ?? "klant"} ·{" "}
                {euro(last.order.totalCents)}
              </p>
              {last.order.wasPayOnPickup ? (
                <p className="mt-2 text-sm font-semibold">
                  💶 Nog te innen aan de kassa: {euro(last.order.totalCents)}
                </p>
              ) : null}
              <ul className="mt-2 space-y-0.5 text-sm">
                {last.order.items.map((it, i) => (
                  <li key={i}>
                    {it.quantity} × {it.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-sm font-semibold text-destructive"
            >
              <TriangleAlert className="size-5" /> {reasonText(last.reason)}
            </p>
          )
        ) : null}
      </section>

      {/* Openstaande afhalingen */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            Openstaande afhalingen{rows.length ? ` (${rows.length})` : ""}
          </h2>
          {pending.isFetching ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        </div>

        {pending.isLoading ? (
          <p className="rounded-2xl border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
            Lijst wordt geladen…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
            Er staan momenteel geen bestellingen te wachten.
          </p>
        ) : (
          <>
            <TableCard>
              <table className="w-full text-sm">
                <thead className={theadClass}>
                  <tr>
                    <th>Code</th>
                    <th>Klant</th>
                    <th>Afhaalmoment</th>
                    <th>Bedrag</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paged.rows.map((row) => (
                    <tr key={row.id} className={rowClass}>
                      <td className="font-mono font-semibold">{row.shortCode ?? "—"}</td>
                      <td>
                        <span className="block font-medium">{row.customerName ?? "—"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {row.customerEmail ?? row.reference ?? ""}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{row.pickupSlot ?? "—"}</td>
                      <td>
                        {euro(row.totalCents)}
                        {row.payOnPickup ? (
                          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                            te betalen
                          </span>
                        ) : null}
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={mark.isPending}
                          onClick={() => mark.mutate(row.id)}
                        >
                          Markeer als afgehaald
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>

            <CardList>
              {paged.rows.map((row) => (
                <DataCard key={row.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.customerName ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.customerEmail ?? row.reference ?? ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-border px-2 py-0.5 font-mono text-xs font-semibold">
                      {row.shortCode ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-border/60 pt-2">
                    <CardRow label="Afhaalmoment">{row.pickupSlot ?? "—"}</CardRow>
                    <CardRow label="Bedrag">
                      {euro(row.totalCents)}
                      {row.payOnPickup ? " · te betalen" : ""}
                    </CardRow>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 h-11 w-full"
                    disabled={mark.isPending}
                    onClick={() => mark.mutate(row.id)}
                  >
                    Markeer als afgehaald
                  </Button>
                </DataCard>
              ))}
            </CardList>

            <Pagination
              page={paged.page}
              pageCount={paged.pageCount}
              total={paged.total}
              onPage={paged.setPage}
            />
          </>
        )}
      </section>

    </div>
  );
}
