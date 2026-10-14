import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
import { LOCATIONS, locationName } from "@/lib/portal-data";
import type { LocationId, Service } from "@/lib/portal-types";
import { LocationBadge, PageHeader, euro } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";
import { PageContentAdmin } from "./PageContentAdmin";

type Draft = Omit<Service, "id"> & { id?: string };

const emptyDraft = (): Draft => ({
  title_fr: "",
  title_nl: "",
  title_en: "",
  desc_fr: "",
  desc_nl: "",
  desc_en: "",
  price: 0,
  location_id: "zaal",
  active: false,
});

export function ServicesPage() {
  const {
    t,
    lang,
    services,
    toggleService,
    updateService,
    addService,
    removeService,
    moveService,
  } = usePortal();
  const { can, isLoading: rightsLoading } = usePermissions();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const readOnly = rightsLoading || !can("manage_services");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("services.title")}
        subtitle={readOnly ? t("services.readOnly") : t("services.subtitle")}
      />

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">{t("services.tabPages")}</TabsTrigger>
          <TabsTrigger value="packages">{t("services.tabPackages")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("services.pagesHint")}</p>
          <PageContentAdmin />
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {readOnly ? t("services.readOnly") : t("services.order")}
            </p>
            {readOnly ? null : (
              <Button size="sm" className="ml-auto" onClick={() => setEditing(emptyDraft())}>
                <Plus className="mr-1.5 size-4" />
                {t("services.new")}
              </Button>
            )}
          </div>

          {services.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("services.empty")}
            </p>
          ) : null}

          <ul className="grid gap-3 sm:grid-cols-2">

        {services.map((s, index) => (
          <li key={s.id} className="rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s[`title_${lang}`] || s.title_nl}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {s[`desc_${lang}`] || s.desc_nl}
                </p>
              </div>
              <span className="shrink-0 font-display text-lg font-extrabold">{euro(s.price)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LocationBadge locationId={s.location_id} label={locationName(s.location_id)} />
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  s.active
                    ? "border-success/30 bg-success/12 text-success"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {s.active ? t("services.active") : t("services.inactive")}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Switch
                  checked={s.active}
                  disabled={readOnly}
                  onCheckedChange={() => {
                    toggleService(s.id);
                    toast.success(s.active ? t("services.setOffline") : t("services.setOnline"));
                  }}
                  aria-label={t("services.visibility")}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={readOnly || index === 0}
                  aria-label={t("services.moveUp")}
                  onClick={() => moveService(s.id, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={readOnly || index === services.length - 1}
                  aria-label={t("services.moveDown")}
                  onClick={() => moveService(s.id, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={readOnly}
                  aria-label={t("services.edit")}
                  onClick={() => setEditing(s)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={readOnly}
                  aria-label={t("services.delete")}
                  onClick={() => setDeleting(s)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </li>
        ))}
          </ul>
        </TabsContent>
      </Tabs>



      <ServiceEditor
        service={editing}
        onClose={() => setEditing(null)}
        onSave={(s) => {
          if (s.id) {
            updateService({ ...s, id: s.id });
            toast.success(t("services.updated"));
          } else {
            const { id: _omit, ...values } = s;
            addService(values);
          }
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("services.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("services.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) removeService(deleting.id);
                setDeleting(null);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ServiceEditor({
  service,
  onClose,
  onSave,
}: {
  service: Draft | null;
  onClose: () => void;
  onSave: (s: Draft) => void;
}) {
  const { t } = usePortal();
  const [draft, setDraft] = useState<Draft | null>(service);
  if (service && draft !== service && draft?.id !== service.id) setDraft(service);
  if (!service || !draft) return null;

  const valid =
    draft.title_nl.trim().length > 0 &&
    draft.title_fr.trim().length > 0 &&
    draft.title_en.trim().length > 0;

  return (
    <Dialog open={!!service} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft.id ? t("services.edit") : t("services.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="svc-price">{t("services.basePrice")}</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                max={100000}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="svc-location">{t("services.location")}</Label>
              <Select
                value={draft.location_id}
                onValueChange={(v) => setDraft({ ...draft, location_id: v as LocationId })}
              >
                <SelectTrigger id="svc-location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="nl">
            <TabsList className="w-full">
              <TabsTrigger value="fr" className="flex-1">
                FR
              </TabsTrigger>
              <TabsTrigger value="nl" className="flex-1">
                NL
              </TabsTrigger>
              <TabsTrigger value="en" className="flex-1">
                EN
              </TabsTrigger>
            </TabsList>
            {(["fr", "nl", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
                <div>
                  <Label htmlFor={`title-${l}`}>{`${t("services.fieldTitle")} (${l.toUpperCase()})`}</Label>
                  <Input
                    id={`title-${l}`}
                    maxLength={120}
                    value={draft[`title_${l}`]}
                    onChange={(e) => setDraft({ ...draft, [`title_${l}`]: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`desc-${l}`}>{`${t("services.fieldDesc")} (${l.toUpperCase()})`}</Label>
                  <Textarea
                    id={`desc-${l}`}
                    maxLength={600}
                    className="min-h-24"
                    value={draft[`desc_${l}`]}
                    onChange={(e) => setDraft({ ...draft, [`desc_${l}`]: e.target.value })}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
            <span className="text-sm font-medium">{t("services.publicVisible")}</span>
            <Switch
              checked={draft.active}
              onCheckedChange={(v) => setDraft({ ...draft, active: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onSave({
                ...draft,
                price: Math.max(0, Math.min(100000, draft.price)),
                title_fr: draft.title_fr.trim().slice(0, 120),
                title_nl: draft.title_nl.trim().slice(0, 120),
                title_en: draft.title_en.trim().slice(0, 120),
              })
            }
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
