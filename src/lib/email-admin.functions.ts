/**
 * Beheer van de mailserver + maillogboek. Enkel voor actieve beheerders.
 * Het SMTP-wachtwoord verlaat de server nooit: er wordt alleen gemeld óf er een
 * wachtwoord ingesteld is.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import type { SmtpConfigStatus } from "./smtp.server";

export type EmailEvent = {
  id: string;
  kind: string;
  recipient_masked: string;
  subject: string | null;
  status: "sent" | "failed" | "skipped";
  error_code: string | null;
  error_message: string | null;
  duration_ms: number | null;
  smtp_host: string | null;
  created_at: string;
};

export type EmailAdminSnapshot = {
  config: SmtpConfigStatus;
  events: EmailEvent[];
  envPresent: Record<string, boolean>;
  /** True in preview/lokaal: daar vertrekt er geen echte mail. */
  preview: boolean;
};

/**
 * Enkel beheerders. Let op: dit gaat *rechtstreeks* via Postgres
 * (`requirePermission`) en niet via de Data API — die laatste faalt met
 * "Invalid URL" wanneer de Neon Data API-url niet ingesteld is, waardoor het
 * hele e-mailbeheer onbruikbaar leek.
 */
async function assertAdmin(context: Parameters<typeof requirePermission>[0]) {
  await requirePermission(context, "manage_rights");
}

export const fetchEmailAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<EmailAdminSnapshot> => {
    await assertAdmin(context);
    const { smtpConfigStatus } = await import("./smtp.server");
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { isPreviewEnvironment } = await import("./auth-email.server");

    const { data, error } = await dbAdmin
      .from("email_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    return {
      config: await smtpConfigStatus(),
      preview: await isPreviewEnvironment(),
      events: (data ?? []) as EmailEvent[],
      envPresent: {
        SMTP_HOST: Boolean(process.env.SMTP_HOST),
        SMTP_PORT: Boolean(process.env.SMTP_PORT),
        SMTP_USER: Boolean(process.env.SMTP_USER),
        SMTP_PASS: Boolean(process.env.SMTP_PASS),
        SMTP_FROM: Boolean(process.env.SMTP_FROM),
      },
    };
  });

export const saveSmtpConfig = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        host: z.string().trim().max(200),
        port: z.number().int().min(1).max(65535),
        username: z.string().trim().max(200),
        /** Leeg laten = bestaand wachtwoord behouden. */
        password: z.string().max(300).optional(),
        from_address: z.string().trim().max(200),
        from_name: z.string().trim().max(120),
        secure: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { dbAdmin } = await import("@/lib/db-admin.server");

    const update: {
      host: string | null;
      port: number;
      username: string | null;
      from_address: string | null;
      from_name: string | null;
      secure: boolean;
      updated_by: string;
      password?: string;
    } = {
      host: data.host || null,
      port: data.port,
      username: data.username || null,
      from_address: data.from_address || null,
      from_name: data.from_name || null,
      secure: data.secure,
      updated_by: context.userId,
    };
    if (data.password && data.password.trim()) update.password = data.password.trim();

    const { error } = await dbAdmin.from("smtp_config").update(update).eq("id", true);
    if (error) throw new Error(error.message);

    const { smtpConfigStatus } = await import("./smtp.server");
    return { ok: true, config: await smtpConfigStatus() };
  });

/** Verwijdert de databank-instellingen zodat opnieuw de environment variables gelden. */
export const clearSmtpConfig = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { error } = await dbAdmin
      .from("smtp_config")
      .update({
        host: null,
        port: null,
        username: null,
        password: null,
        from_address: null,
        from_name: null,
        secure: null,
        updated_by: context.userId,
      })
      .eq("id", true);
    if (error) throw new Error(error.message);
    const { smtpConfigStatus } = await import("./smtp.server");
    return { ok: true, config: await smtpConfigStatus() };
  });

/* ------------------------- Mailroutering per formulier ------------------------- */

export type ContactRouteRow = {
  key: string;
  label: string;
  recipients: string[];
  active: boolean;
};

/** Alle categorieën met hun huidige ontvangers. */
export const fetchContactRoutes = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ routes: ContactRouteRow[]; databaseReady: boolean }> => {
    await assertAdmin(context);
    const { listContactRoutes } = await import("./contact-routes.server");
    const { hasDatabase } = await import("./neon.server");
    return { routes: await listContactRoutes(), databaseReady: hasDatabase() };
  });

