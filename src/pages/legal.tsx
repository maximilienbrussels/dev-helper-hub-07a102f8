import { deepTx } from "@/lib/i18n-extra";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import { LEGAL_COPY, LEGAL_ENTITY, LEGAL_SECTIONS } from "@/lib/legal-content";

export function LegalPage() {
  const { lang, tx } = useT();
  const c = deepTx(tx, LEGAL_COPY[lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <dl className="mt-10 grid gap-3 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{c.orgLabel}</dt>
            <dd className="font-medium text-[color:var(--ink-forest)]">{LEGAL_ENTITY.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.addressLabel}</dt>
            <dd className="text-foreground/90">{LEGAL_ENTITY.address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.vatLabel}</dt>
            <dd className="text-foreground/90">{LEGAL_ENTITY.vat}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.editorLabel}</dt>
            <dd className="text-foreground/90">
              {LEGAL_ENTITY.editor} —{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.editorEmail}`}
                className="underline underline-offset-4"
              >
                {LEGAL_ENTITY.editorEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{c.hostingLabel}</dt>
            <dd className="text-foreground/90">{LEGAL_ENTITY.hosting}</dd>
          </div>
        </dl>

        {LEGAL_SECTIONS.map((s) => (
          <section key={s.title.fr} className="mt-10">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)] md:text-2xl">
              {tx(s.title[lang])}
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
              {s.body[lang].map((p) => (
                <p key={p}>{tx(p)}</p>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-16">
          <PageContactForm
            context="Wettelijke vermeldingen"
            inbox="technisch"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}
