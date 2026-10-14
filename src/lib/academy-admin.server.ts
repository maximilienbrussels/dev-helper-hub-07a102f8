import { sendMail, siteOrigin } from "./email.server";

/** E-mailadressen van iedereen die academies mag publiceren. */
export async function publisherEmails(): Promise<string[]> {
  const { dbAdmin } = await import("@/lib/db-admin.server");
  const { data: roles } = await dbAdmin
    .from("role_permissions")
    .select("role")
    .eq("permission", "publish_academy")
    .eq("allowed", true);
  const allowed = (roles ?? []).map((r) => r.role);
  if (allowed.length === 0) return [];

  const { data: users } = await dbAdmin
    .from("user_roles")
    .select("user_id, role")
    .in("role", allowed);
  const ids = [...new Set((users ?? []).map((u) => u.user_id))];
  if (ids.length === 0) return [];

  const { data: profiles } = await dbAdmin.from("profiles").select("email, active").in("id", ids);
  return [
    ...new Set(
      (profiles ?? [])
        .filter((p) => p.active && p.email && p.email.includes("@"))
        .map((p) => p.email as string),
    ),
  ];
}

const shell = (title: string, body: string) => `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2a24">
    <h1 style="font-size:19px;margin:0 0 12px">${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#6b7d73">Beheerportaal — Maximilien</p>
  </div>`;

/** Mail naar de verantwoordelijke(n) met de vraag om een kaart live te zetten. */
export async function notifyPublishRequest(p: {
  academy: string;
  aanvrager: string;
  note: string | null;
}) {
  const to = await publisherEmails();
  if (to.length === 0) return { sent: false, reason: "no-publishers" as const };
  const url = `${siteOrigin()}/nl/academies`;
  const html = shell(
    "Goedkeuring gevraagd voor een academykaart",
    `<p><strong>${esc(p.aanvrager)}</strong> vraagt om de academy <strong>${esc(p.academy)}</strong> live te zetten.</p>
     ${p.note ? `<p style="background:#f3f6f4;padding:12px;border-radius:8px">${esc(p.note)}</p>` : ""}
     <p><a href="${url}">Openen in het beheerportaal</a></p>`,
  );
  for (const address of to) {
    await sendMail({
      to: address,
      subject: `Goedkeuring gevraagd: ${p.academy} Academy`,
      html,
      kind: "academy_publicatie",
    });
  }
  return { sent: true as const, recipients: to.length };
}

/** Mail naar de aanvrager met de beslissing. */
const esc = (v: string | null | undefined) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function notifyPublishDecision(p: {
  to: string;
  academy: string;
  approved: boolean;
  note: string | null;
}) {
  const html = shell(
    p.approved ? "Academykaart goedgekeurd" : "Academykaart niet goedgekeurd",
    `<p>De academy <strong>${esc(p.academy)}</strong> is ${
      p.approved ? "goedgekeurd en staat nu live." : "voorlopig niet gepubliceerd."
    }</p>
     ${p.note ? `<p style="background:#f3f6f4;padding:12px;border-radius:8px">${esc(p.note)}</p>` : ""}`,
  );
  return sendMail({
    to: p.to,
    subject: `${p.approved ? "Goedgekeurd" : "Afgewezen"}: ${p.academy} Academy`,
    html,
    kind: "academy_publicatie",
  });
}
