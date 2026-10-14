import type { Row } from "@/lib/db-types";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { History, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrderDetail,
  updateOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders.functions";
import { usePermissions } from "@/lib/use-permissions";

const money = (cents: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(cents / 100);

/** Detailvenster van een bestelling: bestelregels, status wijzigen en historiek. */
export function OrderDetailDialog({
  orderId,
  onOpenChange,
}: {
  orderId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const detailFn = useServerFn(getOrderDetail);
  const statusFn = useServerFn(updateOrderStatus);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");

  const detail = useQuery({
    queryKey: ["portal", "order", orderId],
    queryFn: () => detailFn({ data: { id: orderId as number } }),
    enabled: orderId !== null,
  });

  const save = useMutation({
    mutationFn: () =>
      statusFn({
        data: { id: orderId as number, status: status as OrderStatus, note: note || undefined },
      }),
    onSuccess: () => {
      toast.success("Status bijgewerkt.");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["portal", "order", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["portal", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message || "Bijwerken mislukt."),
  });

  const order = detail.data?.order;
  const current = (order?.payment_status ?? "") as OrderStatus | "";

  return (
    <Dialog open={orderId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Bestelling {order ? (order.order_reference ?? `#${order.id}`) : `#${orderId ?? ""}`}
          </DialogTitle>
        </DialogHeader>

        {detail.isLoading || !order ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Klant</dt>
              <dd>{order.customer_email ?? "—"}</dd>
              <dt className="text-muted-foreground">Afhaalmoment</dt>
              <dd>
                {new Date(order.pickup_slot).toLocaleString("nl-BE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </dd>
              <dt className="text-muted-foreground">Betaalwijze</dt>
              <dd>{order.payment_method ?? "—"}</dd>
              <dt className="text-muted-foreground">Huidige status</dt>
              <dd className="font-semibold">
                {ORDER_STATUS_LABELS[current as OrderStatus] ?? order.payment_status}
              </dd>
            </dl>

            <section>
              <h3 className="text-sm font-bold">Bestelregels</h3>
              <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                {(order.order_items ?? []).map((line: Row) => (
                  <li key={line.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      {line.quantity}× {line.products?.title ?? "Product"}
                    </span>
                    <span>{money(line.price_at_purchase_cents * line.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 px-3 py-2 text-sm font-semibold">
                  <span>Totaal</span>
                  <span>{money(order.total_price_cents)}</span>
                </li>
              </ul>
            </section>

            {can("manage_orders") ? (
              <section className="space-y-2 rounded-md border border-border p-3">
                <Label htmlFor="order-status">Status aanpassen</Label>
                <Select
                  value={status || current}
                  onValueChange={(v) => setStatus(v as OrderStatus)}
                >
                  <SelectTrigger id="order-status">
                    <SelectValue placeholder="Kies een status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="order-note">Notitie (optioneel)</Label>
                <Textarea
                  id="order-note"
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={save.isPending || !(status || current)}
                  onClick={() => save.mutate()}
                >
                  {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Status opslaan
                </Button>
              </section>
            ) : null}

            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <History className="size-4 text-muted-foreground" /> Statusgeschiedenis
              </h3>
              {detail.data?.history.length ? (
                <ol className="mt-2 space-y-2">
                  {detail.data.history.map((h) => (
                    <li key={h.id} className="rounded-md border border-border px-3 py-2 text-sm">
                      <p className="font-medium">
                        {ORDER_STATUS_LABELS[h.status as OrderStatus] ?? h.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("nl-BE")} · {h.author}
                      </p>
                      {h.note ? <p className="mt-1 text-sm">{h.note}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Nog geen wijzigingen gelogd.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
