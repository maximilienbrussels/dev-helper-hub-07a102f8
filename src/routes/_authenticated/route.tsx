import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { PortalProvider } from "@/lib/portal-store";
import { PortalShell } from "@/components/portal/PortalShell";
import { checkPortalAccess } from "@/lib/portal-access.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Bron van waarheid: de Neon-tabel `portal_admins`.
    // Een storing mag nooit worden behandeld als een rechtenweigering.
    const access = await checkPortalAccess();
    // Noodtoegang: superadmin zonder 2FA mag door (allowed + mfa "setup"); geen lus.
    if (access?.mfa && !access.allowed) {
      throw redirect({ href: `/beveiliging?next=${encodeURIComponent(location.pathname)}` });
    }
    if (!access?.allowed) {
      throw redirect({
        href: `/auth?geen_toegang=${encodeURIComponent(data.user.email ?? "1")}`,
      });
    }
    if (access.mfa === "setup") {
      console.warn("Tweestapsverificatie nog niet ingesteld — stel ze in via /beveiliging.");
    }
    return { user: data.user, portalRole: access.role };
  },
  component: PortalLayout,
  errorComponent: () => (
    <main className="mx-auto max-w-md space-y-4 px-4 py-12 text-center">
      <h1 className="font-semibold">De toegangscontrole lukte niet</h1>
      <p className="text-sm text-muted-foreground">Je sessie is niet gewist. Probeer opnieuw zodra de verbinding hersteld is.</p>
      <Button onClick={() => window.location.reload()}>Opnieuw proberen</Button>
      <Button variant="outline" asChild><a href="/auth">Naar aanmelden</a></Button>
    </main>
  ),
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
