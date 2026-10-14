import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import appleAsset from "@/assets/apple-wallet.png";
import googleAsset from "@/assets/google-wallet.png";
import weroAsset from "@/assets/wero-wallet.png";
import { handleImageError } from "@/lib/image-fallback";

/**
 * Official wallet badges (Apple Wallet, Google Wallet, Wero) using the
 * uploaded brand assets. Each badge degrades gracefully to a toast when
 * no pass URL is available yet.
 */
const COPY: Record<Lang, { apple: string; google: string; wero: string }> = {
  nl: {
    apple: "Voeg toe aan Apple Wallet",
    google: "Voeg toe aan Google Wallet",
    wero: "Voeg toe aan Wero Wallet",
  },
  fr: {
    apple: "Ajouter à Apple Wallet",
    google: "Ajouter à Google Wallet",
    wero: "Ajouter à Wero Wallet",
  },
  en: { apple: "Add to Apple Wallet", google: "Add to Google Wallet", wero: "Add to Wero Wallet" },
};

export function WalletBadges({
  applePassUrl,
  googleSaveUrl,
  weroUrl,
}: {
  applePassUrl?: string;
  googleSaveUrl?: string;
  weroUrl?: string;
}) {
  const { t, lang } = useT();
  const c = COPY[lang];
  const soon = () => toast.info(t("mine.wallet.soon"));

  const open = (url?: string) => {
    if (!url) return soon();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openWero = () => {
    if (!weroUrl) return soon();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && weroUrl.startsWith("http")) {
      const timer = window.setTimeout(() => window.open(weroUrl, "_blank"), 900);
      window.location.href = weroUrl.replace(/^https?:\/\//, "wero://");
      window.addEventListener("pagehide", () => window.clearTimeout(timer), { once: true });
      return;
    }
    window.open(weroUrl, "_blank", "noopener,noreferrer");
  };

  const btn =
    "inline-block rounded-2xl transition-transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)]";

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => open(applePassUrl)} aria-label={c.apple} className={btn}>
        <img
          src={appleAsset}
          onError={handleImageError}
          alt={c.apple}
          className="h-12 w-auto rounded-2xl"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </button>

      <button
        type="button"
        onClick={() => open(googleSaveUrl)}
        aria-label={c.google}
        className={btn}
      >
        <img
          src={googleAsset}
          onError={handleImageError}
          alt={c.google}
          className="h-12 w-auto rounded-full"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </button>

      <button type="button" onClick={openWero} aria-label={c.wero} className={btn}>
        <img
          src={weroAsset}
          onError={handleImageError}
          alt={c.wero}
          className="h-12 w-auto rounded-full"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </button>
    </div>
  );
}
