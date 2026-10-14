import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import {
  DEFAULT_LANG,
  PAGE_META,
  aliasToKey,
  pathFor,
  isLang,
  localizedHead,
  newsBySlug,
  slugToKey,
  subSlugToId,
  subPathFor,
  SITE_URL,
  type Lang,
  type PageKey,
} from "@/lib/routes-i18n";
import { VisitPage } from "@/pages/visit";
import { AnimalsPage, animalsQO } from "@/pages/animals";
import { AnimalPassportPage as AnimalDetailPage } from "@/pages/animal-passport";
import { EducationPage, EducationBookingPage } from "@/pages/education";
import { NewsPage, NewsDetailPage } from "@/pages/news";
import { SupportPage } from "@/pages/support";
import { SponsorPage } from "@/pages/sponsor";
import { AboutPage } from "@/pages/about";
import { ContactPage } from "@/pages/contact";
import { PrivacyPage } from "@/pages/privacy";
import { TermsPage } from "@/pages/terms";
import { CookiesPage } from "@/pages/cookies";
import { StatusPage } from "@/pages/status";
import { FairTechPage } from "@/pages/fairtech";
import { MijnHoefjes, academiesQO } from "@/pages/pass";
import { AcademyIndex } from "@/pages/academy-list";
import { AcademyQuiz } from "@/pages/academy-quiz";
import { academiesQO as publicAcademiesQO } from "@/lib/academy-query";
import { LoginPage } from "@/pages/login";
import { AccountPage } from "@/pages/account";
import { RentalPage } from "@/pages/rental";
import { CampsPage } from "@/pages/camps";
import { CompostPage } from "@/pages/compost";
import { TeamBuildingPage } from "@/pages/teambuilding";
import { SeminarsPage } from "@/pages/seminars";
import { AnimationsIndexPage, AnimationDetailPage } from "@/pages/animations";
import type { AnimationSlug } from "@/lib/school-animations";
import { getAnimation } from "@/lib/school-animations";
import { courseJsonLd, fairtechJsonLd, faqJsonLd } from "@/lib/seo-jsonld";
import { FAQ_SECTIONS } from "@/lib/faq-content";
import { ShopPage, productsQO } from "@/pages/shop";
import { ProductDetailPage } from "@/pages/product";
import { PartnersPage } from "@/pages/partners";
import { SocialPage } from "@/pages/social";
import { RegisterPage } from "@/pages/register";
import { FaqPage } from "@/pages/faq";
import { TransparencyPage } from "@/pages/transparency";
import { LegalPage } from "@/pages/legal";
import { ResourcesPage } from "@/pages/resources";
import { JobsPage } from "@/pages/jobs";
import { VolunteersPage, VolunteerProfilePage } from "@/pages/volunteers";
import { EventsPage } from "@/pages/events";
import { PressPage } from "@/pages/press";
import {
  pageFromSlug as portalPageFromSlug,
  PAGE_META as PORTAL_PAGE_META,
  type PortalPage,
} from "@/lib/portal-routes";
import { PortalRoot } from "@/components/portal/PortalRoot";
import { siteConfigQuery } from "@/lib/use-site-config";
import { DEFAULT_SITE_CONFIG, effectivePageStatus, pageNotice } from "@/lib/site-config";
import { MaintenanceScreen, PageUnavailable } from "@/components/PageUnavailable";

type Resolved = { lang: Lang; key: PageKey; sub?: string; portal?: PortalPage };

/** Beheerportaal: /nl/vandaag, /fr/demandes, /en/today … (alleen maximilien.site). */
function resolvePortal(langParam: string, splat: string | undefined): PortalPage | null {
  if (!isLang(langParam)) return null;
  const parts = (splat ?? "").split("/").filter(Boolean);
  if (parts.length !== 1 || !parts[0]) return null;
  return portalPageFromSlug(langParam, parts[0]);
}

function resolve(langParam: string, splat: string | undefined): Resolved {
  if (!isLang(langParam)) throw notFound();
  const portal = resolvePortal(langParam, splat);
  if (portal) return { lang: langParam, key: "home", portal };
  const parts = (splat ?? "").split("/").filter(Boolean);
  // Alternatieve, kortere adressen (bv. /nl/webshop, /fr/compte, /en/rentals)
  // sturen door naar de canonieke gelokaliseerde URL.
  if (parts[0]) {
    const alias = aliasToKey(langParam, parts[0]);
    if (alias) {
      throw redirect({ href: pathFor(alias, langParam, parts[1]), replace: true });
    }
  }
  const key = parts[0] ? slugToKey(langParam, parts[0]) : "home";
  if (!key || parts.length > 2) throw notFound();
  return { lang: langParam, key, sub: parts[1] };
}

