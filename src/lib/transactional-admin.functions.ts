/**
 * Beheerdersdashboard: maillogboek van de transactionele engine bekijken en
 * mislukte mails opnieuw versturen.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

export type TransactionalLog = {
  id: string;
  reference: string | null;
  template: string;
  lang: string;
  recipient: string;
  subject: string | null;
  status: "pending" | "sent" | "failed";
  attempts: number;
  error_message: string | null;
  provider_status: number | null;
  created_at: string;
  sent_at: string | null;
};

async function assertAdmin(context: { userId: string; claims?: unknown }) {
  const { hasPermission } = await import("@/lib/permission-core.server");
  if (!(await hasPermission(context, "manage_rights"))) {
    throw new Error("Enkel beheerders kunnen het maillogboek bekijken.");
  }
}

export const fetchTransactionalLogs = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z
      .object({ status: z.enum(["all", "failed", "sent"]).default("all") })
      .default({ status: "all" })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<TransactionalLog[]> => {
    await assertAdmin(context as never);
    const { db } = await import("@/lib/neon.server");
    const sql = db();
    const rows =
      data.status === "all"
        ? await sql`select id, reference, template, lang, recipient, subject, status, attempts,
                           error_message, provider_status, created_at, sent_at
                      from public.email_logs order by created_at desc limit 100`
        : await sql`select id, reference, template, lang, recipient, subject, status, attempts,
                           error_message, provider_status, created_at, sent_at
                      from public.email_logs where status = ${data.status}
                      order by created_at desc limit 100`;
    return rows as TransactionalLog[];
  });

export const resendTransactionalEmail = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) => z.object({ logId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { resendEmailLog } = await import("@/lib/transactional-email.server");
    return resendEmailLog(data.logId);
  });
