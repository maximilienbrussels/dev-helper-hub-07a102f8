import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { OpeningStatus } from "@/lib/opening-status";

/**
 * Publieke badge met de actuele openingsstatus. Haalt de status live op bij
 * /api/public/opening-status, zodat een uitzondering in het portaal meteen
 * zichtbaar is op de website.
 */
export function OpeningHoursBadge({ className }: { className?: string }) {
  const { lang } = useT();
  const [status, setStatus] = useState<OpeningStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/public/opening-status?lang=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: OpeningStatus | null) => {
        if (alive) setStatus(d);
      })
      .catch(() => setStatus(null));
    return () => {
      alive = false;
    };
  }, [lang]);

  if (!status) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        status.isOpenNow
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
      title={status.todayHours ?? undefined}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          status.isOpenNow ? "bg-primary" : "bg-muted-foreground/60",
        )}
        aria-hidden
      />
      {status.statusLabel}
      {status.todayHours ? (
        <span className="font-normal opacity-70">{status.todayHours}</span>
      ) : null}
    </span>
  );
}
