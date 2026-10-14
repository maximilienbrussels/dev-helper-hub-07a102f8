/**
 * Instellingen voor de Maxim-chat, beheerd in het portaal.
 * Bewaard in `site_settings` onder de sleutel `chat`.
 */

export type ChatSettings = {
  /** Toont of verbergt de zwevende chatknop op de hele site. */
  chatEnabled: boolean;
  /** Aan = Infomaniak AI, uit = eenvoudige regelgebaseerde bot. */
  chatAiEnabled: boolean;
  /** Bericht dat bezoekers zien wanneer de chat uitstaat. */
  offlineMessage: string;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  chatEnabled: true,
  chatAiEnabled: true,
  offlineMessage:
    "De chat is momenteel offline. Je bereikt ons via info@fermeduparcmaximilien.be of +32 2 331 53 91.",
};

/** Ruwe JSON uit de databank veilig omzetten naar instellingen. */
export function parseChatSettings(raw: unknown): ChatSettings {
  const o = (raw ?? {}) as Record<string, unknown>;
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  const message = typeof o["offline_message"] === "string" ? (o["offline_message"] as string) : "";
  return {
    chatEnabled: bool(o["chat_enabled"], DEFAULT_CHAT_SETTINGS.chatEnabled),
    chatAiEnabled: bool(o["chat_ai_enabled"], DEFAULT_CHAT_SETTINGS.chatAiEnabled),
    offlineMessage: message.trim() || DEFAULT_CHAT_SETTINGS.offlineMessage,
  };
}

/* ------------------------------ betalingen ------------------------------ */

/** Bewaard in `site_settings` onder de sleutel `payments`. */
export type PaymentSettings = {
  /** settings_pay_on_pickup_enabled: toont "Betalen bij afhaling" in de checkout. */
  payOnPickupEnabled: boolean;
  /** Instructietekst voor de klant (checkout, mail, PDF-afhaalpas). */
  payOnPickupNotice: string;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  payOnPickupEnabled: false,
  payOnPickupNotice: "Betaal contant of via Payconiq aan de kassa op de stadsboerderij.",
};

export function parsePaymentSettings(raw: unknown): PaymentSettings {
  const o = (raw ?? {}) as Record<string, unknown>;
  const notice =
    typeof o["pay_on_pickup_notice"] === "string" ? (o["pay_on_pickup_notice"] as string) : "";
  return {
    payOnPickupEnabled:
      typeof o["pay_on_pickup_enabled"] === "boolean"
        ? (o["pay_on_pickup_enabled"] as boolean)
        : DEFAULT_PAYMENT_SETTINGS.payOnPickupEnabled,
    payOnPickupNotice: notice.trim() || DEFAULT_PAYMENT_SETTINGS.payOnPickupNotice,
  };
}
