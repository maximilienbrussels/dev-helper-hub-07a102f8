/**
 * Google Wallet pass generatie — server-only.
 * RS256 JWT-ondertekening via Web Crypto (werkt in de Cloudflare Worker runtime).
 */

export type WalletPassType = "ticket" | "pickup" | "certificate";
export type WalletLocale = "nl" | "fr" | "en";

export const WALLET_CONFIG = {
  issuerId: "3388000000023193763",
  classSuffix: "maximilien_ticket_v1",
  backgroundColor: "#1D3528",
  logoUri: "https://maximilien.dlp.li/logo.png",
  location: { latitude: 50.85885, longitude: 4.350356 },
  locationName: "Maximilien",
  homepage: "https://maximilien.brussels",
  origins: ["https://maximilien.brussels", "https://maximilien.site"],
  verifyBase: "https://maximilien.brussels/verify",
} as const;

const LABELS: Record<
  WalletLocale,
  { account: string; ticket: string; event: string; date: string; site: string }
> = {
  nl: {
    account: "Deelnemer",
    ticket: "Ticketnummer",
    event: "Evenement",
    date: "Datum / Date",
    site: "Website",
  },
  fr: {
    account: "Participant",
    ticket: "Numéro de ticket",
    event: "Événement",
    date: "Datum / Date",
    site: "Site web",
  },
  en: {
    account: "Participant",
    ticket: "Ticket Number",
    event: "Event",
    date: "Datum / Date",
    site: "Website",
  },
};

export type WalletPassInput = {
  ticketId: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  passType: WalletPassType;
  locale: WalletLocale;
  /** Optioneel: eigen verificatie-URL voor de QR-code. */
  verifyUrl?: string;
};

export type WalletCredentials = {
  issuerId: string;
  clientEmail: string;
  privateKey: string;
};

/** Leest de service-account gegevens uit de omgeving. Alleen binnen een handler aanroepen. */
export function readWalletCredentials(): WalletCredentials | null {
  const issuerId = process.env["GOOGLE_WALLET_ISSUER_ID"] || WALLET_CONFIG.issuerId;
  const clientEmail = process.env["GOOGLE_WALLET_CLIENT_EMAIL"] || "";
  const privateKey = (
    process.env["GOOGLE_WALLET_KEY"] ||
    process.env["GOOGLE_WALLET_PRIVATE_KEY"] ||
    ""
  ).replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) return null;
  return { issuerId, clientEmail, privateKey };
}

function sanitizeId(ticketId: string) {
  return ticketId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

/** Bouwt het generic-pass object volgens de Google Wallet specificatie. */
export function buildPassObject(input: WalletPassInput, issuerId: string) {
  const l = LABELS[input.locale] ?? LABELS.nl;

  return {
    id: `${issuerId}.${sanitizeId(input.ticketId)}`,
    classId: `${issuerId}.${WALLET_CONFIG.classSuffix}`,
    state: "ACTIVE",
    hexBackgroundColor: WALLET_CONFIG.backgroundColor,
    logo: {
      sourceUri: { uri: WALLET_CONFIG.logoUri },
      contentDescription: {
        defaultValue: { language: input.locale, value: WALLET_CONFIG.locationName },
      },
    },
    cardTitle: {
      defaultValue: { language: input.locale, value: WALLET_CONFIG.locationName },
    },
    header: {
      defaultValue: { language: input.locale, value: input.eventTitle },
    },
    subheader: {
      defaultValue: { language: input.locale, value: l.account },
    },
    accountNameLabel: l.account,
    accountName: input.participantName,
    accountIdLabel: l.ticket,
    accountId: input.ticketId,
    barcode: {
      type: "QR_CODE",
      value:
        input.verifyUrl ?? `${WALLET_CONFIG.verifyBase}?id=${encodeURIComponent(input.ticketId)}`,
      alternateText: input.ticketId,
    },
    textModulesData: [
      { id: "event", header: "Evenement", body: input.eventTitle },
      { id: "date", header: "Datum / Date", body: input.eventDate },
      { id: "type", header: "Type", body: input.passType },
    ],
    linksModuleData: {
      uris: [{ uri: WALLET_CONFIG.homepage, description: l.site, id: "website" }],
    },
    locations: [
      { latitude: WALLET_CONFIG.location.latitude, longitude: WALLET_CONFIG.location.longitude },
    ],
  };
}

function base64Url(bytes: Uint8Array | string) {
  const raw =
    typeof bytes === "string"
      ? bytes
      : Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string) {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Ondertekent een JWT-payload met RS256. */
export async function signRs256(payload: Record<string, unknown>, privateKeyPem: string) {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64Url(
    // btoa kan geen niet-ASCII aan; encodeer eerst naar UTF-8 bytes.
    String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))),
  );
  const signingInput = `${header}.${body}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(signingInput),
    ),
  );
  return `${signingInput}.${base64Url(signature)}`;
}

/** Bouwt de volledige "save to wallet" URL. */
export async function createSaveUrl(input: WalletPassInput, creds: WalletCredentials) {
  const claims = {
    iss: creds.clientEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [...WALLET_CONFIG.origins],
    payload: { genericObjects: [buildPassObject(input, creds.issuerId)] },
  };

  const token = await signRs256(claims, creds.privateKey);
  return `https://pay.google.com/gp/v/save/${token}`;
}

