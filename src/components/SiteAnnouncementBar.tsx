import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { activeAnnouncement } from "@/lib/site-config";
import { useSiteConfig } from "@/lib/use-site-config";
import type { Lang } from "@/lib/routes-i18n";

const TONE_CLASS: Record<string, string> = {
  info: "bg-primary text-primary-foreground",
  warning: "bg-amber-500 text-amber-950",
  success: "bg-emerald-600 text-white",
};

/** Aankondigingsbalk bovenaan de publieke site, beheerd via het portaal. */
export function SiteAnnouncementBar({ lang }: { lang: Lang }) {
  const config = useSiteConfig();
  const announcement = activeAnnouncement(config, lang);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(sessionStorage.getItem("announcement-dismissed"));
  }, []);

  if (!announcement) return null;
  const id = config.announcement?.id ?? "";
  if (dismissed === id) return null;

  return (
    <div className={`w-full px-4 py-2 text-sm ${TONE_CLASS[announcement.tone] ?? TONE_CLASS.info}`}>
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 text-center">
        <span>{announcement.message}</span>
        {announcement.linkUrl ? (
          announcement.linkUrl.startsWith("/") ? (
            // Interne link: zachte navigatie, zodat de chat gemonteerd blijft.
            <Link
              to={announcement.linkUrl as never}
              className="font-semibold underline underline-offset-2"
            >
              {announcement.linkLabel || announcement.linkUrl}
            </Link>
          ) : (
            <a
              href={announcement.linkUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold underline underline-offset-2"
            >
              {announcement.linkLabel || announcement.linkUrl}
            </a>
          )
        ) : null}
        <button
          type="button"
          aria-label="Sluiten"
          className="ml-auto shrink-0 opacity-70 transition hover:opacity-100"
          onClick={() => {
            sessionStorage.setItem("announcement-dismissed", id);
            setDismissed(id);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
