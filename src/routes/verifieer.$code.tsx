import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Camera,
  Copy,
  FileText,
  Loader2,
  Search,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { verifyCertificaat, verifyCertificaatByCode } from "@/lib/verify.functions";
import { useT, localeFor } from "@/lib/i18n";
import { MLogo } from "@/components/MLogo";
import { NavHeader } from "@/components/NavHeader";
import { CertificateQR } from "@/components/CertificateQR";
import { CertificateFront } from "@/components/academy/CertificateFront";
import { QrScanner } from "@/components/verify/QrScanner";
import { certVerifyCodeUrl } from "@/lib/academy-cert";
import { parseCertCode } from "@/lib/cert-code";
import { closestCertPrefixes, EXAMPLE_CERT_CODE } from "@/lib/verify-prefixes";
import { verifyReasonMessage } from "@/lib/verify-messages";
import { downloadVerifiedCertificatePdf } from "@/lib/verify-pdf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Leest code + handtekening uit een gescande QR-inhoud (URL of los nummer). */
export function parseScanned(raw: string): { code: string; sig?: string } | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
    const code = decodeURIComponent(last).replace(/^#/, "");
    const sig = url.searchParams.get("s") ?? url.searchParams.get("id") ?? undefined;
    if (code.length >= 6) return { code, sig: sig ?? undefined };
    return null;
  } catch {
    const code = text.replace(/^#/, "");
    return code.length >= 6 ? { code } : null;
  }
}

/**
 * Officieel verificatiescherm dat achter elke QR-code op het A4-certificaat
 * zit: /verifieer/KNJ-2026-0001. Toont alle publieke certificaatgegevens of
 * een vriendelijke "niet gevonden"-status met handmatige zoekbalk.
 */
