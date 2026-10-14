import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { PortalProvider } from "@/lib/portal-store";
import { PortalShell } from "@/components/portal/PortalShell";
import { checkPortalAccess } from "@/lib/portal-access.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Bron van waarheid: de Neon-tabel `portal_admins`.
    const access = await checkPortalAccess().catch(() => null);
    // Noodtoegang: superadmin zonder 2FA mag door (allowed + mfa "setup"); geen lus.
    if (access?.mfa && !access.allowed) {
      throw redirect({ href: `/beveiliging?next=${encodeURIComponent(location.pathname)}` });
    }
    if (!access?.allowed) throw redirect({ to: "/auth" });
    if (access.mfa === "setup") {
      console.warn("Tweestapsverificatie nog niet ingesteld — stel ze in via /beveiliging.");
    }
    return { user: data.user, portalRole: access.role };
  },
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <PortalProvider>
      <PortalShell>
        <Outlet />
      </PortalShell>
    </PortalProvider>
  );
}
