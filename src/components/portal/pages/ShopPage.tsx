import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
import { OrderDetailDialog } from "@/components/portal/OrderDetailDialog";
import { OrderNotifications } from "@/components/portal/OrderNotifications";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders.functions";
import {
  PageHeader,
  CardList,
  DataCard,
  CardRow,
  TableCard,
  Pagination,
  theadClass,
  rowClass,
  usePaged,
} from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ADMIN_AVAILABILITY_OPTIONS, normalizeAvailability } from "@/lib/product-status";
import { ProductEditDialog } from "@/components/portal/shop/ProductEditDialog";
import type { ProductRow } from "@/components/portal/shop/types";
import {
  createProduct as createProductFn,
  updateProduct as updateProductFn,
  deleteProduct as deleteProductFn,
  getPortalProducts,
  getShopOrders,
  getShopHero,
  updateShopHero,
  clearShopHero,
} from "@/lib/shop-admin.functions";
import { ImagePickerModal } from "@/components/portal/media/ImagePickerModal";
import type { MediaAsset } from "@/lib/media.functions";
import { ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleImageError } from "@/lib/image-fallback";

type ProductPatch = {
  price_cents?: number;
  stock_quantity?: number;
  is_catalog?: boolean;
  availability?: string;
  required_level?: number | null;
};

type OrderRow = {
  id: number;
  order_reference: string | null;
  structured_communication: string;
  total_price_cents: number;
  pickup_slot: string;
  payment_status: string;
  customer_email: string | null;
};


