import { normalizeMailLang, type MailLang } from "./email-copy";

export type ContactEmailInput = {
  inbox?: string;
  onderwerp: string;
  naam: string;
  email: string;
  telefoon?: string;
  organisatie?: string;
  bericht: string;
  pagina?: string;
  lang?: MailLang;
};

/**
 * Bewaart een geldige contactaanvraag vóór enige poging tot mailen.
 * Zodra de rij bestaat, blijft een mislukte provider een geslaagd antwoord.
 */
export async function processContactEmail(data: ContactEmailInput): Promise<{
  sent: boolean;
  stored: boolean;
  reason?: string;
}> {
  const { contactAdminEmail, contactReceiptEmail } = await import("./email.server");
  const { logSubmission } = await import("./email-settings.server");
  const { dispatchSubmission } = await import("./email-service.server");
  const payload = {
    onderwerp: data.onderwerp,
    naam: data.naam,
    email: data.email,
    telefoon: data.telefoon,
    organisatie: data.organisatie,
    bericht: data.bericht,
    pagina: data.pagina,
  };

  const submissionId = await logSubmission({
    form: "contact",
    category: data.inbox ?? "algemeen",
    name: data.naam,
    email: data.email,
    subject: data.onderwerp,
    message: data.bericht,
    payload,
  });

  if (!submissionId) {
    return { sent: false, stored: false, reason: "storage_failed" };
  }

  const admin = contactAdminEmail(payload);
  const receipt = contactReceiptEmail({ ...payload, lang: normalizeMailLang(data.lang) });
  const out = await dispatchSubmission({
    submissionId,
    category: data.inbox ?? "algemeen",
    admin: { subject: admin.subject, html: admin.html },
    customer: { to: data.email, subject: receipt.subject, html: receipt.html },
    replyTo: data.email,
    kind: "contact",
  });

  return {
    sent: true,
    stored: true,
    ...(out.status === "failed" ? { reason: out.error ?? "email_failed" } : {}),
  };
}