import { useState } from "react";
import { MastodonIcon } from "@/components/social/MastodonIcon";
import {
  getSavedInstance,
  mastodonShareUrl,
  normaliseInstance,
  saveInstance,
} from "@/lib/mastodon";
import { useT, type Lang } from "@/lib/i18n";
import { deepTx } from "@/lib/i18n-extra";

const COPY: Record<Lang, { share: string; ask: string; placeholder: string; go: string }> = {
  nl: {
    share: "Deel op Mastodon",
    ask: "Op welke Mastodon-server sta je?",
    placeholder: "bv. mastodon.social",
    go: "Delen",
  },
  fr: {
    share: "Partager sur Mastodon",
    ask: "Sur quel serveur Mastodon êtes-vous ?",
    placeholder: "p.ex. mastodon.social",
    go: "Partager",
  },
  en: {
    share: "Share on Mastodon",
    ask: "Which Mastodon server are you on?",
    placeholder: "e.g. mastodon.social",
    go: "Share",
  },
};

/** Deelknop voor het fediverse: vraagt eenmalig naar de server van de bezoeker. */
export function MastodonShareButton({
  text,
  url,
  className = "",
}: {
  text: string;
  url?: string;
  className?: string;
}) {
  const { lang, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const [asking, setAsking] = useState(false);
  const [domain, setDomain] = useState("");

  const open = (host: string) => {
    const target = url ?? (typeof window !== "undefined" ? window.location.href : "");
    window.open(mastodonShareUrl(host, text, target), "_blank", "noopener,noreferrer");
  };

  const onClick = () => {
    const saved = getSavedInstance();
    if (saved) return open(saved);
    setAsking(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const host = normaliseInstance(domain);
    if (!host) return;
    saveInstance(host);
    setAsking(false);
    open(host);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border bg-card px-4 text-[12px] font-semibold text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)]/50 hover:text-[color:var(--color-terracotta)]"
      >
        <MastodonIcon className="h-4 w-4" />
        {c.share}
      </button>

      {asking ? (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="mastodon-instance">
            {c.ask}
          </label>
          <input
            id="mastodon-instance"
            autoFocus
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={c.placeholder}
            className="min-h-[40px] w-56 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
          />
          <button
            type="submit"
            className="min-h-[40px] rounded-full bg-primary px-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
          >
            {c.go}
          </button>
        </form>
      ) : null}
    </div>
  );
}
