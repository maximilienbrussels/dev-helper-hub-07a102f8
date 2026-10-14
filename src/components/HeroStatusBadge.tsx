/**
 * Slimme statusbadge in de hero: openingsstatus, weer en het volledige
 * weekrooster in een pop-up. Alle teksten in drie talen en zonder afkappen.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { computeOpenStatus, fallbackPublicHours, type HoursDTO } from "@/lib/data.functions";
import { useT, type Lang } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OpeningStatus } from "@/lib/opening-status";

type WeatherDTO = { temperature: number; rainChance: number | null; icon: string };

const COPY: Record<
  Lang,
  {
    openNow: string;
    closed: string;
    openUntil: (time: string) => string;
    opensTomorrow: (time: string) => string;
    opensOnDay: (day: string, time: string) => string;
    opensLaterToday: (time: string) => string;
    noTime: string;
    rain: string;
    week: string;
    weekShort: string;
    weekTitle: string;
    weekIntro: string;
    closedDay: string;
    today: string;
    holidayNote: string;
  }
> = {
  nl: {
    openNow: "NU OPEN",
    closed: "GESLOTEN",
    openUntil: (t) => `Vandaag open tot ${t}`,
    opensTomorrow: (t) => `Opent morgen om ${t}`,
    opensOnDay: (d, t) => `Opent ${d} om ${t}`,
    opensLaterToday: (t) => `Opent vandaag om ${t}`,
    noTime: "Openingsuren op aanvraag",
    rain: "neerslag",
    week: "Bekijk weekrooster",
    weekShort: "Weekrooster",
    weekTitle: "Weekrooster",
    weekIntro: "Openingsuren van maandag tot en met zondag (Europe/Brussels).",
    closedDay: "Gesloten",
    today: "vandaag",
    holidayNote:
      "Op wettelijke feestdagen is de boerderij gesloten. Bijzondere sluitingen en evenementen kondigen we aan op de website.",
  },
  fr: {
    openNow: "OUVERT",
    closed: "FERMÉ",
    openUntil: (t) => `Aujourd'hui ouvert jusqu'à ${t}`,
    opensTomorrow: (t) => `Ouvre demain à ${t}`,
    opensOnDay: (d, t) => `Ouvre ${d} à ${t}`,
    opensLaterToday: (t) => `Ouvre aujourd'hui à ${t}`,
    noTime: "Horaires sur demande",
    rain: "précipitations",
    week: "Voir l'horaire de la semaine",
    weekShort: "Horaire",
    weekTitle: "Horaire de la semaine",
    weekIntro: "Horaires du lundi au dimanche (Europe/Bruxelles).",
    closedDay: "Fermé",
    today: "aujourd'hui",
    holidayNote:
      "La ferme est fermée les jours fériés. Les fermetures exceptionnelles et les événements sont annoncés sur le site.",
  },
  en: {
    openNow: "OPEN NOW",
    closed: "CLOSED",
    openUntil: (t) => `Open today until ${t}`,
    opensTomorrow: (t) => `Opens tomorrow at ${t}`,
    opensOnDay: (d, t) => `Opens ${d} at ${t}`,
    opensLaterToday: (t) => `Opens today at ${t}`,
    noTime: "Opening hours on request",
    rain: "precipitation",
    week: "View weekly schedule",
    weekShort: "Schedule",
    weekTitle: "Weekly schedule",
    weekIntro: "Opening hours from Monday to Sunday (Europe/Brussels).",
    closedDay: "Closed",
    today: "today",
    holidayNote:
      "The farm is closed on public holidays. Special closures and events are announced on the website.",
  },
};

const LOCALES: Record<Lang, string> = { nl: "nl-BE", fr: "fr-BE", en: "en-GB" };

function hhmm(value: string) {
  return value.slice(0, 5);
}

/** Openingsuren per weekdag (maandag → zondag), samengevoegd per dag. */
function weekRows(hours: HoursDTO[], locale: string) {
  const rows = hours.filter((h) => h.audience_type === "public" && h.open_time && h.close_time);
  const source = rows.length > 0 ? rows : fallbackPublicHours();
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dow) => {
    const blocks = source
      .filter((h) => h.day_of_week === dow)
      .sort((a, b) => a.open_time.localeCompare(b.open_time))
      .map((h) => `${hhmm(h.open_time)} – ${hhmm(h.close_time)}`);
    // 2024-01-01 was een maandag: geeft ons de dagnaam in de juiste taal.
    const day = new Date(Date.UTC(2024, 0, 1 + ((dow + 6) % 7)));
    const name = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(day);
    return { dow, name: name.charAt(0).toUpperCase() + name.slice(1), blocks };
  });
}

