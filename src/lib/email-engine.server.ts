/**
 * Eén server-side ingang voor élke uitgaande mail.
 *
 * Alle triggers (afhaalbon, boekingsbevestiging, inlogcode, mededeling) lopen
 * via `sendTemplateMail`: het sjabloon wordt hier gekozen, het onderwerp per
 * taal (NL/FR/EN) meegegeven en het resultaat bevat expliciete diagnostiek
 * (route, message-id, duur). Nooit vanuit een clientcomponent aanroepen — dit
 * bestand eindigt op `.server.ts` en blijft dus buiten de browserbundel.
 */
import type { MailLang } from "./email-copy";
import type { OrderLine, SendResult } from "./email.server";

export type MailTemplateType =
  | "pickup_ticket"
  | "booking_confirmation"
  | "auth_code"
  | "general_notice";

export interface SendMailOptions {
  to: { email: string; name?: string };
  /** Onderwerp per taal; laat leeg om het sjabloononderwerp te gebruiken. */
  subject?: { nl: string; fr: string; en: string };
  templateType: MailTemplateType;
  data: Record<string, unknown>;
  lang: MailLang;
  replyTo?: string;
}

export type SendMailDiagnostics = SendResult & {
  templateType: MailTemplateType;
  lang: MailLang;
  subject: string;
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Bouwt onderwerp + HTML voor het gevraagde sjabloon in de gevraagde taal. */
async function render(
  opts: SendMailOptions,
): Promise<{ subject: string; html: string; kind: string }> {
  const mail = await import("./email.server");
  const { lang, data } = opts;

  switch (opts.templateType) {
    case "pickup_ticket": {
      const built = mail.orderEmail({
        naam: str(data["naam"]) || opts.to.name || "",
        ordernummer: str(data["ordernummer"], "—"),
        code: str(data["code"], "—"),
        afhaalmoment: str(data["afhaalmoment"], "—"),
        totaal_cent: num(data["totaal_cent"]),
        lijnen: Array.isArray(data["lijnen"]) ? (data["lijnen"] as OrderLine[]) : [],
        lang,
      });
      return { ...built, kind: "afhaalbon" };
    }
    case "booking_confirmation": {
      const built = mail.bookingPaidEmail({
        naam: str(data["naam"]) || opts.to.name || "",
        referentie: str(data["referentie"], "—"),
        formule: str(data["formule"], "—"),
        datum: str(data["datum"], "—"),
        personen: num(data["personen"], 1),
        bedrag_cent: num(data["bedrag_cent"]),
        lang,
      });
      return { ...built, kind: "boeking" };
    }
    case "auth_code": {
      const built = mail.authActionEmail("magic", {
        naam: str(data["naam"]) || opts.to.name || "",
        ...(str(data["url"]) ? { url: str(data["url"]) } : {}),
        ...(str(data["code"]) ? { code: str(data["code"]) } : {}),
        lang,
      });
      return { ...built, kind: "auth-code" };
    }
    default: {
      const built = mail.noticeEmail({
        naam: str(data["naam"]) || opts.to.name || "",
        title: str(data["title"], opts.subject?.[lang] ?? "Bericht"),
        message: str(data["message"]),
        ...(str(data["ctaLabel"]) ? { ctaLabel: str(data["ctaLabel"]) } : {}),
        ...(str(data["ctaUrl"]) ? { ctaUrl: str(data["ctaUrl"]) } : {}),
        lang,
      });
      return { ...built, kind: "mededeling" };
    }
  }
}

/** Verstuurt een sjabloonmail via de Brevo HTTP-API en logt het resultaat. */
export async function sendTemplateMail(opts: SendMailOptions): Promise<SendMailDiagnostics> {
  const { sendMail } = await import("./email.server");
  const rendered = await render(opts);
  const subject = opts.subject?.[opts.lang]?.trim() || rendered.subject;

  const result = await sendMail({
    to: opts.to.email,
    subject,
    html: rendered.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    kind: `${rendered.kind}:${opts.lang}`,
  });

  return { ...result, templateType: opts.templateType, lang: opts.lang, subject };
}
