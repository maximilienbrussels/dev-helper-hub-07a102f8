import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { useT, type Lang } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const COPY: Record<Lang, { install: string; ios: string }> = {
  nl: { install: "App installeren", ios: "Tik op Delen 📤 en kies 'Zet op beginscherm'." },
  fr: { install: "Installer l'app", ios: "Touchez Partager 📤 puis « Sur l'écran d'accueil »." },
  en: { install: "Install app", ios: "Tap Share 📤 and choose 'Add to Home Screen'." },
};

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Discreet installatie-icoon in de voettekst: geen opdringerig venster, de
 * bezoeker installeert de app alleen wanneer hij dat zelf wil.
 */
export function PwaInstallButton({ className }: { className?: string }) {
  const { lang } = useT();
  const c = COPY[lang];
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    setInstalled(false);
    setIos(isIos());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  async function install() {
    if (ios || !prompt) {
      setHint((v) => !v);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <span className={className}>
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground/70 hover:text-[color:var(--color-terracotta)]"
      >
        {ios ? <Share className="size-3.5" aria-hidden /> : <Download className="size-3.5" aria-hidden />}
        {c.install}
      </button>
      {hint ? <span className="ml-2 text-[11px] text-muted-foreground">{c.ios}</span> : null}
    </span>
  );
}