/** Bewaart de ontvangers van één categorie. */
export const saveContactRouteFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        key: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[a-z0-9_-]+$/, "Enkel kleine letters, cijfers, - en _"),
        label: z.string().trim().min(1).max(80),
        recipients: z.array(z.string().trim().email()).min(1).max(10),
        active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { saveContactRoute } = await import("./contact-routes.server");
    await saveContactRoute({ ...data, updatedBy: context.userId });
    return { ok: true };
  });

/** Verwijdert een categorie uit de mailroutering. */
export const deleteContactRouteFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ key: z.string().trim().min(1).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { deleteContactRoute } = await import("./contact-routes.server");
    await deleteContactRoute(data.key);
    return { ok: true };
  });

/* ------------------------- Testmails per sjabloon ------------------------- */

const TEST_TEMPLATES = ["pickup_ticket", "booking_confirmation", "auth_code", "general_notice"] as const;
const TEST_LANGS = ["nl", "fr", "en"] as const;

export type TestTemplateKind = (typeof TEST_TEMPLATES)[number];
export type TestMailLang = (typeof TEST_LANGS)[number];

export type EmailTestResult = {
  template: TestTemplateKind;
  lang: TestMailLang;
  sent: boolean;
  error?: string;
  messageId?: string;
};

function sampleData(template: TestTemplateKind): Record<string, unknown> {
  switch (template) {
    case "pickup_ticket":
      return {
        naam: "Test Bezoeker",
        ordernummer: "TEST-0001",
        code: "AB12CD",
        afhaalmoment: "Zaterdag 10:00 – 12:00",
        totaal_cent: 1250,
        lijnen: [{ naam: "Testproduct", aantal: 1, prijs_cent: 1250 }],
      };
    case "booking_confirmation":
      return {
        naam: "Test Klant",
        referentie: "BOEK-TEST-01",
        formule: "Teambuilding",
        datum: new Date().toISOString().slice(0, 10),
        personen: 12,
        bedrag_cent: 45000,
      };
    case "auth_code":
      return { naam: "Test Gebruiker", code: "123456", url: "https://maximilien.site/auth" };
    default:
      return {
        naam: "Test Gebruiker",
        title: "Testmededeling",
        message: "Dit is een testbericht vanuit het beheerportaal.",
      };
  }
}

/**
 * Verstuurt élk gevraagd sjabloon in élke gevraagde taal naar één adres, zodat
 * beheerders de volledige mailweergave (NL/FR/EN) kunnen controleren zonder
 * een echte bestelling of boeking aan te maken.
 */
export const sendEmailTemplateTests = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        to: z.string().trim().email(),
        templates: z.array(z.enum(TEST_TEMPLATES)).min(1).max(TEST_TEMPLATES.length),
        langs: z.array(z.enum(TEST_LANGS)).min(1).max(TEST_LANGS.length),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ results: EmailTestResult[] }> => {
    await assertAdmin(context);
    const { sendTemplateMail } = await import("./email-engine.server");
    const results: EmailTestResult[] = [];
    for (const template of data.templates) {
      for (const lang of data.langs) {
        try {
          const res = await sendTemplateMail({
            to: { email: data.to, name: "Test" },
            templateType: template,
            data: sampleData(template),
            lang,
          });
          results.push({
            template,
            lang,
            sent: res.sent,
            ...(res.error ? { error: res.error } : {}),
            ...(res.messageId ? { messageId: res.messageId } : {}),
          });
        } catch (error) {
          results.push({ template, lang, sent: false, error: (error as Error).message });
        }
      }
    }
    return { results };
  });

/* --------------------------- Sjabloonvoorbeelden --------------------------- */

export type SystemEmailPreviewDto = {
  id: string;
  name: string;
  lang: TestMailLang;
  subject: string;
  html: string;
};

/**
 * Levert álle systeemmails (afhaalbon, boeking, inlogcode, certificaat, …) met
 * fictieve gegevens, zodat beheerders ze in het portaal kunnen bekijken en als
 * HTML downloaden. Enkel beheerders; de HTML bevat geen echte persoonsgegevens.
 */
export const fetchSystemEmailPreviews = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ langs: z.array(z.enum(TEST_LANGS)).min(1).max(TEST_LANGS.length) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ previews: SystemEmailPreviewDto[] }> => {
    await assertAdmin(context);
    const { buildSystemEmailPreviews } = await import("./email-previews.server");
    const previews = await buildSystemEmailPreviews(data.langs);
    return { previews };
  });

