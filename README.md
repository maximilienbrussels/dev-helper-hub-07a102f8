<div align="center">

# Stadsboerderij Maximilien — Platform Architecture

**Multi-environment web infrastructure for La Ferme du Parc Maximilien / Stadsboerderij Maximilliaanpark**
Quai des Péniches 2 · Schipperijkaai 2 · 1000 Brussels

<p>
  <a href="https://maximilien.brussels"><img alt="Public site" src="https://img.shields.io/badge/Public%20site-maximilien.brussels-2d5a27?style=for-the-badge" /></a>
  <a href="https://maximilien.site"><img alt="Back office" src="https://img.shields.io/badge/Back%20office-maximilien.site-c86d51?style=for-the-badge" /></a>
  <a href="https://maximilien.app"><img alt="Field app" src="https://img.shields.io/badge/Field%20app-maximilien.app-8a7f66?style=for-the-badge" /></a>
</p>

<p>
  <img alt="Framework" src="https://img.shields.io/badge/React%2019%20·%20TanStack%20Start-f0ebe3?style=flat-square&labelColor=1f2a1c" />
  <img alt="Build" src="https://img.shields.io/badge/Vite%207-f0ebe3?style=flat-square&labelColor=1f2a1c" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript%20strict-f0ebe3?style=flat-square&labelColor=1f2a1c" />
  <img alt="Styling" src="https://img.shields.io/badge/Tailwind%20v4%20tokens-f0ebe3?style=flat-square&labelColor=1f2a1c" />
  <img alt="Database" src="https://img.shields.io/badge/Neon%20Postgres%20·%2038%20migrations-f0ebe3?style=flat-square&labelColor=1f2a1c" />
  <img alt="Deployment" src="https://img.shields.io/badge/Vercel%20·%203%20targets-f0ebe3?style=flat-square&labelColor=1f2a1c" />
</p>

</div>

---

## System architecture

One GitHub repository, deployed as **three Vercel projects** that differ only by the
`VITE_APP_MODE` build variable and their custom domain. One codebase, one database,
one identity system — three purpose-built surfaces.

| Tier | Domain | `VITE_APP_MODE` | Audience | Primary purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Public site** | `maximilien.brussels` | `public` | Visitors, neighbours, press | Multilingual storytelling, events, shop, donations |
| **Back office** | `maximilien.site` | `admin` | Coordinators, office team | CRM, planning, finance, content management |
| **Field app** | `maximilien.app` | `field` | Gardeners, volunteers on site | Offline-first PWA: tasks, scanning, logs |

```text
                         ┌──────────────────────────────────────────┐
                         │        Single GitHub repository          │
                         │   (React 19 · Vite 7 · TanStack Start)   │
                         └───────────────────┬──────────────────────┘
                                             │  VITE_APP_MODE
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
  ┌────────────────────┐          ┌────────────────────┐          ┌────────────────────┐
  │  PUBLIC  (public)  │          │  ADMIN   (admin)   │          │  FIELD   (field)   │
  │ maximilien.brussels│          │  maximilien.site   │          │  maximilien.app    │
  ├────────────────────┤          ├────────────────────┤          ├────────────────────┤
  │ • NL / FR / EN     │          │ • CRM + members    │          │ • Installable PWA  │
  │ • Events & tickets │          │ • Planning & tasks │          │ • Offline cache    │
  │ • Shop & donations │          │ • Finance / Stripe │          │ • Task check-off   │
  │ • SEO + OG cards   │          │ • Content studio   │          │ • QR scanning      │
  └─────────┬──────────┘          └─────────┬──────────┘          └─────────┬──────────┘
            │                               │                               │
            └───────────────┬───────────────┴───────────────┬───────────────┘
                            ▼                               ▼
              ┌──────────────────────────┐     ┌──────────────────────────┐
              │  Server functions layer  │     │   Shared session / RBAC  │
              │  (TanStack Start, edge)  │     │  cookies · roles · perms │
              └────────────┬─────────────┘     └────────────┬─────────────┘
                           └───────────────┬────────────────┘
                                           ▼
            ╔══════════════════════════════════════════════════════════╗
            ║             UNIFIED DATABASE CORE — Neon Postgres        ║
            ║  users · roles · members · events · tasks · bookings ·   ║
            ║  orders · invoices · media · audit log   (38 migrations) ║
            ╚═══════════════════════┬══════════════════════════════════╝
                                    │
        ┌───────────────┬───────────┴───────────┬───────────────┐
        ▼               ▼                       ▼               ▼
   ┌──────────┐   ┌────────────┐          ┌──────────┐   ┌────────────┐
   │  Stripe  │   │  S3 object │          │  Brevo   │   │  Bluesky   │
   │ payments │   │  storage   │          │  e-mail  │   │  social    │
   └──────────┘   └────────────┘          └──────────┘   └────────────┘
```