export function HeroStatusBadge({ hours }: { hours: HoursDTO[] }) {
  const { lang } = useT();
  const c = COPY[lang];
  const locale = LOCALES[lang];
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const status = useMemo(() => (now ? computeOpenStatus(hours ?? [], now) : null), [hours, now]);
  const rows = useMemo(() => weekRows(hours ?? [], locale), [hours, locale]);
  const todayDow = now
    ? ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Brussels",
          weekday: "short",
        }).format(now)
      ] ?? -1)
    : -1;

  const { data: weather } = useQuery({
    queryKey: ["weather"],
    queryFn: async (): Promise<WeatherDTO | null> => {
      const res = await fetch("/api/weather");
      return res.ok ? ((await res.json()) as WeatherDTO) : null;
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });

  const { data: live } = useQuery({
    queryKey: ["opening-status", lang],
    queryFn: async (): Promise<OpeningStatus | null> => {
      const res = await fetch(`/api/public/opening-status?lang=${lang}`);
      return res.ok ? ((await res.json()) as OpeningStatus) : null;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const isOpen = status?.open === true;

  // Volledige, nooit afgekapte ondertekst.
  const subtext = (() => {
    if (!status) return c.noTime;
    if (status.open) {
      const closeTime = status.todayLabel?.split("–").pop()?.trim();
      return closeTime ? c.openUntil(closeTime) : c.openNow;
    }
    const laterToday = status.vars?.["time"];
    if (status.statusKey === "status.openingSoon" || status.statusKey === "status.closed") {
      if (laterToday) return c.opensLaterToday(String(laterToday));
    }
    if (status.nextOpenTime && status.nextOpenInDays != null) {
      if (status.nextOpenInDays === 1) return c.opensTomorrow(status.nextOpenTime);
      const d = new Date();
      d.setDate(d.getDate() + status.nextOpenInDays);
      const day = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: "Europe/Brussels",
      }).format(d);
      return c.opensOnDay(day, status.nextOpenTime);
    }
    return c.noTime;
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={c.week}
        className="flex w-full max-w-full min-w-0 flex-col gap-1 rounded-2xl border border-white/20 bg-black/70 px-4 py-3 text-left shadow-lg backdrop-blur-md transition-colors hover:bg-black/80 sm:w-auto sm:min-w-[240px] sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={
              "size-2.5 shrink-0 rounded-full " +
              (isOpen ? "animate-pulse bg-emerald-400" : "animate-pulse bg-red-400")
            }
          />
          <span className="shrink-0 text-sm font-extrabold uppercase tracking-wide text-white">
            {isOpen ? c.openNow : c.closed}
          </span>
          <span className="ml-auto min-w-0 truncate text-right text-xs font-semibold text-white/90 sm:text-sm">
            {subtext}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-x-3 gap-y-1 text-xs text-white/90">
          {weather && (
            <span className="inline-flex min-w-0 shrink items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden>{weather.icon}</span>
              <span className="font-medium">{weather.temperature}°C</span>
              {weather.rainChance != null && (
                <>
                  <span aria-hidden>·</span>
                  <span aria-hidden>💧</span>
                  <span className="truncate">
                    {weather.rainChance}% {c.rain}
                  </span>
                </>
              )}
            </span>
          )}
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold text-white/90">
            <span aria-hidden>📅</span>
            <span className="sm:hidden">{c.weekShort}</span>
            <span className="hidden sm:inline">{c.week}</span>
            <span aria-hidden>→</span>
          </span>
        </div>
      </button>


      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{c.weekTitle}</DialogTitle>
            <DialogDescription>{c.weekIntro}</DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.dow}
                className={
                  "flex items-center justify-between gap-4 py-2 text-sm " +
                  (row.dow === todayDow ? "font-semibold text-foreground" : "text-foreground/90")
                }
              >
                <span className="whitespace-nowrap">
                  {row.name}
                  {row.dow === todayDow && (
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-[color:var(--color-terracotta)]">
                      {c.today}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap text-right">
                  {row.blocks.length > 0 ? row.blocks.join(" · ") : c.closedDay}
                </span>
              </li>
            ))}
          </ul>
          {live?.specialNotice && (
            <p className="rounded-xl bg-[color:var(--surface-page)]/70 p-3 text-xs text-foreground/90">
              {live.specialNotice}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{c.holidayNote}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
