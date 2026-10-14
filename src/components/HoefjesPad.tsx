import { useT } from "@/lib/i18n";
import { Check, Gift } from "lucide-react";

/**
 * Hoefjespad — compacte, horizontaal scrollbare tijdlijn van 12 stappen.
 * Op grotere schermen valt het terug op een strak raster zonder scroll.
 */

type Milestone = { step: number; label: string };

export function HoefjesPad({ collected, total = 12 }: { collected: number; total?: number }) {
  const { t } = useT();

  const milestones: Milestone[] = [
    { step: 3, label: t("mine.reward.coffee") },
    { step: 7, label: t("mine.reward.shop") },
    { step: 12, label: t("mine.reward.activity") },
  ];

  const steps = Array.from({ length: total }, (_, i) => i + 1);
  const pct = Math.min(100, Math.round((collected / total) * 100));

  return (
    <div>
      {/* Voortgangsbalk */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-page)]">
        <div
          className="h-full rounded-full bg-[color:var(--color-terracotta)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol
        aria-label={`Hoefjespad: ${collected} van ${total}`}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-6"
      >
        {steps.map((step) => {
          const earned = step <= collected;
          const next = step === collected + 1;
          const milestone = milestones.find((m) => m.step === step);
          return (
            <li
              key={step}
              className={
                "relative flex min-w-[104px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition sm:min-w-0 " +
                (earned
                  ? "border-[color:var(--color-terracotta)]/40 bg-[color:var(--color-terracotta)]/10"
                  : next
                    ? "border-dashed border-[color:var(--color-terracotta)]/50 bg-card"
                    : "border-border bg-card/60")
              }
            >
              <span
                className={
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-semibold " +
                  (earned
                    ? "border-transparent bg-[color:var(--color-terracotta)] text-white"
                    : "border-border bg-card text-muted-foreground")
                }
              >
                {earned ? <Check className="h-4 w-4" strokeWidth={2.25} /> : step}
              </span>
              {milestone ? (
                <span
                  className={
                    "inline-flex items-center gap-1 text-[10px] font-semibold uppercase leading-tight tracking-wide " +
                    (earned ? "text-[color:var(--color-terracotta)]" : "text-muted-foreground")
                  }
                >
                  <Gift className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  {milestone.label}
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Hoefje {step}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-1 text-[11px] text-muted-foreground sm:hidden">
        Veeg om alle stappen te zien →
      </p>
    </div>
  );
}
