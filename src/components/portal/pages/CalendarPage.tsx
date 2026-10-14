import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Plus, Printer, TriangleAlert } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { LOCATIONS, locationName } from "@/lib/portal-data";
import type { Booking, LocationId } from "@/lib/portal-types";
import { localeFor } from "@/lib/i18n";
import { usePermissions } from "@/lib/use-permissions";
import { LOCATION_DOT, LocationBadge, PageHeader, euro } from "@/components/portal/portal-ui";
import { BookingDetail } from "@/components/portal/BookingDetail";
import { useCalendarAdmin } from "@/components/portal/calendar/useCalendarAdmin";
import {
  CATEGORY_LEGEND,
  FarmCalendarBoard,
  type BoardView,
} from "@/components/portal/calendar/FarmCalendarBoard";
import { CalendarSyncModal } from "@/components/portal/calendar/CalendarSyncModal";
import { EditBookingDialog } from "@/components/portal/calendar/EditBookingDialog";
import { EditBlockDialog } from "@/components/portal/calendar/EditBlockDialog";
import { AssignmentsSection } from "@/components/portal/calendar/AssignmentsSection";
import { OpeningHoursTab } from "@/components/portal/calendar/OpeningHoursTab";
import { EventsTab } from "@/components/portal/calendar/EventsTab";
import { AvailabilityTab } from "@/components/portal/calendar/AvailabilityTab";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { conflictMessage, findConflicts, type ConflictItem } from "@/lib/calendar-conflicts";

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function CalendarPage() {
  const { t, lang, bookings, blockSlot, addBooking, staff, currentUser } = usePortal();
  const admin = useCalendarAdmin();
  const locale = localeFor(lang);
  const now = new Date();
  const [filter, setFilter] = useState<LocationId | "all">("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>(
    key(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const [detail, setDetail] = useState<Booking | null>(null);
  const [view, setView] = useState<BoardView>("dayGridMonth");
  // Categoriepillen werken als filters; standaard staat alles aan.
  const [activeCategories, setActiveCategories] = useState<Booking["type"][]>(
    CATEGORY_LEGEND.map((c) => c.key),
  );
  // Klik op een leeg dag- of uurvak opent meteen het toevoegformulier.
  const [quickSlot, setQuickSlot] = useState<{
    date: string;
    start_time?: string;
    end_time?: string;
  } | null>(null);
  const { can } = usePermissions();
  // Slepen en herschalen enkel voor wie de agenda mag beheren.
  const canManage = can("manage_calendar");


  const assignments = admin.data?.assignments ?? [];
  const events = admin.data?.events ?? [];

  // Alles wat een ruimte bezet houdt: reservaties, blokkades en eigen
  // evenementen. Gebruikt voor de zachte conflictwaarschuwing.
  const occupied: ConflictItem[] = useMemo(
    () => [
      ...bookings
        .filter((b) => b.status !== "geannuleerd")
        .map((b) => ({
          id: b.id,
          date: b.date,
          start_time: b.start_time,
          end_time: b.end_time,
          location_id: b.location_id,
          label: b.type === "geblokkeerd" ? t("calendar.blockSlot") : b.client_name,
        })),
      ...events.map((e) => ({
        id: e.id,
        date: e.date,
        start_time: e.startTime,
        end_time: e.endTime,
        location_id: e.locationId,
        label: e.titleNl,
      })),
    ],
    [bookings, events, t],
  );
  const assignmentsFor = (bookingId: string) =>
    assignments.filter((a) => a.bookingId === bookingId);

  const visible = useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== "all" && b.location_id !== filter) return false;
      if (!activeCategories.includes(b.type)) return false;
      if (staffFilter !== "all") {
        const mine = assignments.some(
          (a) => a.bookingId === b.id && a.profileId === staffFilter,
        );
        if (!mine) return false;
      }
      return true;
    });
  }, [bookings, filter, staffFilter, assignments, activeCategories]);

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of visible) {
      if (b.status === "geannuleerd") continue;
      map.set(b.date, [...(map.get(b.date) ?? []), b]);
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [visible]);

  const monthLabel = new Date(selectedDay + "T12:00:00").toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const dayList = byDate.get(selectedDay) ?? [];


  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.calendar")}
        subtitle={monthLabel}
        action={
          <div className="flex flex-wrap gap-2">
            <CalendarSyncModal />
            <BlockSlotDialog defaultDate={selectedDay} onBlock={blockSlot} occupied={occupied} />
            <ManualBookingDialog
              defaultDate={selectedDay}
              onAdd={addBooking}
              occupied={occupied}
              prefill={quickSlot}
              open={quickSlot !== null ? true : undefined}
              onOpenChange={(o) => {
                if (!o) setQuickSlot(null);
              }}
            />
          </div>

        }
      />

      <Tabs defaultValue="agenda">
        <TabsList>
          <TabsTrigger value="agenda">{t("calendar.tab.agenda")}</TabsTrigger>
          <TabsTrigger value="hours">{t("calendar.tab.hours")}</TabsTrigger>
          <TabsTrigger value="events">{t("calendar.tab.events")}</TabsTrigger>
          <TabsTrigger value="availability">Beschikbaarheid</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as LocationId | "all")}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("calendar.filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("calendar.all")}</SelectItem>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("calendar.filterStaff")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("calendar.allStaff")}</SelectItem>
                {currentUser.id ? (
                  <SelectItem value={currentUser.id}>{t("calendar.myDaysOnly")}</SelectItem>
                ) : null}
                {staff
                  .filter((s) => s.active && s.id !== currentUser.id)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2" data-print-hide>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                title="Agenda afdrukken"
              >
                <Printer className="size-4" />
                <span className="hidden sm:inline">Afdrukken</span>
              </Button>
              <Tabs value={view} onValueChange={(v) => setView(v as BoardView)}>
                <TabsList>
                  <TabsTrigger value="zones">Zones</TabsTrigger>
                  <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
                  <TabsTrigger value="dayGridMonth">Maand</TabsTrigger>
                  <TabsTrigger value="listWeek">Lijst</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

          </div>

          <div
            className="flex flex-wrap gap-2 rounded-lg border border-border bg-card px-3 py-2"
            data-print-hide
          >
            {CATEGORY_LEGEND.map((c) => {
              const on = activeCategories.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setActiveCategories((prev) =>
                      prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key],
                    )
                  }
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-transparent text-white"
                      : "border-border bg-transparent text-muted-foreground opacity-60 hover:opacity-90",
                  )}
                  style={on ? { backgroundColor: c.color } : undefined}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: on ? "#ffffff" : c.color }}
                    aria-hidden
                  />
                  {c.label}
                </button>
              );
            })}
          </div>

          <FarmCalendarBoard
            view={view}
            bookings={visible}
            events={events}
            openingHours={admin.data?.openingHours ?? []}
            exceptions={admin.data?.openingExceptions ?? []}
            lang={lang}
            editable={canManage}
            focusDate={selectedDay}
            visibleCategories={activeCategories}
            onDateClick={(date, times) => {
              setSelectedDay(date);
              if (canManage)
                setQuickSlot({ date, start_time: times?.start, end_time: times?.end });
            }}
            onEventClick={(id) => {
              const found = bookings.find((b) => b.id === id);
              if (found) setDetail(found);
            }}
            onMove={(input) => {
              const found = bookings.find((b) => b.id === input.id);
              if (!found) return;
              if (found.type === "geblokkeerd") admin.updateBlock({ ...input });
              else admin.updateBooking({ ...input });
              toast.success(t("calendar.today"));
            }}
          />


          <section>
            <h2 className="mb-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            {dayList.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t("calendar.noBookingsToday")}
              </p>
            ) : (
              <ul className="space-y-2">
                {dayList.map((b) => (
                  <li key={b.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3">
                      <button
                        onClick={() => setDetail(b)}
                        className="min-w-0 text-left hover:underline"
                      >
                        <span className="block text-[11px] font-bold text-muted-foreground tabular-nums sm:hidden">
                          {b.start_time}–{b.end_time}
                        </span>
                        <span className="block truncate text-sm font-semibold">
                          <span className="hidden sm:inline">
                            {b.start_time}–{b.end_time} ·{" "}
                          </span>
                          {b.type === "geblokkeerd" ? t("calendar.blocked") : b.client_name}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1.5">
                          <LocationBadge
                            locationId={b.location_id}
                            label={locationName(b.location_id)}
                          />
                        </span>
                      </button>
                      <span className="shrink-0 text-sm font-bold tabular-nums sm:text-right">
                        {euro(b.price)}
                      </span>
                      <span className="shrink-0">
                        {b.type === "geblokkeerd" ? (
                          <EditBlockDialog
                            block={b}
                            onSave={admin.updateBlock}
                            onDelete={admin.deleteBlock}
                          />
                        ) : (
                          <EditBookingDialog booking={b} onSave={admin.updateBooking} />
                        )}
                      </span>
                    </div>
                    {b.type === "geblokkeerd" ? null : (
                      <div className="mt-3 border-t border-border pt-3">
                        <AssignmentsSection
                          bookingId={b.id}
                          assignments={assignmentsFor(b.id)}
                          onAssign={admin.assignStaff}
                          onRemove={admin.removeAssignment}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="hours">
          <OpeningHoursTab
            hours={admin.data?.openingHours ?? []}
            exceptions={admin.data?.openingExceptions ?? []}
            onSaveHour={admin.saveOpeningHour}
            onSaveException={admin.saveException}
            onDeleteException={admin.deleteException}
          />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab
            events={admin.data?.events ?? []}
            onSave={admin.saveEvent}
            onDelete={admin.deleteEvent}
          />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityTab />
        </TabsContent>
      </Tabs>

      <BookingDetail booking={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </div>
  );
}

function BlockSlotDialog({
  defaultDate,
  onBlock,
  occupied,
}: {
  defaultDate: string;
  occupied: ConflictItem[];
  onBlock: (i: {
    date: string;
    start_time: string;
    end_time: string;
    location_id: LocationId;
    reason: string;
  }) => void;
}) {
  const { t } = usePortal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: defaultDate,
    start_time: "08:00",
    end_time: "18:00",
    location_id: "chalet" as LocationId,
    reason: "",
  });

  const warning = conflictMessage(
    locationName(form.location_id),
    findConflicts(form, occupied),
    t("calendar.conflictPrefix"),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm((f) => ({ ...f, date: defaultDate }));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Ban className="size-4" />
          <span className="hidden sm:inline">{t("calendar.blockSlot")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("calendar.blockSlot")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="blk-date">{t("common.date")}</Label>
            <Input
              id="blk-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="blk-start">{t("common.from")}</Label>
              <Input
                id="blk-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="blk-end">{t("common.to")}</Label>
              <Input
                id="blk-end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{t("common.room")}</Label>
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
            <Label htmlFor="blk-reason">{t("calendar.reason")}</Label>
            <Input
              id="blk-reason"
              maxLength={120}
              value={form.reason}
              placeholder={t("calendar.reasonPlaceholder")}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          {warning ? <ConflictWarning message={warning} /> : null}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!form.date || form.end_time <= form.start_time) {
                toast.error(t("calendar.checkFields"));
                return;
              }
              onBlock({ ...form, reason: form.reason.trim().slice(0, 120) });
              setOpen(false);
              toast.success(t("calendar.blockedToast"));
            }}
          >
            {t("calendar.blockSlot")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualBookingDialog({
  defaultDate,
  onAdd,
  occupied,
  prefill,
  open: openProp,
  onOpenChange,
}: {
  defaultDate: string;
  occupied: ConflictItem[];
  /** Vooraf gekozen dag en uur na een klik op een leeg agendavak. */
  prefill?: { date: string; start_time?: string; end_time?: string } | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd: (b: {
    type: "teambuilding" | "privatisering" | "zaalverhuur";
    status: "gereserveerd";
    client_name: string;
    client_email: string;
    client_phone: string;
    date: string;
    start_time: string;
    end_time: string;
    location_id: LocationId;
    guests_count: number;
    price: number;
    options: string[];
  }) => void;
}) {
  const { t } = usePortal();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    date: defaultDate,
    start_time: "10:00",
    end_time: "16:00",
    location_id: "chalet" as LocationId,
    guests_count: 10,
    price: 150,
    type: "zaalverhuur" as "teambuilding" | "privatisering" | "zaalverhuur",
  });

  // Bij een klik op een leeg agendavak schuiven dag en uur meteen in het formulier.
  useEffect(() => {
    if (!prefill) return;
    setForm((f) => ({
      ...f,
      date: prefill.date,
      start_time: prefill.start_time ?? f.start_time,
      end_time: prefill.end_time ?? f.end_time,
    }));
  }, [prefill?.date, prefill?.start_time, prefill?.end_time]);

  const warning = conflictMessage(
    locationName(form.location_id),
    findConflicts(form, occupied),
    t("calendar.conflictPrefix"),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o)
          setForm((f) => ({
            ...f,
            date: prefill?.date ?? defaultDate,
            start_time: prefill?.start_time ?? f.start_time,
            end_time: prefill?.end_time ?? f.end_time,
          }));
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("calendar.manualBooking")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("calendar.manualBooking")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mb-name">{t("calendar.clientName")}</Label>
            <Input
              id="mb-name"
              maxLength={100}
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mb-mail">{t("common.email")}</Label>
              <Input
                id="mb-mail"
                type="email"
                maxLength={255}
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mb-tel">{t("common.phone")}</Label>
              <Input
                id="mb-tel"
                maxLength={30}
                value={form.client_phone}
                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="mb-date">{t("common.date")}</Label>
            <Input
              id="mb-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mb-start">{t("common.from")}</Label>
              <Input
                id="mb-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mb-end">{t("common.to")}</Label>
              <Input
                id="mb-end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("common.room")}</Label>
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
              <Label>{t("calendar.type")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zaalverhuur">{t("calendar.type.zaalverhuur")}</SelectItem>
                  <SelectItem value="teambuilding">{t("calendar.type.teambuilding")}</SelectItem>
                  <SelectItem value="privatisering">{t("calendar.type.privatisering")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mb-guests">{t("common.guests")}</Label>
              <Input
                id="mb-guests"
                type="number"
                min={0}
                max={500}
                value={form.guests_count}
                onChange={(e) => setForm({ ...form, guests_count: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="mb-price">{t("common.price")}</Label>
              <Input
                id="mb-price"
                type="number"
                min={0}
                max={100000}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          </div>
          {warning ? <ConflictWarning message={warning} /> : null}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!form.client_name.trim() || !form.date || form.end_time <= form.start_time) {
                toast.error(t("calendar.checkNameFields"));
                return;
              }
              onAdd({
                ...form,
                client_name: form.client_name.trim().slice(0, 100),
                client_email: form.client_email.trim().slice(0, 255),
                client_phone: form.client_phone.trim().slice(0, 30),
                guests_count: Math.max(0, Math.min(500, form.guests_count)),
                price: Math.max(0, Math.min(100000, form.price)),
                status: "gereserveerd",
                options: [],
              });
              setOpen(false);
              toast.success(t("calendar.bookingAdded"));
            }}
          >
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Zachte waarschuwing bij een dubbele boeking in dezelfde ruimte. */
function ConflictWarning({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 p-2.5 text-xs font-medium text-primary">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
