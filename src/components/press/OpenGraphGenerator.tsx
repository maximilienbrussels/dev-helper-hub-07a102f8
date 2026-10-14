/**
 * OpenGraphGenerator — interactieve link-previewkiezer.
 *
 * Toont per pagina en per platform hoe een gedeelde link van de site rendert,
 * met de exacte deellink en de share-afbeelding (1200 × 630) om te downloaden.
 */
import { useMemo, useState } from "react";
import { Check, Copy, Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  OG_IMAGES,
  OG_IMAGE_FALLBACK,
  PAGE_META,
  SITE_URL,
  pathFor,
  type PageKey,
} from "@/lib/routes-i18n";

type Lang = "nl" | "fr" | "en";
type T3 = Record<Lang, string>;

const ROUTES: { key: PageKey; label: T3 }[] = [
  { key: "home", label: { nl: "Hoofdpagina", fr: "Page d'accueil", en: "Home page" } },
  { key: "visit", label: { nl: "Plan je bezoek", fr: "Planifier la visite", en: "Plan your visit" } },
  { key: "academy", label: { nl: "Academy & quiz", fr: "Academy & quiz", en: "Academy & quiz" } },
  { key: "shop", label: { nl: "Hoevewinkel", fr: "Boutique fermière", en: "Farm shop" } },
  { key: "camps", label: { nl: "Programma's", fr: "Programmes", en: "Programmes" } },
  { key: "press", label: { nl: "Pers & mediakit", fr: "Presse & kit média", en: "Press & media kit" } },
];

type PlatformId = "meta" | "chat" | "x" | "story";

const PLATFORMS: { id: PlatformId; label: string; note: T3 }[] = [
  {
    id: "meta",
    label: "📘 Facebook / LinkedIn",
    note: {
      nl: "Grote banner 1200 × 630 px met domeinbadge.",
      fr: "Grande bannière 1200 × 630 px avec badge de domaine.",
      en: "Large 1200 × 630 px banner with domain badge.",
    },
  },
  {
    id: "chat",
    label: "💬 WhatsApp / iMessage",
    note: {
      nl: "Compacte kaart: beeld bovenaan, vette titel.",
      fr: "Carte compacte : image en haut, titre en gras.",
      en: "Compact card: image on top, bold title.",
    },
  },
  {
    id: "x",
    label: "🖤 X (Twitter) / Slack",
    note: {
      nl: "Summary large image card.",
      fr: "Carte summary large image.",
      en: "Summary large image card.",
    },
  },
  {
    id: "story",
    label: "📱 Instagram Story kit",
    note: {
      nl: "Verticale story 1080 × 1920 px — gebruik het beeld gecentreerd op bosgroen.",
      fr: "Story verticale 1080 × 1920 px — image centrée sur vert forêt.",
      en: "Vertical story 1080 × 1920 px — image centred on forest green.",
    },
  },
];

const COPY = {
  title: {
    nl: "Link-previews (Open Graph)",
    fr: "Aperçus de lien (Open Graph)",
    en: "Link previews (Open Graph)",
  } as T3,
  lede: {
    nl: "Kies een pagina en een platform om te zien hoe een gedeelde link eruitziet. Elke pagina heeft een eigen share-afbeelding van 1200 × 630 px.",
    fr: "Choisissez une page et une plateforme pour voir le rendu d'un lien partagé. Chaque page a sa propre image 1200 × 630 px.",
    en: "Pick a page and a platform to see how a shared link looks. Every page has its own 1200 × 630 px share image.",
  } as T3,
  page: { nl: "Pagina", fr: "Page", en: "Page" } as T3,
  copyLink: { nl: "Kopieer deellink", fr: "Copier le lien", en: "Copy share link" } as T3,
  copied: { nl: "Gekopieerd", fr: "Copié", en: "Copied" } as T3,
  downloadOg: {
    nl: "Download OG-afbeelding (1200 × 630)",
    fr: "Télécharger l'image OG (1200 × 630)",
    en: "Download OG image (1200 × 630)",
  } as T3,
};

const CARD =
  "rounded-3xl border border-border bg-[color:var(--surface-page)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]";
const BTN =
  "inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)] hover:text-[color:var(--color-terracotta)]";

export function OpenGraphGenerator({ lang }: { lang: Lang }) {
  const [route, setRoute] = useState<PageKey>("home");
  const [platform, setPlatform] = useState<PlatformId>("meta");
  const [copied, setCopied] = useState(false);

  const meta = PAGE_META[route][lang];
  const image = OG_IMAGES[route] ?? OG_IMAGE_FALLBACK;
  const shareUrl = useMemo(() => `${SITE_URL}${pathFor(route, lang)}`, [route, lang]);
  const domain = SITE_URL.replace(/^https?:\/\//, "");
  const activePlatform = PLATFORMS.find((p) => p.id === platform)!;

  function copyLink() {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success(COPY.copied[lang]);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <section id="og" className="scroll-mt-24">
      <h2 className="font-serif text-2xl text-[color:var(--ink-forest)] md:text-3xl">
        {COPY.title[lang]}
      </h2>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{COPY.lede[lang]}</p>

      <div className={`${CARD} mt-6`}>
        {/* Paginakiezer */}
        <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {COPY.page[lang]}
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value as PageKey)}
            className="mt-2 block w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground"
          >
            {ROUTES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label[lang]}
              </option>
            ))}
          </select>
        </label>

        {/* Platformtabs */}
        <div className="mt-5 flex flex-wrap gap-2" role="tablist">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={platform === p.id}
              onClick={() => setPlatform(p.id)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                platform === p.id
                  ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 text-foreground"
                  : "border-border text-foreground/90 hover:border-[color:var(--color-terracotta)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{activePlatform.note[lang]}</p>

        {/* Live preview */}
        <div className="mt-5">
          {platform === "story" ? (
            <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-3xl bg-[#1D3528] p-4">
              <div className="flex aspect-[9/16] items-center justify-center">
                <img
                  src={image}
                  alt={meta.title}
                  className="w-full rounded-xl border border-white/15"
                  loading="lazy"
                />
              </div>
              <p className="mt-3 text-center text-[11px] text-[color:var(--color-cream)]/95">
                {domain}
              </p>
            </div>
          ) : platform === "chat" ? (
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-card">
              <img src={image} alt={meta.title} className="w-full" loading="lazy" />
              <div className="p-3">
                <p className="text-sm font-semibold leading-snug text-foreground">{meta.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {meta.description}
                </p>
                <p className="mt-1 text-[11px] uppercase text-muted-foreground">{domain}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={image} alt={meta.title} className="w-full" loading="lazy" />
              <div className="border-t border-border p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {domain}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{meta.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {meta.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acties */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={copyLink} className={BTN}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />} 📋{" "}
            {COPY.copyLink[lang]}
          </button>
          <a href={image} download className={BTN}>
            <Download className="h-3.5 w-3.5" /> 📥 {COPY.downloadOg[lang]}
          </a>
          <span className="font-mono text-[11px] text-muted-foreground">{shareUrl}</span>
        </div>
      </div>
    </section>
  );
}