export const Route = createFileRoute("/verifieer/$code")({
  validateSearch: (search: Record<string, unknown>) => ({
    s: typeof search["s"] === "string" ? (search["s"] as string) : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Certificaat #${params.code} — officiële verificatie` },
      {
        name: "description",
        content: `Officiële echtheidscontrole van Academy-certificaat #${params.code} van Maximilien.`,
      },
      { property: "og:title", content: `Certificaat #${params.code} geverifieerd` },
      {
        property: "og:description",
        content: "Officiële verificatiepagina voor diploma's van de stadsboerderij Maximiliaan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifieerCodePage,
});

function VerifieerCodePage() {
  const { code } = Route.useParams();
  const { s: sig } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { lang } = useT();
  const byToken = useServerFn(verifyCertificaat);
  const byCode = useServerFn(verifyCertificaatByCode);
  const clean = code.trim().replace(/^#/, "");
  const [value, setValue] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["verifieer-code", clean, sig ?? ""],
    enabled: clean.length >= 6,
    retry: false,
    queryFn: () =>
      UUID.test(clean)
        ? byToken({ data: { token: clean, sig } })
        : byCode({ data: { code: clean, sig } }),
  });

  // Een netwerk-/serverfout mag nooit blijven hangen op "controleren…":
  // dan tonen we gewoon de niet-gevonden status met handmatige zoekbalk.
  const loading = clean.length >= 6 && isPending && !isError;
  const failureReason =
    clean.length < 6 ? "invalid_format" : isError ? "not_found" : data && !data.valid ? data.reason : null;
  const notFound = !loading && !!failureReason;

  const parsedPrefix = clean ? (parseCertCode(clean)?.prefix ?? clean.split("-")[0]) : "";
  const suggestions =
    failureReason === "not_found" && parsedPrefix ? closestCertPrefixes(parsedPrefix) : [];

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verifieer/${clean}${sig ? `?s=${encodeURIComponent(sig)}` : ""}`
      : certVerifyCodeUrl(clean, sig);

  /** Verwerkt een gescande QR: navigeert naar de code met handtekening. */
  const onScan = useCallback(
    (raw: string) => {
      const hit = parseScanned(raw);
      if (!hit) {
        toast.error("Deze QR-code hoort niet bij een certificaat.");
        return;
      }
      setScanOpen(false);
      navigate({
        to: "/verifieer/$code",
        params: { code: hit.code },
        search: { s: hit.sig },
      });
    },
    [navigate],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = value.trim().replace(/^#/, "");
    if (next.length >= 6) navigate({ to: "/verifieer/$code", params: { code: next }, search: { s: undefined } });
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success("Verificatielink gekopieerd naar het klembord.");
    } catch {
      toast.error("Kopiëren is niet gelukt.");
    }
  };

  const onDownloadPdf = async () => {
    if (!data?.valid) return;
    await downloadVerifiedCertificatePdf({
      code: data.code,
      naam: data.naam,
      academy: data.academy,
      score: data.score,
      behaaldOp: data.behaald_op,
      verifyUrl,
    });
  };

  const datum = data?.valid
    ? new Date(data.behaald_op).toLocaleDateString(localeFor(lang), {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <>
      <NavHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center px-4 py-16">
      <MLogo variant="brand" className="h-12 w-auto" />

      {loading && (
        <p className="mt-10 inline-flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Certificaat controleren…
        </p>
      )}

      {!loading && data?.valid && (
        <article className="mt-8 w-full rounded-3xl border border-[color:var(--color-sage)]/60 bg-[color:var(--surface-page)] p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-cream)]">
            <BadgeCheck className="h-4 w-4" /> Officieel &amp; geverifieerd diploma
          </p>

          {/* Gescand via de officiële QR: dan tonen we het certificaat zelf. */}
          {data.ondertekend ? (
            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-[color:var(--color-sage)]/60">
              <CertificateFront
                academy={data.slug ? { slug: data.slug, badge_icon: data.badge_icon } : null}
                academyLabel={data.academy ?? ""}
                naam={data.naam}
                score={data.score ?? ""}
                datum={datum}
                code={data.code}
                volgnummer={data.volgnummer}
                qrUrl={certVerifyCodeUrl(data.code, sig)}
                certLang={lang}
              />
            </div>
          ) : (
            <p className="mt-6 inline-flex items-start gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Dit nummer is manueel ingevoerd. De gegevens hieronder komen uit onze databank en
                zijn geldig; het certificaatbeeld verschijnt enkel na het scannen van de officiële
                QR-code op het certificaat.
              </span>
            </p>
          )}


          <h1 className="mt-6 font-serif text-3xl italic text-[color:var(--ink-forest)]">
            {data.naam ?? "—"}
          </h1>

          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Row label="Certificaat referentie" value={`#${data.code}`} mono />
            <Row label="Uitgereikt aan" value={data.naam ?? "—"} />
            <Row label="Behaalde academie" value={`${data.academy ?? "—"} Academy`} />
            <Row label="Uitgiftedatum" value={datum} />
            <Row
              label="Resultaat"
              value={`${data.score ?? "—"}${isHonours(data.score) ? " — Met onderscheiding" : ""}`}
            />
            <Row
              label="Instantie"
              value="Maximilien (Stadsboerderij Maximiliaan Brussel)"
            />
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-[color:var(--color-sage)]/50 pt-6">
            <span className="rounded-xl bg-[#FAF7F2] p-2 ring-1 ring-[color:var(--color-sage)]/60">
              <CertificateQR value={certVerifyCodeUrl(data.code, sig)} size={64} />
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onDownloadPdf}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-7 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
              >
                <FileText className="h-4 w-4" /> Download certificaat als PDF
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--color-terracotta)]"
              >
                <Copy className="h-4 w-4" /> Verificatielink kopiëren
              </button>
            </div>
          </div>
        </article>
      )}

      {!loading && (
        <div className="mt-6 w-full">
          <button
            type="button"
            onClick={() => setScanOpen((o) => !o)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--color-terracotta)]"
          >
            <Camera className="h-4 w-4" /> {scanOpen ? "Scanner sluiten" : "Scan QR-code"}
          </button>
          {scanOpen && <QrScanner onResult={onScan} onClose={() => setScanOpen(false)} />}
        </div>
      )}


      {notFound && (
        <section className="mt-8 w-full rounded-3xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-serif text-2xl italic text-[color:var(--ink-forest)]">
            {verifyReasonMessage(failureReason!).title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {verifyReasonMessage(failureReason!).cause}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {verifyReasonMessage(failureReason!).action}
          </p>
          <p className="mt-2 font-mono text-xs tracking-widest text-muted-foreground">#{clean}</p>

          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Bedoelde u misschien:</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {suggestions.map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/verifieer/$code",
                        params: { code: clean.replace(parsedPrefix, prefix) },
                        search: { s: undefined },
                      })
                    }
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest hover:border-[color:var(--color-terracotta)]"
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="mx-auto mt-6 flex w-full max-w-md items-center gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={EXAMPLE_CERT_CODE}
              aria-label="Certificaatnummer"
              className="h-12 min-w-0 flex-1 rounded-full border border-border bg-background px-5 text-sm uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal focus:border-[color:var(--color-terracotta)] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
            >
              <Search className="h-4 w-4" /> Zoeken
            </button>
          </form>
        </section>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link to="/academy" className="text-sm text-primary hover:underline">
          Academy
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          Terug naar de site
        </Link>
      </div>
      </main>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 text-sm text-foreground/90 ${mono ? "font-mono tracking-widest text-[color:var(--color-terracotta)]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function isHonours(score: string | null | undefined) {
  const [got, total] = String(score ?? "")
    .split("/")
    .map((x) => parseInt(x, 10));
  return Number.isFinite(got) && Number.isFinite(total) && total > 0 && got === total;
}
