/**
 * SeoHead — onzichtbare head-manager.
 *
 * Rendert enkel <title>, <meta>, <link> en <script type="application/ld+json">.
 * React 19 hijst deze tags automatisch naar de <head>, ook tijdens SSR, dus de
 * component kan gewoon binnen een pagina staan zonder iets zichtbaar te maken.
 */
import {
  DEFAULT_LANG,
  LANGS,
  SITE_URL,
  alternates,
  ogImageFor,
  pathFor,
  type Lang,
  type PageKey,
} from "@/lib/routes-i18n";

const OG_LOCALE: Record<Lang, string> = { nl: "nl_BE", fr: "fr_BE", en: "en_GB" };

export type SeoHeadProps = {
  /** Pagina-sleutel; bepaalt canonical en hreflang-varianten. */
  page: PageKey;
  lang: Lang;
  title: string;
  description: string;
  /** Sub-pagina (bv. animatie-id) of nieuws-id voor de juiste canonical. */
  subId?: string;
  newsId?: string;
  /** Absolute of site-relatieve afbeelding; valt terug op de pagina-OG. */
  image?: string;
  type?: "website" | "article" | "event" | "product";
  noindex?: boolean;
  /** Eén of meerdere JSON-LD documenten. */
  jsonLd?: unknown | unknown[];
};

/** Absolute URL van deze pagina in de actieve taal. */
export function canonicalFor(
  page: PageKey,
  lang: Lang,
  opts: { subId?: string; newsId?: string } = {},
): string {
  const alts = alternates(page, opts);
  return `${SITE_URL}${alts[lang] ?? pathFor(page, lang)}`;
}

export function SeoHead({
  page,
  lang,
  title,
  description,
  subId,
  newsId,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  const opts = { ...(subId ? { subId } : {}), ...(newsId ? { newsId } : {}) };
  const alts = alternates(page, opts);
  const canonical = `${SITE_URL}${alts[lang]}`;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : ogImageFor(page);
  const docs = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex,follow" /> : null}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={OG_LOCALE[lang]} />
      {LANGS.filter((l) => l !== lang).map((l) => (
        <meta key={l} property="og:locale:alternate" content={OG_LOCALE[l]} />
      ))}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <link rel="canonical" href={canonical} />
      {LANGS.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={`${SITE_URL}${alts[l]}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${alts[DEFAULT_LANG]}`} />

      {docs.map((doc, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}

/** Losse JSON-LD injectie wanneer de meta-tags al elders staan. */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const docs = Array.isArray(data) ? data : [data];
  return (
    <>
      {docs.map((doc, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}

export default SeoHead;
