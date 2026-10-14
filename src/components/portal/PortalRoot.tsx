import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { checkPortalAccess } from "@/lib/portal-access.functions";
import { PortalProvider } from "@/lib/portal-store";
import { PortalShell } from "@/components/portal/PortalShell";
import { usePermissions } from "@/lib/use-permissions";
import type { Permission } from "@/lib/rights.functions";
import { translate } from "@/lib/portal-i18n";
import type { Lang } from "@/lib/portal-types";
import type { PortalPage } from "@/lib/portal-routes";

import { TodayPage } from "@/components/portal/pages/TodayPage";
import { RequestsPage } from "@/components/portal/pages/RequestsPage";
import { CalendarPage } from "@/components/portal/pages/CalendarPage";
import { ServicesPage } from "@/components/portal/pages/ServicesPage";
import { ShopPage } from "@/components/portal/pages/ShopPage";
import { PickupsPage } from "@/components/portal/pages/PickupsPage";
import { AcademyPage } from "@/components/portal/pages/AcademyPage";
import { ResultsPage } from "@/components/portal/pages/ResultsPage";
import { TeamPage } from "@/components/portal/pages/TeamPage";
import { EmailPage } from "@/components/portal/pages/EmailPage";
import { SocialPage } from "@/components/portal/pages/SocialPage";
import { AlbumsPage } from "@/components/portal/pages/AlbumsPage";
import { ResidentsPage } from "@/components/portal/pages/ResidentsPage";
import { SitePage } from "@/components/portal/pages/SitePage";
import { LogPage } from "@/components/portal/pages/LogPage";
import { ApiKeysPage } from "@/components/portal/pages/ApiKeysPage";
import { CoPilotPage } from "@/components/portal/pages/CoPilotPage";

const PAGES: Record<PortalPage, () => React.ReactElement> = {
  today: TodayPage,
  requests: RequestsPage,
  calendar: CalendarPage,
  services: ServicesPage,
  shop: ShopPage,
  pickups: PickupsPage,
  academy: AcademyPage,
  results: ResultsPage,
  social: SocialPage,
  albums: AlbumsPage,
  residents: ResidentsPage,
  team: TeamPage,
  email: EmailPage,
  site: SitePage,
  log: LogPage,
  api: ApiKeysPage,
  copilot: CoPilotPage,
};

/** Elke portaalpagina hangt aan een recht uit de rechtenmatrix. */
export const PAGE_PERMISSION: Record<PortalPage, Permission> = {
  today: "view_today",
  requests: "view_requests",
  calendar: "view_calendar",
  services: "view_services",
  pickups: "manage_orders",
  shop: "view_shop",
  academy: "view_academy",
  results: "view_academy",
  social: "view_media",
  albums: "view_media",
  residents: "view_media",
  team: "view_team",
  email: "manage_rights",
  site: "manage_settings",
  log: "view_audit",
  api: "manage_settings",
  copilot: "manage_settings",
};

/**
 * Portaalpagina met toegangspoort. De sessiecontrole gebeurt in de browser
 * (het portaal wordt nooit server-side gerenderd), daarna gelden de rechten
 * uit de rechtenmatrix.
 */
export function PortalRoot({ page, lang }: { page: PortalPage; lang: Lang }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      const access = await checkPortalAccess().catch(() => null);
      if (access?.mfa) {
        window.location.assign(`/beveiliging?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!access?.allowed) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!ready)
    return (
      <p className="p-6 text-sm text-muted-foreground">{translate("common.loading", lang)}</p>
    );

  return (
    <PortalProvider>
      <PortalShell>
        <PortalPageView page={page} lang={lang} />
      </PortalShell>
    </PortalProvider>
  );
}

function PortalPageView({ page, lang }: { page: PortalPage; lang: Lang }) {
  const Component = PAGES[page];
  const { can, isLoading } = usePermissions();

  if (isLoading)
    return <p className="p-6 text-sm text-muted-foreground">{translate("common.loading", lang)}</p>;

  if (!can(PAGE_PERMISSION[page]))
    return (
      <div className="mx-auto mt-8 grid max-w-md place-items-center rounded-2xl border border-border/70 bg-card p-10 text-center shadow-sm">
        <span className="grid size-12 place-items-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </span>
        <p className="mt-4 font-semibold">{translate("team.noAccess", lang)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{translate("page.noAccess", lang)}</p>
      </div>
    );

  return <Component />;
}
