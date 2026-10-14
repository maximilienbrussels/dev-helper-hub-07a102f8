import { useMemo, useState, useEffect } from "react";
import { Check, CalendarDays, Clock } from "lucide-react";

export type PickupDay = { key: string; label: string; date: Date };

const TIMES = ["14:00 - 15:00", "16:00 - 17:00"] as const;

function buildDays(locale: string, count = 7): PickupDay[] {
  const now = new Date();
  const days: PickupDay[] = [];
  for (let d = 1; d <= count; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    days.push({
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString(locale, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
      date: day,
    });
  }
  return days;
}

/**
 * Custom afhaalmoment-kiezer: twee duidelijke stappen (dag + tijdslot) met
 * afgeronde kaarten in de huisstijl — geen native <select> die uit het
 * winkelmand-paneel breekt.
 */
export function PickupSlotPicker({
  value,
  onChange,
  onIsoChange,
  locale,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  onIsoChange?: (iso: string | null) => void;
  locale: string;
  labels: { title: string; day: string; time: string; placeholder: string };
}) {
  const days = useMemo(() => buildDays(locale), [locale]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  // Reset de selectie wanneer de waarde extern gewist wordt (nieuwe bestelling).
  useEffect(() => {
    if (value === "") {
      setDayKey(null);
      setTime(null);
    }
  }, [value]);

  const commit = (nextDay: string | null, nextTime: string | null) => {
    const day = days.find((d) => d.key === nextDay);
    onChange(day && nextTime ? `${day.label} — ${nextTime}` : "");
    if (day && nextTime) {
      const [hh, mm] = nextTime
        .split(" - ")[0]
        .split(":")
        .map((n) => parseInt(n, 10));
      const dt = new Date(day.date);
      dt.setHours(hh, mm, 0, 0);
      onIsoChange?.(dt.toISOString());
    } else {
      onIsoChange?.(null);
    }
  };

  const pill =
    "min-h-[48px] rounded-2xl border px-4 py-2 text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{labels.title}</p>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/90">
          <CalendarDays className="h-3.5 w-3.5" /> {labels.day}
        </p>
        <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d) => {
            const active = d.key === dayKey;
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDayKey(d.key);
                  commit(d.key, time);
                }}
                className={
                  pill +
                  " shrink-0 snap-start capitalize " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-[color:var(--surface-page)] hover:border-primary hover:bg-primary/5")
                }
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/90">
          <Clock className="h-3.5 w-3.5" /> {labels.time}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIMES.map((tSlot) => {
            const active = tSlot === time;
            return (
              <button
                key={tSlot}
                type="button"
                aria-pressed={active}
                disabled={!dayKey}
                onClick={() => {
                  setTime(tSlot);
                  commit(dayKey, tSlot);
                }}
                className={
                  pill +
                  " flex items-center justify-center gap-2 font-mono " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-[color:var(--surface-page)] hover:border-primary hover:bg-primary/5") +
                  (!dayKey
                    ? " cursor-not-allowed opacity-40 hover:border-border hover:bg-[color:var(--surface-page)]"
                    : "")
                }
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {tSlot}
              </button>
            );
          })}
        </div>
      </div>

      <p
        aria-live="polite"
        className={
          "rounded-2xl border px-4 py-3 text-sm " +
          (value
            ? "border-primary/40 bg-primary/5 text-foreground"
            : "border-dashed border-border bg-[color:var(--surface-page)] text-muted-foreground")
        }
      >
        {value || labels.placeholder}
      </p>
    </div>
  );
}
