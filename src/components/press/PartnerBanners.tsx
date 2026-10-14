/**
 * PartnerBanners — webbanners & partnerkit.
 *
 * Kant-en-klare bannerformaten (leaderboard, medium rectangle, social) in PNG
 * en SVG, plus een HTML-embedcode die scholen, sponsors en mediapartners op
 * hun eigen site kunnen plakken.
 */
import { useState } from "react";
import { Check, Code2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { SITE_URL } from "@/lib/routes-i18n";

type Lang = "nl" | "fr" | "en";
type T3 = Record<Lang, string>;

const COPY = {
  title: {
    nl: "Webbanners & partnerkit",
    fr: "Bannières web & kit partenaires",
    en: "Web banners & partner kit",
  } as T3,
  lede: {
    nl: "Voor scholen, sponsors en mediapartners die naar de boerderij willen linken. Download de banner of plak de embedcode op je eigen site.",
    fr: "Pour les écoles, sponsors et partenaires médias qui souhaitent créer un lien vers la ferme. Téléchargez la bannière ou collez le code d'intégration.",
    en: "For schools, sponsors and media partners linking to the farm. Download the banner or paste the embed code on your own site.",
  } as T3,
  embed: {
    nl: "Kopieer HTML-embedcode",
    fr: "Copier le code HTML",
    en: "Copy HTML embed code",
  } as T3,
  copied: { nl: "Gekopieerd", fr: "Copié", en: "Copied" } as T3,
};

const BANNERS: {
  id: string;
  name: T3;
  size: string;
  width: number;
  height: number;
  png: string;
  svg: string;
  use: T3;
}[] = [
  {
    id: "leaderboard",
    name: { nl: "Leaderboard", fr: "Leaderboard", en: "Leaderboard" },
    size: "728 × 90 px",
    width: 728,
    height: 90,
    png: "/pers/banners/banner-leaderboard-728x90.png",
    svg: "/pers/banners/banner-leaderboard-728x90.svg",
    use: {
      nl: "Ideaal voor website-headers en footers.",
      fr: "Idéal pour les en-têtes et pieds de page.",
      en: "Ideal for site headers and footers.",
    },
  },
  {
    id: "rectangle",
    name: { nl: "Medium rectangle", fr: "Medium rectangle", en: "Medium rectangle" },
    size: "300 × 250 px",
    width: 300,
    height: 250,
    png: "/pers/banners/banner-rectangle-300x250.png",
    svg: "/pers/banners/banner-rectangle-300x250.svg",
    use: {
      nl: "Ideaal voor zijbalken en widgets.",
      fr: "Idéal pour barres latérales et widgets.",
      en: "Ideal for sidebars and widgets.",
    },
  },
  {
    id: "social",
    name: { nl: "Social share banner", fr: "Bannière réseaux", en: "Social share banner" },
    size: "1200 × 630 px",
    width: 1200,
    height: 630,
    png: "/pers/banners/banner-social-1200x630.png",
    svg: "/pers/banners/banner-social-1200x630.svg",
    use: {
      nl: "Promobanner in hoge resolutie voor posts en nieuwsbrieven.",
      fr: "Bannière promo haute résolution pour posts et newsletters.",
      en: "High-res promo banner for posts and newsletters.",
    },
  },
];

function embedCode(banner: (typeof BANNERS)[number], lang: Lang): string {
  const alt = {
    nl: "Maximilien — stadsboerderij in hartje Brussel",
    fr: "Maximilien — ferme urbaine au cœur de Bruxelles",
    en: "Maximilien — city farm in the heart of Brussels",
  }[lang];
  return `<a href="${SITE_URL}" target="_blank" rel="noopener">
  <img src="${SITE_URL}${banner.png}" width="${banner.width}" height="${banner.height}" alt="${alt}" style="max-width:100%;height:auto;border:0" />
</a>`;
}

const CARD =
  "rounded-3xl border border-border bg-[color:var(--surface-page)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]";
const BTN =
  "inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]";

export function PartnerBanners({ lang }: { lang: Lang }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(banner: (typeof BANNERS)[number]) {
    void navigator.clipboard.writeText(embedCode(banner, lang)).then(() => {
      setCopied(banner.id);
      toast.success(COPY.copied[lang]);
      window.setTimeout(() => setCopied((c) => (c === banner.id ? null : c)), 1800);
    });
  }

  return (
    <section id="banners" className="scroll-mt-24">
      <h2 className="font-serif text-2xl text-[color:var(--ink-forest)] md:text-3xl">
        {COPY.title[lang]}
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{COPY.lede[lang]}</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {BANNERS.map((b) => (
          <article key={b.id} className={`${CARD} ${b.id === "social" ? "md:col-span-2" : ""}`}>
            <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#1D3528] p-3">
              <img
                src={b.png}
                alt={b.name[lang]}
                width={b.width}
                height={b.height}
                loading="lazy"
                className="h-auto w-full max-w-full"
              />
            </div>
            <h3 className="mt-4 font-serif text-lg text-[color:var(--ink-forest)]">
              {b.name[lang]} · {b.size}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.use[lang]}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={b.png} download className={BTN}>
                <Download className="h-3.5 w-3.5" /> PNG
              </a>
              <a href={b.svg} download className={BTN}>
                <Download className="h-3.5 w-3.5" /> SVG
              </a>
              <button type="button" onClick={() => copy(b)} className={BTN}>
                {copied === b.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Code2 className="h-3.5 w-3.5" />
                )}{" "}
                📋 {COPY.embed[lang]}
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-border bg-black/[0.04] p-3 text-[11px] leading-relaxed text-foreground/90">
              <code>{embedCode(b, lang)}</code>
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}
