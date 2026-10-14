// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// Vercel zet VERCEL=1 tijdens build én runtime; VERCEL_ENV is de fallback.
const isVercel = Boolean(process.env["VERCEL"] || process.env["VERCEL_ENV"]);

/**
 * `@neondatabase/auth` genereert op moduleniveau een tab-id met
 * `crypto.randomUUID()`. In de Cloudflare Worker-runtime is willekeur in global
 * scope verboden ("Disallowed operation called within global scope"), waardoor
 * de SSR soms een 500 gaf. We maken die waarde server-side statisch; in de
 * browser blijft het gedrag identiek.
 */
const neonAuthGlobalScopeFix = {
  name: "neon-auth-global-scope-fix",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!id.includes("@neondatabase")) return null;
    if (!code.includes("CURRENT_TAB_CLIENT_ID = crypto.randomUUID()")) return null;
    return {
      code: code.replace(
        "CURRENT_TAB_CLIENT_ID = crypto.randomUUID()",
        'CURRENT_TAB_CLIENT_ID = typeof window === "undefined" ? "server-tab" : crypto.randomUUID()',
      ),
      map: null,
    };
  },
};

// Offline-ondersteuning enkel in de veld-build (maximilien.app).
const isFieldBuild = process.env["VITE_APP_MODE"] === "field";

const fieldPwa = isFieldBuild
  ? [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        // Registratie gebeurt uitsluitend via src/lib/pwa.ts (bewaakte wrapper).
        injectRegister: null,
        filename: "sw.js",
        // De statische client-output staat in dist/client; daar moet sw.js ook staan.
        outDir: "dist/client",
        buildBase: "/",
        // Eigen manifest: public/manifest.field.json.
        manifest: false,
        devOptions: { enabled: false },
        workbox: {
          // Alleen wat de veld-app nodig heeft; zware marketingbeelden blijven eruit.
          globPatterns: ["**/*.{js,css,woff2}", "icons/*.png"],
          navigateFallback: undefined,
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/auth(?:\/|$)/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }: { request: Request; url: URL }) =>
                request.mode === "navigate" &&
                (url.pathname === "/veld" || url.pathname.startsWith("/veld/")),
              handler: "NetworkFirst",
              options: {
                cacheName: "veld-paginas",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: ({ sameOrigin, request }: { sameOrigin: boolean; request: Request }) =>
                sameOrigin && ["style", "script", "font", "image"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "veld-bestanden",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ]
  : [];

export default defineConfig({
  vite: {
    plugins: [neonAuthGlobalScopeFix, ...fieldPwa],

    // Zware bibliotheken en het beheerportaal in eigen brokken, zodat de
    // publieke en veld-builds ze niet meeslepen.
    build: {
      chunkSizeWarningLimit: 900,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: "vendor-pdf", test: /node_modules\/(jspdf|html2canvas|canvg|dompurify)/ },
              { name: "vendor-charts", test: /node_modules\/(recharts|d3-|victory)/ },
              { name: "vendor-react", test: /node_modules\/(react|react-dom|scheduler)\// },
              { name: "portal", test: /src\/(components\/portal|pages\/portal)\//, maxSize: 600 * 1024 },
            ],
          },
        },
      },
    },


    // Eigen domeinen mogen de dev-server aanspreken (lokale hosts-mapping om
    // de domeinscheiding admin/publiek te testen).
    server: { allowedHosts: ["maximilien.site", "maximilien.brussels", "maximilien.app"] },

    // Serverless functies hebben geen node_modules-resolutie op runtime: alles
    // moet in de bundel zitten, anders faalt de deploy met o.a.
    // "Cannot find module 'tslib/modules/index.js'". Enkel tijdens de
    // Vercel-build: in dev moeten dependencies extern blijven.
    ...(isVercel ? { ssr: { noExternal: true } } : {}),
    resolve: {
      alias: [
        {
          // `@` expliciet naar ./src (naast de tsconfig-paths resolutie), zodat
          // de build niet afhankelijk is van de current working directory.
          find: /^@\//,
          replacement: `${path.resolve(projectRoot, "src")}/`,
        },
        {
          // tslib publiceert CommonJS als default entry; in een volledig
          // gebundelde serverfunctie levert die interop `undefined` op
          // ("Cannot destructure property '__extends'"). De ESM-build wél.
          find: /^tslib$/,
          replacement: path.resolve(projectRoot, "node_modules/tslib/tslib.es6.mjs"),
        },
        {
          // `cloudflare:sockets` bestaat enkel in de Cloudflare Worker-runtime.
          // `@neondatabase/serverless` importeert het voor zijn (ongebruikte)
          // WebSocket-pad. Zonder stub crasht de serverbundel op Node/Vercel
          // bij het laden — dus elke request een 500.
          find: /^cloudflare:sockets$/,
          replacement: path.resolve(projectRoot, "src/lib/cloudflare-sockets-stub.ts"),
        },
      ],
    },
  },

  nitro: {
    // Op Vercel expliciet de vercel-preset; elders laat de wrapper zijn eigen
    // default staan (Lovable-preview/Cloudflare) zodat beide targets blijven werken.
    ...(isVercel ? { preset: "vercel" as const } : {}),
  },

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Idem voor de client: eigen src/client.tsx i.p.v. de default in
    // node_modules (die soms niet door de preview-proxy raakte -> wit scherm).
    client: { entry: "client" },
  },
});
