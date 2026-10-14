import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CertificateQR } from "@/components/CertificateQR";
import {
  CertificateFront,
  BotanicalCorners,
  ordinal,
} from "@/components/academy/CertificateFront";
import { getCertificaat } from "@/lib/academy.functions";
import { useT, localeFor, formatT, tFor, type Lang } from "@/lib/i18n";
import { academyName } from "@/lib/academy-i18n";
import {
  Loader2,
  ArrowLeft,
  Printer,
  Stamp,
  Share2,
  Check,
  RotateCw,
  MapPin,
  Clock,
  Mail,
  Linkedin,
  Award,
  Download,
} from "lucide-react";
import { MLogo } from "@/components/MLogo";
import { NavHeader } from "@/components/NavHeader";
import { OfficialSeal } from "@/components/OfficialSeal";
import { Signature } from "@/components/Signature";
import { RubberStamp } from "@/components/RubberStamp";
import brusselsLogo from "@/assets/partner-brussels.png";
import leefmilieuLogo from "@/assets/partner-leefmilieu.svg";
import { certCode, titleCaseName } from "@/lib/cert-code";
import { academyModules, certVerifyUrl, certVerifyCodeUrl } from "@/lib/academy-cert";
import { AnimalIcon } from "@/lib/animal-glyph";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { handleImageError } from "@/lib/image-fallback";
import { stashRedirect } from "@/lib/redirect";
import { CANONICAL_SITE_URL } from "@/lib/site-url";

/**
 * Houdt het certificaat 100% vloeiend: meet de beschikbare breedte en zet de
 * schaalfactor als CSS-variabele, zodat het vaste 1123x794 canvas altijd
 * volledig binnen de kaart past (ook zonder container-query ondersteuning).
 */
function CertViewport({
  children,
  side,
  onFlip,
  flipping,
}: {
  children: React.ReactNode;
  side: "front" | "back";
  onFlip: () => void;
  flipping: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      if (w > 0) el.style.setProperty("--cert-scale", String(w / 1123));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);
  return (
    <div
      ref={ref}
      id="certificate-print-area"
      className="cert-flip mx-auto w-full max-w-2xl rounded-none shadow-[0_10px_30px_rgba(0,0,0,0.08)] print:max-w-none print:shadow-none"
    >
      {/* Klikken op de kaart draait ze om — behalve wanneer je tekst selecteert. */}
      <div
        className={
          "cert-flip-inner" + (side === "back" ? " is-back" : "") + (flipping ? " is-flipping" : "")
        }
        onClick={() => {
          if (typeof window !== "undefined" && window.getSelection()?.toString()) return;
          onFlip();
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/certificaat/$id")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const redirectPath =
        typeof window === "undefined" ? "/certificaat" : window.location.pathname;
      stashRedirect(redirectPath);
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Certificaat — Ferme Maximilien" }, { name: "robots", content: "noindex" }],
  }),
  component: CertificaatPage,
});