---

## Feature & environment matrix

| Module | `public` — maximilien.brussels | `admin` — maximilien.site | `field` — maximilien.app |
| :--- | :---: | :---: | :---: |
| Multilingual visitor pages (NL / FR / EN) | ● | — | — |
| Interactive farm map & animal passports | ● | — | — |
| Webshop, pickup tickets & donations | ● | — | — |
| Bookings, camps & rental requests | ● | ● | — |
| Academy, certificates & verification | ● | ● | — |
| CRM, members & sponsorships | — | ● | — |
| Planning, calendar & task management | — | ● | ● |
| Finance, Stripe payments & invoices | — | ● | — |
| Media library & S3 asset manager | — | ● | — |
| Content studio & site settings | — | ● | — |
| Transactional e-mail settings & test send | — | ● | — |
| Role & permission matrix | — | ● | — |
| Daily operational task list | — | — | ● |
| QR scanner (pickups, animals, certificates) | — | — | ● |
| Offline support & install trigger | — | — | ● |

Legend: ● active · — not built into that bundle.

---

## Build matrix

| Target | Command | Domain |
| :--- | :--- | :--- |
| Public site | `VITE_APP_MODE=public bun run build` | `maximilien.brussels` |
| Back office | `VITE_APP_MODE=admin bun run build` | `maximilien.site` |
| Field app (PWA) | `VITE_APP_MODE=field bun run build` | `maximilien.app` |

