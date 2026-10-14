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
    if (access?.mfa) {
      throw redirect({ href: `/beveiliging?next=${encodeURIComponent(location.pathname)}` });
    }
    if (!access?.allowed) throw redirect({ to: "/auth" });
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
