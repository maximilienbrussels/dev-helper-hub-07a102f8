import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Inbox, MoreHorizontal, QrCode, Sprout } from "lucide-react";

import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { checkPortalAccess } from "@/lib/portal-access.functions";
import { PortalProvider } from "@/lib/portal-store";
import { pathWithMode } from "@/lib/app-mode";
import { usePermissions } from "@/lib/use-permissions";
import { cn } from "@/lib/utils";

/**
 * Veld-app (maximilien.app): lichte schermen voor medewerkers op het terrein.
 * Dezelfde aanmelding en dezelfde databank als het beheerportaal.
 */
export const Route = createFileRoute("/veld")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Maximilien veld-app" },
      { name: "description", content: "Dagelijkse terreinwerking van La Ferme du parc Maximilien." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Maximilien veld-app" },
      { property: "og:description", content: "Dagelijkse terreinwerking van La Ferme du parc Maximilien." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const authHref = pathWithMode("/auth", "field");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ href: authHref });
    const access = await checkPortalAccess().catch(() => null);
    if (access?.mfa) {
      throw redirect({ href: `/beveiliging?next=${encodeURIComponent(location.pathname)}` });
    }
    if (!access?.allowed) throw redirect({ href: authHref });
    return { user: data.user, portalRole: access.role };
  },
  component: FieldLayout,
});

const TABS = [
  { to: "/veld", label: "Vandaag", Icon: CalendarDays, exact: true, need: "view_today" },
  { to: "/veld/aanvragen", label: "Aanvragen", Icon: Inbox, need: "view_requests" },
  { to: "/veld/scanner", label: "Scan", Icon: QrCode, center: true, need: "manage_orders" },
  { to: "/veld/diensten", label: "Diensten", Icon: Sprout, need: "view_services" },
  { to: "/veld/meer", label: "Meer", Icon: MoreHorizontal, need: null },
] as const;

function FieldLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { can, isLoading } = usePermissions();
  // Tijdens het laden tonen we alles; daarna alleen wat deze medewerker mag.
  const tabs = TABS.filter((tab) => !tab.need || isLoading || can(tab.need));


  return (
    <PortalProvider standaloneLang>
      <div className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-hidden">
        <main
          className="flex-1 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-32"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(31,42,28,0.5)] backdrop-blur-xl print:hidden">
          <ul className="mx-auto flex max-w-lg items-stretch justify-between">
            {tabs.map(({ to, label, Icon, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = exact ? pathname === to : pathname.startsWith(to);
              const center = "center" in rest && rest.center;
              return (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[66px] flex-col items-center justify-center gap-1 px-1 text-[10.5px] font-bold tracking-[0.02em] transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full transition-all duration-200",
                        center
                          ? "-mt-7 h-15 w-15 bg-primary text-primary-foreground shadow-[0_10px_24px_-10px_rgba(200,109,81,0.85)] ring-4 ring-card"
                          : "h-9 w-9",
                        !center && active && "bg-primary/12",
                      )}
                    >
                      <Icon className={center ? "h-7 w-7" : "h-[21px] w-[21px]"} aria-hidden />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </PortalProvider>
  );
}
