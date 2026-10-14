import { Link } from "@tanstack/react-router";

import { pathFor, type Lang } from "@/lib/routes-i18n";

const COPY = {
  nl: {
    title: "Deze pagina is tijdelijk niet beschikbaar",
    body: "We werken hieraan. Kom binnenkort terug of neem contact op.",
    home: "Naar de startpagina",
  },
  fr: {
    title: "Cette page est temporairement indisponible",
    body: "Nous y travaillons. Revenez bientôt ou contactez-nous.",
    home: "Retour à l'accueil",
  },
  en: {
    title: "This page is temporarily unavailable",
    body: "We're working on it. Please check back soon or contact us.",
    home: "Back to home",
  },
} as const;

/** Getoond wanneer het team een publieke pagina tijdelijk uitzette. */
export function PageUnavailable({ lang, notice }: { lang: Lang; notice?: string }) {
  const copy = COPY[lang] ?? COPY.nl;
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <h1 className="font-serif text-3xl md:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-muted-foreground">{notice?.trim() ? notice : copy.body}</p>
        <Link
          to={pathFor("home", lang)}
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          {copy.home}
        </Link>
      </div>
    </main>
  );
}

/** Volledige site in onderhoud. */
export function MaintenanceScreen({ lang, message }: { lang: Lang; message?: string }) {
  const fallback = {
    nl: "De site is even in onderhoud. Tot straks!",
    fr: "Le site est en maintenance. À tout de suite !",
    en: "The site is under maintenance. Back shortly!",
  }[lang];
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="font-serif text-3xl md:text-4xl">La Ferme du parc Maximilien</h1>
        <p className="mt-4 text-muted-foreground">{message?.trim() ? message : fallback}</p>
      </div>
    </main>
  );
}
