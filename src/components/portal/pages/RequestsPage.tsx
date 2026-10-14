import { useMemo, useState } from "react";
import { LayoutGrid, Table2, Search } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { locationName } from "@/lib/portal-data";
import type { Booking, BookingStatus } from "@/lib/portal-types";
import {
  CardList,
  DataCard,
  LocationBadge,
  PageHeader,
  Pagination,
  StatusBadge,
  TableCard,
  euro,
  rowClass,
  theadClass,
  usePaged,
} from "@/components/portal/portal-ui";
import { BookingDetail } from "@/components/portal/BookingDetail";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COLUMNS: BookingStatus[] = [
  "nieuw",
  "in_behandeling",
  "offerte_verzonden",
  "gereserveerd",
  "afgerond",
];

export function RequestsPage() {
  const { t, bookings } = usePortal();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [query, setQuery] = useState("");
  // Filters op status en datumbereik van het evenement.
  const [status, setStatus] = useState<"all" | BookingStatus>("all");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => b.type !== "geblokkeerd")
      .filter(
        (b) =>
          !q ||
          b.client_name.toLowerCase().includes(q) ||
          (b.client_org ?? "").toLowerCase().includes(q) ||
          b.client_email.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q),
      )
      .filter((b) => status === "all" || b.status === status)
      .filter((b) => !from || (b.date ?? "") >= from)
      .filter((b) => !until || (b.date ?? "") <= until)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [bookings, query, status, from, until]);

  // Paginering voor de tabelweergave (telefoon en desktop tonen dezelfde pagina).
  const paged = usePaged(filtered, 25);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.requests")}
        subtitle={`${filtered.length} ${t("requests.count")}`}
        action={
          <div className="flex overflow-hidden rounded-md border border-border">
            <button
              onClick={() => setView("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold",
                view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">{t("requests.kanban")}</span>
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold",
                view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <Table2 className="size-4" />
              <span className="hidden sm:inline">{t("requests.table")}</span>
            </button>
          </div>
        }
      />

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          maxLength={80}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("requests.search")}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | BookingStatus)}
          className="h-9 rounded-md border border-border bg-card px-2 text-xs font-semibold"
          aria-label={t("requests.filterStatus")}
        >
          <option value="all">{t("requests.filterStatus")}</option>
          {COLUMNS.map((c) => (
            <option key={c} value={c}>
              {t(`status.${c}`)}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-2 text-xs"
          aria-label={t("requests.filterFrom")}
        />
        <input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-2 text-xs"
          aria-label={t("requests.filterUntil")}
        />
        {(status !== "all" || from || until) && (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setFrom("");
              setUntil("");
            }}
            className="h-9 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
          >
            {t("requests.filterReset")}
          </button>
        )}
      </div>

      {view === "kanban" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-3">
            {COLUMNS.map((col) => {
              const items = filtered.filter((b) => b.status === col);
              return (
                <div key={col} className="w-[16rem] shrink-0 rounded-lg bg-surface p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wide uppercase">
                      {t(`status.${col}`)}
                    </p>
                    <span className="rounded bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {items.map((b) => (
                      <li key={b.id}>
                        <button
                          onClick={() => setSelected(b)}
                          className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary"
                        >
                          <p className="truncate text-sm font-semibold">{b.client_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {b.client_org ?? t("requests.private")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <LocationBadge
                              locationId={b.location_id}
                              label={locationName(b.location_id)}
                            />
                          </div>
                          <p className="mt-2 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                            <span>{b.date}</span>
                            <span className="font-bold text-foreground">{euro(b.price)}</span>
                          </p>
                        </button>
                      </li>
                    ))}
                    {items.length === 0 ? (
                      <li className="rounded-md border border-dashed border-border py-6 text-center text-[11px] text-muted-foreground">
                        {t("requests.empty")}
                      </li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Telefoon: rijen als gestapelde kaarten */}
          <CardList>
            {paged.rows.map((b) => (
              <DataCard key={b.id} onClick={() => setSelected(b)}>
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{b.client_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {b.client_org ?? t("requests.private")} · {t(`type.${b.type}`)}
                    </span>
                  </span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <LocationBadge locationId={b.location_id} label={locationName(b.location_id)} />
                  <span className="tabular-nums">{b.date}</span>
                  <span className="tabular-nums">
                    {b.guests_count} {t("requests.persons")}
                  </span>
                  <span className="ml-auto font-bold text-foreground tabular-nums">
                    {euro(b.price)}
                  </span>
                </div>
              </DataCard>
            ))}
            {filtered.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                {t("requests.none")}
              </li>
            ) : null}
          </CardList>

          <TableCard>
            <table className="w-full min-w-[46rem] text-sm">
              <thead className={theadClass}>
                <tr>
                  <th>{t("common.client")}</th>
                  <th>{t("requests.type")}</th>
                  <th>{t("common.date")}</th>
                  <th>{t("common.location")}</th>
                  <th>{t("common.guests")}</th>
                  <th>{t("common.status")}</th>
                  <th className="text-right">{t("common.price")}</th>
                </tr>
              </thead>
              <tbody>
                {paged.rows.map((b) => (
                  <tr
                    key={b.id}
                    data-clickable="true"
                    onClick={() => setSelected(b)}
                    className={rowClass}
                  >
                    <td>
                      <p className="font-semibold">{b.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.client_org ?? t("requests.private")}
                      </p>
                    </td>
                    <td>{t(`type.${b.type}`)}</td>
                    <td className="tabular-nums">{b.date}</td>
                    <td>
                      <LocationBadge
                        locationId={b.location_id}
                        label={locationName(b.location_id)}
                      />
                    </td>
                    <td className="tabular-nums">{b.guests_count}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="text-right font-semibold tabular-nums">{euro(b.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            total={paged.total}
            onPage={paged.setPage}
          />
        </>
      )}

      <BookingDetail booking={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
