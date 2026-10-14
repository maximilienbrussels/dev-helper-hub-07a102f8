import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Ontwerpelementen van de veld-app: één set bouwstenen zodat alle schermen
 * op de telefoon dezelfde rustige, hoogwaardige uitstraling hebben.
 *
 * Uitgangspunten: grote leesbare koppen, ruime raakvlakken (minstens 48 px),
 * zachte schaduwen in plaats van harde lijnen, en de huisstijl (bosgroen +
 * terracotta) als enige kleuraccenten.
 */

/** Kop van een scherm: kleine bovenregel, grote titel, optionele bijregel. */
export function FieldPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-0.5 truncate text-[27px] font-bold leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm capitalize text-muted-foreground">{subtitle}</p>}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </header>
  );
}

/** Kaart met zachte schaduw; `accent` licht de kaart op wanneer iets actief is. */
export function FieldCard({
  accent = false,
  className,
  children,
}: {
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(31,42,28,0.04),0_8px_24px_-16px_rgba(31,42,28,0.25)]",
        accent ? "border-primary/45 bg-primary/[0.06]" : "border-border/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Donkergroen overzichtsblok met de cijfers van de dag. */
export function FieldSummary({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--surface-forest)] text-[#f5f2ea] shadow-[0_10px_30px_-18px_rgba(31,42,28,0.55)]">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-[var(--surface-forest)] px-4 py-4">
          <p className="text-[30px] font-bold leading-none tabular-nums">{value}</p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Statuslabel; `tone` bepaalt de kleur. */
export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "active" | "done";
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]",
        tone === "active" && "bg-primary text-primary-foreground",
        tone === "done" && "bg-accent/12 text-accent",
        tone === "neutral" && "bg-secondary text-secondary-foreground/80",
      )}
    >
      {children}
    </span>
  );
}

/** Rustige lege toestand in plaats van een kale regel tekst. */
export function FieldEmpty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Kleine regel met pictogram en tekst (locatie, aantal, uur …). */
export function FieldMeta({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted-foreground">
      {children}
    </p>
  );
}

/** Grote secundaire actie met dezelfde hoogte als de hoofdknoppen. */
export function FieldLinkAction({
  href,
  icon,
  children,
  className,
}: {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/60 px-3 text-[15px] font-semibold transition-colors active:bg-secondary",
        className,
      )}
    >
      {icon}
      {children}
    </a>
  );
}

/** Skeletregels tijdens het laden — voorkomt een springende lay-out. */
export function FieldSkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="h-[132px] animate-pulse rounded-2xl border border-border/60 bg-card/70"
        />
      ))}
    </ul>
  );
}
