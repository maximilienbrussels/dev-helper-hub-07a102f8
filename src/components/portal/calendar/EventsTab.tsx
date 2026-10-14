/** Beheer van eigen evenementen in de kalender (drietalige titel, publiek zichtbaar). */
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { LOCATIONS } from "@/lib/portal-data";
import type { CalendarEvent } from "@/lib/calendar-admin.functions";
import type { LocationId } from "@/lib/portal-types";
import { LocationBadge } from "@/components/portal/portal-ui";
import { locationName } from "@/lib/portal-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EventsTab({
  events,
  onSave,
  onDelete,
}: {
  events: CalendarEvent[];
  onSave: (input: {
    id?: string;
    titleNl: string;
    titleFr: string;
    titleEn: string;
    date: string;
    startTime: string;
    endTime: string;
    locationId: LocationId;
    isPublic: boolean;
  }) => void;
  onDelete: (input: { id: string }) => void;
}) {
  const { t, lang } = usePortal();
  const titleFor = (e: CalendarEvent) =>
    lang === "nl" ? e.titleNl : lang === "en" ? e.titleEn : e.titleFr;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{t("calendar.tab.events")}</h3>
        <EventDialog onSave={onSave} />
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("calendar.noEvents")}</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="font-semibold">{titleFor(e)}</span>
                <span className="ml-2 text-muted-foreground">
                  {e.date} · {e.startTime}–{e.endTime}
                </span>
                <LocationBadge
                  locationId={e.locationId}
                  label={locationName(e.locationId)}
                  className="ml-2"
                />
                {e.isPublic ? (
                  <span className="ml-2 text-[11px] font-semibold text-success">
                    {t("calendar.publicVisible")}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-1">
                <EventDialog
                  event={e}
                  onSave={onSave}
                  trigger={
                    <Button variant="outline" size="sm">
                      {t("calendar.edit")}
                    </Button>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("action.delete")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("calendar.deleteConfirm")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("calendar.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          onDelete({ id: e.id });
                          toast.success(t("calendar.eventDeleted"));
                        }}
                      >
                        {t("action.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventDialog({
  event,
  onSave,
  trigger,
}: {
  event?: CalendarEvent;
  onSave: (input: {
    id?: string;
    titleNl: string;
    titleFr: string;
    titleEn: string;
    date: string;
    startTime: string;
    endTime: string;
    locationId: LocationId;
    isPublic: boolean;
  }) => void;
  trigger?: React.ReactNode;
}) {
  const { t } = usePortal();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    titleNl: event?.titleNl ?? "",
    titleFr: event?.titleFr ?? "",
    titleEn: event?.titleEn ?? "",
    date: event?.date ?? today,
    startTime: event?.startTime ?? "10:00",
    endTime: event?.endTime ?? "17:00",
    locationId: event?.locationId ?? ("chalet" as LocationId),
    isPublic: event?.isPublic ?? false,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" /> {t("calendar.addEvent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? t("calendar.editEvent") : t("calendar.addEvent")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ev-nl">{t("calendar.titleNl")}</Label>
            <Input
              id="ev-nl"
              maxLength={160}
              value={form.titleNl}
              onChange={(e) => setForm({ ...form, titleNl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ev-fr">{t("calendar.titleFr")}</Label>
            <Input
              id="ev-fr"
              maxLength={160}
              value={form.titleFr}
              onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ev-en">{t("calendar.titleEn")}</Label>
            <Input
              id="ev-en"
              maxLength={160}
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ev-date">{t("common.date")}</Label>
            <Input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-start">{t("common.from")}</Label>
              <Input
                id="ev-start"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ev-end">{t("common.to")}</Label>
              <Input
                id="ev-end"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{t("common.location")}</Label>
            <Select
              value={form.locationId}
              onValueChange={(v) => setForm({ ...form, locationId: v as LocationId })}
            >
              <SelectTrigger className="w-full">
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
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="ev-public">{t("calendar.publicVisible")}</Label>
              <p className="text-xs text-muted-foreground">{t("calendar.publicHint")}</p>
            </div>
            <Switch
              id="ev-public"
              checked={form.isPublic}
              onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("calendar.cancel")}
          </Button>
          <Button
            onClick={() => {
              if (
                !form.titleNl.trim() ||
                !form.titleFr.trim() ||
                !form.titleEn.trim() ||
                !form.date ||
                form.endTime <= form.startTime
              ) {
                toast.error(t("calendar.checkFields"));
                return;
              }
              onSave({
                id: event?.id,
                ...form,
                titleNl: form.titleNl.trim(),
                titleFr: form.titleFr.trim(),
                titleEn: form.titleEn.trim(),
              });
              setOpen(false);
              toast.success(t("calendar.eventSaved"));
            }}
          >
            {t("calendar.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
