import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import {
  Bell,
  CalendarDays,
  Inbox,
  LayoutList,
  ShoppingBasket,
  GraduationCap,
  Tag,
  Users,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Mail,
  Images,
  PawPrint,
  MoreHorizontal,
  History,
  SlidersHorizontal,
  KeyRound,
  Sparkles,
  PackageCheck,
  BarChart3,
  QrCode,
  Languages,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
import type { Permission } from "@/lib/rights.functions";
import { LANGS, pathFor, type PortalPage } from "@/lib/portal-routes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { MLogo } from "@/components/MLogo";
import { DevSecretsModal } from "@/components/DevSecretsModal";
import { MaximAdminAiBubble } from "@/components/portal/copilot/MaximAdminAiBubble";
import { PickupScanner } from "@/components/portal/PickupScanner";
import { FieldHandoffItem } from "@/components/portal/FieldHandoffItem";


type NavGroup = "work" | "content" | "admin";

type NavItem = {
  page: PortalPage;
  key: string;
  icon: typeof LayoutList;
  permission: Permission;
  group: NavGroup;
};

const NAV: NavItem[] = [
  { page: "today", key: "nav.today", icon: LayoutList, permission: "view_today", group: "work" },
  { page: "requests", key: "nav.requests", icon: Inbox, permission: "view_requests", group: "work" },
  { page: "calendar", key: "nav.calendar", icon: CalendarDays, permission: "view_calendar", group: "work" },
  { page: "services", key: "nav.services", icon: Tag, permission: "view_services", group: "work" },
  { page: "shop", key: "nav.shop", icon: ShoppingBasket, permission: "view_shop", group: "work" },
  { page: "pickups", key: "nav.pickups", icon: PackageCheck, permission: "manage_orders", group: "work" },
  { page: "academy", key: "nav.academy", icon: GraduationCap, permission: "view_academy", group: "content" },
  { page: "results", key: "nav.results", icon: BarChart3, permission: "view_academy", group: "content" },
  { page: "social", key: "nav.social", icon: Images, permission: "view_media", group: "content" },
  { page: "albums", key: "nav.albums", icon: Images, permission: "view_media", group: "content" },
  { page: "residents", key: "nav.residents", icon: PawPrint, permission: "view_media", group: "content" },
  { page: "email", key: "nav.email", icon: Mail, permission: "manage_rights", group: "content" },
  { page: "team", key: "nav.team", icon: Users, permission: "view_team", group: "admin" },
  { page: "site", key: "nav.site", icon: SlidersHorizontal, permission: "manage_settings", group: "admin" },
  { page: "log", key: "nav.log", icon: History, permission: "view_audit", group: "admin" },
  { page: "api", key: "nav.api", icon: KeyRound, permission: "manage_settings", group: "admin" },
];

const NAV_GROUPS: { id: NavGroup; key: string }[] = [
  { id: "work", key: "navgroup.work" },
  { id: "content", key: "navgroup.content" },
  { id: "admin", key: "navgroup.admin" },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, page, role, isAdmin, currentUser, bookings } = usePortal();
  const { can, isLoading: rightsLoading } = usePermissions();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  useRouterState({ select: (s) => s.location.pathname });
  const pending = bookings.filter((b) => b.status === "nieuw").length;
  // Navigation follows the rights matrix (RBAC).
  const items = NAV.filter((n) => (rightsLoading ? n.page === "today" : can(n.permission)));
  // Telefoon: vier snelkoppelingen onderaan, de rest achter "Meer".
  const primary = items.slice(0, 4);
  const overflow = items.slice(4);
  const [moreOpen, setMoreOpen] = useState(false);
  // Telefoon: camerascan voor afhaal-QR's (op desktop volledig verborgen).
  const [scanOpen, setScanOpen] = useState(false);
  const canScan = !rightsLoading && can("manage_orders");
  // Desktop: zijbalk inklapbaar tot icoonmodus + inklapbare groepen.
  const [railed, setRailed] = useState(false);
  const [closedGroups, setClosedGroups] = useState<NavGroup[]>([]);
  useEffect(() => {
    setRailed(localStorage.getItem("portal.sidebar.railed") === "1");
    try {
      const raw = localStorage.getItem("portal.sidebar.groups");
      if (raw) setClosedGroups(JSON.parse(raw) as NavGroup[]);
    } catch {
      /* geen voorkeur bewaard */
    }
  }, []);
  function toggleRail() {
    setRailed((v) => {
      localStorage.setItem("portal.sidebar.railed", v ? "0" : "1");
      return !v;
    });
  }
  function toggleGroup(id: NavGroup) {
    setClosedGroups((prev) => {
      const next = prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];
      localStorage.setItem("portal.sidebar.groups", JSON.stringify(next));
      return next;
    });
  }
  // Bookings are date-derived; render them only after hydration to avoid
  // server/client timezone mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Naam met een nette fallback op het e-mailadres, zodat er nooit een leeg
  // label met enkel de rol ("Team") in de hoeken blijft staan.
  const displayName =
    currentUser.name?.trim() || currentUser.email?.split("@")[0] || t("menu.account");
  const initials =
    displayName
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?";


  return (
    <div className="min-h-screen w-full bg-[color:var(--surface-page,var(--background))]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar text-sidebar-foreground shadow-[inset_-1px_0_0_0_var(--sidebar-border)] transition-[width] duration-200 lg:flex",
          railed ? "w-[4.75rem]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 border-b border-sidebar-border/70 py-5",
            railed ? "justify-center px-2" : "px-5",
          )}
        >
          <MLogo variant="white" className="h-9 w-auto shrink-0" />
          {railed ? null : (
            <div className="min-w-0">
              <p className="truncate font-display text-sm leading-tight font-bold text-sidebar-accent-foreground">
                {t("app.brand")}
              </p>
              <p className="mt-0.5 truncate text-[10px] tracking-[0.18em] text-sidebar-foreground/55 uppercase">
                {t("app.name")}
              </p>
            </div>
          )}
        </div>
        <nav className={cn("flex-1 overflow-y-auto py-3", railed ? "px-2" : "px-3")}>
          {NAV_GROUPS.map((group) => {
            const groupItems = items.filter((i) => i.group === group.id);
            if (groupItems.length === 0) return null;
            const open = railed || !closedGroups.includes(group.id);
            return (
              <div key={group.id} className="mb-2">
                {railed ? (
                  <span aria-hidden className="mx-auto mb-2 block h-px w-6 bg-sidebar-border/70" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-sidebar-foreground/45 uppercase transition-colors hover:text-sidebar-accent-foreground"
                  >
                    {t(group.key)}
                    <ChevronDown
                      className={cn("ml-auto size-3.5 transition-transform", open ? "" : "-rotate-90")}
                    />
                  </button>
                )}
                {open ? (
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const active = page === item.page;
                      return (
                        <Link
                          key={item.page}
                          to={pathFor(lang, item.page)}
                          title={railed ? t(item.key) : undefined}
                          aria-label={railed ? t(item.key) : undefined}
                          className={cn(
                            "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150",
                            railed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute top-1/2 left-0 h-6 w-1 -translate-x-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary-foreground transition-opacity",
                              active ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <item.icon className="size-4 shrink-0" />
                          {railed ? null : <span className="truncate">{t(item.key)}</span>}
                          {item.page === "requests" && pending > 0 ? (
                            <span
                              className={cn(
                                "rounded-full bg-accent text-[10px] font-bold text-accent-foreground",
                                railed
                                  ? "absolute top-1.5 right-1.5 grid size-4 place-items-center"
                                  : "ml-auto px-1.5 py-0.5",
                              )}
                            >
                              {pending}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className={cn("border-t border-sidebar-border/70 py-3", railed ? "px-2" : "px-4")}>
          <button
            type="button"
            onClick={toggleRail}
            aria-label={railed ? t("nav.expand") : t("nav.collapse")}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              railed && "justify-center",
            )}
          >
            {railed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                {t("nav.collapse")}
              </>
            )}
          </button>
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-sidebar-accent/40 px-2.5 py-2",
              railed && "justify-center px-0",
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
              {initials}
            </span>
            {railed ? null : (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-xs font-semibold text-sidebar-accent-foreground">
                  {displayName}
                </span>
                <span className="block truncate text-[10px] text-sidebar-foreground/55">
                  {currentUser.email}
                </span>
              </span>
            )}
          </div>
          {railed ? null : (
            <span className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-sidebar-foreground/45">
              <ShieldCheck className="size-3.5" />
              {t("app.session")}
              <span className="ml-auto rounded-full border border-sidebar-border/70 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-foreground/70">
                {t(`role.${role}`)}
              </span>
            </span>
          )}
        </div>

      </aside>

      <div className={cn(railed ? "lg:pl-[4.75rem]" : "lg:pl-64")}>
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <MLogo className="h-7 w-auto shrink-0 lg:hidden" />
              <p className="truncate font-display text-sm font-bold lg:hidden">{t("app.brand")}</p>
              <p className="hidden truncate text-base font-semibold tracking-tight lg:block">
                {t(NAV.find((n) => n.page === page)?.key ?? "nav.today")}
              </p>

            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                to={pathFor(lang, "requests")}
                aria-label={t("menu.notifications")}
                className="relative rounded-md p-2 hover:bg-muted"
              >
                <Bell className="size-4" />
                {pending > 0 ? (
                  <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    {pending}
                  </span>
                ) : null}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    aria-label={displayName}
                    className="h-10 gap-2 rounded-full border border-border/70 bg-card pr-2 pl-1.5 hover:bg-muted"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <span className="hidden max-w-[9rem] truncate text-xs font-semibold sm:block">
                      {displayName}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm font-semibold">{displayName}</span>
                      <span className="block truncate text-[11px] font-normal text-muted-foreground">
                        {currentUser.email}
                      </span>
                      <span className="mt-1 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {t(`role.${role}`)}
                      </span>
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {isAdmin ? (
                    <>
                      <DropdownMenuLabel className="text-[10px] tracking-wide text-muted-foreground uppercase">
                        {t("menu.settings")}
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to={pathFor(lang, "team")}>
                          <Users className="size-4" />
                          {t("menu.team")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={pathFor(lang, "services")}>
                          <Tag className="size-4" />
                          {t("nav.services")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={pathFor(lang, "email")}>
                          <Mail className="size-4" />
                          E-mail
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                     </>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profiel">
                      <ShieldCheck className="size-4" />
                      {t("menu.security")}
                    </Link>
                  </DropdownMenuItem>
                  <FieldHandoffItem label={t("menu.openFieldApp")} />
                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="flex items-center gap-2 text-[10px] tracking-wide text-muted-foreground uppercase">
                    <Languages className="size-3.5" />
                    {t("menu.language")}
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={lang}
                    onValueChange={(v) => setLang(v as (typeof LANGS)[number])}
                  >
                    {LANGS.map((l) => (
                      <DropdownMenuRadioItem key={l} value={l} className="uppercase">
                        {l}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2 text-[10px] tracking-wide text-muted-foreground uppercase">
                    {theme === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                    {t("menu.theme")}
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(v) => setTheme(v as Theme)}
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun className="size-4" />
                      {t("theme.light")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="size-4" />
                      {t("theme.dark")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor className="size-4" />
                      {t("theme.system")}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="size-4" />
                    {t("menu.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pt-4 pb-24 sm:px-6 sm:pt-6 lg:pb-10">
          {mounted ? children : <div className="min-h-[60vh]" />}
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-flow-col border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {canScan ? (
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              setScanOpen(true);
            }}
            aria-label={t("nav.scan")}
            className="absolute -top-7 left-1/2 z-10 grid size-16 -translate-x-1/2 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <QrCode className="size-7" />
          </button>
        ) : null}
        {primary.map((item) => {
          const active = page === item.page;
          return (
            <Link
              key={item.page}
              to={pathFor(lang, item.page)}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-primary transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <item.icon className="size-5" />
              <span className="max-w-full truncate px-1">{t(item.key).split(" ")[0]}</span>
              {item.page === "requests" && pending > 0 ? (
                <span className="absolute top-1.5 right-1/4 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  {pending}
                </span>
              ) : null}
            </Link>
          );
        })}
        {overflow.length > 0 ? (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
              overflow.some((o) => o.page === page) || moreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="size-5" />
            <span>{t("nav.more")}</span>
          </button>
        ) : null}
      </nav>

      {/* Telefoon: overige pagina's */}
      {moreOpen && overflow.length > 0 ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-2xl"
          >
            <p className="px-1 pb-2 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              {t("menu.settings")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {overflow.map((item) => (
                <Link
                  key={item.page}
                  to={pathFor(lang, item.page)}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border border-border px-3 py-3 text-sm font-medium transition-colors",
                    page === item.page ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{t(item.key)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {scanOpen ? <PickupScanner onClose={() => setScanOpen(false)} /> : null}
      {can("manage_settings") ? <MaximAdminAiBubble /> : null}
      <DevSecretsModal />
    </div>
  );
}