/* -------------------- Vangnetadres + logboek van inzendingen -------------------- */

export type { FormSubmission } from "./email-settings.server";

/** Het globale vangnetadres + de laatste formulierinzendingen. */
export const fetchEmailRoutingSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { fallbackEmail, listSubmissions } = await import("./email-settings.server");
    const { hasDatabase } = await import("./neon.server");
    return {
      fallback: await fallbackEmail(),
      submissions: await listSubmissions(50),
      databaseReady: hasDatabase(),
    };
  });

/** Bewaart het globale vangnetadres (herstelbestemming voor élke melding). */
export const saveFallbackEmailFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { saveFallbackEmail } = await import("./email-settings.server");
    await saveFallbackEmail(data.email, context.userId);
    return { ok: true };
  });

/** Inzendingen met filters (formuliersoort, status, datum, vrij zoeken). */
export const fetchSubmissions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        form: z.string().max(40).optional(),
        status: z.string().max(40).optional(),
        query: z.string().max(120).optional(),
        since: z.string().max(40).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { listSubmissions } = await import("./email-settings.server");
    const { hasDatabase } = await import("./neon.server");
    return {
      submissions: await listSubmissions({ limit: 200, ...data }),
      databaseReady: hasDatabase(),
    };
  });

/**
 * Stuurt een bewaarde inzending opnieuw via de Brevo HTTP-API en werkt de
 * status bij. Optioneel naar een gecorrigeerd adres.
 */
export const resendSubmission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({ id: z.string().uuid(), to: z.string().trim().email().optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getSubmission, updateSubmissionEmail } = await import("./email-settings.server");
    if (data.to) await updateSubmissionEmail(data.id, data.to);
    const submission = await getSubmission(data.id);
    if (!submission) throw new Error("Deze inzending bestaat niet meer.");

    const { contactAdminEmail } = await import("./email.server");
    const { dispatchSubmission } = await import("./email-service.server");
    const mail = contactAdminEmail({
      onderwerp: submission.subject || "Inzending via de website",
      naam: submission.name || "Bezoeker",
      email: submission.email || "",
      bericht: submission.message || "(geen bericht bewaard)",
      pagina: submission.form,
    });
    const out = await dispatchSubmission({
      submissionId: submission.id,
      category: submission.category ?? "algemeen",
      admin: { subject: mail.subject, html: mail.html },
      ...(submission.email ? { replyTo: submission.email } : {}),
      kind: `${submission.form}:opnieuw`,
    });
    return { status: out.status, error: out.error ?? null };
  });

/** Corrigeert het e-mailadres van een inzending (zonder te herversturen). */
export const updateSubmissionRecipient = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), email: z.string().trim().email() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { updateSubmissionEmail } = await import("./email-settings.server");
    const ok = await updateSubmissionEmail(data.id, data.email);
    if (!ok) throw new Error("Databank niet beschikbaar.");
    return { ok: true };
  });

/** Verwijdert één regel uit het inzendingenlogboek. */
export const deleteSubmissionFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { deleteSubmission } = await import("./email-settings.server");
    const ok = await deleteSubmission(data.id);
    if (!ok) throw new Error("Databank niet beschikbaar.");
    return { ok: true };
  });

/** Ruimt in één klik alle mislukte óf alle verstuurde logregels op. */
export const cleanupSubmissionsFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ scope: z.enum(["failed", "sent"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { cleanupSubmissions } = await import("./email-settings.server");
    return { removed: await cleanupSubmissions(data.scope) };
  });

/**
 * Verstuurt één sjabloon-voorbeeld (HTML zoals in de previewer) als test naar
 * een adres. Uitsluitend via de Brevo HTTP-API; plaatshouders zijn al
 * vervangen door voorbeeldwaarden in de browser.
 */
export const sendTemplateHtmlTest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        to: z.string().trim().email(),
        subject: z.string().trim().min(1).max(300),
        html: z.string().min(1).max(400_000),
        name: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ sent: boolean; error?: string }> => {
    await assertAdmin(context);
    const { sendDual } = await import("./email-service.server");
    const res = await sendDual({
      to: [data.to],
      subject: `[TEST] ${data.subject}`,
      html: data.html,
      kind: "template_test",
    });
    if (res.status === "failed") {
      return { sent: false, error: res.error ?? "Brevo weigerde de test-e-mail." };
    }
    return { sent: true };
  });
