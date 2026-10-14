import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Inbox, Mail, Phone, Search, Users } from "lucide-react";

import { usePortal } from "@/lib/portal-store";
import { locationName } from "@/lib/portal-data";
import type { BookingStatus } from "@/lib/portal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldCard,
  FieldEmpty,
  FieldLinkAction,
  FieldMeta,
  FieldPageHeader,
  StatusPill,
} from "@/components/veld/field-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/veld/aanvragen")({
  head: () => ({
    meta: [
      { title: "Aanvragen — Maximilien veld-app" },
      { name: "description", content: "Openstaande aanvragen en boekingen van de stadsboerderij." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Aanvragen — Maximilien veld-app" },
      { property: "og:description", content: "Openstaande aanvragen en boekingen van de stadsboerderij." },
    ],
  }),
  component: FieldRequests,
});

const FILTERS: { value: "open" | BookingStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "nieuw", label: "Nieuw" },
  { value: "gereserveerd", label: "Bevestigd" },
  { value: "afgerond", label: "Afgerond" },
];

const OPEN_STATUSES: BookingStatus[] = ["nieuw", "in_behandeling", "offerte_verzonden", "gereserveerd"];

function FieldRequests() {
  const { bookings, setStatus } = usePortal();
  const [filter, setFilter] = useState<"open" | BookingStatus>("open");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => b.type !== "geblokkeerd")
      .filter((b) => (filter === "open" ? OPEN_STATUSES.includes(b.status) : b.status === filter))
      .filter(
        (b) =>
          !q ||
          b.client_name.toLowerCase().includes(q) ||
          (b.client_org ?? "").toLowerCase().includes(q) ||
          b.client_email.toLowerCase().includes(q),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [bookings, filter, query]);

  return (
    <div className="space-y-4">
      <FieldPageHeader
        eyebrow="Postvak"
        title="Aanvragen"
        subtitle={`${list.length} in deze lijst`}
      />

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op naam of e-mail"
          className="h-12 rounded-xl pl-10 text-base"
          inputMode="search"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-[14px] font-semibold transition-colors",
              filter === value
                ? "border-primary bg-primary text-primary-foreground shadow-[0_6px_16px_-10px_rgba(200,109,81,0.9)]"
                : "border-border/70 bg-card text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <FieldEmpty
          icon={<Inbox className="h-6 w-6" aria-hidden />}
          title="Geen aanvragen in deze lijst"
          hint="Kies een andere filter of wis je zoekterm."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => (
            <li key={b.id}>
              <FieldCard>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[17px] font-semibold leading-snug">
                    {b.client_org || b.client_name}
                  </p>
                  <StatusPill tone={b.status === "gereserveerd" ? "done" : "neutral"}>
                    {b.status.replace(/_/g, " ")}
                  </StatusPill>
                </div>
                <FieldMeta>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    {b.date} · {b.start_time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {b.guests_count}
                  </span>
                  <span>{locationName(b.location_id)}</span>
                </FieldMeta>

                <div className="mt-3 flex gap-2">
                  {b.client_phone && (
                    <FieldLinkAction
                      href={`tel:${b.client_phone}`}
                      icon={<Phone className="h-4 w-4" aria-hidden />}
                      className="flex-1"
                    >
                      Bellen
                    </FieldLinkAction>
                  )}
                  <FieldLinkAction
                    href={`mailto:${b.client_email}`}
                    icon={<Mail className="h-4 w-4" aria-hidden />}
                    className="flex-1"
                  >
                    Mailen
                  </FieldLinkAction>
                </div>

                {OPEN_STATUSES.includes(b.status) && b.status !== "gereserveerd" && (
                  <Button
                    type="button"
                    className="mt-2 h-12 w-full rounded-xl text-[15px]"
                    onClick={() => setStatus(b.id, "gereserveerd")}
                  >
                    Bevestigen
                  </Button>
                )}
              </FieldCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
