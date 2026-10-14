import { deepTx } from "@/lib/i18n-extra";
import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import { FAQ_COPY, FAQ_FORM, FAQ_SECTIONS } from "@/lib/faq-content";

export function FaqPage() {
  const { lang, tx } = useT();
  const c = deepTx(tx, FAQ_COPY[lang]);
  const f = deepTx(tx, FAQ_FORM[lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="geit-madeliefjes" />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        {FAQ_SECTIONS.map((section) => (
          <section key={section.id} className="mt-14">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {tx(section.eyebrow[lang])}
            </p>
            <h2 className="font-serif mt-2 text-2xl text-[color:var(--ink-forest)] md:text-3xl">
              {tx(section.title[lang])}
            </h2>
            <div className="mt-5 divide-y divide-border/60 rounded-3xl border border-border/60">
              {section.items.map((item) => (
                <details key={item.id} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-base font-medium text-[color:var(--ink-forest)] marker:hidden">
                    <span className="mr-2 text-[color:var(--color-terracotta)] group-open:rotate-90 inline-block transition-transform">
                      →
                    </span>
                    {tx(item.q[lang])}
                  </summary>
                  <p className="mt-3 pl-6 text-sm leading-relaxed text-foreground/90">
                    {tx(item.a[lang])}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-16">
          <PageContactForm context="FAQ" inbox="algemeen" title={f.title} intro={f.intro} />
        </div>
      </main>
    </div>
  );
}
