import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { usePortal } from "@/lib/portal-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ADMIN_AVAILABILITY_OPTIONS, normalizeAvailability } from "@/lib/product-status";
import { updateProduct as updateProductFn } from "@/lib/shop-admin.functions";
import { ProductMediaManager } from "@/components/admin/products/ProductMediaManager";
import type { ProductRow } from "./types";

/** Volledig bewerkingsdialoog per product: NL/FR/EN velden, prijs, voorraad, status en foto's. */
export function ProductEditDialog({
  product,
  onOpenChange,
}: {
  product: ProductRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = usePortal();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title_nl: "",
    title_fr: "",
    title_en: "",
    desc_nl: "",
    desc_fr: "",
    desc_en: "",
    price: "",
    stock: "0",
    availability: "available",
    required_level: "",
    is_catalog: true,
  });

  useEffect(() => {
    if (!product) return;
    setForm({
      title_nl: product.title_nl ?? product.title ?? "",
      title_fr: product.title_fr ?? "",
      title_en: product.title_en ?? "",
      desc_nl: product.desc_nl ?? product.description ?? "",
      desc_fr: product.desc_fr ?? "",
      desc_en: product.desc_en ?? "",
      price: (product.price_cents / 100).toFixed(2),
      stock: String(product.stock_quantity),
      availability: normalizeAvailability(product.availability),
      required_level: product.required_level ? String(product.required_level) : "",
      is_catalog: product.is_catalog,
    });
  }, [product]);

  const save = useMutation({
    mutationFn: async () => {
      if (!product) return;
      const price = Math.round(Number(form.price.replace(",", ".")) * 100);
      if (!form.title_nl.trim()) throw new Error(t("shop.toast.nameRequired"));
      if (!Number.isFinite(price) || price < 0) throw new Error(t("shop.toast.priceInvalid"));
      const level = form.required_level.trim() === "" ? null : Number(form.required_level);
      await updateProductFn({
        data: {
          id: product.id,
          patch: {
            title: form.title_nl.trim(),
            title_nl: form.title_nl.trim(),
            title_fr: form.title_fr.trim() || null,
            title_en: form.title_en.trim() || null,
            description: form.desc_nl.trim() || null,
            desc_nl: form.desc_nl.trim() || null,
            desc_fr: form.desc_fr.trim() || null,
            desc_en: form.desc_en.trim() || null,
            price_cents: price,
            stock_quantity: Number(form.stock) || 0,
            availability: form.availability,
            required_level: Number.isFinite(level as number) ? level : null,
            is_catalog: form.is_catalog,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success(t("shop.toast.saved"));
      void queryClient.invalidateQueries({ queryKey: ["portal", "products"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || t("shop.toast.saveFailed")),
  });

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("shop.edit.title")}</DialogTitle>
        </DialogHeader>

        {product ? (
          <div className="space-y-4">
            <Tabs defaultValue="nl">
              <TabsList>
                <TabsTrigger value="nl">{t("shop.tab.nl")}</TabsTrigger>
                <TabsTrigger value="fr">{t("shop.tab.fr")}</TabsTrigger>
                <TabsTrigger value="en">{t("shop.tab.en")}</TabsTrigger>
              </TabsList>
              {(["nl", "fr", "en"] as const).map((lng) => (
                <TabsContent key={lng} value={lng} className="space-y-3">
                  <div>
                    <Label htmlFor={`title-${lng}`}>{t(`shop.title.${lng}`)}</Label>
                    <Input
                      id={`title-${lng}`}
                      value={form[`title_${lng}` as const]}
                      maxLength={255}
                      onChange={(e) => setForm({ ...form, [`title_${lng}`]: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`desc-${lng}`}>{t(`shop.desc.${lng}`)}</Label>
                    <Textarea
                      id={`desc-${lng}`}
                      value={form[`desc_${lng}` as const]}
                      onChange={(e) => setForm({ ...form, [`desc_${lng}`]: e.target.value })}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor="e-price">{t("shop.field.price")}</Label>
                <Input
                  id="e-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="e-stock">{t("shop.field.stock")}</Label>
                <Input
                  id="e-stock"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="e-level">{t("shop.field.requiredLevel")}</Label>
                <Input
                  id="e-level"
                  inputMode="numeric"
                  placeholder="—"
                  value={form.required_level}
                  onChange={(e) => setForm({ ...form, required_level: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="e-status">{t("shop.field.status")}</Label>
                <select
                  id="e-status"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                >
                  {ADMIN_AVAILABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="e-cat">{t("shop.field.visible")}</Label>
              <Switch
                id="e-cat"
                checked={form.is_catalog}
                onCheckedChange={(v) => setForm({ ...form, is_catalog: v })}
              />
            </div>

            <ProductMediaManager productId={product.id} />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("shop.cancel")}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("shop.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
