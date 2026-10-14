/**
 * JSON-LD (schema.org) bouwstenen — puur data, geen UI.
 * Wordt onzichtbaar in de <head> geïnjecteerd via <SeoHead> / <JsonLd>.
 */
import { SITE_URL, type Lang } from "@/lib/routes-i18n";

export const ORG_ID = `${SITE_URL}/#organisation`;
export const SCHOOL_ID = `${SITE_URL}/#educational-organization`;

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Schipperijkaai 2 (Quai du Batelage 2)",
  addressLocality: "Bruxelles",
  addressRegion: "Brussels-Capital",
  postalCode: "1000",
  addressCountry: "BE",
} as const;

const GEO = {
  "@type": "GeoCoordinates",
  latitude: 50.8597,
  longitude: 4.3483,
} as const;

/** Openingsuren van de boerderij (publiek toegankelijk). */
const OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "10:00",
    closes: "17:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday", "Sunday"],
    opens: "10:00",
    closes: "18:00",
  },
];

const LOCALE_NAME: Record<Lang, string> = {
  nl: "La Ferme du parc Maximilien — Stadsboerderij Brussel",
  fr: "La Ferme du parc Maximilien — Ferme urbaine à Bruxelles",
  en: "La Ferme du parc Maximilien — Urban farm in Brussels",
};

const LOCALE_DESC: Record<Lang, string> = {
  nl: "Educatieve stadsboerderij aan het Maximiliaanpark in Brussel: dieren, schoolanimaties, vakantiestages, zaalverhuur en verpakkingsvrije hoevewinkel.",
  fr: "Ferme urbaine éducative au parc Maximilien à Bruxelles : animaux, animations scolaires, stages de vacances, location de salle et magasin de ferme zéro déchet.",
  en: "Educational urban farm at Maximilien park in Brussels: animals, school workshops, holiday camps, venue rental and a zero-waste farm shop.",
};

/** Openbare profielen van de boerderij (o.a. gedecentraliseerd via Mastodon). */
export const SAME_AS = ["https://mastodon-belgium.be/@Maximilien"];

/** LocalBusiness + EducationalOrganization voor de homepagina. */
export function homeJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "TouristAttraction"],
        "@id": ORG_ID,
        name: LOCALE_NAME[lang],
        description: LOCALE_DESC[lang],
        url: SITE_URL,
        image: `${SITE_URL}/hero.png`,
        logo: `${SITE_URL}/logo.png`,
        telephone: "+3223315391",
        email: "info@lafermeduparcmaximilien.be",
        priceRange: "€€",
        currenciesAccepted: "EUR",
        paymentAccepted: "Bancontact, iDEAL, Credit Card, Cash",
        address: ADDRESS,
        geo: GEO,
        openingHoursSpecification: OPENING_HOURS,
        inLanguage: ["nl", "fr", "en"],
        publicAccess: true,
        isAccessibleForFree: true,
        sameAs: SAME_AS,
      },
      {
        "@type": "EducationalOrganization",
        "@id": SCHOOL_ID,
        name: LOCALE_NAME[lang],
        description: LOCALE_DESC[lang],
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        address: ADDRESS,
        location: { "@id": ORG_ID },
        areaServed: "Brussels-Capital Region",
        knowsLanguage: ["nl", "fr", "en"],
        sameAs: SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: LOCALE_NAME[lang],
        inLanguage: lang,
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

/** Course-schema voor schoolanimaties en educatief aanbod. */
export function courseJsonLd(input: {
  name: string;
  description: string;
  url: string;
  lang: Lang;
  audience?: string;
  priceCent?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.lang,
    provider: { "@id": SCHOOL_ID },
    ...(input.audience
      ? { audience: { "@type": "EducationalAudience", educationalRole: input.audience } }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      location: { "@id": ORG_ID },
      ...(typeof input.priceCent === "number"
        ? {
            offers: {
              "@type": "Offer",
              price: (input.priceCent / 100).toFixed(2),
              priceCurrency: "EUR",
            },
          }
        : {}),
    },
  };
}

/** Event-schema voor stages, evenementen en workshops. */
export function eventJsonLd(input: {
  name: string;
  description?: string;
  url: string;
  startDate: string;
  endDate?: string;
  lang: Lang;
  priceCent?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    startDate: input.startDate,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: input.lang,
    organizer: { "@id": ORG_ID },
    location: {
      "@type": "Place",
      name: "La Ferme du parc Maximilien",
      address: ADDRESS,
      geo: GEO,
    },
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: "EUR",
      price:
        typeof input.priceCent === "number" ? (input.priceCent / 100).toFixed(2) : "0.00",
      availability: "https://schema.org/InStock",
    },
  };
}

/** FAQPage-schema voor veelgestelde vragen en praktische info. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Breadcrumbs helpen AI-crawlers de hiërarchie begrijpen. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: `${SITE_URL}${step.path}`,
    })),
  };
}

/** WebPage + organisatie voor de Fair & Open Tech-pagina. */
export function fairtechJsonLd(lang: Lang, url: string, title: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": ORG_ID },
      },
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: LOCALE_NAME[lang],
        url: SITE_URL,
        address: ADDRESS,
        sameAs: SAME_AS,
      },
    ],
  };
}
