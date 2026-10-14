import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { isAdminPath } from "@/lib/app-mode";

/**
 * Shell van het bestaande admin-portaal (maximilien.site).
 * Het portaal brengt zijn eigen layout mee (zie components/portal/PortalShell),
 * dus deze shell voegt alleen de admin-scope toe en laat publieke marketing-chrome
 * (footer, PWA-prompt) bewust weg.
 *
 * Extra vangnet (naast de root-beforeLoad): publieke paden worden in admin-modus
 * nooit gerenderd maar naar /auth gestuurd — ook bij de dev-override in preview.
 */
export default function AdminAppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const allowed = isAdminPath(pathname);

  useEffect(() => {
    if (!allowed) void navigate({ to: "/auth", replace: true });
  }, [allowed, navigate]);

  return (
    <div data-app-mode="admin" className="min-h-screen w-full max-w-full">
      {allowed ? children : null}
    </div>
  );
}
