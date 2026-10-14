import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { readCart } from "@/lib/cart";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Ticket,
  GraduationCap,
  User,
  Search,
} from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { LanguageSwitcher, useT } from "@/lib/i18n";
import { ThemeMenu, ThemeSwitcher } from "@/lib/theme";
import { MLogo } from "@/components/MLogo";
import { getHubMenu } from "@/lib/hub-content";
import { useAuth, initials, firstName } from "@/lib/auth";
import { currentPath, stashRedirect } from "@/lib/redirect";
import { SiteSearchDialog, useSiteSearchShortcut } from "@/components/SiteSearchDialog";

import type { Lang } from "@/lib/i18n";

const COPY: Record<
  Lang,
  {
    hello: (name: string) => string;
    myHooi: string;
    myOrders: string;
    myBadges: string;
    settings: string;
    signOut: string;
    myAccount: string;
    signInRegister: string;
    loginPrompt: string;
    hoefjes: string;
    menuClose: string;
    menuOpen: string;
    support: string;
    search: string;
  }
> = {
  nl: {
    hello: (name) => `Hallo, ${name}`,
    myHooi: "Mijn Hooi",
    myOrders: "Mijn Bestellingen",
    myBadges: "Mijn Badges & Certificaten",
    settings: "Instellingen",
    signOut: "Uitloggen",
    myAccount: "Mijn Account",
    signInRegister: "Inloggen / Registreren",
    loginPrompt: "Log in voor je bestellingen, cursussen en hoefjes-saldo.",
    hoefjes: "Hoefjes",
    menuClose: "Menu sluiten",
    menuOpen: "Menu openen",
    support: "💚 Steun ons",
    search: "Zoeken",
  },
  fr: {
    hello: (name) => `Bonjour, ${name}`,
    myHooi: "Mes Hoefjes",
    myOrders: "Mes commandes",
    myBadges: "Mes badges & certificats",
    settings: "Paramètres",
    signOut: "Déconnexion",
    myAccount: "Mon compte",
    signInRegister: "Se connecter / S'inscrire",
    loginPrompt: "Connectez-vous pour vos commandes, cours et solde de Hoefjes.",
    hoefjes: "Hoefjes",
    menuClose: "Fermer le menu",
    menuOpen: "Ouvrir le menu",
    support: "💚 Nous soutenir",
    search: "Rechercher",
  },
  en: {
    hello: (name) => `Hi, ${name}`,
    myHooi: "My Hoefjes",
    myOrders: "My orders",
    myBadges: "My badges & certificates",
    settings: "Settings",
    signOut: "Sign out",
    myAccount: "My account",
    signInRegister: "Sign in / Register",
    loginPrompt: "Sign in for your orders, courses and Hoefjes balance.",
    hoefjes: "Hoefjes",
    menuClose: "Close menu",
    menuOpen: "Open menu",
    support: "💚 Support us",
    search: "Search",
  },
};

