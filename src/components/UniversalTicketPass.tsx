import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2, Printer, Share2, Smartphone, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { usePlatform } from "@/hooks/use-platform";
import {
  PASS_COPY,
  TicketPassCard,
  type TicketPassData,
  type TicketPassLocale,
} from "@/components/TicketPassCard";

export type UniversalTicketPassProps = TicketPassData & {
  passType?: "ticket" | "pickup" | "certificate";
  className?: string;
};

const BTN_BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Universele ticketpas: Google Wallet op Android/desktop, web-pass met
 * startscherm- en foto-opslag op iOS. Volledig NL/FR/EN.
 */
export function UniversalTicketPass({
  ticketId,
  participantName,
  eventTitle,
  eventDate,
  locale = "nl",
  passType = "ticket",
  className = "",
}: UniversalTicketPassProps) {
  const { platform } = usePlatform();
  const cardRef = useRef<HTMLDivElement>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const copy = PASS_COPY[(locale as TicketPassLocale) ?? "nl"] ?? PASS_COPY.nl;

  async function addToGoogleWallet() {
    if (walletLoading) return;
    setWalletLoading(true);
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
        toast.error(data.error === "wallet_not_configured" ? copy.notConfigured : copy.failed);
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
      setWalletLoading(false);
    }
  }

  async function saveAsImage() {
    if (!cardRef.current || imageLoading) return;
    setImageLoading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#1D3528",
      });
      const fileName = `ticket-${ticketId}.png`;

      const nav = window.navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (typeof nav.share === "function" && typeof nav.canShare === "function") {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: "image/png" });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: eventTitle });
          setImageLoading(false);
          return;
        }
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      toast.success(copy.saved);
    } catch {
      toast.error(copy.saveFailed);
    } finally {
      setImageLoading(false);
    }
  }

  const googleButton = (
    <button
      type="button"
      onClick={addToGoogleWallet}
      disabled={walletLoading}
      aria-label={copy.google}
      className={`${BTN_BASE} bg-neutral-900 text-white shadow-sm hover:bg-neutral-800`}
    >
      {walletLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Wallet className="h-5 w-5" aria-hidden />
      )}
      <span>{walletLoading ? copy.generating : copy.google}</span>
    </button>
  );

  const imageButton = (variant: "primary" | "secondary") => (
    <button
      type="button"
      onClick={saveAsImage}
      disabled={imageLoading}
      className={`${BTN_BASE} ${
        variant === "primary"
          ? "bg-[#1D3528] text-white hover:opacity-90"
          : "border border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {imageLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Download className="h-5 w-5" aria-hidden />
      )}
      <span>{imageLoading ? copy.generating : copy.savePhoto}</span>
    </button>
  );

  return (
    <div className={`space-y-5 ${className}`}>
      <TicketPassCard
        ref={cardRef}
        ticketId={ticketId}
        participantName={participantName}
        eventTitle={eventTitle}
        eventDate={eventDate}
        locale={locale}
      />

      <div className="mx-auto flex w-full max-w-sm flex-col gap-3 print:hidden">
        {platform === "ios" ? (
          <>
            <button
              type="button"
              onClick={() => setShowInstall(true)}
              className={`${BTN_BASE} bg-[#1D3528] text-white hover:opacity-90`}
            >
              <Share2 className="h-5 w-5" aria-hidden />
              <span>{copy.homeScreen}</span>
            </button>
            {imageButton("secondary")}
            <button
              type="button"
              onClick={addToGoogleWallet}
              disabled={walletLoading}
              className="text-center text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {copy.googleQuestion}
            </button>
          </>
        ) : platform === "android" ? (
          <>
            {googleButton}
            {imageButton("secondary")}
          </>
        ) : (
          <>
            {googleButton}
            {imageButton("secondary")}
            <button
              type="button"
              onClick={() => window.print()}
              className={`${BTN_BASE} border border-border bg-background text-foreground hover:bg-muted`}
            >
              <Printer className="h-5 w-5" aria-hidden />
              <span>{copy.print}</span>
            </button>
          </>
        )}
      </div>

      {showInstall ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.howToInstall}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowInstall(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Smartphone className="h-5 w-5" aria-hidden />
                {copy.howToInstall}
              </h2>
              <button
                type="button"
                onClick={() => setShowInstall(false)}
                aria-label="Sluiten"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              {copy.installSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UniversalTicketPass;
