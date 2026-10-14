import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, MapPin, Phone, Users, StickyNote } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { LOCATIONS, locationName, shift } from "@/lib/portal-data";
import type { Booking } from "@/lib/portal-types";
import {
  LOCATION_BAR,
  LocationBadge,
  PageHeader,
  StatusBadge,
} from "@/components/portal/portal-ui";
import { BookingDetail } from "@/components/portal/BookingDetail";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TodayPage() {
  const { t, bookings, toggleCheckIn } = usePortal();
  const [selected, setSelected] = useState<Booking | null>(null);
  const today = shift(0);

  const dayBookings = bookings
    .filter((b) => b.date === today && b.status !== "geannuleerd")
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const groups = dayBookings.filter((b) => b.type !== "geblokkeerd");
  const visitors = groups.reduce((sum, b) => sum + b.guests_count, 0);
  const zones = new Set(dayBookings.map((b) => b.location_id)).size;

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      <PageHeader title={t("nav.today")} subtitle={dateLabel} />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Stat label={t("today.groups")} value={groups.length} />
        <Stat label={t("today.visitors")} value={visitors} />
        <Stat label={t("today.zones")} value={`${zones}/${LOCATIONS.length}`} />
      </div>

      <section>
        <h2 className="mb-2.5 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          {t("today.timeline")}
        </h2>
        {dayBookings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("today.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {dayBookings.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "rounded-lg border border-l-4 border-border bg-card p-4",
                  LOCATION_BAR[b.location_id],
                )}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <button
                    onClick={() => setSelected(b)}
                    className="min-w-0 text-left"
                    aria-label={`Details ${b.client_name}`}
                  >
                    <p className="flex items-center gap-1.5 text-sm font-bold tabular-nums">
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                      {b.start_time} – {b.end_time}
                    </p>
                    <p className="mt-1 truncate text-base font-semibold">{b.client_name}</p>
                    {b.client_org ? (
                      <p className="truncate text-xs text-muted-foreground">{b.client_org}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <LocationBadge
                        locationId={b.location_id}
                        label={locationName(b.location_id)}
                      />
                      {b.type !== "geblokkeerd" ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="size-3.5" />
                            {b.guests_count}
                          </span>
                          <a
                            href={`tel:${b.client_phone.replace(/\s/g, "")}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            <Phone className="size-3.5" />
                            {b.client_phone}
                          </a>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <MapPin className="size-3.5" /> Geblokkeerd
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={b.status} />
                    {b.type !== "geblokkeerd" ? (
                      <Button
                        size="sm"
                        variant={b.day_status === "aangekomen" ? "secondary" : "default"}
                        onClick={() => {
                          toggleCheckIn(b.id);
                          toast.success(
                            b.day_status === "aangekomen"
                              ? t("today.checkinUndone")
                              : `${b.client_name}: ${t("today.groupArrived")}`,
                          );
                        }}
                      >
                        <CheckCircle2 className="size-4" />
                        <span className="hidden sm:inline">
                          {b.day_status === "aangekomen" ? t("today.arrived") : t("today.checkin")}
                        </span>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {b.internal_notes.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {b.internal_notes.map((n, i) => (
                      <li
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-md bg-warning/20 px-2 py-1 text-xs font-medium text-warning-foreground"
                      >
                        <StickyNote className="size-3.5 shrink-0" />
                        <span className="break-words">{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <BookingDetail booking={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] transition-shadow hover:shadow-[0_2px_10px_-4px_rgb(0_0_0/0.15)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
      <p className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight font-medium text-muted-foreground sm:text-xs">
        {label}
      </p>
    </div>
  );
}