/**
 * Compatibiliteitslaag voor de oudere `wallet.functions.ts` serverfunctie.
 * Geeft `null` terug wanneer de Google Wallet-secrets ontbreken.
 */
export async function generateGoogleWalletPassUrl(input: {
  id: string;
  type: "pickup_ticket" | "booking" | "certificate";
  title: { nl: string; fr: string; en: string };
  subtitle?: { nl: string; fr: string; en: string };
  recipientName?: string;
  eventDate?: string;
  verificationUrl: string;
  lang: WalletLocale;
}): Promise<string | null> {
  const creds = readWalletCredentials();
  if (!creds) return null;

  const passType: WalletPassType =
    input.type === "certificate" ? "certificate" : input.type === "pickup_ticket" ? "pickup" : "ticket";

  return createSaveUrl(
    {
      ticketId: input.id,
      participantName: input.recipientName ?? input.subtitle?.[input.lang] ?? "",
      eventTitle: input.title[input.lang],
      eventDate: input.eventDate ?? "",
      passType,
      locale: input.lang,
      verifyUrl: input.verificationUrl,
    },
    creds,
  );
}

/* ------------------------------------------------------------------ */
/* Mijn Hooi — digitale ledenpas                                       */
/* ------------------------------------------------------------------ */

export const MEMBER_CLASS_SUFFIX = "maximilien_hooi_card";

const MEMBER_LABELS: Record<
  WalletLocale,
  { title: string; member: string; number: string; balance: string; tier: string; site: string }
> = {
  nl: {
    title: "Mijn Hooi - Digital Pass",
    member: "Lid",
    number: "Lidnummer",
    balance: "Hoefjes",
    tier: "Status",
    site: "Website",
  },
  fr: {
    title: "Mijn Hooi - Digital Pass",
    member: "Membre",
    number: "Numéro de membre",
    balance: "Hoefjes",
    tier: "Statut",
    site: "Site web",
  },
  en: {
    title: "Mijn Hooi - Digital Pass",
    member: "Member",
    number: "Member number",
    balance: "Hoefjes",
    tier: "Status",
    site: "Website",
  },
};

export type WalletMemberInput = {
  memberId: string;
  memberName: string;
  hooiBalance: number;
  tier?: string;
  locale: WalletLocale;
};

/** Bouwt het generic-pass object voor de Mijn Hooi ledenkaart. */
export function buildMemberPassObject(input: WalletMemberInput, issuerId: string) {
  const l = MEMBER_LABELS[input.locale] ?? MEMBER_LABELS.nl;

  return {
    id: `${issuerId}.hooi_${sanitizeId(input.memberId)}`,
    classId: `${issuerId}.${MEMBER_CLASS_SUFFIX}`,
    state: "ACTIVE",
    hexBackgroundColor: WALLET_CONFIG.backgroundColor,
    logo: {
      sourceUri: { uri: WALLET_CONFIG.logoUri },
      contentDescription: {
        defaultValue: { language: input.locale, value: WALLET_CONFIG.locationName },
      },
    },
    cardTitle: {
      defaultValue: { language: input.locale, value: l.title },
    },
    header: {
      defaultValue: { language: input.locale, value: WALLET_CONFIG.locationName },
    },
    subheader: {
      defaultValue: { language: input.locale, value: l.member },
    },
    accountNameLabel: l.member,
    accountName: input.memberName,
    accountIdLabel: l.number,
    accountId: input.memberId,
    barcode: {
      type: "QR_CODE",
      value: `fermemaximilien:customer:${input.memberId}`,
      alternateText: input.memberId,
    },
    textModulesData: [
      { id: "balance", header: l.balance, body: String(input.hooiBalance) },
      ...(input.tier ? [{ id: "tier", header: l.tier, body: input.tier }] : []),
    ],
    linksModuleData: {
      uris: [{ uri: WALLET_CONFIG.homepage, description: l.site, id: "website" }],
    },
    locations: [
      { latitude: WALLET_CONFIG.location.latitude, longitude: WALLET_CONFIG.location.longitude },
    ],
  };
}

/** Bouwt de "save to wallet" URL voor de Mijn Hooi ledenkaart. */
export async function createMemberSaveUrl(
  input: WalletMemberInput,
  creds: WalletCredentials,
) {
  const claims = {
    iss: creds.clientEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [...WALLET_CONFIG.origins],
    payload: { genericObjects: [buildMemberPassObject(input, creds.issuerId)] },
  };

  const token = await signRs256(claims, creds.privateKey);
  return `https://pay.google.com/gp/v/save/${token}`;
}