Without `VITE_APP_MODE` (local dev or preview) the hostname decides, with
`?mode=public`, `?mode=admin` or `?mode=field` as a manual override.
Detection order is defined in `src/lib/app-mode.ts`: env → hostname → query → local override.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev          # http://localhost:8080
```

| Script | Purpose |
| :--- | :--- |
| `bun run dev` | Local dev server with HMR |
| `bun run build` | Production build |
| `bun run build:dev` | Development-mode build (prerender sanity check) |
| `bun run preview` | Serve the built output |
| `bun run lint` | ESLint across the repo |
| `bun run test` | Vitest suite |
| `bun run format` | Prettier write |

---

## Cross-domain linking protocol

The three domains are separate deployments but one product. Navigation between them is
explicit and permission-aware, never a hidden redirect. Canonical origins live in
`src/lib/urls.ts` (`PUBLIC_ORIGIN`, `ADMIN_ORIGIN`, `FIELD_ORIGIN`) — never hard-code a
domain anywhere else.

| From | To | Where |
| :--- | :--- | :--- |
| Back office | Field app | Sidebar entry under the security group, shown only to users with field permissions |
| Back office | Public site | Discrete "view live site" link, opens the public portal in a new tab |
| Public site | Back office | Staff entry point in the footer, leading to the sign-in screen |
| Field app | Back office | Header shortcut for users whose role includes office access |

Sign-in is shared: whoever may work on `maximilien.site` enters `maximilien.app` with the
same role and the same permissions. Menu entries and field-app tabs are filtered per
permission, so the interface only ever shows what the signed-in person may do.

---

## PWA & offline strategy (`maximilien.app`)

The field app is built for people working on the terrain with weak reception. The service
worker is only generated for the `field` build (`vite.config.ts`) and only registered
through the guarded wrapper in `src/lib/pwa.ts`.

| Concern | Behaviour |
| :--- | :--- |
| Pre-cached shell | Scripts, stylesheets, fonts (`woff2`) and app icons only — heavy marketing imagery is deliberately excluded |
| Page navigations | Network first with a 4-second timeout, then the cached page; 30 pages kept for 7 days (`veld-paginas`) |
| Same-origin assets | Cache first; 120 entries kept for 30 days (`veld-bestanden`) |
| Never cached | `/api/*` and the OAuth callback `/~oauth` are excluded from the navigation fallback |
| Updates | `autoUpdate` with `skipWaiting` + `clientsClaim`; outdated caches are cleaned on activation |
| Registration guard | Production only — never in dev, never inside an iframe, never on preview hostnames |
| Emergency brake | `?sw=off` unregisters the service worker on the spot |
| Install | A discrete download control next to the footer copyright triggers the browser's native install prompt; on iOS it explains the Share → Add to Home Screen path. No intrusive banner |

Manifests: `public/manifest.json` (public site) and `public/manifest.field.json` (field app).

---

## Technology stack

| Layer | Technology |
| :--- | :--- |
| UI | React 19, TanStack Router/Start, Radix UI, shadcn-style components |
| Styling | Tailwind CSS v4 (native `@theme` tokens in `src/styles.css`) |
| Build | Vite 7, manual chunk groups (`vendor-pdf`, `vendor-charts`, `vendor-react`, `portal`) |
| Server | TanStack Start server functions, edge runtime |
| Database | Neon serverless Postgres — 38 SQL migrations in `neon/migrations/` |
| Auth | Own session auth on Neon + WebAuthn passkeys, Google OAuth, role-based permissions |
| Payments | Stripe (checkout, webhooks, invoices) |
| Storage | S3-compatible object storage (Scaleway) with presigned uploads |
| E-mail | Brevo HTTP API, SMTP fallback, dedicated sending subdomain |
| Calendar | FullCalendar (day, week, list, interaction) |

---

## Access & identity

Authentication is **not** delegated to a third-party identity product: accounts,
password hashes (bcrypt) and one-time tokens live in the project's own Postgres tables
(`app_users`, `app_auth_tokens`), reached exclusively through server-side code.

| Concern | Detail |
| :--- | :--- |
| Session | HTTP-only cookie, verified server-side on every server function |
| Roles | Stored in a dedicated roles table — never on the profile record |
| Access list | Portal access is whitelist-only (`portal_admins`); there is no public registration |
| Passkeys | WebAuthn registration and login via SimpleWebAuthn |
| OAuth | Google sign-in, origins allow-listed per domain |
| Sign-in aids | Password, e-mailed 6-digit code, and magic link — all rate-limited |

`GET /api/auth/config-check` reports, per domain, whether the database is reachable,
whether outbound mail is configured (Brevo or complete SMTP), which secrets are missing,
and whether the OAuth origin is registered.

---

## Transactional e-mail

Mail is decoupled from the root domain so main DNS records stay untouched.

| Concern | Detail |
| :--- | :--- |
| Gateway | Brevo HTTP API when `BREVO_API_KEY` is present, otherwise SMTP |
| Sending domain | Dedicated `send.` subdomain, with SPF, DKIM and DMARC on that prefix only |
| Templates | Pickup ticket, booking confirmation, auth code, general notice — NL / FR / EN |
| Entry point | One server-side function (`sendTemplateMail`); never called from the browser |
| Diagnostics | Every send returns route, message id, duration and a plain-language failure reason |

---

## Environment variables

Set these per Vercel project. Values are identical across the three targets except
`VITE_APP_MODE` and the site origin.

```env
# Build target
VITE_APP_MODE=public                 # public | admin | field

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@neon-host/dbname

# Sessions — must be the SAME value on all three domains
AUTH_JWT_SECRET=...

# E-mail (Brevo preferred, SMTP as fallback)
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=no-reply@send.maximilien.site
SMTP_HOST=...  SMTP_PORT=...  SMTP_USER=...  SMTP_PASS=...  SMTP_FROM=...

# Storage, payments, integrations
S3_ACCESS_KEY=...  S3_SECRET_KEY=...  S3_ENDPOINT=...  S3_BUCKET=...  S3_REGION=...
STRIPE_PUBLISHABLE_KEY=...  STRIPE_SECRET_KEY=...  STRIPE_WEBHOOK_SECRET=...
GOOGLE_CLIENT_ID=...  GOOGLE_CLIENT_SECRET=...
BSKY_IDENTIFIER=...  BSKY_APP_PASSWORD=...

# Cross-domain safety
OAUTH_ALLOWED_ORIGINS=https://maximilien.brussels,https://maximilien.site,https://maximilien.app
PUBLIC_SITE_ORIGIN=https://maximilien.brussels
```

> All three domains must appear in `OAUTH_ALLOWED_ORIGINS`, `PUBLIC_SITE_ORIGIN` and the
> CORS origins of the S3 bucket — otherwise sessions or uploads break. `AUTH_JWT_SECRET`
> differing between domains is the classic cause of "signed in here, signed out there".

---

## Repository layout

```text
src/
├── routes/            File-based routes (public, portal, field, api)
│   └── api/public/    Webhooks & external endpoints (signature-verified)
├── components/
│   ├── portal/        Back-office shell, navigation, pages
│   ├── pwa/           Install control & offline helpers
│   └── ui/            Design-system primitives
├── lib/               Server functions, auth, i18n, storage, integrations
└── styles.css         Tailwind v4 theme tokens
neon/
├── migrations/        38 ordered SQL migrations
└── seed/              Reference and demo data
public/                Static assets, manifests, icons
tests/                 Vitest suites
```

---

## Quality gates

Run before every push; all four must pass.

| Check | Command | Catches |
| :--- | :--- | :--- |
| Types | `npx @typescript/native-preview --noEmit` | Strict type and route-name errors |
| Build | `bun run build` | Broken imports, SSR/edge incompatibilities |
| Tests | `bun run test` | Regressions in academy, filters, error boundaries |
| Lint | `bun run lint` | Style and unsafe-pattern violations |

Conventions: server-only code lives in `*.server.ts` (never imported from a component),
client-callable RPC in `*.functions.ts`, colours only through the design tokens in
`src/styles.css` — never hard-coded utility colours.

---

## Deployment

Each Vercel project points at the same repository and differs only by its
`VITE_APP_MODE` value and its custom domain. Push to `main` and all three targets rebuild
from the identical commit, so the public site, the back office and the field app never
drift apart.

| Vercel project | Env | Domain |
| :--- | :--- | :--- |
| `maximilien-public` | `VITE_APP_MODE=public` | `maximilien.brussels` |
| `maximilien-admin` | `VITE_APP_MODE=admin` | `maximilien.site` |
| `maximilien-field` | `VITE_APP_MODE=field` | `maximilien.app` |

## Community, socials & decentralised identity

We publish on decentralised, self-hostable platforms first. The footer of every
public page carries a `rel="me"` link so Mastodon can verify the domain.

| Channel | Handle / URL |
| :--- | :--- |
| Mastodon (official) | `@Maximilien@mastodon-belgium.be` — <https://mastodon-belgium.be/@Maximilien> |
| Fair & Open Tech page | `/nl/fairtech`, `/fr/fairtech`, `/en/fairtech` |
| Murena partner shop | <https://murena.com/partner/Maximilienbrussels/> |

### Fair & open technology

The farm runs a physical Fair Tech demo station at Quai des Péniches 2 /
Schipperijkaai 2, 1000 Brussels: repairable Fairphone hardware and
privacy-first `/e/OS` software, plus decentralised protocols (Mastodon, Matrix).

### Icon set

Generated from `public/pers/logo-maximilien-terracotta.svg`:

* transparent freestanding emblem — `favicon.svg`, `favicon.ico` (16/32/64),
  `icons/taskbar-512.png` (edge to edge)
* `purpose: "any"` — 192/512 PNGs with 10% inner padding
* `purpose: "maskable"` — 512 PNGs with a 20% safe zone: crème `#FBF9F5` +
  terracotta `#D95D39` (public), forest `#1E4D3B` + white (field app),
  white + black `#111111` (manager portal)

---

<div align="center">

© 2026 **Stadsboerderij Maximilien / La Ferme du Parc Maximilien**
Quai des Péniches 2 · Schipperijkaai 2 · 1000 Brussels

</div>
