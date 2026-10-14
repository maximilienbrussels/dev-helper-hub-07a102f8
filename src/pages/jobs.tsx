import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import { JOBS_COPY, JOBS_LINKEDIN, JOB_OFFERS } from "@/lib/jobs-content";
import { Briefcase, GraduationCap, Linkedin } from "lucide-react";

export function JobsPage() {
  const { lang, tx } = useT();
  const deep = <T,>(v: T): T =>
    (typeof v === "string"
      ? tx(v)
      : Array.isArray(v)
        ? v.map(deep)
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)]))
          : v) as T;
  const c = deep(JOBS_COPY[lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="geiten" />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-serif text-2xl text-[color:var(--ink-forest)]">
            <Briefcase className="h-5 w-5" aria-hidden /> {c.openTitle}
          </h2>
          {JOB_OFFERS.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6">
              <p className="text-sm font-medium text-[color:var(--ink-forest)]">{c.empty}</p>
              <p className="mt-2 text-sm text-muted-foreground">{c.emptyHint}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {JOB_OFFERS.map((job) => (
                <li key={job.id} className="rounded-3xl border border-border/60 p-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {c.contracts[job.contract]}
                  </p>
                  <h3 className="font-serif mt-1 text-xl text-[color:var(--ink-forest)]">
                    {tx(job.title[lang])}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    {tx(job.summary[lang])}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {c.regime}: {tx(job.regime[lang])}
                    {job.deadline ? ` · ${c.deadline} ${job.deadline}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <a
            href={JOBS_LINKEDIN}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-terracotta)] underline underline-offset-4"
          >
            <Linkedin className="h-4 w-4" aria-hidden /> {c.linkedin}
          </a>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-serif text-2xl text-[color:var(--ink-forest)]">
            <GraduationCap className="h-5 w-5" aria-hidden /> {c.internshipsTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.internshipsIntro}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {c.internshipFields.map((f) => (
              <li
                key={f}
                className="rounded-2xl border border-border/50 px-4 py-3 text-sm text-foreground/90"
              >
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{c.internshipNote}</p>
        </section>

        <section className="mt-12 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6">
          <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">
            {c.workingHereTitle}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/90">
            {c.workingHere.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="text-[color:var(--color-terracotta)]">·</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16">
          <PageContactForm
            context="Jobs & stages"
            inbox="stages"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}