function CertificaatPage() {
  const { id } = Route.useParams();
  const { t, lang } = useT();
  const fn = useServerFn(getCertificaat);
  const [claimed, setClaimed] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  /**
   * Taal van het certificaat zelf — volledig losgekoppeld van de site-taal.
   * Start op de site-taal, maar wijzigen raakt enkel het certificaat en de PDF.
   */
  const [certLang, setCertLang] = useState<Lang>(lang);
  const ct = tFor(certLang);

  const [side, setSide] = useState<"front" | "back">("front");
  const [flipping, setFlipping] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["certificaat", id],
    queryFn: () => fn({ data: { id } }),
  });

  // De aanvraagstatus overleeft een refresh (localStorage per certificaatcode).
  const storageKey = data
    ? `cert_requested_#${certCode(
        data.academy?.slug,
        data.certificaat.behaald_op,
        data.certificaat.volgnummer,
      )}`
    : null;
  useEffect(() => {
    if (!storageKey) return;
    try {
      setClaimed(window.localStorage.getItem(storageKey) === "1");
    } catch {
      /* storage geblokkeerd — status blijft dan enkel in het geheugen */
    }
  }, [storageKey]);

  if (isLoading) {
    return (
      <>
        <NavHeader />
        <div className="flex min-h-[70vh] items-center justify-center bg-background text-foreground dark:bg-[#111A15] dark:text-[#E6E4DD]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("cert.loading")}
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <NavHeader />
        <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 text-foreground dark:bg-[#111A15] dark:text-[#E6E4DD]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("cert.notFound")}</p>
            <Link
              to="/mijn-hoefjes"
              className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> {t("cert.backBadges")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { certificaat, academy } = data;
  const dt = new Date(certificaat.behaald_op);
  const locale = localeFor(certLang);
  const datum = dt.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  // Bewust géén tijdstip op een formeel certificaat: enkel de datum.
  const nr = String(certificaat.volgnummer).padStart(4, "0");
  const code = certCode(academy?.slug, certificaat.behaald_op, certificaat.volgnummer);
  const [got, total] = String(certificaat.score ?? "")
    .split("/")
    .map((x) => parseInt(x, 10));
  const honours = Number.isFinite(got) && Number.isFinite(total) && total > 0 && got === total;
  const naam = titleCaseName(certificaat.volledige_naam, ct("cert.participant"));
  const academyLabel = academy ? academyName(academy, certLang) : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // Competenties horen bij de diersoort van dit certificaat, niet bij één academie.
  const modules = academyModules(academy?.slug, certLang);
  // Publieke verificatiepagina — altijd de canonieke URL, ook op papier.
  const verifyUrl = certVerifyUrl(certificaat.public_token, certificaat.id);
  // QR op het A4-certificaat verwijst naar de leesbare, officiële code-URL,
  // ondertekend met een servergeheim zodat vervalsing onmogelijk is.
  const qrUrl = certVerifyCodeUrl(code, data.qr_sig);
  const linkedinUrl =
    "https://www.linkedin.com/profile/add?" +
    new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: `${academyLabel} Academy — Maximilien`,
      organizationName: "Maximilien",
      issueYear: String(dt.getFullYear()),
      issueMonth: String(dt.getMonth() + 1),
      certUrl: verifyUrl,
      certId: code,
    }).toString();

  /**
   * Open Badges v2.0 (JSON-LD): downloadt een "Assertion" die de houder kan
   * uploaden bij Youthpass of een badge-backpack. Volledig client-side, zodat
   * er niets aan de bestaande academy-logica verandert.
   */
  const onOpenBadge = () => {
    const assertion = {
      "@context": "https://w3id.org/openbadges/v2",
      type: "Assertion",
      id: verifyUrl,
      issuedOn: dt.toISOString(),
      recipient: { type: "id", hashed: false, identity: naam },
      verification: { type: "HostedBadge" },
      evidence: verifyUrl,
      badge: {
        type: "BadgeClass",
        // Een badge blijft jaren geldig: altijd het canonieke domein, nooit
        // het toevallige adres van deze browsersessie.
        id: `${CANONICAL_SITE_URL}/academy`,
        name: `${academyLabel} Academy`,
        description: formatT(ct("cert.completedBody"), { name: academyLabel }),
        image: `${CANONICAL_SITE_URL}/favicon.ico`,
        criteria: { narrative: `${ct("cert.score")} ${certificaat.score}` },
        issuer: {
          type: "Profile",
          id: CANONICAL_SITE_URL,
          name: "Maximilien",
          url: CANONICAL_SITE_URL,
        },
      },
    };
    const blob = new Blob([JSON.stringify(assertion, null, 2)], {
      type: "application/ld+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openbadge-${code}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("cert.actions.badgeDone"));
  };

  const flip = () => {
    setSide((s) => (s === "front" ? "back" : "front"));
    setFlipping(true);
    window.setTimeout(() => setFlipping(false), 820);
  };

  const onShare = async () => {
    const shareData = { title: `${academyLabel} Academy`, url: verifyUrl };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* gebruiker annuleerde het delen — val terug op kopiëren */
    }
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success(t("cert.shareCopied"));
    } catch {
      window.prompt("Kopieer de link naar je certificaat:", verifyUrl);
    }
  };

  /**
   * Print/PDF: printen gebeurt op deze pagina zelf (geen pop-up, zodat het ook
   * op mobiel werkt). De @media print regels in styles.css verbergen de UI en
   * schalen het certificaat naar een volledig A4-liggend blad.
   */

  const onPrint = () => {
    setSide("front");
    // Geen pop-up: we printen de huidige pagina en laten @media print CSS
    // de UI verbergen en het certificaat op A4-liggend schalen.
    window.setTimeout(() => window.print(), 80);
  };

  /**
   * Download: exporteert voor- én achterzijde als een echte A4-liggende PDF.
   * Het vaste 1123x794-canvas heeft exact de A4-liggende verhouding, dus de
   * afbeelding wordt zonder marges over het volledige blad geplaatst
   * (0,0 → 297x210 mm) en niet naar de linkerbovenhoek geschaald.
   */
  const onDownload = async () => {
    const pages = Array.from(
      document.querySelectorAll<HTMLElement>("#certificate-print-area .cert-page .cert-scale"),
    );
    if (!pages.length) return;
    setDownloading(true);
    const loading = toast.loading(t("cert.downloading"));
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const W = pdf.internal.pageSize.getWidth(); // 297
      const H = pdf.internal.pageSize.getHeight(); // 210

      for (let i = 0; i < pages.length; i += 1) {
        const dataUrl = await toPng(pages[i], {
          pixelRatio: 2.4,
          cacheBust: true,
          backgroundColor: "#FDFBF7",
          width: 1123,
          height: 794,
          style: {
            transform: "none",
            transformOrigin: "top left",
            margin: "0",
            width: "1123px",
            height: "794px",
          },
        });
        if (i > 0) pdf.addPage("a4", "landscape");
        pdf.addImage(dataUrl, "PNG", 0, 0, W, H, undefined, "FAST");
      }

      pdf.save(`certificaat-${code}.pdf`);
      toast.success(t("cert.pdfDone"), { id: loading });
    } catch {
      toast.error(t("cert.downloadFail"), { id: loading });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-[#111A15] dark:text-[#E6E4DD] print:bg-white">
      <div className="no-print">
        <NavHeader />
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8 print:px-0 print:py-0">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/mijn-hoefjes"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> {t("cert.backBadges")}
          </Link>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={flip}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-muted"
            >
              <RotateCw className="h-4 w-4" />{" "}
              {side === "front" ? t("cert.side.back") : t("cert.side.front")}
            </button>
          </div>
        </div>

        {/* Taalkeuze — enkel voor het certificaat en de PDF, niet voor de site */}
        <div className="no-print mb-4 flex flex-col items-center justify-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {t("cert.lang.label")}
            </span>
            <div
              role="group"
              aria-label={t("cert.lang.label")}
              className="inline-flex overflow-hidden rounded-full border border-border bg-muted/50 p-1"
            >
              {(["nl", "fr", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setCertLang(l)}
                  aria-pressed={certLang === l}
                  className={
                    "min-h-[36px] min-w-[52px] rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors " +
                    (certLang === l
                      ? "bg-[color:var(--surface-forest)] text-[color:var(--color-cream)]"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("cert.lang.hint")}</p>
        </div>

        <CertViewport side={side} onFlip={flip} flipping={flipping}>
          <CertificateFront
            academy={academy}
            academyLabel={academyLabel}
            naam={naam}
            score={certificaat.score}
            datum={datum}
            code={code}
            volgnummer={certificaat.volgnummer}
            qrUrl={qrUrl}
            certLang={certLang}
          />

          <div className="certificate-page-break" aria-hidden="true" />

          <article
            data-side="back"
            style={{ colorScheme: "light" }}
            data-static-theme="light"
            className={
              "cert-page cert-isolate cert-frame relative select-text overflow-hidden rounded-none bg-[#FDFBF7] text-[#1A2E1E] print:shadow-none"
            }
          >
            <div className="cert-scale cert-back relative overflow-hidden bg-[#FDFBF7]">
              <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-[0.06]">
                <MLogo variant="brand" className="h-[70%] w-auto" />
              </div>
              <div className="absolute inset-4 border-2 border-[#7a6f4a]" />
              <div className="absolute inset-6 border border-[#a8985f]" />
              <BotanicalCorners />

              <div className="relative z-10 flex h-full flex-col justify-between px-24 py-12 text-left text-[#1A2E1E]">
                <header className="text-center">
                  <p className="font-certificate text-[10px] font-semibold uppercase tracking-[0.45em] text-[#7a6f4a]">
                    {ct("cert.back.title")}
                  </p>
                  <div className="mx-auto mt-3 h-px w-40 bg-[#a8985f]" />
                  <h2 className="font-certificate mt-4 text-3xl italic text-[#3b3b2f]">
                    {academyLabel} Academy
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-[#3b3b2f]">
                    {ct("cert.back.intro")}
                  </p>
                </header>

                {/* Modules / competenties — dynamisch per diersoort */}
                <ol className="mx-auto w-full max-w-3xl space-y-3">
                  {modules.map((m, i) => (
                    <li
                      key={m.titel}
                      className="flex items-start gap-4 border-b border-[#a8985f]/50 pb-3"
                    >
                      <span className="font-certificate mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#C85A32] text-sm text-[#C85A32]">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-[#2b2b22]">
                          {m.titel}
                        </span>
                        <span className="block text-[12px] leading-relaxed text-[#3b3b2f]">
                          {m.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>

                {/* Uitreiking + verificatie */}
                <div className="grid w-full grid-cols-[1.6fr_1fr] items-end gap-10">
                  {/* Digitale uitreiking — enkel voor de digitale versie & PDF */}
                  <div className="rounded-md border border-[#1b382b]/60 p-4 print:hidden">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#1b382b]">
                      {ct("cert.digital.title")}
                    </p>
                    <p className="mt-3 text-[12px] text-[#3b3b2f]">
                      {ct("cert.digital.place")}{" "}
                      <span className="font-certificate text-[13px] text-[#1b382b]">{datum}</span>
                    </p>
                    <div className="mt-2 flex items-end gap-6">
                      <div className="min-w-0 flex-1">
                        <Signature className="h-12 w-44" />
                        <div className="border-b border-[#7a6f4a]" />
                        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#7a6f4a]">
                          {ct("cert.issue.signature")} · {ct("cert.signatureRole")}
                        </p>
                      </div>
                      <div className="w-[7.5rem] shrink-0">
                        <RubberStamp seed={code} className="h-[4.75rem] w-full opacity-70" />
                        <p className="mt-1 text-center text-[8px] uppercase tracking-[0.2em] text-[#7a6f4a]">
                          {ct("cert.digital.stamp")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fysieke uitreiking — enkel op de geprinte versie */}
                  <div className="hidden rounded-md border border-[#7a6f4a] p-4 print:block">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#7a6f4a]">
                      {ct("cert.issue.title")}
                    </p>
                    <p className="mt-3 text-[12px] text-[#3b3b2f]">
                      {ct("cert.issue.place")}{" "}
                      <span className="tracking-[0.2em] text-[#7a6f4a]">____ / ____ / ______</span>
                    </p>
                    <div className="mt-4 flex items-end gap-6">
                      <div className="flex-1">
                        <div className="h-8 border-b border-dashed border-[#7a6f4a]" />
                        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#7a6f4a]">
                          {ct("cert.issue.signature")}
                        </p>
                      </div>
                      <div className="w-[7.5rem] shrink-0">
                        <div className="grid h-[4.5rem] w-full place-items-center rounded-sm border border-dashed border-[#7a6f4a]/70 text-center text-[8px] leading-tight text-[#7a6f4a]/80">
                          {ct("cert.issue.stamp")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="bg-white p-1.5 ring-1 ring-[#a8985f]">
                      <CertificateQR value={qrUrl} size={80} />
                    </span>
                    <p className="mt-2 text-center text-[8px] uppercase tracking-[0.2em] text-[#7a6f4a]">
                      {ct("cert.verifyHint")}
                    </p>
                    <p className="font-certificate text-[13px] tabular-nums text-[#2b2b22] select-text">
                      #{code}
                    </p>
                  </div>
                </div>

                {/* Partners & erkenningen — monochroom */}
                <div className="w-full border-t border-[#a8985f] pt-4">
                  <p className="text-center text-[8px] font-semibold uppercase tracking-[0.3em] text-[#7a6f4a]">
                    {ct("cert.partners")}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-10 opacity-70 grayscale">
                    <img loading="lazy" onError={handleImageError}
                      src={brusselsLogo}
                      alt="Stad Brussel / Ville de Bruxelles"
                      className="h-8 w-auto"
                    />
                    <img loading="lazy" onError={handleImageError} src={leefmilieuLogo} alt="Leefmilieu Brussel" className="h-8 w-auto" />
                    <MLogo variant="brand" className="h-8 w-auto" />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </CertViewport>

        <p className="no-print mb-10 mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          {formatT(t("cert.footer"), {
            nr,
            ord: ordinal(certificaat.volgnummer, lang),
            name: academy ? academyName(academy, lang) : "",
          })}
        </p>

        {/* Deel je resultaat — PDF, LinkedIn, Open Badge en delen */}
        <section className="no-print mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {t("cert.actions.title")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-sm font-medium text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)] disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}{" "}
              {t("cert.actions.pdf")}
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]"
            >
              <Printer className="h-4 w-4" /> {t("cert.print")}
            </button>

            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]"
            >
              <Linkedin className="h-4 w-4" /> {t("cert.actions.linkedin")}
              <span className="font-mono text-xs text-muted-foreground">#{code}</span>
            </a>
            <button
              type="button"
              onClick={onOpenBadge}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]"
            >
              <Award className="h-4 w-4" /> 🇪🇺 {t("cert.actions.youthpass")}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]"
            >
              <Share2 className="h-4 w-4" /> {t("cert.actions.share")}
            </button>
          </div>
        </section>

        {/* Fysiek certificaat afhalen */}
        <section className="no-print mt-8 rounded-3xl border border-[#a8985f]/40 bg-[color:var(--surface-page)]/60 p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-terracotta)] text-white">
              <Stamp className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)]">
                {t("cert.pickup.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {t("cert.pickup.body")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setClaimed(true);
                  try {
                    if (storageKey) window.localStorage.setItem(storageKey, "1");
                  } catch {
                    /* storage geblokkeerd */
                  }
                  window.setTimeout(() => {
                    voucherRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }, 120);
                }}
                aria-pressed={claimed}
                className={
                  "group mt-5 inline-flex min-h-[48px] items-center gap-2.5 rounded-full px-7 py-3 text-[15px] font-medium tracking-[0.01em] shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)] focus-visible:ring-offset-2 " +
                  (claimed
                    ? "bg-[color:var(--color-sage)] text-[color:var(--ink-forest)]"
                    : "bg-[color:var(--surface-forest)] text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)]")
                }
              >
                {claimed ? (
                  <Check className="h-[1.05em] w-[1.05em] shrink-0" strokeWidth={2} />
                ) : (
                  <Stamp
                    className="h-[1.05em] w-[1.05em] shrink-0 opacity-70 transition-opacity duration-200 group-hover:opacity-100"
                    strokeWidth={1.75}
                  />
                )}
                <span className="leading-none">
                  {claimed ? t("cert.pickup.claimed") : t("cert.pickup.cta")}
                </span>
              </button>
            </div>
          </div>

          {claimed && (
            <div
              ref={voucherRef}
              className="mt-6 animate-fade-in overflow-hidden rounded-2xl border-2 border-dashed border-[#7a6f4a] bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <MLogo variant="brand" className="h-10 w-auto" />
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#7a6f4a]">
                    {t("cert.pickup.voucher")}
                  </p>
                  <p className="font-serif text-2xl tabular-nums text-[#2b2b22]">#{code}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-[#a8985f]/40 pt-4 text-sm text-[#2b2b22]">
                <span className="flex flex-col items-center gap-1 rounded-xl bg-white p-2 ring-1 ring-[#a8985f]">
                  <CertificateQR value={qrUrl} size={96} />
                  {certificaat.short_code ? (
                    <span className="font-mono text-sm font-semibold tracking-[0.3em] text-[#2b2b22]">
                      {certificaat.short_code}
                    </span>
                  ) : null}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{naam}</p>
                  <p className="mt-1 text-xs text-[#5c5a4e]">
                    {academy ? academyName(academy, lang) : ""} Academy · {datum}
                  </p>
                  <p className="mt-3 text-xs italic text-[color:var(--color-terracotta)]">
                    {t("cert.pickup.show")}
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 border-t border-[#a8985f]/40 pt-4 text-sm text-[#2b2b22] sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]" />
                  <span>
                    <dt className="text-[10px] uppercase tracking-[0.22em] text-[#7a6f4a]">
                      {t("cert.pickup.locationLabel")}
                    </dt>
                    <dd>{t("cert.pickup.location")}</dd>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]" />
                  <span>
                    <dt className="text-[10px] uppercase tracking-[0.22em] text-[#7a6f4a]">
                      {t("cert.pickup.hoursLabel")}
                    </dt>
                    <dd>{t("cert.pickup.hours")}</dd>
                  </span>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => toast.success(t("cert.pickup.emailSent"))}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#7a6f4a] px-6 text-sm font-medium text-[#2b2b22] transition-colors hover:bg-[color:var(--color-sage)]/40"
              >
                <Mail className="h-4 w-4" /> {t("cert.pickup.email")}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
