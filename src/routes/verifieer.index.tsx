import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { verifyCertificaat, verifyCertificaatByCode } from "@/lib/verify.functions";
import { useT, localeFor, formatT } from "@/lib/i18n";
import { BadgeCheck, Camera, Copy, FileText, Loader2, Search, ShieldAlert } from "lucide-react";
import { QrScanner } from "@/components/verify/QrScanner";
import { parseScanned } from "@/routes/verifieer.$code";
import { MLogo } from "@/components/MLogo";
import { NavHeader } from "@/components/NavHeader";
import { parseCertCode } from "@/lib/cert-code";
import { closestCertPrefixes, EXAMPLE_CERT_CODE } from "@/lib/verify-prefixes";
import { verifyReasonMessage } from "@/lib/verify-messages";
import { downloadVerifiedCertificatePdf } from "@/lib/verify-pdf";

const searchSchema = z.object({ id: z.string().trim().optional() });

/**
 * Publieke verificatiepagina: `?id=` wordt automatisch gecontroleerd, maar
 * bezoekers (werkgevers, scholen, ouders) kunnen ook zelf een certificaat-
 * nummer intypen. Zowel het onraadbare token als de leesbare code werken.
 */
export const Route = createFileRoute("/verifieer/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Certificaat verifiëren — Ferme du parc Maximilien" },
      {
        name: "description",
        content:
          "Controleer de echtheid van een Academy-certificaat van La Ferme du parc Maximilien met het certificaatnummer.",
      },
      { property: "og:title", content: "Certificaat verifiëren" },
      {
        property: "og:description",
        content: "Officiële verificatie van Academy-certificaten van de stadsboerderij.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifieerPage,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function VerifieerPage() {
  const { id } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t, lang } = useT();
  const byToken = useServerFn(verifyCertificaat);
  const byCode = useServerFn(verifyCertificaatByCode);
  const [value, setValue] = useState(id ?? "");
  const [scanOpen, setScanOpen] = useState(false);

  // Hash-routing: /verifieer#MAX-2026-9K2P4 of maximilien.site/#KNJ-2026-0001
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.replace(/^#/, "").trim();
      if (hash.length >= 6 && !id) void navigate({ search: { id: hash }, replace: true });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [id, navigate]);

  const query = (id ?? "").trim().replace(/^#/, "");
  const { data, isPending, isError } = useQuery({
    queryKey: ["verifieer", query],
    enabled: query.length >= 6,
    retry: false,
    queryFn: () =>
      UUID.test(query) ? byToken({ data: { token: query } }) : byCode({ data: { code: query } }),
  });

  const loading = query.length >= 6 && isPending && !isError;
  const failure = !loading && query.length >= 6 ? (isError ? "not_found" : data && !data.valid ? data.reason : null) : null;
  const parsedPrefix = query ? (parseCertCode(query)?.prefix ?? query.split("-")[0]) : "";
  const suggestions =
    failure === "not_found" && parsedPrefix ? closestCertPrefixes(parsedPrefix) : [];

  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verifieer/${query}`;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ search: { id: value.trim() } });
  };

  /** Gescande QR meteen doorsturen naar de officiële controlepagina. */
  const onScan = (raw: string) => {
    const hit = parseScanned(raw);
    if (!hit) {
      toast.error("Deze QR-code hoort niet bij een certificaat.");
      return;
    }
    setScanOpen(false);
    void navigate({
      to: "/verifieer/$code",
      params: { code: hit.code },
      search: { s: hit.sig },
    });
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

  return (
    <>
      <NavHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-4 py-16">
      <MLogo variant="brand" className="h-12 w-auto" />
      <h1 className="mt-6 text-center font-serif text-3xl italic text-[color:var(--ink-forest)]">
        {t("verify.title")}
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">
        {t("verify.lookupHint")}
      </p>

      <div className="mt-6 w-full max-w-md">
        <button
          type="button"
          onClick={() => setScanOpen((o) => !o)}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--color-terracotta)]"
        >
          <Camera className="h-4 w-4" /> {scanOpen ? "Scanner sluiten" : "Scan QR-code"}
        </button>
        {scanOpen && <QrScanner onResult={onScan} onClose={() => setScanOpen(false)} />}
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-md items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={EXAMPLE_CERT_CODE}
          aria-label={t("verify.lookupLabel")}
          className="h-12 min-w-0 flex-1 rounded-full border border-border bg-background px-5 text-sm tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal focus:border-[color:var(--color-terracotta)] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
        >
          <Search className="h-4 w-4" /> {t("verify.lookupCta")}
        </button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Bijvoorbeeld: <span className="font-mono tracking-widest">{EXAMPLE_CERT_CODE}</span>
      </p>

      {loading && (
        <p className="mt-8 inline-flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("verify.checking")}
        </p>
      )}

      {!loading && data?.valid && (
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-7 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
            >
              <FileText className="h-4 w-4" /> {t("verify.pdf")}
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
      )}

      {!loading && failure && (
        <div className="mt-8 w-full rounded-3xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-serif text-xl italic text-[color:var(--ink-forest)]">
            {verifyReasonMessage(failure).title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{verifyReasonMessage(failure).cause}</p>
          <p className="mt-1 text-sm text-muted-foreground">{verifyReasonMessage(failure).action}</p>
          <p className="mt-2 font-mono text-xs tracking-widest text-muted-foreground">#{query}</p>
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Bedoelde u misschien:</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {suggestions.map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => setValue(query.replace(parsedPrefix, prefix))}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest hover:border-[color:var(--color-terracotta)]"
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
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
