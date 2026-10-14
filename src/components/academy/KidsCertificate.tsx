import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Printer, Download, Loader2, LogIn } from "lucide-react";
import { CertificateQR } from "@/components/CertificateQR";
import { kidsVerifyUrl } from "@/lib/kids-cert";
import { localeFor, type Lang } from "@/lib/i18n";
import {
  CrayonFrame,
  DonkeyArt,
  GoatArt,
  GuineaPigArt,
  KIDS_PALETTE,
  KidsWaxSeal,
  RabbitArt,
} from "@/components/academy/KidsFarmArt";

/**
 * Kinderdiploma "Junior Boerderij Expert".
 *
 * Technisch identiek aan het volwassen certificaat (vast 1123x794-canvas =
 * exact A4-liggend, `#certificate-print-area` voor de printregels, PDF-export
 * via html-to-image + jsPDF), maar visueel volledig speels en handgetekend.
 * Inloggen is nooit verplicht: het diploma is meteen zichtbaar, printbaar en
 * downloadbaar.
 */

const COPY: Record<
  Lang,
  {
    kicker: string;
    title: string;
    subtitle: string;
    awarded: string;
    quizLabel: string;
    dateLabel: string;
    scoreLabel: string;
    codeLabel: string;
    verify: string;
    issuer: string;
    print: string;
    download: string;
    downloading: string;
    pdfDone: string;
    pdfFail: string;
    saveHint: string;
    saveCta: string;
    namePlaceholder: string;
  }
> = {
  nl: {
    kicker: "Maximilien",
    title: "JUNIOR BOERDERIJ EXPERT",
    subtitle: "Diploma Dierenvriend",
    awarded: "Dit diploma is met trots uitgereikt aan",
    quizLabel: "Voltooide quiz",
    dateLabel: "Datum",
    scoreLabel: "Score",
    codeLabel: "Diplomanummer",
    verify: "Scan om te controleren",
    issuer: "Officieel Junior Boerderij Diploma",
    print: "Diploma printen",
    download: "Download als PDF",
    downloading: "Diploma wordt gemaakt…",
    pdfDone: "Je diploma is gedownload!",
    pdfFail: "Downloaden lukte niet. Probeer opnieuw.",
    saveHint: "Wil je dit diploma bewaren op je account?",
    saveCta: "Optioneel inloggen",
    namePlaceholder: "Boerderijheld",
  },
  fr: {
    kicker: "Maximilien",
    title: "JEUNE EXPERT DE LA FERME",
    subtitle: "Diplôme Ami des Animaux",
    awarded: "Ce diplôme est fièrement remis à",
    quizLabel: "Quiz terminé",
    dateLabel: "Date",
    scoreLabel: "Score",
    codeLabel: "Numéro du diplôme",
    verify: "Scanne pour vérifier",
    issuer: "Diplôme officiel Junior de la Ferme",
    print: "Imprimer le diplôme",
    download: "Télécharger en PDF",
    downloading: "Création du diplôme…",
    pdfDone: "Ton diplôme est téléchargé !",
    pdfFail: "Le téléchargement a échoué. Réessaie.",
    saveHint: "Tu veux garder ce diplôme sur ton compte ?",
    saveCta: "Connexion facultative",
    namePlaceholder: "Héros de la ferme",
  },
  en: {
    kicker: "Maximilien",
    title: "JUNIOR FARM EXPERT",
    subtitle: "Animal Friend Diploma",
    awarded: "This diploma is proudly awarded to",
    quizLabel: "Completed quiz",
    dateLabel: "Date",
    scoreLabel: "Score",
    codeLabel: "Diploma number",
    verify: "Scan to verify",
    issuer: "Official Junior Farm Diploma",
    print: "Print diploma",
    download: "Download as PDF",
    downloading: "Creating your diploma…",
    pdfDone: "Your diploma has been downloaded!",
    pdfFail: "Download failed. Please try again.",
    saveHint: "Want to keep this diploma on your account?",
    saveCta: "Optional sign in",
    namePlaceholder: "Farm hero",
  },
};

