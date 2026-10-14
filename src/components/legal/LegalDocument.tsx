import { NavHeader } from "@/components/NavHeader";
import type { LegalDoc } from "@/lib/legal-pages";

/**
 * Gedeelde leeslay-out voor juridische pagina's:
 * rustige typografie, comfortabele regelbreedte, veel witruimte.
 */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-[46rem] px-5 py-16 md:px-8 md:py-28">
        <header className="border-b border-border/70 pb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[color:var(--color-terracotta)]">
            {doc.eyebrow}
          </p>
          <h1 className="font-serif mt-5 text-4xl leading-[1.05] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
            {doc.title}
          </h1>
          <p className="mt-6 max-w-[38rem] text-base leading-relaxed text-foreground/80 md:text-lg">
            {doc.lede}
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {doc.updated}
          </p>
        </header>

        <div className="mt-12 space-y-12">
          {doc.blocks.map((b) => (
            <section key={b.h} className="scroll-mt-24">
              <h2 className="font-serif text-xl leading-snug text-[color:var(--ink-forest)] md:text-2xl">
                {b.h}
              </h2>
              {b.p?.map((p) => (
                <p
                  key={p}
                  className="mt-4 text-[0.95rem] leading-[1.75] text-foreground/85 md:text-base"
                >
                  {p}
                </p>
              ))}
              {b.ul ? (
                <ul className="mt-4 space-y-3 border-l border-border/70 pl-5">
                  {b.ul.map((li) => (
                    <li
                      key={li}
                      className="text-[0.95rem] leading-[1.75] text-foreground/85 md:text-base"
                    >
                      {li}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-border/70 pt-8 text-sm leading-relaxed text-muted-foreground">
          {doc.footnote}
        </p>
      </main>
    </div>
  );
}

export default LegalDocument;
