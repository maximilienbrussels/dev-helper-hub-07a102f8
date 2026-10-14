import { deepTx } from "@/lib/i18n-extra";
import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import {
  ANNUAL_REPORT_URL,
  LINKEDIN_URL,
  SUBSIDIES_2025,
  TENDERS_2025,
  TRANSPARENCY_COPY,
  TRANSPARENCY_REPORT_URL,
  type MoneyRow,
} from "@/lib/transparency-content";
import { Download, FileText } from "lucide-react";

function MoneyTable({
  rows,
  headers,
}: {
  rows: MoneyRow[];
  headers: { project: string; funder: string; amount: string };
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-3xl border border-border/60">
      <table className="w-full text-left text-sm">
        <thead className="bg-[color:var(--surface-page)]/60 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">{headers.project}</th>
            <th className="px-4 py-3 font-medium">{headers.funder}</th>
            <th className="px-4 py-3 text-right font-medium">{headers.amount}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((r) => (
            <tr key={r.project + r.funder}>
              <td className="px-4 py-3 font-medium text-[color:var(--ink-forest)]">{r.project}</td>
              <td className="px-4 py-3 text-foreground/90">{r.funder}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground/90">{r.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TransparencyPage() {
  const { lang, tx } = useT();
  const c = deepTx(tx, TRANSPARENCY_COPY[lang]);
  const headers = { project: c.project, funder: c.funder, amount: c.amount };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="pauw" />
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
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.subsidiesTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.subsidiesIntro}</p>
          <MoneyTable rows={SUBSIDIES_2025} headers={headers} />
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.studiesTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground/90">{c.studies}</p>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.tendersTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.tendersIntro}</p>
          <MoneyTable rows={TENDERS_2025} headers={headers} />
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.jobsTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground/90">{c.jobsIntro}</p>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-medium text-[color:var(--color-terracotta)] underline underline-offset-4"
          >
            LinkedIn
          </a>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.reportsTitle}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { href: TRANSPARENCY_REPORT_URL, text: c.transparencyReport },
              { href: ANNUAL_REPORT_URL, text: c.annualReport },
            ].map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-3xl border border-border/60 p-6 transition-colors hover:border-[color:var(--color-terracotta)]"
              >
                <FileText className="h-5 w-5 text-[color:var(--ink-forest)]" aria-hidden />
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-terracotta)]">
                  <Download className="h-4 w-4" aria-hidden /> {c.download}
                </span>
              </a>
            ))}
          </div>
        </section>

        <div className="mt-16">
          <PageContactForm
            context="Transparantie"
            inbox="algemeen"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}