export type KidsCertificateProps = {
  /** Voornaam of bijnaam van het kind (mag leeg blijven). */
  naam: string;
  /** Naam van de academie/diersoort, bv. "Cavia". */
  academyLabel: string;
  /** Volledige quiztitel, bv. "Cavia & Dierenverzorging Masterclass". */
  quizTitel: string;
  ok: number;
  totaal: number;
  /** ISO-datum (YYYY-MM-DD). */
  datum: string;
  /** Leesbare code, bv. KND-2026-0042. */
  code: string;
  lang: Lang;
  /** Toont de vrijblijvende inlogsuggestie onder de knoppen. */
  showLoginHint?: boolean;
};

export function KidsCertificate({
  naam,
  academyLabel,
  quizTitel,
  ok,
  totaal,
  datum,
  code,
  lang,
  showLoginHint = true,
}: KidsCertificateProps) {
  const c = COPY[lang] ?? COPY.nl;
  const frameRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Houdt het vaste 1123x794-canvas altijd exact binnen de kaartbreedte.
  useEffect(() => {
    const el = frameRef.current;
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

  const displayName = naam.trim() || c.namePlaceholder;
  const dateLabel = new Date(datum).toLocaleDateString(localeFor(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const onPrint = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => window.print(), 80);
  };

  const onDownload = async () => {
    const page = document.querySelector<HTMLElement>(
      "#certificate-print-area .cert-page .cert-scale",
    );
    if (!page) return;
    setDownloading(true);
    const loading = toast.loading(c.downloading);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const dataUrl = await toPng(page, {
        pixelRatio: 2.4,
        cacheBust: true,
        backgroundColor: KIDS_PALETTE.cream,
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
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        undefined,
        "FAST",
      );
      pdf.save(`diploma-${code}.pdf`);
      toast.success(c.pdfDone, { id: loading });
    } catch {
      toast.error(c.pdfFail, { id: loading });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div
        id="certificate-print-area"
        className="cert-reveal-kids mx-auto w-full max-w-3xl overflow-hidden rounded-3xl shadow-[0_14px_40px_rgba(0,0,0,0.10)] print:max-w-none print:rounded-none print:shadow-none"
      >
        <div ref={frameRef} className="cert-isolate cert-frame cert-page relative">
          <div className="cert-scale" style={{ backgroundColor: KIDS_PALETTE.cream }}>
            {/* Achtergrond: zacht papier met heuvels en zon */}
            <svg viewBox="0 0 1123 794" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <rect width="1123" height="794" fill={KIDS_PALETTE.cream} />
              <circle cx="960" cy="150" r="72" fill={KIDS_PALETTE.sun} opacity="0.35" />
              <path
                d="M0 660 C 180 600 300 700 480 660 C 660 620 820 700 1123 640 L 1123 794 L 0 794 Z"
                fill={KIDS_PALETTE.green}
                opacity="0.22"
              />
              <path
                d="M0 720 C 220 680 420 760 620 720 C 820 680 980 760 1123 720 L 1123 794 L 0 794 Z"
                fill={KIDS_PALETTE.deepGreen}
                opacity="0.18"
              />
              <circle cx="150" cy="120" r="10" fill={KIDS_PALETTE.sky} opacity="0.5" />
              <circle cx="200" cy="96" r="6" fill={KIDS_PALETTE.terracotta} opacity="0.5" />
              <circle cx="1010" cy="640" r="8" fill={KIDS_PALETTE.terracotta} opacity="0.4" />
            </svg>

            <CrayonFrame className="absolute inset-0 h-full w-full" />

            {/* Dieren in de hoeken */}
            <GoatArt className="absolute left-[92px] top-[470px] h-[180px] w-[180px]" />
            <DonkeyArt className="absolute left-[300px] top-[500px] h-[170px] w-[170px]" />
            <GuineaPigArt className="absolute right-[320px] top-[500px] h-[150px] w-[150px]" />
            <RabbitArt className="absolute right-[110px] top-[478px] h-[180px] w-[180px]" />

            {/* Tekstblok */}
            <div className="absolute inset-x-[200px] top-[92px] text-center">
              <p
                className="text-[15px] font-semibold uppercase"
                style={{ letterSpacing: "0.42em", color: KIDS_PALETTE.deepGreen }}
              >
                {c.kicker}
              </p>
              <h1
                className="mt-3 text-[46px] font-extrabold leading-[1.04]"
                style={{
                  color: KIDS_PALETTE.terracotta,
                  fontFamily: "'Trebuchet MS', 'Verdana', system-ui, sans-serif",
                  letterSpacing: "0.02em",
                  textShadow: `3px 3px 0 ${KIDS_PALETTE.sun}`,
                }}
              >
                {c.title}
              </h1>
              <p
                className="mt-1 text-[26px] italic"
                style={{ color: KIDS_PALETTE.green, fontFamily: "Georgia, serif" }}
              >
                {c.subtitle}
              </p>

              <p className="mt-7 text-[17px]" style={{ color: KIDS_PALETTE.ink }}>
                {c.awarded}
              </p>
              <p
                className="mt-2 text-[54px] leading-tight"
                style={{
                  color: KIDS_PALETTE.deepGreen,
                  fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                }}
              >
                {displayName}
              </p>
              <svg viewBox="0 0 600 12" className="mx-auto mt-1 h-[12px] w-[420px]" aria-hidden="true">
                <path
                  d="M4 8 C 120 2 240 12 360 6 C 450 2 540 8 596 5"
                  fill="none"
                  stroke={KIDS_PALETTE.sun}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>

              <p className="mt-6 text-[20px] font-semibold" style={{ color: KIDS_PALETTE.ink }}>
                {quizTitel}
              </p>
              <p className="mt-1 text-[15px]" style={{ color: KIDS_PALETTE.ink, opacity: 0.8 }}>
                {c.scoreLabel}: {ok}/{totaal} · {c.dateLabel}: {dateLabel} · {academyLabel} Academy
              </p>
            </div>

            {/* Stempel */}
            <KidsWaxSeal
              className="absolute right-[62px] top-[104px] h-[136px] w-[136px] -rotate-6"
              label={lang === "fr" ? "OFFICIEL" : "OFFICIEEL"}
              sub="FERME MAXIMILIEN"
            />

            {/* QR + code */}
            <div className="absolute bottom-[74px] left-[96px] flex items-center gap-4">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <CertificateQR value={kidsVerifyUrl(code)} size={84} title={c.verify} />
              </div>
              <div className="text-left">
                <p
                  className="text-[11px] uppercase"
                  style={{ letterSpacing: "0.22em", color: KIDS_PALETTE.deepGreen }}
                >
                  {c.codeLabel}
                </p>
                <p
                  className="font-mono text-[17px] font-bold"
                  style={{ color: KIDS_PALETTE.terracotta }}
                >
                  {code}
                </p>
                <p className="text-[11px]" style={{ color: KIDS_PALETTE.ink, opacity: 0.7 }}>
                  {c.verify}
                </p>
              </div>
            </div>

            <p
              className="absolute bottom-[78px] right-[100px] text-[12px] uppercase"
              style={{ letterSpacing: "0.2em", color: KIDS_PALETTE.deepGreen }}
            >
              {c.issuer}
            </p>
          </div>
        </div>
      </div>

      <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-7 text-sm font-semibold text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
        >
          <Printer className="h-4 w-4" /> 🖨️ {c.print}
        </button>
        <button
          type="button"
          onClick={() => void onDownload()}
          disabled={downloading}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-border bg-card px-7 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}{" "}
          📥 {c.download}
        </button>
      </div>

      {showLoginHint && (
        <p className="no-print mt-4 text-center text-xs text-muted-foreground">
          {c.saveHint}{" "}
          <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
            <LogIn className="h-3 w-3" /> {c.saveCta}
          </Link>
        </p>
      )}
    </div>
  );
}
