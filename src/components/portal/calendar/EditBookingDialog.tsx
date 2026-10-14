/** Dialoog om een bestaande reservatie volledig te bewerken. */
import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { LOCATIONS } from "@/lib/portal-data";
import type { Booking, BookingStatus, LocationId } from "@/lib/portal-types";
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

const STATUSES: BookingStatus[] = [
  "nieuw",
  "in_behandeling",
  "offerte_verzonden",
  "gereserveerd",
  "afgerond",
  "geannuleerd",
];

export function EditBookingDialog({
  booking,
  onSave,
  trigger,
}: {
  booking: Booking;
  onSave: (input: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    location_id: LocationId;
    guests_count: number;
    price: number;
    status: BookingStatus;
  }) => void;
  trigger?: React.ReactNode;
}) {
  const { t } = usePortal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: booking.date,
    start_time: booking.start_time,
    end_time: booking.end_time,
    location_id: booking.location_id,
    guests_count: booking.guests_count,
    price: booking.price,
    status: booking.status,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm({
            date: booking.date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            location_id: booking.location_id,
            guests_count: booking.guests_count,
            price: booking.price,
            status: booking.status,
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
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("calendar.editBooking")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="eb-date">{t("common.date")}</Label>
            <Input
              id="eb-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eb-start">{t("common.from")}</Label>
              <Input
                id="eb-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="eb-end">{t("common.to")}</Label>
              <Input
                id="eb-end"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eb-guests">{t("common.guests")}</Label>
              <Input
                id="eb-guests"
                type="number"
                min={0}
                max={1000}
                value={form.guests_count}
                onChange={(e) => setForm({ ...form, guests_count: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="eb-price">{t("common.price")} (€)</Label>
              <Input
                id="eb-price"
                type="number"
                min={0}
                max={1000000}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>{t("common.status")}</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as BookingStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("calendar.cancel")}
          </Button>
          <Button
            onClick={() => {
              if (!form.date || form.end_time <= form.start_time) {
                toast.error(t("calendar.checkFields"));
                return;
              }
              onSave({ id: booking.id, ...form });
              setOpen(false);
              toast.success(t("calendar.updated"));
            }}
          >
            {t("calendar.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