const money = (cents: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(cents / 100);

export function ShopPage() {
  const { t } = usePortal();
  const { can, isLoading: rightsLoading } = usePermissions();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductRow | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    price: "",
    stock: "0",
    is_catalog: true,
  });

  const products = useQuery({
    queryKey: ["portal", "products"],
    queryFn: async () => (await getPortalProducts()) as ProductRow[],
  });

  const hero = useQuery({
    queryKey: ["portal", "shop-hero"],
    queryFn: () => getShopHero(),
  });
  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
  const saveHero = useMutation({
    mutationFn: async (patch: { media_id?: string; url?: string; alt?: string }) =>
      updateShopHero({ data: patch }),
    onSuccess: () => {
      toast.success(t("shop.toast.saved"));
      void queryClient.invalidateQueries({ queryKey: ["portal", "shop-hero"] });
    },
    onError: (e: Error) => toast.error(e.message || t("shop.toast.saveFailed")),
  });
  const clearHero = useMutation({
    mutationFn: async () => clearShopHero(),
    onSuccess: () => {
      toast.success("Afbeelding verwijderd — de webshop toont nu het standaardbeeld.");
      void queryClient.invalidateQueries({ queryKey: ["portal", "shop-hero"] });
    },
    onError: (e: Error) => toast.error(e.message || t("shop.toast.saveFailed")),
  });

  const orders = useQuery({
    queryKey: ["portal", "orders"],
    queryFn: async () => (await getShopOrders()) as OrderRow[],
    enabled: can("manage_orders"),
  });

  const [orderSearch, setOrderSearch] = useState("");
  const q = orderSearch.trim().toLowerCase();
  const visibleOrders: OrderRow[] = (orders.data ?? []).filter((o) =>
    q
      ? [o.order_reference, o.structured_communication, o.customer_email, `#${o.id}`]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      : true,
  );
  const pagedOrders = usePaged(visibleOrders, 25);


  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["portal", "products"] });

  const createProduct = useMutation({
    mutationFn: async () => {
      const price = Math.round(Number(draft.price.replace(",", ".")) * 100);
      if (!draft.title.trim()) throw new Error(t("shop.toast.nameRequired"));
      if (!Number.isFinite(price) || price < 0) throw new Error(t("shop.toast.priceInvalid"));
      const organisationId = products.data?.[0]?.organisation_id ?? 1;
      await createProductFn({
        data: {
          title: draft.title.trim(),
          description: draft.description.trim(),
          price_cents: price,
          stock_quantity: Number(draft.stock) || 0,
          is_catalog: draft.is_catalog,
          organisation_id: organisationId,
        },
      });
    },
    onSuccess: () => {
      toast.success(t("shop.toast.created"));
      setOpen(false);
      setDraft({ title: "", description: "", price: "", stock: "0", is_catalog: true });
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message || t("shop.toast.createFailed")),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: ProductPatch }) => {
      await updateProductFn({ data: { id, patch } });
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message || t("shop.toast.saveFailed")),
  });

  const removeProduct = useMutation({
    mutationFn: async (id: number) => {
      await deleteProductFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success(t("shop.toast.removed"));
      setPendingDelete(null);
      void invalidate();
    },
    onError: () => toast.error(t("shop.toast.removeFailed")),
  });

  if (!rightsLoading && !can("view_shop")) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border p-12 text-center">
        <Lock className="size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">{t("shop.noAccess")}</p>
        <p className="text-sm text-muted-foreground">{t("shop.noAccess.body")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.shop")}
        subtitle={t("shop.subtitle").replace("{n}", String(products.data?.length ?? 0))}
        action={
          !can("manage_products") ? null : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> {t("shop.new")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("shop.new.title")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="p-title">{t("shop.field.name")}</Label>
                    <Input
                      id="p-title"
                      value={draft.title}
                      maxLength={255}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="p-desc">{t("shop.field.description")}</Label>
                    <Textarea
                      id="p-desc"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="p-price">{t("shop.field.price")}</Label>
                      <Input
                        id="p-price"
                        inputMode="decimal"
                        value={draft.price}
                        onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="p-stock">{t("shop.field.stock")}</Label>
                      <Input
                        id="p-stock"
                        inputMode="numeric"
                        value={draft.stock}
                        onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <Label htmlFor="p-cat">{t("shop.field.visible")}</Label>
                    <Switch
                      id="p-cat"
                      checked={draft.is_catalog}
                      onCheckedChange={(v) => setDraft({ ...draft, is_catalog: v })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createProduct.mutate()} disabled={createProduct.isPending}>
                    {createProduct.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t("shop.save")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {can("manage_products") ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold">Webshop-hero (banner op de webshoppagina)</p>
          <p className="text-xs text-muted-foreground">
            Zonder eigen beeld toont de webshop het standaardbeeld.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {hero.data?.url ? (
              <img loading="lazy" onError={handleImageError}
                src={hero.data.url}
                alt={hero.data.alt ?? ""}
                className="h-20 w-32 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="grid h-20 w-32 place-items-center rounded-md border border-dashed border-border text-center text-xs text-muted-foreground">
                Standaardbeeld
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setHeroPickerOpen(true)}>
                <ImagePlus className="size-4" />{" "}
                {hero.data?.url ? "Vervang / kies nieuw" : t("shop.images.addFromLibrary")}
              </Button>
              {hero.data?.url ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={clearHero.isPending}
                  onClick={() => clearHero.mutate()}
                  aria-label="Verwijder afbeelding"
                >
                  {clearHero.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Verwijder afbeelding
                </Button>
              ) : null}
            </div>
          </div>
          <ImagePickerModal
            open={heroPickerOpen}
            onOpenChange={setHeroPickerOpen}
            lang="nl"
            uploadCategory="general"
            title="Kies de webshop-hero"
            onSelect={(asset: MediaAsset) =>
              saveHero.mutate({ media_id: asset.id, alt: asset.title || undefined })
            }
          />
        </section>
      ) : null}

      <section className="space-y-2">
        {products.isError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {(products.error as Error)?.message || "De producten konden niet geladen worden. Controleer de databankverbinding."}
          </p>
        ) : products.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("shop.loading")}</p>
        ) : (
          products.data?.map((p) => (
            <article
              key={p.id}
              className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  <Package className="size-4 text-muted-foreground" />
                  {p.title}
                </p>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <Label className="text-[11px]" htmlFor={`status-${p.id}`}>
                    {t("shop.field.status")}
                  </Label>
                  <select
                    id={`status-${p.id}`}
                    className="h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
                    value={normalizeAvailability(p.availability)}
                    onChange={(e) =>
                      updateProduct.mutate({ id: p.id, patch: { availability: e.target.value } })
                    }
                  >
                    {ADMIN_AVAILABILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(o.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[11px]" htmlFor={`price-${p.id}`}>
                    {t("shop.field.price")}
                  </Label>
                  <Input
                    id={`price-${p.id}`}
                    className="w-28"
                    defaultValue={(p.price_cents / 100).toFixed(2)}
                    inputMode="decimal"
                    onBlur={(e) => {
                      const cents = Math.round(Number(e.target.value.replace(",", ".")) * 100);
                      if (Number.isFinite(cents) && cents >= 0 && cents !== p.price_cents) {
                        updateProduct.mutate({ id: p.id, patch: { price_cents: cents } });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label className="text-[11px]" htmlFor={`stock-${p.id}`}>
                    {t("shop.field.stock")}
                  </Label>
                  <Input
                    id={`stock-${p.id}`}
                    className="w-24"
                    defaultValue={String(p.stock_quantity)}
                    inputMode="numeric"
                    onBlur={(e) => {
                      const stock = Number(e.target.value);
                      if (Number.isFinite(stock) && stock !== p.stock_quantity) {
                        updateProduct.mutate({ id: p.id, patch: { stock_quantity: stock } });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px]" htmlFor={`cat-${p.id}`}>
                    {t("shop.field.online")}
                  </Label>
                  <Switch
                    id={`cat-${p.id}`}
                    checked={p.is_catalog}
                    onCheckedChange={(v) =>
                      updateProduct.mutate({ id: p.id, patch: { is_catalog: v } })
                    }
                  />
                </div>
                <Button variant="ghost" size="icon" aria-label={t("shop.edit")} onClick={() => setEditing(p)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("shop.delete")}
                  onClick={() => setPendingDelete(p)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{t("shop.orders.title")}</h2>
          <Input
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Zoek op MP-2026-… of e-mail"
            className="h-8 w-56 text-xs"
            aria-label="Zoek bestelling"
          />
        </div>
        {orders.isError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {(orders.error as Error)?.message || "De bestellingen konden niet geladen worden."}
          </p>
        ) : orders.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("shop.loading")}</p>
        ) : visibleOrders.length ? (
          <>
            {/* Telefoon: bestellingen als kaarten */}
            <CardList>
              {pagedOrders.rows.map((o) => (
                <DataCard key={o.id} onClick={() => setDetailId(o.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-sm font-semibold">
                        {o.order_reference ?? `#${o.id}`}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {o.customer_email ?? "—"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold">
                      {ORDER_STATUS_LABELS[o.payment_status as OrderStatus] ?? o.payment_status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-0.5">
                    <CardRow label={t("shop.orders.pickup")}>
                      {new Date(o.pickup_slot).toLocaleString("nl-BE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </CardRow>
                    <CardRow label={t("shop.orders.amount")}>{money(o.total_price_cents)}</CardRow>
                  </div>
                </DataCard>
              ))}
            </CardList>

            <TableCard>
              <table className="w-full min-w-[52rem] text-sm">
                <thead className={theadClass}>
                  <tr>
                    <th>Bestelcode</th>
                    <th>{t("shop.orders.reference")}</th>
                    <th>{t("shop.orders.customer")}</th>
                    <th>{t("shop.orders.pickup")}</th>
                    <th>{t("shop.orders.amount")}</th>
                    <th>{t("shop.orders.status")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.rows.map((o) => (
                    <tr key={o.id} className={rowClass}>
                      <td className="font-mono text-xs font-semibold">
                        {o.order_reference ?? `#${o.id}`}
                      </td>
                      <td className="font-mono text-xs">{o.structured_communication}</td>
                      <td>{o.customer_email ?? "—"}</td>
                      <td className="tabular-nums">
                        {new Date(o.pickup_slot).toLocaleString("nl-BE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="tabular-nums">{money(o.total_price_cents)}</td>
                      <td>
                        {ORDER_STATUS_LABELS[o.payment_status as OrderStatus] ?? o.payment_status}
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(o.id)}>
                          {t("shop.orders.open")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
            <Pagination
              page={pagedOrders.page}
              pageCount={pagedOrders.pageCount}
              total={pagedOrders.total}
              onPage={pagedOrders.setPage}
            />
          </>

        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            {t("shop.orders.empty")}
          </p>
        )}
      </section>

      <ProductEditDialog product={editing} onOpenChange={(o) => !o && setEditing(null)} />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shop.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? t("shop.delete.confirm").replace("{title}", pendingDelete.title)
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("shop.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && removeProduct.mutate(pendingDelete.id)}
            >
              {t("shop.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderNotifications />
      <OrderDetailDialog orderId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </div>
  );
}
