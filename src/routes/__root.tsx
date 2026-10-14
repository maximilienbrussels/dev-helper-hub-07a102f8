import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";

import "../styles.css";
import { I18nProvider, useT } from "../lib/i18n";
import { AuthProvider } from "../lib/auth";
import { ThemeProvider, themeInitScript } from "../lib/theme";
import { Toaster } from "../components/ui/sonner";

import { getAuthClient } from "../lib/auth-client";
import { AppErrorFallback } from "../components/AppErrorFallback";
import { installGlobalErrorLogging } from "../lib/lovable-error-reporting";
import { PwaInstallProvider } from "../lib/pwa-install";
import {
  getEnvAppMode,
  getServerAppMode,
  isAdminHostname,
  isAdminOnlyPath,
  isAdminPath,
  isAppModeSwitchable,
  isFieldHostname,
  isFieldOnlyPath,
  isFieldPath,
  modeFromPath,
  resolveAppMode,

  type AppMode,
} from "../lib/app-mode";
import { crossModeHref, getRequestAppMode, getRequestHost } from "../lib/app-mode.request";

/**
 * Drie gescheiden bundels: de publieke bezoekerssite, het beheerportaal en de
 * veld-app (PWA). React.lazy zorgt dat alleen de shell van de actieve modus laadt.
 */
const PublicAppShell = lazy(() => import("../components/shells/PublicAppShell"));
const AdminAppShell = lazy(() => import("../components/shells/AdminAppShell"));
const FieldAppShell = lazy(() => import("../components/shells/FieldAppShell"));
const DevModeToggle = lazy(() => import("../components/DevModeToggle"));