export function NavHeader() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openHub, setOpenHub] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const hubWrapRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const { t, lang, tx, extra } = useT();
  const c0 = COPY[lang];
  const c = {
    ...c0,
    hello: (name: string) => (lang === "en" && extra === "de" ? `Hallo, ${name}` : c0.hello(name)),
    ...Object.fromEntries(
      Object.entries(c0)
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, tx(v as string)]),
    ),
  } as typeof c0;
  const hubs = getHubMenu(lang).map((h) => ({
    ...h,
    label: tx(h.label),
    items: h.items.map((it) => ({ ...it, label: tx(it.label), hint: it.hint ? tx(it.hint) : it.hint })),
  }));
  const byKey = (k: string) => hubs.find((h) => h.key === k)?.items ?? [];
  const groupLabel = (nl: string, fr: string, en: string) =>
    lang === "fr" ? fr : lang === "en" ? tx(en) : nl;
  type NavItem = { label: string; href: string; hint?: string };
  type DesktopGroup = {
    key: string;
    label: string;
    href?: string;
    items: NavItem[];
    /** Twee kolommen met titel = mega-menu; anders één nette kolom. */
    columns?: { title: string; items: NavItem[] }[];
  };
  const bezoekenPraktisch = byKey("bezoeken");
  const bezoekenGroepen = byKey("programmas");
  const desktopGroups: DesktopGroup[] = [
    {
      key: "ontdekken",
      label: groupLabel("Ontdekken", "Découvrir", "Discover"),
      items: [...byKey("over-ons"), ...byKey("betrokkenheid")],
    },
    {
      key: "bezoeken",
      label: groupLabel("Bezoeken", "Visiter", "Visit"),
      items: [...bezoekenPraktisch, ...bezoekenGroepen],
      columns: [
        {
          title: groupLabel("Praktische info", "Infos pratiques", "Practical info"),
          items: bezoekenPraktisch,
        },
        {
          title: groupLabel("Groepen & verhuur", "Groupes & location", "Groups & rental"),
          items: bezoekenGroepen,
        },
      ],
    },
    {
      key: "academy",
      label: t("nav.academy"),
      items: [
        {
          label: groupLabel(
            "🎓 Educatie & workshops",
            "🎓 Éducation & ateliers",
            "🎓 Education & workshops",
          ),
          href: pathFor("education", lang),
          hint: groupLabel(
            "Animaties en lespakketten",
            "Animations et dossiers pédagogiques",
            "Activities and lesson packs",
          ),
        },
        {
          label: groupLabel(
            "🧩 Quizzen & dierenweetjes",
            "🧩 Quiz & infos animaux",
            "🧩 Quizzes & animal facts",
          ),
          href: pathFor("academy", lang),
          hint: groupLabel(
            "Speel en leer over onze dieren",
            "Jouez et apprenez sur nos animaux",
            "Play and learn about our animals",
          ),
        },
        {
          label: groupLabel(
            "📜 Certificaten & cursussen",
            "📜 Certificats & cours",
            "📜 Certificates & courses",
          ),
          href: "/verifieer",
          hint: groupLabel(
            "Bekijk of controleer een certificaat",
            "Consultez ou vérifiez un certificat",
            "View or verify a certificate",
          ),
        },
        {
          label: groupLabel(
            "📱 Fair & Open Tech",
            "📱 Fair & Open Tech",
            "📱 Fair & Open Tech",
          ),
          href: pathFor("fairtech", lang),
          hint: groupLabel(
            "Fairphone en /e/OS op de boerderij",
            "Fairphone et /e/OS à la ferme",
            "Fairphone and /e/OS at the farm",
          ),
        },
      ],
    },
    {
      key: "shop",
      label: groupLabel("Hoevewinkel", "Magasin de la ferme", "Farm shop"),
      href: pathFor("shop", lang),
      items: [],
    },
  ];

  const navigate = useNavigate();
  useSiteSearchShortcut(setSearchOpen);
  const { isLoggedIn, user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locationSearch = useRouterState({ select: (s) => s.location.searchStr });
  const loginRedirect = currentPath(pathname, locationSearch);
  const signedIn = isLoggedIn;

  useEffect(() => {
    const refresh = () => setCount(readCart().reduce((s, i) => s + i.quantity, 0));
    refresh();
    window.addEventListener("scos:cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("scos:cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        profileBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  // Verplaats focus naar het eerste item zodra de profielmenu opent (toetsenbord)
  useEffect(() => {
    if (!profileOpen) return;
    const first = profileMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
  }, [profileOpen]);

  // Sluit het mobiele menu met Escape en geef focus terug aan de menuknop
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Sluit menu's bij navigatie
  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
    setOpenHub(null);
  }, [pathname]);

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const items = Array.from(
      profileMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? items.length - 1
          : e.key === "ArrowDown"
            ? (i + 1 + items.length) % items.length
            : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  // Close mega-menu on outside click / escape
  useEffect(() => {
    if (!openHub) return;
    const onDown = (e: MouseEvent) => {
      if (!hubWrapRef.current?.contains(e.target as Node)) setOpenHub(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenHub(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openHub]);

  return (
    <>
      {/* Spacer houdt de contenthoogte correct nu de header uit de flow is */}
      <div aria-hidden className="h-[68px] md:h-[72px]" />
      <header className="fixed inset-x-0 top-0 z-[999] border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <LocalLink
            to={pathFor("home", lang)}
            className="flex items-center gap-3"
            aria-label={t("brand.name")}
          >
            <MLogo className="h-10 w-auto shrink-0" />
            <span className="hidden sm:block font-serif text-[19px] italic leading-none text-[color:var(--color-terracotta)]">
              {t("brand.name")}
            </span>
          </LocalLink>

          <nav ref={hubWrapRef} className="hidden lg:flex items-center gap-0 text-sm relative">
            {desktopGroups.map((hub) =>
              hub.items.length === 0 ? (
                <NavLink key={hub.key} to={hub.href ?? "/"}>
                  {hub.label}
                </NavLink>
              ) : (
                <div key={hub.key} className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openHub === hub.key}
                    onClick={() => setOpenHub((k) => (k === hub.key ? null : hub.key))}
                    className={
                      "min-h-[48px] inline-flex items-center gap-1 px-3 py-2 text-[13px] uppercase tracking-[0.15em] transition-colors " +
                      (openHub === hub.key
                        ? "text-[color:var(--color-terracotta)] font-semibold"
                        : "text-foreground/90 hover:text-[color:var(--color-terracotta)]")
                    }
                  >
                    {hub.label}
                    <ChevronDown
                      className={
                        "h-3.5 w-3.5 transition-transform " +
                        (openHub === hub.key ? "rotate-180" : "")
                      }
                    />
                  </button>
                  {openHub === hub.key && (
                    <div
                      role="menu"
                      className={
                        "absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 rounded-2xl border border-border/70 bg-background shadow-2xl " +
                        (hub.columns ? "grid w-[520px] grid-cols-2 gap-6 p-6" : "w-80 p-2")
                      }
                    >
                      {hub.columns
                        ? hub.columns.map((col) => (
                            <div key={col.title}>
                              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {col.title}
                              </p>
                              <div className="flex flex-col">
                                {col.items.map((it) => (
                                  <MenuItemLink
                                    key={it.href}
                                    item={it}
                                    onClick={() => setOpenHub(null)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))
                        : hub.items.map((it) => (
                            <MenuItemLink
                              key={it.href}
                              item={it}
                              onClick={() => setOpenHub(null)}
                            />
                          ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-3">
            {/* Taalkiezer alleen vanaf tablet: op mobiel staat hij in de lade. */}
            <LanguageSwitcher className="hidden md:inline-flex" />
            <ThemeMenu className="hidden md:inline-flex" />

            <LocalLink
              to={pathFor("support", lang)}
              aria-label={c.support.replace("💚 ", "")}
              className="hidden md:inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl bg-[color:var(--color-terracotta)] px-2 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-colors hover:brightness-110 md:px-4 md:text-sm"
            >
              <span aria-hidden>💚</span>
              <span className="hidden sm:inline">{c.support.replace("💚 ", "")}</span>
            </LocalLink>


            <button
              type="button"
              aria-label={c.search}
              onClick={() => setSearchOpen(true)}
              className="min-h-[48px] min-w-[36px] inline-flex items-center justify-center text-foreground hover:text-[color:var(--color-terracotta)] sm:min-w-[40px]"
            >
              <Search className="h-5 w-5" strokeWidth={1.75} />
            </button>


            {/* Profielknop: mobiel = directe navigatie, desktop = dropdown */}
            {signedIn ? (
              <>
                <LocalLink
                  to={pathFor("account", lang)}
                  search={{ tab: "hoefjes" as const }}
                  aria-label={t("nav.account")}
                  className="hidden sm:inline-flex md:hidden min-h-[48px] min-w-[48px] items-center justify-center text-foreground hover:text-[color:var(--color-terracotta)]"
                >
                  <User className="h-5 w-5" strokeWidth={1.75} />
                </LocalLink>
                <div ref={profileRef} className="relative hidden md:block">
                  <button
                    ref={profileBtnRef}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    aria-label={t("nav.account")}
                    onClick={() => setProfileOpen((o) => !o)}
                    className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center text-foreground hover:text-[color:var(--color-terracotta)]"
                  >
                    <User className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                  {profileOpen && (
                    <div
                      ref={profileMenuRef}
                      role="menu"
                      aria-label={t("nav.account")}
                      onKeyDown={onMenuKeyDown}
                      className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border/70 bg-background p-2 shadow-2xl"
                    >
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-[color:var(--ink-forest)]">
                          {c.hello(firstName(user?.name ?? null, user?.email ?? null))}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                      </div>
                      <div className="my-1 h-px bg-border" />
                      <LocalLink
                        to={pathFor("account", lang)}
                        search={{ tab: "hoefjes" as const }}
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] hover:bg-[color:var(--surface-page)]/70"
                      >
                        <span className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 shrink-0" /> {c.myHooi}
                        </span>
                        <span className="font-mono text-xs text-[color:var(--color-terracotta)]">
                          {user?.hoefjes ?? 0}
                        </span>
                      </LocalLink>
                      <LocalLink
                        to={pathFor("account", lang)}
                        search={{ tab: "bestellingen" as const }}
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] hover:bg-[color:var(--surface-page)]/70"
                      >
                        <ShoppingBag className="h-4 w-4 shrink-0" /> {c.myOrders}
                      </LocalLink>
                      <LocalLink
                        to={pathFor("account", lang)}
                        search={{ tab: "badges" as const }}
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] hover:bg-[color:var(--surface-page)]/70"
                      >
                        <GraduationCap className="h-4 w-4 shrink-0" /> {c.myBadges}
                      </LocalLink>
                      <LocalLink
                        to={pathFor("account", lang)}
                        search={{ tab: "instellingen" as const }}
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] hover:bg-[color:var(--surface-page)]/70"
                      >
                        <User className="h-4 w-4 shrink-0" /> {c.settings}
                      </LocalLink>
                      <div className="my-1 h-px bg-border" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          void signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-muted-foreground hover:bg-[color:var(--surface-page)]/70"
                      >
                        <LogOut className="h-4 w-4 shrink-0" /> {c.signOut}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <LocalLink
                to={pathFor("login", lang)}
                onClick={() => stashRedirect(loginRedirect)}
                aria-label={t("nav.signin")}
                className="hidden sm:inline-flex min-h-[48px] min-w-[48px] items-center justify-center text-foreground hover:text-[color:var(--color-terracotta)]"
              >
                <User className="h-5 w-5" strokeWidth={1.75} />
              </LocalLink>
            )}

            <button
              type="button"
              aria-label={t("nav.cart")}
              onClick={() => {
                const isEmpty = readCart().reduce((s, i) => s + i.quantity, 0) === 0;
                const onShop =
                  typeof window !== "undefined" && window.location.pathname.startsWith("/webshop");
                if (isEmpty && !onShop) {
                  navigate({ to: pathFor("shop", lang) as never });
                  return;
                }
                window.dispatchEvent(new Event("scos:cart-open"));
              }}
              className="relative hidden md:inline-flex min-h-[48px] min-w-[48px] items-center justify-center text-foreground hover:text-[color:var(--color-terracotta)]"
            >

              <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-[color:var(--color-terracotta)] text-white text-[10px] font-semibold px-1 inline-flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            <button
              ref={menuBtnRef}
              type="button"
              aria-label={open ? c.menuClose : c.menuOpen}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden min-h-[48px] min-w-[48px] inline-flex items-center justify-center text-foreground"
            >
              {open ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer — grid-rows animatie: vloeiend open/dicht, geen layout jump.
            Eén enkele X sluitknop: die van de vaste header (hamburgermenu togglet). */}
        <div
          id="mobile-nav"
          inert={!open}
          className={
            "lg:hidden grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none " +
            (open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none")
          }
        >
          <div
            className={
              "min-h-0 overflow-hidden bg-background " + (open ? "border-t border-border" : "")
            }
          >
            <nav
              aria-label="Hoofdmenu"
              className="mx-auto flex max-w-7xl flex-col px-4 py-2 md:px-8"
            >
              {/* A. Primaire navigatie */}
              <MobileAccordion
                label={groupLabel("Bezoeken", "Visiter", "Visit")}
                sections={[
                  {
                    title: groupLabel("Praktisch", "Pratique", "Practical"),
                    items: bezoekenPraktisch,
                  },
                  {
                    title: groupLabel("Groepen", "Groupes", "Groups"),
                    items: bezoekenGroepen,
                  },
                ]}
                onNavigate={() => setOpen(false)}
              />
              <MobileAccordion
                label={t("nav.academy")}
                items={desktopGroups.find((g) => g.key === "academy")?.items ?? []}
                onNavigate={() => setOpen(false)}
              />
              <MobileLink to={pathFor("shop", lang)} onClick={() => setOpen(false)}>
                {t("nav.webshop")}
              </MobileLink>
              <MobileAccordion
                label={groupLabel("Ontdekken", "Découvrir", "Discover")}
                items={[...byKey("over-ons"), ...byKey("betrokkenheid")]}
                onNavigate={() => setOpen(false)}
              />

              {/* B. Compacte acties */}
              <div className="mt-4 flex flex-col gap-2">
                <LocalLink
                  to={pathFor("support", lang)}
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
                >
                  {c.support.replace("Steun ons", groupLabel("Steun het project", "Soutenir le projet", "Support the project"))}
                </LocalLink>
                {signedIn ? (
                  <div className="flex items-center gap-2">
                    <LocalLink
                      to={pathFor("account", lang)}
                      search={{ tab: "hoefjes" as const }}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-center text-sm text-foreground transition-colors hover:bg-[color:var(--surface-page)]/70"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--color-terracotta)] text-[10px] font-semibold text-white">
                        {initials(user?.name ?? null, user?.email ?? null)}
                      </span>
                      <span className="truncate">
                        {user?.name ?? firstName(null, user?.email ?? null)} · {user?.hoefjes ?? 0}{" "}
                        {c.hoefjes}
                      </span>
                    </LocalLink>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                      className="inline-flex min-h-[44px] shrink-0 items-center px-2 text-xs text-muted-foreground underline underline-offset-2"
                    >
                      {c.signOut}
                    </button>
                  </div>
                ) : (
                  <LocalLink
                    to={pathFor("login", lang)}
                    onClick={() => {
                      stashRedirect(loginRedirect);
                      setOpen(false);
                    }}
                    className="block w-full rounded-xl border border-border px-4 py-2.5 text-center text-sm text-foreground transition-colors hover:bg-[color:var(--surface-page)]/70"
                  >
                    👤 {c.signInRegister}
                  </LocalLink>
                )}
              </div>

              {/* C. Voettekst: taal, thema, adres */}
              <div className="mt-5 flex flex-col gap-3 border-t border-border/60 py-4 text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <MobileLangToggle />
                  <ThemeSwitcher className="border-0 bg-transparent p-0 [&>button]:h-8 [&>button]:w-8" />
                </div>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                  <span aria-hidden>📍</span> Stadsboerderij Brussel 1000
                </p>
              </div>
            </nav>
          </div>
        </div>

        <CartDrawer />
        <SiteSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </header>
    </>
  );
}

/** Eén regel in een uitklapmenu: titel + korte uitleg, zachte hover. */
function MenuItemLink({
  item,
  onClick,
}: {
  item: { label: string; href: string; hint?: string };
  onClick?: () => void;
}) {
  return (
    <a
      href={item.href}
      role="menuitem"
      onClick={onClick}
      className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-[color:var(--surface-page)]/70"
    >
      <div className="text-[13px] font-semibold text-[color:var(--ink-forest)]">{item.label}</div>
      {item.hint && <div className="mt-0.5 text-[12px] text-muted-foreground">{item.hint}</div>}
    </a>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <LocalLink
      to={to}
      className="relative min-h-[48px] inline-flex items-center px-3 py-2 text-[13px] uppercase tracking-[0.15em] text-foreground/90 hover:text-[color:var(--color-terracotta)] transition-colors"
      activeProps={{
        className:
          "text-[color:var(--color-terracotta)] font-semibold after:absolute after:inset-x-3 after:bottom-1 after:h-[2px] after:rounded-full after:bg-[color:var(--color-terracotta)]",
      }}
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </LocalLink>
  );
}

function MobileLink({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <LocalLink
      to={to}
      onClick={onClick}
      className="min-h-[48px] flex items-center border-b border-border/60 py-3 text-sm uppercase tracking-[0.15em] text-foreground/90"
      activeProps={{ className: "text-[color:var(--color-terracotta)] font-semibold" }}
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </LocalLink>
  );
}

/** Uitklapbaar mobiel menu-item: vlakke lijst of geneste subsecties met titel. */
function MobileAccordion({
  label,
  items,
  sections,
  onNavigate,
}: {
  label: string;
  items?: { label: string; href: string; hint?: string }[];
  sections?: { title: string; items: { label: string; href: string; hint?: string }[] }[];
  onNavigate?: () => void;
}) {
  const renderItems = (list: { label: string; href: string; hint?: string }[]) =>
    list.map((it) => (
      <a
        key={it.href}
        href={it.href}
        onClick={onNavigate}
        className="flex min-h-[44px] flex-col justify-center rounded-lg px-3 py-2 text-[13px] text-foreground/90 hover:bg-[color:var(--surface-page)]/60"
      >
        <span className="font-medium">{it.label}</span>
        {it.hint && (
          <span className="mt-0.5 block text-[11px] text-muted-foreground">{it.hint}</span>
        )}
      </a>
    ));

  return (
    <details className="group border-b border-border/60">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between py-3 text-sm uppercase tracking-[0.15em] text-foreground/90 marker:hidden">
        {label}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-3 pl-2">
        {sections
          ? sections.map((sec) => (
              <div key={sec.title}>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {sec.title}
                </p>
                {renderItems(sec.items)}
              </div>
            ))
          : renderItems(items ?? [])}
      </div>
    </details>
  );
}

/** Dezelfde volledige taalkeuze als op desktop, compact in de mobiele lade. */
function MobileLangToggle() {
  return <LanguageSwitcher className="inline-flex" />;
}
