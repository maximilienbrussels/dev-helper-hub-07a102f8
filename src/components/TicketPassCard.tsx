import { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { MapPin } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";
import { CANONICAL_SITE_URL } from "@/lib/site-url";

export type TicketPassLocale = "nl" | "fr" | "en";

export type TicketPassData = {
  ticketId: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  locale?: TicketPassLocale;
};

export const PASS_BRAND = {
  background: "#1D3528",
  logo: "https://maximilien.dlp.li/logo.png",
  address: "Schipperijkaai 2, 1000 Brussel",
  verifyBase: `${CANONICAL_SITE_URL}/verify?id=`,
} as const;

export const PASS_COPY: Record<
  TicketPassLocale,
  {
    participant: string;
    ticketNumber: string;
    event: string;
    date: string;
    scan: string;
    google: string;
    savePhoto: string;
    homeScreen: string;
    print: string;
    googleQuestion: string;
    generating: string;
    saved: string;
    saveFailed: string;
    notConfigured: string;
    failed: string;
    howToInstall: string;
    installSteps: string[];
  }
> = {
  nl: {
    participant: "Deelnemer",
    ticketNumber: "Ticketnummer",
    event: "Evenement",
    date: "Datum",
    scan: "Scan aan de boerderijpoort",
    google: "Toevoegen aan Google Wallet",
    savePhoto: "Bewaar in Foto's / Bestanden",
    homeScreen: "Zet op Startscherm",
    print: "Ticket afdrukken",
    googleQuestion: "Gebruik je Google Wallet?",
    generating: "Bezig…",
    saved: "Ticket opgeslagen als afbeelding.",
    saveFailed: "Opslaan van de afbeelding is mislukt.",
    notConfigured: "Google Wallet is nog niet geconfigureerd op deze site.",
    failed: "Kon de wallet-pas niet aanmaken. Probeer het later opnieuw.",
    howToInstall: "Zet je ticket op je startscherm",
    installSteps: [
      "Tik onderaan in Safari op de deelknop (vierkant met pijl).",
      "Scroll en kies 'Zet op beginscherm'.",
      "Tik op 'Voeg toe' — je ticket opent voortaan offline vanaf je startscherm.",
    ],
  },
  fr: {
    participant: "Participant",
    ticketNumber: "Numéro de ticket",
    event: "Événement",
    date: "Date",
    scan: "À scanner à l'entrée de la ferme",
    google: "Ajouter à Google Wallet",
    savePhoto: "Enregistrer dans Photos",
    homeScreen: "Ajouter à l'écran d'accueil",
    print: "Imprimer le ticket",
    googleQuestion: "Vous utilisez Google Wallet ?",
    generating: "En cours…",
    saved: "Ticket enregistré comme image.",
    saveFailed: "Échec de l'enregistrement de l'image.",
    notConfigured: "Google Wallet n'est pas encore configuré sur ce site.",
    failed: "Impossible de créer le pass. Réessayez plus tard.",
    howToInstall: "Ajoutez votre ticket à l'écran d'accueil",
    installSteps: [
      "Touchez le bouton Partager dans Safari (carré avec flèche).",
      "Faites défiler et choisissez « Sur l'écran d'accueil ».",
      "Touchez « Ajouter » — votre ticket s'ouvrira hors ligne.",
    ],
  },
  en: {
    participant: "Participant",
    ticketNumber: "Ticket number",
    event: "Event",
    date: "Date",
    scan: "Scan at the farm gate",
    google: "Add to Google Wallet",
    savePhoto: "Save to Photos",
    homeScreen: "Add to Home Screen",
    print: "Print ticket",
    googleQuestion: "Using Google Wallet?",
    generating: "Working…",
    saved: "Ticket saved as an image.",
    saveFailed: "Saving the image failed.",
    notConfigured: "Google Wallet is not configured on this site yet.",
    failed: "Could not create the wallet pass. Please try again later.",
    howToInstall: "Add your ticket to the Home Screen",
    installSteps: [
      "Tap the Share button in Safari (square with an arrow).",
      "Scroll down and pick 'Add to Home Screen'.",
      "Tap 'Add' — your ticket then opens offline from your home screen.",
    ],
  },
};

/** Visuele ticketkaart in de bosgroene huisstijl, exporteerbaar als afbeelding. */
export const TicketPassCard = forwardRef<HTMLDivElement, TicketPassData>(function TicketPassCard(
  { ticketId, participantName, eventTitle, eventDate, locale = "nl" },
  ref,
) {
  const copy = PASS_COPY[locale] ?? PASS_COPY.nl;
  const verifyUrl = `${PASS_BRAND.verifyBase}${encodeURIComponent(ticketId)}`;

  return (
    <div
      ref={ref}
      style={{ backgroundColor: PASS_BRAND.background }}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl text-white shadow-xl"
    >
      <div className="flex items-center gap-3 border-b border-white/15 px-6 py-5">
        <img loading="lazy"
          src={PASS_BRAND.logo}
          onError={handleImageError}
          alt="Maximilien"
          crossOrigin="anonymous"
          className="h-10 w-10 rounded-full bg-white/10 object-contain"
        />
        <div className="text-sm font-semibold leading-tight">
          Maximilien
          <span className="block text-[11px] font-normal uppercase tracking-[0.18em] text-white/90">
            vzw · Brussel
          </span>
        </div>
      </div>

      <div className="space-y-4 px-6 py-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/90">{copy.event}</p>
          <p className="text-lg font-semibold leading-snug">{eventTitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/90">{copy.date}</p>
            <p className="text-sm font-medium">{eventDate}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/90">
              {copy.participant}
            </p>
            <p className="text-sm font-medium">{participantName}</p>
          </div>
        </div>

        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-wide">
          {copy.ticketNumber}: {ticketId}
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4">
          <QRCodeCanvas value={verifyUrl} size={168} level="M" includeMargin={false} />
          <p className="text-[11px] font-medium text-neutral-600">{copy.scan}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/15 px-6 py-4 text-xs text-white/90">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        <span>{PASS_BRAND.address}</span>
      </div>
    </div>
  );
});

export default TicketPassCard;
