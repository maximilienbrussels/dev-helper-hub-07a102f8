import { useCallback, useEffect, useRef, useState } from "react";
import googleAsset from "@/assets/google-wallet.png";
import { handleImageError } from "@/lib/image-fallback";

export type Locale = "nl" | "fr" | "en";

const SAVE_PREFIX = "https://pay.google.com/gp/v/save/";

const COPY: Record<
  Locale,
  {
    label: string;
    loading: string;
    apple: string;
    failed: string;
    notConfigured: string;
    retry: string;
  }
> = {
  nl: {
    label: "Toevoegen aan Google Wallet",
    loading: "Google Wallet pas wordt geladen…",
    apple: "Op iPhone? Bewaar deze pagina in Safari of toon de QR-code aan de kassa — Apple Wallet volgt binnenkort.",
    failed: "Kon de pas niet aanmaken. Probeer het later opnieuw.",
    notConfigured: "Google Wallet is hier nog niet beschikbaar — toon je QR-code aan de kassa.",
    retry: "Opnieuw proberen",
  },
  fr: {
    label: "Ajouter à Google Wallet",
    loading: "Chargement du pass Google Wallet…",
    apple: "Sur iPhone ? Enregistrez cette page dans Safari ou montrez le QR à la caisse — Apple Wallet arrive bientôt.",
    failed: "Impossible de créer le pass. Réessayez plus tard.",
    notConfigured: "Google Wallet n'est pas encore disponible ici — montrez votre QR à la caisse.",
    retry: "Réessayer",
  },
  en: {
    label: "Add to Google Wallet",
    loading: "Loading your Google Wallet pass…",
    apple: "On iPhone? Save this page in Safari or show the QR at the desk — Apple Wallet is coming soon.",
    failed: "Could not create the pass. Please try again later.",
    notConfigured: "Google Wallet is not available here yet — show your QR code at the desk.",
    retry: "Try again",
  },
};

export type GoogleWalletMemberButtonProps = {
  memberId: string;
  memberName: string;
  hooiBalance: number;
  tier?: string;
  locale?: Locale;
  className?: string;
};

type State = "loading" | "ready" | "unavailable" | "error";

/** Officiële "Toevoegen aan Google Wallet"-knop voor de Mijn Hooi ledenpas. */
export function GoogleWalletButton({
  memberId,
  memberName,
  hooiBalance,
  tier,
  locale = "nl",
  className = "",
}: GoogleWalletMemberButtonProps) {
  const [state, setState] = useState<State>("loading");
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const mounted = useRef(true);
  const c = COPY[locale];

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/wallet/google/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, memberName, hooiBalance, tier, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        saveUrl?: string;
        error?: string;
      };
      if (!mounted.current) return;

      // Alleen een echte Google-save-URL is bruikbaar; nooit een relatieve link openen.
      if (res.ok && data.saveUrl?.startsWith(SAVE_PREFIX)) {
        setSaveUrl(data.saveUrl);
        setState("ready");
        return;
      }
      setSaveUrl(null);
      setState(data.error === "wallet_not_configured" ? "unavailable" : "error");
    } catch {
      if (!mounted.current) return;
      setSaveUrl(null);
      setState("error");
    }
  }, [memberId, memberName, hooiBalance, tier, locale]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const badge = (
    <img
      src={googleAsset}
      onError={handleImageError}
      alt={c.label}
      className="h-12 w-auto rounded-full"
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {state === "ready" && saveUrl ? (
        <a
          href={saveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={c.label}
          className="inline-block rounded-full transition-transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)]"
        >
          {badge}
        </a>
      ) : state === "loading" ? (
        <div className="inline-flex items-center gap-3 rounded-full opacity-60" aria-busy="true">
          <span className="pointer-events-none inline-block">{badge}</span>
          <span className="text-xs text-muted-foreground">{c.loading}</span>
        </div>
      ) : state === "error" ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{c.failed}</p>
          <button
            type="button"
            onClick={() => {
              void load();
            }}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
          >
            {c.retry}
          </button>
        </div>
      ) : (
        <p className="max-w-md text-xs text-muted-foreground">{c.notConfigured}</p>
      )}

      <p className="max-w-md text-xs text-muted-foreground">{c.apple}</p>

      {state === "unavailable" && import.meta.env.DEV ? (
        <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] text-amber-900">
          💡 Google Wallet secrets niet geconfigureerd (GOOGLE_WALLET_CLIENT_EMAIL / GOOGLE_WALLET_KEY)
        </p>
      ) : null}
    </div>
  );
}

export default GoogleWalletButton;