function NotFoundComponent() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("err.404.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("err.404.body")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://fermemaximilien.brussels/#organisation",
      name: "La Ferme du parc Maximilien",
      telephone: "+3222015609",
      email: "info@fermeduparcmaximilien.be",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Schipperijkaai 2 (Quai du Batelage 2)",
        addressLocality: "Bruxelles",
        postalCode: "1000",
        addressCountry: "BE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 50.8597,
        longitude: 4.3483,
      },
    },
    {
      "@type": "TouristAttraction",
      "@id": "https://fermemaximilien.brussels/#attraction",
      name: "La Ferme du parc Maximilien — Urban Farm Experience",
      description: "Ferme d'animation urbaine et espace de cohésion sociale au cœur de Bruxelles.",
      location: { "@id": "https://fermemaximilien.brussels/#organisation" },
    },
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  ssr: "data-only",
  /**
   * Strikte domeinscheiding: op maximilien.site (admin-modus) bestaan de publieke
   * marketingroutes niet. Elk niet-adminpad (/, /nl, /fr/…, /webshop …) gaat
   * meteen naar /auth, dat ingelogde medewerkers zelf naar het portaal stuurt.
   */
  beforeLoad: async ({ location }) => {
    const host = await getRequestHost();
    const fixedHost = isAdminHostname(host) || isFieldHostname(host);

    // Preview/dev: geen echte domeinen, dus het pad bepaalt de omgeving.
    // Zo blijven publieke pagina's publiek en admin-paden admin, zonder
    // doorsturen op basis van een eerder gekozen modus.
    if (getEnvAppMode() === null && !fixedHost) {
      return { appMode: modeFromPath(location.pathname) ?? "public" };
    }

    const appMode = await getRequestAppMode();
    if (appMode === "admin" && !isAdminPath(location.pathname)) {
      throw redirect({ href: crossModeHref("admin", "/auth", host), replace: true });
    }
    if (appMode === "field" && !isFieldPath(location.pathname)) {
      throw redirect({ href: crossModeHref("field", "/veld", host), replace: true });
    }
    if (appMode === "public") {
      if (isAdminOnlyPath(location.pathname)) {
        throw redirect({ href: crossModeHref("admin", location.pathname, host), replace: true });
      }
      if (isFieldOnlyPath(location.pathname)) {
        throw redirect({ href: crossModeHref("field", location.pathname, host), replace: true });
      }
    }
    return { appMode };
  },


  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "color-scheme", content: "light dark" },
      { name: "supported-color-schemes", content: "light dark" },
      { name: "theme-color", content: "#D95D39" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      {
        name: "apple-mobile-web-app-title",
        content: getEnvAppMode() === "field" ? "Maximilien Veld" : "Maximilien",
      },

      { title: "La Ferme du parc Maximilien — Stadsboerderij Brussel" },

      {
        name: "description",
        content:
          "Stadsboerderij aan het Maximiliaanpark: dieren ontmoeten, verpakkingsvrij winkelen, MIVB/STIB info en een educatieve gids.",
      },
      {
        name: "keywords",
        content:
          "stadsboerderij Brussel, ferme urbaine Bruxelles, Maximiliaanpark, parc Maximilien, kinderboerderij, dierenwelzijn, hoeveproducten, verpakkingsvrij winkelen, educatie, vzw",
      },
      { property: "og:site_name", content: "La Ferme du parc Maximilien" },
      { property: "og:locale", content: "nl_BE" },
      { property: "og:locale:alternate", content: "fr_BE" },
      { property: "og:locale:alternate", content: "en_GB" },
      { property: "og:title", content: "La Ferme du parc Maximilien — Stadsboerderij Brussel" },
      {
        property: "og:description",
        content:
          "Stadsboerderij aan het Maximiliaanpark: dieren ontmoeten, verpakkingsvrij winkelen, MIVB/STIB info en een educatieve gids.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "La Ferme du parc Maximilien — Stadsboerderij Brussel" },
      {
        name: "twitter:description",
        content:
          "Stadsboerderij aan het Maximiliaanpark: dieren ontmoeten, verpakkingsvrij winkelen, MIVB/STIB info en een educatieve gids.",
      },
    ],
    links: [
      // stylesheet wordt via de bundle geladen (zie import bovenaan)
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/x-icon", sizes: "16x16 32x32 64x64", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icons/taskbar-512.png" },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href:
          getEnvAppMode() === "field"
            ? "/icons/field-apple-touch-icon.png"
            : getEnvAppMode() === "admin"
              ? "/icons/admin-apple-touch-icon.png"
              : "/icons/apple-touch-icon.png",
      },
      // Elke bundel (publiek, veld, beheer) krijgt zijn eigen app-omslag.
      {
        rel: "manifest",
        href:
          getEnvAppMode() === "field"
            ? "/manifest.field.json"
            : getEnvAppMode() === "admin"
              ? "/manifest.admin.json"
              : "/manifest.json",
      },


      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@300;400;500;600;700&display=swap",
      },
    ],


    scripts: [
      { children: themeInitScript },
      {
        type: "application/ld+json",
        children: JSON.stringify(JSON_LD),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: AppErrorFallback,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const first = pathname.split("/").filter(Boolean)[0];
  const htmlLang = first === "fr" || first === "en" ? first : "nl";
  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, appMode } = Route.useRouteContext() as {
    queryClient: QueryClient;
    appMode?: AppMode;
  };

  // SSR en de eerste client-render gebruiken dezelfde deterministische modus
  // (env → hostname → query); pas na hydratie kijken we naar de dev-override.
  const [mode, setMode] = useState<AppMode>(() => appMode ?? getServerAppMode());
  const [showDevToggle, setShowDevToggle] = useState(false);

  useEffect(() => {
    const resolved = resolveAppMode();
    // Hostname/env winnen altijd van een oude localStorage-override.
    setMode(appMode === "admin" || appMode === "field" ? appMode : resolved);
    setShowDevToggle(isAppModeSwitchable());
  }, [appMode]);

  useEffect(() => {
    installGlobalErrorLogging();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void getAuthClient().then((sb) => {
      if (!sb) return;
      const { data: sub } = sb.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => unsubscribe?.();
  }, [queryClient]);

  const Shell = mode === "field" ? FieldAppShell : mode === "admin" ? AdminAppShell : PublicAppShell;

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <PwaInstallProvider>
              <Suspense fallback={<div className="min-h-screen w-full max-w-full" />}>
                <Shell>
                  {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                  <Outlet />
                </Shell>
              </Suspense>
              <Toaster />
              {showDevToggle && (
                <Suspense fallback={null}>
                  <DevModeToggle mode={mode} />
                </Suspense>
              )}
            </PwaInstallProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>

  );
}