export const Route = createFileRoute("/$lang/$")({
  // Loaders + head op de server, zodat elke pagina een eigen deelvoorbeeld heeft.
  ssr: "data-only",
  loader: async ({ params, context }) => {
    const { lang, key, sub, portal } = resolve(params.lang, params._splat);
    if (portal) return { lang, key, portal };
    // Fail-safe: een databasefout tijdens SSR mag de pagina niet laten crashen.
    function safe<T>(p: Promise<T>): Promise<T | null> {
      return p.catch((err) => {
        console.error("SSR data loading warning:", err);
        return null;
      });
    }
    // Sitebeheer: onderhoudsmodus en pagina's die het team tijdelijk uitzette.
    const site =
      (await safe(context.queryClient.ensureQueryData(siteConfigQuery))) ?? DEFAULT_SITE_CONFIG;
    if (site.maintenance.enabled && key !== "login" && key !== "account") {
      const message =
        site.maintenance.message[lang] || site.maintenance.message.nl || "";
      return { lang, key, sub, blocked: "maintenance" as const, notice: message };
    }
    const status = effectivePageStatus(site, key);
    if (status === "offline") throw notFound();
    if (status === "hidden") {
      return { lang, key, sub, blocked: "hidden" as const, notice: pageNotice(site, key, lang) };
    }

    if (key === "animals") await safe(context.queryClient.ensureQueryData(animalsQO));

    if (key === "shop" || key === "product") await safe(context.queryClient.ensureQueryData(productsQO));
    if (key === "product" && !sub) throw notFound();
    if (key === "pass") await safe(context.queryClient.ensureQueryData(academiesQO));
    if (key === "news" && sub && !newsBySlug(lang, sub)) throw notFound();
    if (key === "academy") {
      const academies = (await safe(context.queryClient.ensureQueryData(publicAcademiesQO))) ?? [];
      if (sub) {
        const found = academies.find((a) => a.slug === sub);
        if (!found) throw notFound();
        return { lang, key, sub, academyName: found.diersoort_naam };
      }
    }
    if (key === "education" && sub && !subSlugToId("education", lang, sub)) throw notFound();
    if (key === "volunteers" && sub) {
      const id = subSlugToId("volunteers", lang, sub);
      if (!id) throw notFound();
      return { lang, key, sub, volunteerId: id };
    }
    if (key === "animations" && sub) {
      const id = subSlugToId("animations", lang, sub);
      if (!id) throw notFound();
      return { lang, key, sub, animationId: id };
    }
    return { lang, key, sub };
  },
  head: ({ params, loaderData }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
    const portal = resolvePortal(params.lang, params._splat);
    if (portal) {
      const meta = PORTAL_PAGE_META[portal];
      return {
        meta: [
          { title: meta.title },
          { name: "description", content: meta.description },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    // loaderData kan (tijdens streaming SSR) nog ontbreken: dan uit de URL afleiden.
    const fromParams = (() => {
      const parts = String(params._splat ?? "")
        .split("/")
        .filter(Boolean);
      const k = parts[0] ? slugToKey(lang, parts[0]) : "home";
      return k ? { key: k, sub: parts[1] } : null;
    })();
    const resolved = loaderData ?? fromParams;
    if (!resolved) {
      return {
        meta: [{ title: PAGE_META.home[lang].title }, { name: "robots", content: "noindex" }],
      };
    }
    const { key, sub } = resolved;

    if (key === "academy" && sub) {
      const name = (loaderData as { academyName?: string } | undefined)?.academyName ?? sub;
      return localizedHead("academy", lang, {
        subId: sub,
        title: `${name} Academy — Maximilien`,
        description: PAGE_META.academy[lang].description,
      });
    }
    if (key === "news" && sub) {
      const item = newsBySlug(lang, sub);
      if (item) {
        return localizedHead("news", lang, {
          title: `${item.title[lang]} — Maximilien`,
          description: item.lede[lang],
          newsId: item.id,
          type: "article",
        });
      }
    }
    if (key === "volunteers" && sub) {
      const id = subSlugToId("volunteers", lang, sub);
      if (id) return localizedHead("volunteers", lang, { subId: id });
    }
    if (key === "education" && sub) {
      const id = subSlugToId("education", lang, sub);
      if (id) return localizedHead("education", lang, { subId: id });
    }
    if (key === "animations" && sub) {
      const id = (loaderData as { animationId?: string } | undefined)?.animationId ?? sub;
      const animation = id ? getAnimation(id as AnimationSlug) : undefined;
      if (animation) {
        return localizedHead("animations", lang, {
          subId: id,
          title: `${animation.copy[lang].title} — Maximilien`,
          description: animation.copy[lang].lede,
          jsonLd: [
            courseJsonLd({
              name: animation.copy[lang].title,
              description: animation.copy[lang].lede,
              url: `${SITE_URL}${subPathFor("animations", lang, id)}`,
              lang,
              audience: "student",
            }),
          ],
        });
      }
    }
    if (key === "animals" && sub) {
      return {
        ...localizedHead("animals", lang),
        meta: localizedHead("animals", lang).meta,
      };
    }
    if (key === "support" && sub && subSlugToId("support", lang, sub) === "sponsor") {
      const sponsorTitle: Record<Lang, string> = {
        nl: "Word Peter of Meter — Maximilien",
        fr: "Devenez marraine ou parrain — Maximilien",
        en: "Become a sponsor — Maximilien",
      };
      const sponsorDescription: Record<Lang, string> = {
        nl: "Adopteer symbolisch een dier van de boerderij en steun hun dagelijkse zorg.",
        fr: "Adoptez symboliquement un animal de la ferme et soutenez ses soins quotidiens.",
        en: "Symbolically adopt a farm animal and support their daily care.",
      };
      return localizedHead("support", lang, {
        subId: "sponsor",
        title: sponsorTitle[lang],
        description: sponsorDescription[lang],
      });
    }
    if (key === "faq") {
      return localizedHead("faq", lang, {
        jsonLd: [
          faqJsonLd(
            FAQ_SECTIONS.flatMap((section) =>
              section.items.map((item) => ({
                question: item.q[lang],
                answer: item.a[lang],
              })),
            ),
          ),
        ],
      });
    }
    if (key === "fairtech") {
      const meta = PAGE_META.fairtech[lang];
      return localizedHead("fairtech", lang, {
        jsonLd: [
          fairtechJsonLd(lang, `${SITE_URL}${pathFor("fairtech", lang)}`, meta.title, meta.description),
        ],
      });
    }
    return localizedHead(key, lang);
  },
  component: LocalizedPage,
});

function LocalizedPage() {
  const data = Route.useLoaderData();
  const { key, sub } = data;
  const portal = (data as { portal?: PortalPage }).portal;
  if (portal) return <PortalRoot page={portal} lang={data.lang} />;

  const blocked = (data as { blocked?: "maintenance" | "hidden"; notice?: string }).blocked;
  if (blocked === "maintenance") {
    return <MaintenanceScreen lang={data.lang} message={(data as { notice?: string }).notice} />;
  }
  if (blocked === "hidden") {
    return <PageUnavailable lang={data.lang} notice={(data as { notice?: string }).notice} />;
  }

  const node = (() => {
    switch (key) {
      case "visit":
        return <VisitPage />;
      case "animals":
        return sub ? <AnimalDetailPage slug={sub} /> : <AnimalsPage />;
      case "education":
        return sub ? <EducationBookingPage /> : <EducationPage />;
      case "news":
        return sub ? <NewsDetailPage slug={sub} /> : <NewsPage />;
      case "support":
        return sub && subSlugToId("support", data.lang, sub) === "sponsor" ? (
          <SponsorPage />
        ) : (
          <SupportPage />
        );
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "privacy":
        return <PrivacyPage />;
      case "terms":
        return <TermsPage />;
      case "cookies":
        return <CookiesPage />;
      case "status":
        return <StatusPage />;
      case "fairtech":
        return <FairTechPage />;
      case "academy":
        return sub ? <AcademyQuiz slug={sub} /> : <AcademyIndex />;
      case "pass":
        return <MijnHoefjes />;
      case "login":
        return <LoginPage />;
      case "account":
        return <AccountPage />;
      case "rental":
        return <RentalPage />;
      case "camps":
        return <CampsPage />;
      case "compost":
        return <CompostPage />;
      case "teambuilding":
        return <TeamBuildingPage />;
      case "seminars":
        return <SeminarsPage />;
      case "shop":
        return <ShopPage />;
      case "product":
        return sub ? <ProductDetailPage slug={sub} /> : null;
      case "partners":
        return <PartnersPage />;
      case "social":
        return <SocialPage />;
      case "register":
        return <RegisterPage />;
      case "faq":
        return <FaqPage />;
      case "transparency":
        return <TransparencyPage />;
      case "legal":
        return <LegalPage />;
      case "resources":
        return <ResourcesPage />;
      case "jobs":
        return <JobsPage />;
      case "events":
        return <EventsPage />;
      case "press":
        return <PressPage />;
      case "volunteers": {
        const id = (data as { volunteerId?: string }).volunteerId;
        return id ? <VolunteerProfilePage id={id} /> : <VolunteersPage />;
      }
      case "animations": {
        const id = (data as { animationId?: string }).animationId;
        return id ? <AnimationDetailPage slug={id as AnimationSlug} /> : <AnimationsIndexPage />;
      }
      default:
        return null;
    }
  })();

  return <Suspense fallback={null}>{node}</Suspense>;
}
