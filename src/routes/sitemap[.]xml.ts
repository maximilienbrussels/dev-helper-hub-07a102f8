import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  ANIMATION_SLUGS,
  DEFAULT_LANG,
  LANGS,
  NEWS,
  SITE_URL,
  SLUGS,
  SUB_SLUGS,
  alternates,
  pathFor,
  subPathFor,
  type PageKey,
} from "@/lib/routes-i18n";

const PUBLIC_PAGES: PageKey[] = [
  "home",
  "visit",
  "animals",
  "education",
  "animations",
  "camps",
  "rental",
  "teambuilding",
  "seminars",
  "compost",
  "support",
  "news",
  "about",
  "contact",
  "privacy",
  "terms",
  "shop",
  "partners",
  "social",
  "faq",
  "events",
  "volunteers",
  "jobs",
  "resources",
  "transparency",
  "legal",
  "cookies",
  "status",
  "press",
  "fairtech",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        type Entry = {
          loc: string;
          alts: Record<string, string>;
          priority: string;
          lastmod?: string;
        };
        const entries: Entry[] = [];

        /**
         * Laatste wijzigingen uit de databank (Neon). Ontbreekt de databank of
         * een tabel, dan blijft de sitemap gewoon geldig — enkel zonder
         * <lastmod> voor die pagina's.
         */
        const dbLastmod = new Map<PageKey, string>();
        try {
          const { hasDatabase, db } = await import("@/lib/neon.server");
          if (hasDatabase()) {
            const sql = db();
            const [events, services] = await Promise.all([
              sql`select max(updated_at)::date as d from public.events where is_public = true`.catch(
                () => [] as { d: string | null }[],
              ),
              sql`select max(updated_at)::date as d from public.services where active = true`.catch(
                () => [] as { d: string | null }[],
              ),
            ]);
            const eventDate = (events as { d: string | null }[])[0]?.d;
            const serviceDate = (services as { d: string | null }[])[0]?.d;
            if (eventDate) {
              dbLastmod.set("events", eventDate);
              dbLastmod.set("camps", eventDate);
              dbLastmod.set("animations", eventDate);
            }
            if (serviceDate) {
              dbLastmod.set("rental", serviceDate);
              dbLastmod.set("seminars", serviceDate);
              dbLastmod.set("teambuilding", serviceDate);
            }
          }
        } catch (error) {
          console.error("[sitemap] lastmod uit databank mislukt", error);
        }
        // Pagina's die het team uitzette horen niet in de sitemap.
        const { loadSiteConfig } = await import("@/lib/site-config.server");
        const { isPageAvailable } = await import("@/lib/site-config");
        const site = await loadSiteConfig().catch(() => null);

        for (const key of PUBLIC_PAGES) {
          if (!isPageAvailable(site, key)) continue;
          const alts = alternates(key);
          for (const lang of LANGS) {
            entries.push({
              loc: pathFor(key, lang),
              alts,
              priority: key === "home" ? "1.0" : "0.8",
              lastmod: dbLastmod.get(key),
            });
          }
        }

        // Educatieve reservatie
        for (const lang of LANGS) {
          entries.push({
            loc: subPathFor("education", lang, "booking"),
            alts: alternates("education", { subId: "booking" }),
            priority: "0.7",
          });
        }

        // Vrijwilligersprofielen
        for (const id of Object.keys(SUB_SLUGS.volunteers ?? {})) {
          const alts = alternates("volunteers", { subId: id });
          for (const lang of LANGS) {
            entries.push({ loc: subPathFor("volunteers", lang, id), alts, priority: "0.7" });
          }
        }

        // Detailpagina's per schoolanimatie
        for (const id of Object.keys(ANIMATION_SLUGS)) {
          const alts = alternates("animations", { subId: id });
          for (const lang of LANGS) {
            entries.push({ loc: subPathFor("animations", lang, id), alts, priority: "0.7" });
          }
        }

        // Nieuwsitems
        for (const item of NEWS) {
          const alts = alternates("news", { newsId: item.id });
          for (const lang of LANGS) {
            entries.push({
              loc: pathFor("news", lang, item.slug[lang]),
              alts,
              priority: "0.6",
               lastmod: Number.isNaN(Date.parse(item.date)) ? undefined : item.date,
            });
          }
        }

        const urls = entries.map((e) => {
          const links = LANGS.map(
            (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${e.alts[l]}"/>`,
          ).join("");
          return (
            `  <url><loc>${SITE_URL}${e.loc}</loc>` +
            links +
            `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${e.alts[DEFAULT_LANG]}"/>` +
            (e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "") +
            `<changefreq>weekly</changefreq><priority>${e.priority}</priority></url>`
          );
        });

        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
          urls.join("\n") +
          `\n</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

void SLUGS;
