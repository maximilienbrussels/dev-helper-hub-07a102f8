/** Beheer van wekelijkse openingsuren per seizoen + sluitingen/uitzonderingen. */
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import type { OpeningExceptionRow, OpeningHourRow } from "@/lib/calendar-admin.functions";
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

const WEEKDAY_KEYS = [
  "calendar.weekday.sun",
  "calendar.weekday.mon",
  "calendar.weekday.tue",
  "calendar.weekday.wed",
  "calendar.weekday.thu",
  "calendar.weekday.fri",
  "calendar.weekday.sat",
];

export function OpeningHoursTab({
  hours,
  exceptions,
  onSaveHour,
  onSaveException,
  onDeleteException,
}: {
  hours: OpeningHourRow[];
  exceptions: OpeningExceptionRow[];
  onSaveHour: (input: OpeningHourRow) => void;
  onSaveException: (input: {
    id?: string;
    dateFrom: string;
    dateTo: string;
    closed: boolean;
    openTime: string | null;
    closeTime: string | null;
    reasonNl: string;
    reasonFr: string;
    reasonEn: string;
  }) => void;
  onDeleteException: (input: { id: string }) => void;
}) {
  const { t } = usePortal();

  const rowFor = (weekday: number, season: "zomer" | "winter") =>
    hours.find((h) => h.weekday === weekday && h.season === season) ?? {
      weekday,
      season,
      isOpen: false,
      openTime: null,
      closeTime: null,
    };

  const renderSeason = (season: "zomer" | "winter") => (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">{t(`calendar.season.${season}`)}</h3>
      <div className="space-y-2">
        {WEEKDAY_KEYS.map((key, weekday) => {
          const row = rowFor(weekday, season);
          return (
            <div
              key={weekday}
              className="grid grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2"
            >
              <span className="w-8 text-xs font-bold text-muted-foreground">{t(key)}</span>
              <Switch
                checked={row.isOpen}
                onCheckedChange={(v) =>
                  onSaveHour({
                    weekday,
                    season,
                    isOpen: v,
                    openTime: row.openTime ?? "09:00",
                    closeTime: row.closeTime ?? "17:00",
                  })
                }
              />
              <Input
                type="time"
                disabled={!row.isOpen}
                value={row.openTime ?? ""}
                onChange={(e) =>
                  onSaveHour({ ...row, isOpen: true, openTime: e.target.value })
                }
              />
              <Input
                type="time"
                disabled={!row.isOpen}
                value={row.closeTime ?? ""}
                onChange={(e) =>
                  onSaveHour({ ...row, isOpen: true, closeTime: e.target.value })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {renderSeason("zomer")}
        {renderSeason("winter")}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">{t("calendar.exceptions")}</h3>
          <ExceptionDialog onSave={onSaveException} />
        </div>
        {exceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("calendar.noExceptions")}</p>
        ) : (
          <ul className="space-y-2">
            {exceptions.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-semibold">
                    {e.dateFrom}
                    {e.dateFrom !== e.dateTo ? ` – ${e.dateTo}` : ""}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {e.closed
                      ? t("calendar.closedOption")
                      : `${e.openTime ?? ""} – ${e.closeTime ?? ""}`}
                  </span>
                  {e.reasonNl ? (
                    <span className="ml-2 text-muted-foreground">· {e.reasonNl}</span>
                  ) : null}
                </span>
                <div className="flex items-center gap-1">
                  <ExceptionDialog
                    exception={e}
                    onSave={onSaveException}
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
                        <AlertDialogDescription>
                          {t("calendar.deleteConfirm")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("calendar.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            onDeleteException({ id: e.id });
                            toast.success(t("calendar.deleted"));
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
    </div>
  );
}

function ExceptionDialog({
  exception,
  onSave,
  trigger,
}: {
  exception?: OpeningExceptionRow;
  onSave: (input: {
    id?: string;
    dateFrom: string;
    dateTo: string;
    closed: boolean;
    openTime: string | null;
    closeTime: string | null;
    reasonNl: string;
    reasonFr: string;
    reasonEn: string;
  }) => void;
  trigger?: React.ReactNode;
}) {
  const { t } = usePortal();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    dateFrom: exception?.dateFrom ?? today,
    dateTo: exception?.dateTo ?? today,
    closed: exception?.closed ?? true,
    openTime: exception?.openTime ?? "09:00",
    closeTime: exception?.closeTime ?? "17:00",
    reasonNl: exception?.reasonNl ?? "",
    reasonFr: exception?.reasonFr ?? "",
    reasonEn: exception?.reasonEn ?? "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" /> {t("calendar.addException")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("calendar.addException")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exc-from">{t("calendar.dateFrom")}</Label>
              <Input
                id="exc-from"
                type="date"
                value={form.dateFrom}
                onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="exc-to">{t("calendar.dateTo")}</Label>
              <Input
                id="exc-to"
                type="date"
                value={form.dateTo}
                onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="exc-closed">{t("calendar.closedOption")}</Label>
            <Switch
              id="exc-closed"
              checked={form.closed}
              onCheckedChange={(v) => setForm({ ...form, closed: v })}
            />
          </div>
          {!form.closed ? (
            <div>
              <Label>{t("calendar.customHours")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="time"
                  value={form.openTime}
                  onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                />
                <Input
                  type="time"
                  value={form.closeTime}
                  onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <div>
            <Label htmlFor="exc-nl">{t("calendar.reasonNl")}</Label>
            <Input
              id="exc-nl"
              maxLength={200}
              value={form.reasonNl}
              onChange={(e) => setForm({ ...form, reasonNl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="exc-fr">{t("calendar.reasonFr")}</Label>
            <Input
              id="exc-fr"
              maxLength={200}
              value={form.reasonFr}
              onChange={(e) => setForm({ ...form, reasonFr: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="exc-en">{t("calendar.reasonEn")}</Label>
            <Input
              id="exc-en"
              maxLength={200}
              value={form.reasonEn}
              onChange={(e) => setForm({ ...form, reasonEn: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("calendar.cancel")}
          </Button>
          <Button
            onClick={() => {
              if (!form.dateFrom || form.dateTo < form.dateFrom) {
                toast.error(t("calendar.checkFields"));
                return;
              }
              onSave({
                id: exception?.id,
                dateFrom: form.dateFrom,
                dateTo: form.dateTo,
                closed: form.closed,
                openTime: form.closed ? null : form.openTime,
                closeTime: form.closed ? null : form.closeTime,
                reasonNl: form.reasonNl.trim(),
                reasonFr: form.reasonFr.trim(),
                reasonEn: form.reasonEn.trim(),
              });
              setOpen(false);
              toast.success(t("calendar.hoursSaved"));
            }}
          >
            {t("calendar.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
