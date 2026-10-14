import { deepTx, type ExtraLang } from "@/lib/i18n-extra";
import { PagePhotoBand } from "@/components/PagePhotoBand";
import { LocalLink } from "@/components/LocalLink";
import { NavHeader } from "@/components/NavHeader";
import { MastodonShareButton } from "@/components/social/MastodonShareButton";
import { useT, localeFor } from "@/lib/i18n";
import { NEWS, newsBySlug, pathFor, type Lang } from "@/lib/routes-i18n";

const COPY: Record<Lang, { title: string; lede: string; back: string; read: string }> = {
  nl: {
    title: "Nieuws & agenda",
    lede: "Activiteiten, evenementen en nieuws van de boerderij.",
    back: "Terug naar nieuws",
    read: "Lees verder",
  },
  fr: {
    title: "Actualités & agenda",
    lede: "Activités, événements et actualités de la ferme.",
    back: "Retour aux actualités",
    read: "Lire la suite",
  },
  en: {
    title: "News & events",
    lede: "Activities, events and news from the farm.",
    back: "Back to news",
    read: "Read more",
  },
};

function fmt(date: string, lang: Lang | ExtraLang) {
  return new Date(date).toLocaleDateString(localeFor(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NewsPage() {
  const { lang, extra, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const items = [...NEWS].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <PagePhotoBand photo="ezel" />
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="font-serif text-4xl text-foreground">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.lede}</p>

        <div className="mt-8 space-y-5">
          {items.map((n) => (
            <article key={n.id} className="rounded-2xl border border-border bg-card p-5">
              <time dateTime={n.date} className="text-xs uppercase tracking-wide text-muted-foreground">
                {fmt(n.date, extra ?? lang)}
              </time>
              <h2 className="mt-1 font-serif text-2xl text-foreground">{tx(n.title[lang])}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tx(n.lede[lang])}</p>
              <LocalLink
                to={pathFor("news", lang, n.slug[lang])}
                className="mt-3 inline-block text-sm font-semibold text-primary underline"
              >
                {c.read}
              </LocalLink>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export function NewsDetailPage({ slug }: { slug: string }) {
  const { lang, extra, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const item = newsBySlug(lang, slug);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
          <h1 className="font-serif text-3xl text-foreground">404</h1>
          <LocalLink
            to={pathFor("news", lang)}
            className="mt-4 inline-block text-sm text-primary underline"
          >
            {c.back}
          </LocalLink>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <LocalLink to={pathFor("news", lang)} className="text-sm text-muted-foreground underline">
          ← {c.back}
        </LocalLink>
        <time dateTime={item.date} className="mt-6 block text-xs uppercase tracking-wide text-muted-foreground">
          {fmt(item.date, extra ?? lang)}
        </time>
        <h1 className="mt-1 font-serif text-4xl text-foreground">{tx(item.title[lang])}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{tx(item.lede[lang])}</p>
        <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
          {item.body[lang].map((p) => (
            <p key={p}>{tx(p)}</p>
          ))}
        </div>
        <MastodonShareButton className="mt-8" text={tx(item.title[lang])} />
      </main>
    </div>
  );
}
