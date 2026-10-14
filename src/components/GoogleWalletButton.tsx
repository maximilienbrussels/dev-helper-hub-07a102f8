import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

export type GoogleWalletButtonProps = {
  ticketId: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  passType?: "ticket" | "pickup" | "certificate";
  locale?: "nl" | "fr" | "en";
  className?: string;
};

const COPY = {
  nl: {
    label: "Toevoegen aan Google Wallet",
    loading: "Pas wordt aangemaakt…",
    notConfigured: "Google Wallet is nog niet geconfigureerd op deze site.",
    failed: "Kon de wallet-pas niet aanmaken. Probeer het later opnieuw.",
  },
  fr: {
    label: "Ajouter à Google Wallet",
    loading: "Création du pass…",
    notConfigured: "Google Wallet n'est pas encore configuré sur ce site.",
    failed: "Impossible de créer le pass. Réessayez plus tard.",
  },
  en: {
    label: "Add to Google Wallet",
    loading: "Creating pass…",
    notConfigured: "Google Wallet is not configured on this site yet.",
    failed: "Could not create the wallet pass. Please try again later.",
  },
} as const;

/** Officiële "Add to Google Wallet"-knop met server-side ondertekende pas. */
export function GoogleWalletButton({
  ticketId,
  participantName,
  eventTitle,
  eventDate,
  passType = "ticket",
  locale = "nl",
  className = "",
}: GoogleWalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const copy = COPY[locale] ?? COPY.nl;

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-google-wallet-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          participantName,
          eventTitle,
          eventDate,
          passType,
          locale,
        }),
      });
      const data = (await res.json()) as { saveUrl?: string; error?: string };

      if (!res.ok || !data.saveUrl) {
        toast.error(
          data.error === "wallet_not_configured" ? copy.notConfigured : copy.failed,
        );
        return;
      }
      const link = document.createElement("a");
      link.href = data.saveUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch {
      toast.error(copy.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={copy.label}
      className={`inline-flex items-center gap-3 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Wallet className="h-5 w-5" aria-hidden />
      )}
      <span>{loading ? copy.loading : copy.label}</span>
    </button>
  );
}

export default GoogleWalletButton;
