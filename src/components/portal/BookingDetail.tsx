import { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  Mail,
  Phone,
  Users,
  MapPin,
  StickyNote,
  Trash2,
  CheckCircle2,
  Send,
  XCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
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

import { locationName } from "@/lib/portal-data";
import type { Booking, BookingStatus } from "@/lib/portal-types";
import { LocationBadge, StatusBadge, euro } from "./portal-ui";

const STATUSES: BookingStatus[] = [
  "nieuw",
  "in_behandeling",
  "offerte_verzonden",
  "gereserveerd",
  "afgerond",
  "geannuleerd",
];

export function BookingDetail({
  booking,
  onOpenChange,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, setStatus, addNote, removeBooking } = usePortal();
  const { can, isLoading: rightsLoading } = usePermissions();
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const readOnly = rightsLoading || !can("manage_requests");

  if (!booking) return null;

  const submitNote = () => {
    const clean = note.trim().slice(0, 500);
    if (!clean) return;
    addNote(booking.id, clean);
    setNote("");
    toast.success(t("booking.noteAdded"));
  };


  return (
    <Sheet open={!!booking} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            <LocationBadge
              locationId={booking.location_id}
              label={locationName(booking.location_id)}
            />
            <span className="text-[11px] font-semibold text-muted-foreground">{booking.id}</span>
          </div>
          <SheetTitle className="mt-2 text-left text-lg break-words">
            {booking.client_name}
          </SheetTitle>
          <SheetDescription className="text-left">
            {booking.client_org ?? t("booking.private")} · {t(`type.${booking.type}`)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field icon={Clock} label={t("common.date")}>
              {booking.date}
              <br />
              <span className="text-muted-foreground">
                {booking.start_time} – {booking.end_time}
              </span>
            </Field>
            <Field icon={Users} label={t("common.guests")}>
              {booking.guests_count}
            </Field>
            <Field icon={MapPin} label={t("common.location")}>
              {locationName(booking.location_id)}
            </Field>
            <Field icon={StickyNote} label={t("common.price")}>
              {euro(booking.price)}
            </Field>
            <Field icon={Mail} label={t("common.email")}>
              <span className="break-all">{booking.client_email}</span>
            </Field>
            <Field icon={Phone} label={t("common.phone")}>
              {booking.client_phone}
            </Field>

          </div>

          {booking.options?.length ? (
            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("booking.options")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {booking.options.map((o) => (
                  <span
                    key={o}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <Separator />

          {readOnly ? (
            <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
              {t("booking.readOnly")}
            </p>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("common.status")}
            </p>
            <Select
              value={booking.status}
              disabled={readOnly}
              onValueChange={(v) => {
                setStatus(booking.id, v as BookingStatus);
                toast.success(t("booking.statusUpdated"));
              }}
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

          <div>
            <p className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("notes.internal")}
            </p>
            <ul className="space-y-1.5">
              {booking.internal_notes.length ? (
                booking.internal_notes.map((n, i) => (
                  <li
                    key={i}
                    className="rounded-md border-l-2 border-l-accent bg-surface px-3 py-2 text-sm"
                  >
                    {n}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">{t("notes.none")}</li>
              )}
            </ul>
            <Textarea
              value={note}
              maxLength={500}
              disabled={readOnly}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notes.add")}
              className="mt-2 min-h-20"
            />
            <Button
              size="sm"
              className="mt-2"
              onClick={submitNote}
              disabled={readOnly || !note.trim()}
            >
              {t("common.add")}
            </Button>
          </div>

          <Separator />

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="default"
              disabled={readOnly}
              onClick={() => {
                setStatus(booking.id, "gereserveerd");
                toast.success(`${t("booking.confirmSent")} ${booking.client_email}`);
              }}
            >
              <CheckCircle2 className="size-4" /> {t("action.confirm")}
            </Button>
            <Button
              variant="secondary"
              disabled={readOnly}
              onClick={() => {
                setStatus(booking.id, "offerte_verzonden");
                toast.success(t("booking.quoteSent"));
              }}
            >
              <Send className="size-4" /> {t("action.quote")}
            </Button>
            <Button
              variant="outline"
              disabled={readOnly}
              onClick={() => {
                setStatus(booking.id, "geannuleerd");
                toast(t("booking.rejected"));
              }}
            >
              <XCircle className="size-4" /> {t("action.reject")}
            </Button>
            <Button
              variant="ghost"
              disabled={readOnly}
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" /> {t("common.delete")}
            </Button>
          </div>

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("booking.delete")}</AlertDialogTitle>
                <AlertDialogDescription>{t("booking.deleteConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    removeBooking(booking.id);
                    setConfirmDelete(false);
                    onOpenChange(false);
                    toast(t("booking.deleted"));
                  }}
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Icon className="size-3.5 shrink-0" /> {label}
      </p>
      <div className="mt-0.5 text-sm font-medium break-words">{children}</div>
    </div>
  );
}
