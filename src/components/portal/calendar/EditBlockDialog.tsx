/** Dialoog om een bestaande blokkade te bewerken of te verwijderen. */
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { LOCATIONS } from "@/lib/portal-data";
import type { Booking, LocationId } from "@/lib/portal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function EditBlockDialog({
  block,
  onSave,
  onDelete,
  trigger,
}: {
  block: Booking;
  onSave: (input: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    location_id: LocationId;
    reason: string;
  }) => void;
  onDelete: (input: { id: string }) => void;
  trigger?: React.ReactNode;
}) {
  const { t } = usePortal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: block.date,
    start_time: block.start_time,
    end_time: block.end_time,
    location_id: block.location_id,
    reason: block.client_name,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm({
            date: block.date,
            start_time: block.start_time,
            end_time: block.end_time,
            location_id: block.location_id,
            reason: block.client_name,
          });
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Pencil className="size-4" /> {t("calendar.edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("calendar.editBlock")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="eblk-date">{t("common.date")}</Label>
            <Input
              id="eblk-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eblk-start">{t("common.from")}</Label>
              <Input
                id="eblk-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="eblk-end">{t("common.to")}</Label>
              <Input
                id="eblk-end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{t("common.location")}</Label>
            <Select
              value={form.location_id}
              onValueChange={(v) => setForm({ ...form, location_id: v as LocationId })}
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
          <div>
            <Label htmlFor="eblk-reason">{t("calendar.reason")}</Label>
            <Input
              id="eblk-reason"
              maxLength={120}
              value={form.reason}
              placeholder={t("calendar.reasonPlaceholder")}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10">
                <Trash2 className="size-4" /> {t("calendar.deleteBlock")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("calendar.deleteBlock")}</AlertDialogTitle>
                <AlertDialogDescription>{t("calendar.deleteConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("calendar.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onDelete({ id: block.id });
                    setOpen(false);
                    toast.success(t("calendar.deleted"));
                  }}
                >
                  {t("action.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("calendar.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!form.date || form.end_time <= form.start_time) {
                  toast.error(t("calendar.checkFields"));
                  return;
                }
                onSave({ id: block.id, ...form, reason: form.reason.trim().slice(0, 120) });
                setOpen(false);
                toast.success(t("calendar.updated"));
              }}
            >
              {t("calendar.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
