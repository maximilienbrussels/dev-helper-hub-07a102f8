import { NavHeader } from "@/components/NavHeader";
import { SocialRow } from "@/components/SocialCarousel";
import { BlueskyFeedPaginated } from "@/components/social/BlueskyFeed";
import { MastodonFeed } from "@/components/social/MastodonFeed";
import { BlueskyIcon } from "@/components/social/BlueskyIcon";
import { BSKY_PROFILE_URL, useBlueskyFeed } from "@/lib/bluesky";
import { useT, type Lang } from "@/lib/i18n";
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<Lang, { eyebrow: string; title: string; intro: string; follow: string }> = {
  nl: {
    eyebrow: "Onze media",
    title: "Live van de boerderij",
    intro:
      "Korte updates, foto's van het erf en video's van onze dieren en workshops — rechtstreeks van ons Bluesky-kanaal.",
    follow: "Volg ons op Bluesky",
  },
  fr: {
    eyebrow: "Nos médias",
    title: "En direct de la ferme",
    intro:
      "Brèves actualités, photos de la cour et vidéos de nos animaux et ateliers — directement depuis notre canal Bluesky.",
    follow: "Suivez-nous sur Bluesky",
  },
  en: {
    eyebrow: "Our media",
    title: "Live from the farm",
    intro:
      "Short updates, photos from the yard and videos of our animals and workshops — straight from our Bluesky channel.",
    follow: "Follow us on Bluesky",
  },
};

export function SocialPage() {
  const { lang } = useT();
  const c = COPY[lang];
  const { profile } = useBlueskyFeed(24);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <header className="rounded-3xl border border-border bg-card p-6 text-card-foreground md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                <BlueskyIcon className="h-3 w-3" />
                {c.eyebrow}
              </p>
              <h1 className="font-serif mt-2 text-4xl italic md:text-5xl">{c.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{c.intro}</p>
            </div>

            <a
              href={BSKY_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 pr-5 transition-colors hover:border-[color:var(--color-terracotta)]/50"
            >
              {profile?.avatar ? (
                <img onError={handleImageError}
                  src={profile.avatar}
                  alt={profile.displayName}
                  width={48}
                  height={48}
                  loading="lazy"
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary font-serif text-xl italic">
                  M
                </span>
              )}
              <span className="leading-tight">
                <span className="block font-serif text-lg italic">Maximilien Brussels</span>
                <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {c.follow}
                </span>
              </span>
            </a>
          </div>
          <SocialRow className="mt-8" />
        </header>

        <section className="mt-8">
          <BlueskyFeedPaginated pageSize={12} />
        </section>

        <MastodonFeed limit={6} className="mt-8" />
      </main>
    </div>
  );
}
