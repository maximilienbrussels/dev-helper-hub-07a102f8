/**
 * De voorzijde van het A4-certificaat (vast canvas 1123x794).
 *
 * Gedeeld tussen de certificaatpagina van de deelnemer en het afdrukken aan
 * de balie, zodat papier en scherm exact hetzelfde blad tonen.
 */
import { CertificateQR } from "@/components/CertificateQR";
import { OfficialSeal } from "@/components/OfficialSeal";
import { Signature } from "@/components/Signature";
import { AnimalIcon } from "@/lib/animal-glyph";
import { formatT, tFor, type Lang } from "@/lib/i18n";

export type CertificateFrontData = {
  academy: { slug: string; badge_icon: string | null } | null;
  academyLabel: string;
  naam: string;
  score: string;
  datum: string;
  code: string;
  volgnummer: number;
  qrUrl: string;
  certLang: Lang;
};

export function CertificateFront({
  academy,
  academyLabel,
  naam,
  score,
  datum,
  code,
  volgnummer,
  qrUrl,
  certLang,
}: CertificateFrontData) {
  const ct = tFor(certLang);
  const [got, total] = String(score ?? "")
    .split("/")
    .map((x) => parseInt(x, 10));
  const honours = Number.isFinite(got) && Number.isFinite(total) && total > 0 && got === total;

  return (
    <article
      data-side="front"
      style={{ colorScheme: "light" }}
      data-static-theme="light"
      className={
        "cert-reveal cert-page cert-isolate cert-frame relative select-text overflow-hidden rounded-none bg-[#FDFBF7] text-[#1A2E1E] print:shadow-none"
      }
    >
      <div className="cert-scale cert-front bg-[#FDFBF7] bg-[radial-gradient(circle_at_15%_20%,rgba(122,111,74,.06),transparent_50%),radial-gradient(circle_at_85%_80%,rgba(74,93,53,.05),transparent_55%)]">
        <BotanicalCorners />
        {/* Double border */}
        <div className="absolute inset-4 border-2 border-[#7a6f4a]" />
        <div className="absolute inset-6 border border-[#a8985f]" />

        <div className="relative z-10 flex h-full flex-col items-center justify-between px-24 py-14 text-center">
          <header>
            <p className="font-certificate text-[10px] font-semibold uppercase tracking-[0.5em] text-[#7a6f4a]">
              {ct("cert.official")}
            </p>
            <div className="mx-auto mt-3 h-px w-32 bg-[#a8985f]" />
            {academy && (
              <AnimalIcon
                slug={academy.slug}
                badgeIcon={academy.badge_icon}
                alt={academyLabel}
                className="mx-auto mt-4 h-16 w-16"
              />
            )}
            <h1 className="font-certificate mt-4 text-5xl font-medium italic text-[#3b3b2f]">
              {academyLabel || "—"} Academy
            </h1>
            <p className="mt-3 text-xs uppercase tracking-[0.35em] text-[#7a6f4a]">
              La Ferme du parc Maximilien · Bruxelles
            </p>
          </header>

          <div>
            <p className="text-sm italic text-[#3b3b2f]">{ct("cert.confirms")}</p>
            <p
              className="font-certificate mt-3 whitespace-nowrap border-b border-[#a8985f] pb-2 font-normal tracking-wide text-[#2b2b22] select-text"
              style={{ fontSize: nameFontSize(naam) }}
            >
              {naam}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3b3b2f]">
              {formatT(ct("cert.completedBody"), { name: academyLabel })}
            </p>
            <p className="mt-3 text-sm text-[#3b3b2f]">
              {ct("cert.score")} <strong>{score}</strong>
            </p>
            {honours && <ScoreRibbon label={ct("cert.honours")} />}
          </div>

          {/* Verificatie-QR, handtekening, zegel en gegevens */}
          <div className="w-full">
            <div className="flex items-end justify-between gap-6">
              {/* QR linksonder */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span className="bg-white p-1.5 ring-1 ring-[#a8985f]">
                  <CertificateQR value={qrUrl} size={62} />
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-[#7a6f4a]">
                  {ct("cert.verifyHint")}
                </span>
              </div>

              {/* Handtekening */}
              <div className="min-w-0 flex-1 text-center">
                <Signature className="mx-auto h-14 w-56" />
                <p className="font-certificate -mt-1 text-2xl italic text-[#2b2b22]">
                  {ct("cert.signature")}
                </p>
                <div className="mx-auto mt-2 h-px w-52 bg-[#a8985f]" />
                <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#7a6f4a]">
                  {ct("cert.signatureRole")}
                </p>
              </div>

              {/* Zegel rechtsonder */}
              <div className="flex shrink-0 flex-col items-center">
                <OfficialSeal className="h-32 w-32" authText={ct("cert.seal.auth")} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 items-start gap-8 border-t border-[#a8985f] pt-4 text-left text-xs text-[#3b3b2f]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#7a6f4a]">
                  {ct("cert.issuedOn")}
                </p>
                <p className="font-certificate mt-1 text-base">{datum}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#7a6f4a]">
                  {ct("cert.certNr")}
                </p>
                <p className="font-certificate mt-1 text-base tabular-nums select-text">#{code}</p>
                <p className="text-[11px] text-[#7a6f4a]">
                  {formatT(ct("cert.nthGraduate"), { ord: ordinal(volgnummer, certLang) })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Botanische hoekornamenten in goud — puur SVG zodat het zuiver print.
 * Ze zitten in de marge tússen de kaderlijnen en de tekst (z-0), zodat ze
 * nooit over "UITGEGEVEN OP" of het certificaatnummer vallen.
 */
export function BotanicalCorners() {
  const leaf = (
    <svg viewBox="0 0 120 120" className="h-16 w-16" aria-hidden="true">
      <g fill="none" stroke="#a8985f" strokeWidth="1.2" strokeLinecap="round">
        <path d="M10 110 C 30 96, 52 74, 68 44" />
        <path
          d="M24 96 c -6 -12, -2 -22, 8 -26 c 4 10, 2 20, -8 26 Z"
          fill="#a8985f"
          fillOpacity="0.18"
        />
        <path
          d="M38 78 c -7 -11, -4 -22, 6 -27 c 5 10, 3 21, -6 27 Z"
          fill="#a8985f"
          fillOpacity="0.18"
        />
        <path
          d="M52 58 c -8 -10, -6 -21, 3 -27 c 6 9, 5 20, -3 27 Z"
          fill="#a8985f"
          fillOpacity="0.18"
        />
        <circle cx="70" cy="40" r="2.4" fill="#D4AF37" stroke="none" />
      </g>
    </svg>
  );
  return (
    <div className="pointer-events-none absolute inset-8 z-0 opacity-80" aria-hidden="true">
      <span className="absolute bottom-0 left-0">{leaf}</span>
      <span className="absolute bottom-0 right-0 -scale-x-100">{leaf}</span>
      <span className="absolute left-0 top-0 -scale-y-100">{leaf}</span>
      <span className="absolute right-0 top-0 rotate-180">{leaf}</span>
    </div>
  );
}

export function ordinal(n: number, lang: string): string {
  if (lang === "en") {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  }
  if (lang === "fr") {
    return n === 1 ? "1er" : `${n}e`;
  }
  return `${n}${n === 1 ? "ste" : "de"}`;
}

/**
 * Schaalt de naam mee met de lengte, zodat ook lange namen als
 * "Jona Zeno Delplanche" nooit afbreken of over de kaderlijn lopen.
 */
export function nameFontSize(name: string): string {
  const n = name.length;
  if (n <= 18) return "2.75rem";
  if (n <= 24) return "2.35rem";
  if (n <= 30) return "2rem";
  if (n <= 38) return "1.7rem";
  return "1.45rem";
}

/** Elegant lint/badge met de score — donkergroen met terracotta staarten. */
export function ScoreRibbon({ label }: { label: string }) {
  return (
    <span className="relative mt-5 inline-flex items-stretch">
      <span
        aria-hidden="true"
        className="w-4 self-stretch bg-[#C85A32]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 45% 50%)" }}
      />
      <span className="bg-[#1E3A2B] px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FDFBF7] shadow-[0_2px_6px_rgba(30,58,43,0.28)]">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="w-4 self-stretch bg-[#C85A32]"
        style={{ clipPath: "polygon(0 0, 100% 0, 55% 50%, 100% 100%, 0 100%)" }}
      />
    </span>
  );
}
