import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Clock, MapPin, Phone, Users } from "lucide-react";

import { usePortal } from "@/lib/portal-store";
import { locationName, shift } from "@/lib/portal-data";
import { Button } from "@/components/ui/button";
import {
  FieldCard,
  FieldEmpty,
  FieldLinkAction,
  FieldMeta,
  FieldPageHeader,
  FieldSkeletonList,
  FieldSummary,
  StatusPill,
} from "@/components/veld/field-ui";

export const Route = createFileRoute("/veld/")({
  head: () => ({
    meta: [
      { title: "Vandaag — Maximilien veld-app" },
      { name: "description", content: "De dagplanning van de stadsboerderij voor het team op het terrein." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Vandaag — Maximilien veld-app" },
      { property: "og:description", content: "De dagplanning van de stadsboerderij voor het team op het terrein." },
    ],
  }),
  component: FieldToday,
});

function FieldToday() {
  const { bookings, toggleCheckIn, loading } = usePortal();
  const today = shift(0);

  const day = bookings
    .filter((b) => b.date === today && b.status !== "geannuleerd")
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const groups = day.filter((b) => b.type !== "geblokkeerd");
  const visitors = groups.reduce((sum, b) => sum + b.guests_count, 0);
  const arrivedCount = groups.filter((b) => b.day_status === "aangekomen").length;

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      <FieldPageHeader eyebrow="Dagplanning" title="Vandaag" subtitle={dateLabel} />

      <FieldSummary
        items={[
          { label: "Groepen", value: groups.length },
          { label: "Bezoekers", value: visitors },
        ]}
      />

      {groups.length > 0 && (
        <p className="text-[13px] font-medium text-muted-foreground">
          {arrivedCount} van {groups.length} groepen aangemeld
        </p>
      )}

      {loading && day.length === 0 ? (
        <FieldSkeletonList />
      ) : day.length === 0 ? (
        <FieldEmpty
          icon={<CalendarDays className="h-6 w-6" aria-hidden />}
          title="Geen activiteiten vandaag"
          hint="Zodra er een groep geboekt is, verschijnt die hier."
        />
      ) : (
        <ul className="space-y-3">
          {day.map((b) => {
            const arrived = b.day_status === "aangekomen";
            return (
              <li key={b.id}>
                <FieldCard accent={arrived}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-baseline gap-1.5 text-[17px] font-bold tabular-nums">
                      <Clock className="h-4 w-4 self-center text-primary" aria-hidden />
                      {b.start_time}–{b.end_time}
                    </span>
                    <StatusPill tone={arrived ? "active" : "neutral"}>
                      {arrived ? "Aangekomen" : b.status.replace(/_/g, " ")}
                    </StatusPill>
                  </div>

                  <p className="mt-2 text-[17px] font-semibold leading-snug">
                    {b.client_org || b.client_name}
                  </p>
                  <FieldMeta>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {locationName(b.location_id)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {b.guests_count}
                    </span>
                  </FieldMeta>

                  {b.type !== "geblokkeerd" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant={arrived ? "secondary" : "default"}
                        className="h-12 flex-1 rounded-xl text-[15px]"
                        onClick={() => toggleCheckIn(b.id)}
                      >
                        <Check className="mr-2 h-5 w-5" aria-hidden />
                        {arrived ? "Aangekomen" : "Aanmelden"}
                      </Button>
                      {b.client_phone && (
                        <FieldLinkAction
                          href={`tel:${b.client_phone}`}
                          icon={<Phone className="h-4 w-4" aria-hidden />}
                          className="w-14 shrink-0 px-0"
                        >
                          <span className="sr-only">Bel {b.client_phone}</span>
                        </FieldLinkAction>
                      )}
                    </div>
                  )}
                </FieldCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
