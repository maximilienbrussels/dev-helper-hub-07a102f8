import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { BookingStatus, LocationId } from "@/lib/portal-types";
import { usePortal } from "@/lib/portal-store";

export const LOCATION_DOT: Record<LocationId, string> = {
  chalet: "bg-chalet",
  zaal: "bg-zaal",
  prairie: "bg-prairie",
  boerderij: "bg-boerderij",
};

export const LOCATION_SOFT: Record<LocationId, string> = {
  chalet: "bg-chalet/12 text-chalet border-chalet/30",
  zaal: "bg-zaal/12 text-zaal border-zaal/30",
  prairie: "bg-prairie/12 text-prairie border-prairie/30",
  boerderij: "bg-boerderij/12 text-boerderij border-boerderij/30",
};

export const LOCATION_BAR: Record<LocationId, string> = {
  chalet: "border-l-chalet",
  zaal: "border-l-zaal",
  prairie: "border-l-prairie",
  boerderij: "border-l-boerderij",
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  nieuw: "bg-info/12 text-info border-info/30",
  in_behandeling: "bg-warning/20 text-warning-foreground border-warning/40",
  offerte_verzonden: "bg-accent/12 text-accent border-accent/30",
  gereserveerd: "bg-success/12 text-success border-success/30",
  afgerond: "bg-muted text-muted-foreground border-border",
  geannuleerd: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const { t } = usePortal();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        STATUS_STYLE[status],
        className,
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}

export function LocationBadge({
  locationId,
  label,
  className,
}: {
  locationId: LocationId;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        LOCATION_SOFT[locationId],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", LOCATION_DOT[locationId])} />
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/70 pb-4 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        <span aria-hidden className="mt-1.5 block h-0.5 w-10 rounded-full bg-primary" />
        {subtitle ? (
          <p className="mt-1.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}


export const euro = (n: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(n)
    .replace(/\u00a0/g, " ");

/* ------------------------------------------------------------------ *
 * Gedeelde tabel- en kaartprimitieven voor het beheerportaal.
 * Desktop: sticky kolomkoppen, duidelijke hover, consistente paginering.
 * Telefoon: dezelfde rijen als gestapelde kaarten.
 * ------------------------------------------------------------------ */

/** Desktopkader rond een tabel: alleen zichtbaar vanaf md. */
export function TableCard({
  children,
  className,
  maxHeight = "70vh",
}: {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div
      className={cn(
        "hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block",
        className,
      )}
    >
      <div className="overflow-auto" style={{ maxHeight }}>
        {children}
      </div>
    </div>
  );
}

/** Sticky kolomkop met dezelfde typografie als de publieke site. */
export const theadClass =
  "sticky top-0 z-10 bg-surface/95 backdrop-blur text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold";

/** Rij met leesbare hover- en focusstaat. */
export const rowClass =
  "border-b border-border/60 last:border-0 transition-colors hover:bg-surface/70 data-[clickable=true]:cursor-pointer [&_td]:px-4 [&_td]:py-3";

/** Telefoonlijst: rijen als gestapelde kaarten. */
export function CardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={cn("space-y-2.5 md:hidden", className)}>{children}</ul>;
}

export function DataCard({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors",
        onClick && "text-left active:border-primary",
        className,
      )}
    >
      {children}
    </div>
  );
  return (
    <li>
      {onClick ? (
        <button type="button" onClick={onClick} className="block w-full min-h-11 text-left">
          {inner}
        </button>
      ) : (
        inner
      )}
    </li>
  );
}

/** Label/waarde-paar binnen een kaart. */
export function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{children}</span>
    </div>
  );
}

/** Simpele client-side paginering. */
export function usePaged<T>(rows: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const slice = rows.slice((current - 1) * pageSize, current * pageSize);
  useEffect(() => {
    setPage(1);
  }, [rows.length]);
  return { rows: slice, page: current, pageCount, total: rows.length, setPage };
}

export function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const { t } = usePortal();
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-3 flex items-center justify-between gap-3" aria-label={t("table.page")}>
      <p className="text-xs text-muted-foreground tabular-nums">
        {t("table.page")} {page}/{pageCount} · {total} {t("table.results")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-10 min-w-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
        >
          {t("table.prev")}
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex h-10 min-w-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
        >
          {t("table.next")}
        </button>
      </div>
    </nav>
  );
}
