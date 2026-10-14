import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import { deepTx } from "@/lib/i18n-extra";
import { Link } from "@tanstack/react-router";
import { SLUGS, SUB_SLUGS } from "@/lib/routes-i18n";
import {
  VOLUNTEER_COPY,
  VOLUNTEER_PROFILES,
  getVolunteerProfile,
  type VolunteerProfile,
} from "@/lib/volunteer-content";
import { ArrowLeft, ArrowUpRight, CalendarClock } from "lucide-react";

function profileSplat(lang: "nl" | "fr" | "en", id: string) {
  const sub = SUB_SLUGS.volunteers?.[id]?.[lang] ?? id;
  return `${SLUGS.volunteers[lang]}/${sub}`;
}

export function VolunteersPage() {
  const { lang, tx } = useT();
  const c = deepTx(tx, VOLUNTEER_COPY[lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="moestuin" />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <section className="mt-12 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6">
          <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.introTitle}</h2>
          {c.intro.map((p) => (
            <p key={p} className="mt-3 text-sm leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.profilesTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.profilesIntro}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {VOLUNTEER_PROFILES.map((p) => (
              <Link
                key={p.id}
                to="/$lang/$"
                params={{ lang, _splat: profileSplat(lang, p.id) }}
                className="rounded-3xl border border-border/60 p-6 transition-colors hover:border-[color:var(--color-terracotta)]"
              >
                <h3 className="font-serif text-lg text-[color:var(--ink-forest)]">
                  {tx(p.title[lang])}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{tx(p.lede[lang])}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" aria-hidden /> {tx(p.commitment[lang])}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-terracotta)]">
                  <ArrowUpRight className="h-4 w-4" aria-hidden /> {c.discover}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border/60 p-6">
          <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.practicalTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/90">
            {c.practical.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[color:var(--color-terracotta)]">·</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16">
          <PageContactForm
            context="Vrijwilligerswerk"
            inbox="vrijwilligers"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-3xl border border-border/60 p-6">
      <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-foreground/90">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-[color:var(--color-terracotta)]">·</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VolunteerProfilePage({ id }: { id: string }) {
  const { lang, tx } = useT();
  const c = deepTx(tx, VOLUNTEER_COPY[lang]);
  const profile: VolunteerProfile | undefined = getVolunteerProfile(id);
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
        <Link
          to="/$lang/$"
          params={{ lang, _splat: SLUGS.volunteers[lang] }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> {c.back}
        </Link>

        <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-3 text-4xl leading-[1.05] tracking-tight text-[color:var(--ink-forest)] md:text-5xl">
          {tx(profile.title[lang])}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{tx(profile.lede[lang])}</p>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-foreground/90">
          <CalendarClock className="h-4 w-4 text-[color:var(--ink-forest)]" aria-hidden />
          <span className="font-medium">{c.commitment}:</span> {tx(profile.commitment[lang])}
        </p>

        <div className="mt-10 grid gap-6">
          <Block title={c.tasks} items={deepTx(tx, profile.tasks[lang])} />
          <div className="grid gap-6 md:grid-cols-2">
            <Block title={c.looking} items={deepTx(tx, profile.looking[lang])} />
            <Block title={c.offer} items={deepTx(tx, profile.offer[lang])} />
          </div>
        </div>

        <div className="mt-16">
          <PageContactForm
            context={`Vrijwilliger — ${profile.title.nl}`}
            inbox="vrijwilligers"
            title={c.apply}
            intro={c.applyIntro}
          />
        </div>
      </main>
    </div>
  );
}
