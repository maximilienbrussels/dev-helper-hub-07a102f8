import { useEffect, useState } from "react";

export type Platform = "ios" | "android" | "desktop";

/** Detecteert het besturingssysteem van de bezoeker (client-side, na hydratie). */
export function usePlatform(): { platform: Platform; standalone: boolean; ready: boolean } {
  const [state, setState] = useState<{ platform: Platform; standalone: boolean; ready: boolean }>({
    platform: "desktop",
    standalone: false,
    ready: false,
  });

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    const isTouchMac =
      /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || isTouchMac;
    const isAndroid = /Android/i.test(ua);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setState({
      platform: isIOS ? "ios" : isAndroid ? "android" : "desktop",
      standalone: Boolean(standalone),
      ready: true,
    });
  }, []);

  return state;
}

export default usePlatform;
