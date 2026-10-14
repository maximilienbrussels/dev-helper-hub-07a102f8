/**
 * Dutch-only foutmeldingen voor de publieke verificatiepagina's, met een
 * concrete oorzaak + actie per faalreden (zie `VerifyResult["reason"]`).
 */
import { EXAMPLE_CERT_CODE } from "@/lib/verify-prefixes";

export type VerifyFailReason = "invalid_format" | "not_found" | "rate_limited";

export type VerifyReasonMessage = {
  title: string;
  cause: string;
  action: string;
};

export function verifyReasonMessage(reason: VerifyFailReason): VerifyReasonMessage {
  switch (reason) {
    case "invalid_format":
      return {
        title: "Ongeldig certificaatnummer",
        cause: "Dit lijkt geen geldig certificaatnummer.",
        action: `Gebruik het formaat ${EXAMPLE_CERT_CODE} (prefix-jaar-volgnummer).`,
      };
    case "rate_limited":
      return {
        title: "Te veel pogingen",
        cause: "Er zijn te veel opzoekingen vanaf dit toestel gedaan.",
        action: "Probeer over een uur opnieuw.",
      };
    case "not_found":
    default:
      return {
        title: "Certificaat niet gevonden",
        cause: "Er bestaat geen certificaat met dit nummer, of het is ingetypt met een fout.",
        action: "Controleer de spelling en cijfers, of neem contact op met de uitgevende academie.",
      };
  }
}
