/**
 * Interactieve boekingskalender met tijdsloten.
 *
 * - `mode="slots"`: dagen met vrije slots zijn klikbaar, daarna een slotenrooster.
 * - `mode="week"`: enkel maandagen (startdag van een vakantiestage van 5 dagen).
 * Volgeboekte of geblokkeerde dagen zijn uitgegrijsd en niet klikbaar.
 */
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { fetchAvailability } from "@/lib/availability.functions";
import {
  isoDate,
  parseIsoDate,
  type BookingMode,
  type FormulaType,
  type PublicSlot,
} from "@/lib/availability";

export type SelectedSlot = { date: string; startTime: string; endTime: string; slotId: string };

type Props = {
  formula: FormulaType;
  mode: Exclude<BookingMode, "none">;
  value: SelectedSlot | null;
  onChange: (value: SelectedSlot | null) => void;
};

const HORIZON_MONTHS = 4;

export function BookingCalendar({ formula, mode, value, onChange }: Props) {
  const load = useServerFn(fetchAvailability);
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const horizon = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + HORIZON_MONTHS);
    return d;
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void load({ data: { formula, from: isoDate(today), to: isoDate(horizon) } })
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots);
        setBlocked(res.blockedDates);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formula, load, today, horizon]);

  // Reset de keuze wanneer de formule verandert.
  useEffect(() => {
    onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formula]);

  const byDate = useMemo(() => {
    const map = new Map<string, PublicSlot[]>();
    for (const s of slots) {
      if (mode === "week" && parseIsoDate(s.date).getDay() !== 1) continue;
      map.set(s.date, [...(map.get(s.date) ?? []), s]);
    }
    return map;
  }, [slots, mode]);

  const availableDates = useMemo(
    () => [...byDate.keys()].map((d) => parseIsoDate(d)),
    [byDate],
  );

  const selectedDate = value ? parseIsoDate(value.date) : undefined;
  const [openDay, setOpenDay] = useState<string | null>(value?.date ?? null);
  const daySlots = openDay ? (byDate.get(openDay) ?? []) : [];

  function pickDay(day: Date | undefined) {
    if (!day) return;
    const iso = isoDate(day);
    setOpenDay(iso);
    const list = byDate.get(iso) ?? [];
    // Eén slot? Dan meteen selecteren.
    if (list.length === 1 && list[0]) {
      const s = list[0];
      onChange({ date: iso, startTime: s.startTime, endTime: s.endTime, slotId: s.id });
    } else {
      onChange(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-2 sm:p-3">
        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Beschikbaarheid wordt geladen…
          </div>
        ) : (
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selectedDate}
            onSelect={pickDay}
            weekStartsOn={1}
            startMonth={today}
            endMonth={horizon}
            disabled={(day) => {
              const iso = isoDate(day);
              if (day < today) return true;
              if (blocked.includes(iso)) return true;
              return !byDate.has(iso);
            }}
            modifiers={{ available: availableDates }}
            modifiersClassNames={{
              available: "font-semibold text-[color:var(--color-slot-accent)]",
            }}
            className="pointer-events-auto mx-auto"
          />
        )}
        {failed ? (
          <p role="alert" className="px-3 pb-2 text-sm text-destructive">
            We konden de beschikbaarheid niet ophalen. Bel ons op +32 2 331 53 91 of probeer later
            opnieuw.
          </p>
        ) : null}
      </div>

      {mode === "week" ? (
        <p className="text-sm text-muted-foreground">
          Stages starten telkens op maandag en duren 5 dagen. Enkel beschikbare startweken zijn
          selecteerbaar.
        </p>
      ) : null}

      {openDay && daySlots.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {mode === "week" ? "Startdag" : "Kies een tijdslot"} ·{" "}
            {parseIsoDate(openDay).toLocaleDateString("nl-BE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((s) => {
              const active = value?.slotId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      date: s.date,
                      startTime: s.startTime,
                      endTime: s.endTime,
                      slotId: s.id,
                    })
                  }
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    active
                      ? "border-[color:var(--color-slot-accent)] bg-[color:var(--color-slot-accent)] text-[color:var(--color-on-slot-accent)]"
                      : "border-border/70 bg-background hover:border-[color:var(--color-slot-accent)]",
                  )}
                >
                  {s.startTime} – {s.endTime}
                  {s.remaining > 1 ? (
                    <span className="ml-2 text-xs opacity-70">{s.remaining} vrij</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && byDate.size === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Voor deze formule staan er momenteel geen data open. Neem contact op via{" "}
          <a className="underline" href="mailto:info@fermeduparcmaximilien.be">
            info@fermeduparcmaximilien.be
          </a>
          .
        </p>
      ) : null}

      <input type="hidden" name="datum" value={value?.date ?? ""} />
    </div>
  );
}
