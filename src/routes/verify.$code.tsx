import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { verifyCertificaat } from "@/lib/verify.functions";
import { useT, localeFor, formatT } from "@/lib/i18n";
import { BadgeCheck, Loader2, ShieldAlert, FileText } from "lucide-react";
import { verifyReasonMessage } from "@/lib/verify-messages";
import { downloadVerifiedCertificatePdf } from "@/lib/verify-pdf";
import { MLogo } from "@/components/MLogo";
import { NavHeader } from "@/components/NavHeader";

export const Route = createFileRoute("/verify/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Certificaat ${params.code} verifiëren — Ferme Maximilien` },
      {
        name: "description",
        content:
          "Controleer de echtheid van een Academy-certificaat van La Ferme du parc Maximilien.",
      },
      { property: "og:title", content: `Certificaat ${params.code} verifiëren` },
      {
        property: "og:description",
        content: "Officiële verificatiepagina voor Academy-certificaten van de stadsboerderij.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { code } = Route.useParams();
  const { t, lang } = useT();
  const fn = useServerFn(verifyCertificaat);
  const { data, isLoading } = useQuery({
    queryKey: ["verify", code],
    queryFn: () => fn({ data: { token: code } }),
  });

  return (
    <>
      <NavHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16">
      <MLogo variant="brand" className="h-12 w-auto" />
      <h1 className="mt-6 font-serif text-3xl italic text-[color:var(--ink-forest)]">
        {t("verify.title")}
      </h1>

      {isLoading && (
        <p className="mt-8 inline-flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("verify.checking")}
        </p>
      )}

      {!isLoading && data?.valid && (
        <div className="mt-8 w-full rounded-3xl border border-[color:var(--color-sage)]/60 bg-[color:var(--surface-page)] p-8 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-[color:var(--ink-forest)]" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-forest)]">
            {t("verify.valid")}
          </p>
          <p className="mt-4 text-lg text-foreground/90">
            {formatT(t("verify.issuedTo"), {
              name: data.naam ?? "—",
              date: new Date(data.behaald_op).toLocaleDateString(localeFor(lang), {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            })}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.academy} Academy · {data.score}
          </p>
          {isHonours(data.score) && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37] bg-[#1A3D2F] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              ★ {t("verify.honours")} ★
            </p>
          )}
          <p className="mt-4 font-mono text-xs tracking-widest text-[color:var(--color-terracotta)]">
            #{data.code}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {t("verify.issuer")}
          </p>
          <button
            type="button"
            onClick={() =>
              downloadVerifiedCertificatePdf({
                code: data.code,
                naam: data.naam,
                academy: data.academy,
                score: data.score,
                behaaldOp: data.behaald_op,
                verifyUrl: typeof window !== "undefined" ? window.location.href : "",
              })
            }
            className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-7 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
          >
            <FileText className="h-4 w-4" /> {t("verify.pdf")}
          </button>
        </div>
      )}

      {!isLoading && !data?.valid && (
        <div className="mt-8 w-full rounded-3xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {data ? verifyReasonMessage(data.reason).cause : t("verify.invalid")}
          </p>
          {data && (
            <p className="mt-1 text-sm text-muted-foreground">
              {verifyReasonMessage(data.reason).action}
            </p>
          )}
          <p className="mt-2 font-mono text-xs tracking-widest text-muted-foreground">#{code}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link to="/academy" className="text-sm text-primary hover:underline">
          Academy
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          {t("verify.backSite")}
        </Link>
      </div>
      </main>
    </>
  );
}

function isHonours(score: string | null | undefined) {
  const [got, total] = String(score ?? "")
    .split("/")
    .map((x) => parseInt(x, 10));
  return Number.isFinite(got) && Number.isFinite(total) && total > 0 && got === total;
}
