import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";

import { isFieldPath } from "@/lib/app-mode";
import { registerFieldServiceWorker } from "@/lib/pwa";

/**
 * Shell van de veld-app (maximilien.app): schermvullend, geen marketing-chrome,
 * met een duidelijke offline-melding en registratie van de service worker.
 */
export default function FieldAppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const allowed = isFieldPath(pathname);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!allowed) void navigate({ to: "/veld", replace: true });
  }, [allowed, navigate]);

  useEffect(() => {
    void registerFieldServiceWorker();
  }, []);

  useEffect(() => {
    const sync = () => setOffline(!window.navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <div
      data-app-mode="field"
      className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-hidden bg-background"
    >
      {offline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-[12px] font-semibold text-amber-950 print:hidden">
          <WifiOff className="h-3.5 w-3.5" aria-hidden />
          Geen verbinding — je ziet de laatst geladen gegevens
        </div>
      )}
      {allowed ? children : null}
    </div>
  );
}
