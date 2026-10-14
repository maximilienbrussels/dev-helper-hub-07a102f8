import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { z } from "zod";
import { requirePermission } from "@/lib/portal-permissions";
import { dbAdmin } from "@/lib/db-admin.server";
import {
  academyInputSchema,
  vraagInputSchema,
  publishRequestSchema,
  publishDecisionSchema,
} from "@/lib/academy-admin-schema";
import { auditAll, type AuditAcademy } from "@/lib/academy-audit";
import { controleerPool } from "@/lib/academy-selectie";

const ACADEMY_COLUMNS =
  "id, slug, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, beschrijving, beschrijving_fr, beschrijving_en, categorie, badge_icon, cover_image_url, cover_image_alt, vragen_per_test, slaag_grens, prioriteit, is_active, status, created_by, review_requested_by, review_requested_at, review_note, reviewed_by, reviewed_at";

const VRAAG_COLUMNS =
  "id, academy_id, module, doelgroep, vraag_type, vraag_tekst, vraag_tekst_fr, vraag_tekst_en, opties, opties_fr, opties_en, correcte_optie_index, media_url, media_alt, wist_je_dat, wist_je_dat_fr, wist_je_dat_en, variant_groep, verplicht, moeilijkheid, correct_getal, getal_marge, getal_eenheid, getal_eenheid_fr, getal_eenheid_en";

async function assertPubliceerbaar(id: string) {
  const [a, q] = await Promise.all([
    dbAdmin.from("academies").select("id, slug, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, beschrijving, beschrijving_fr, beschrijving_en, categorie, status, is_active").eq("id", id).single(),
    dbAdmin.from("academy_vragen").select(VRAAG_COLUMNS).eq("academy_id", id),
  ]);
  if (a.error || !a.data) throw new Error(a.error?.message ?? "Academy bestaat niet.");
  if (q.error) throw new Error(q.error.message);
  const vragen = (q.data ?? []).map((v) => ({ ...v, opties: v.opties as unknown, opties_fr: v.opties_fr as unknown, opties_en: v.opties_en as unknown }));
  const audit = auditAll([{ ...a.data, vragen } as AuditAcademy]);
  if (!audit.complete) throw new Error(`Publiceren geblokkeerd: los eerst ${audit.totalIssues} ontbrekende vertaling(en) op.`);
  const pool = controleerPool(vragen);
  if (!pool.publiceerbaar) {
    throw new Error(`Publiceren geblokkeerd: minimaal 8 kindervragen en 5 vragen in elk van de drie 16+-rondes vereist (nu ${pool.kids}; rondes ${pool.adultPerRonde.join("/")}).`);
  }
}

/** Alle academies (ook concepten) met hun vragen — voor beheer, preview en controle. */
export const fetchAcademyAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "view_academy");
    // Bekende bug: bij een ontbrekende/lege Data-API-configuratie gooit de
    // onderliggende fetch-client een kale "Invalid URL" i.p.v. een duidelijke
    // fout. We vangen dat hier op zodat de pagina een bruikbare melding toont
    // in plaats van te crashen.
    // Rechtstreeks via de directe SQL-client (dbAdmin), niet via de Data-API:
    // de Data-API-configuratie (neonDataApiUrl) is niet altijd aanwezig en gaf
    // voordien een kale "Invalid URL". Deze route heeft al zijn eigen
    // permissiecontrole (requirePermission hierboven), dus dat is veilig.
    const [academies, vragen, requests] = await Promise.all([
      dbAdmin
        .from("academies")
        .select(ACADEMY_COLUMNS)
        .order("prioriteit")
        .order("diersoort_naam"),
      dbAdmin.from("academy_vragen").select(VRAAG_COLUMNS).order("module"),
      dbAdmin
        .from("academy_publish_requests")
        .select(
          "id, academy_id, requested_by, requester_email, note, status, decided_at, decision_note, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (academies.error) throw new Error(academies.error.message);
    if (vragen.error) throw new Error(vragen.error.message);
    if (requests.error) throw new Error(requests.error.message);

    const byAcademy = new Map<string, typeof vragen.data>();
    for (const v of vragen.data ?? []) {
      const list = byAcademy.get(v.academy_id) ?? [];
      list.push(v);
      byAcademy.set(v.academy_id, list);
    }

    return {
      academies: (academies.data ?? []).map((a) => ({
        ...a,
        vragen: (byAcademy.get(a.id) ?? []).map((v) => ({
          ...v,
          opties: (v.opties as string[]) ?? [],
          opties_fr: (v.opties_fr as string[] | null) ?? null,
          opties_en: (v.opties_en as string[] | null) ?? null,
        })),
      })),
      requests: requests.data ?? [],
    };
  });

/** Automatisch controlerapport NL/FR/EN per kaart en per module. */
export const auditAcademyTranslations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "view_academy");
    const [academies, vragen] = await Promise.all([
      dbAdmin
        .from("academies")
        .select(
          "id, slug, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, beschrijving, beschrijving_fr, beschrijving_en, categorie, status, is_active",
        )
        .order("categorie")
        .order("diersoort_naam"),
      dbAdmin
        .from("academy_vragen")
        .select(
          "id, academy_id, module, doelgroep, vraag_type, vraag_tekst, vraag_tekst_fr, vraag_tekst_en, opties, opties_fr, opties_en, wist_je_dat, wist_je_dat_fr, wist_je_dat_en, variant_groep, verplicht, moeilijkheid, getal_eenheid, getal_eenheid_fr, getal_eenheid_en",
        ),
    ]);
    if (academies.error) throw new Error(academies.error.message);
    if (vragen.error) throw new Error(vragen.error.message);

    const rows: AuditAcademy[] = (academies.data ?? []).map((a) => ({
      ...a,
      vragen: (vragen.data ?? [])
        .filter((v) => v.academy_id === a.id)
        .map((v) => ({
          id: v.id,
          module: v.module,
          vraag_tekst: v.vraag_tekst,
          vraag_tekst_fr: v.vraag_tekst_fr,
          vraag_tekst_en: v.vraag_tekst_en,
          opties: v.opties,
          opties_fr: v.opties_fr,
          opties_en: v.opties_en,
          wist_je_dat: v.wist_je_dat,
          wist_je_dat_fr: v.wist_je_dat_fr,
          wist_je_dat_en: v.wist_je_dat_en,
          doelgroep: v.doelgroep,
          vraag_type: v.vraag_type,
          variant_groep: v.variant_groep,
          verplicht: v.verplicht,
          moeilijkheid: v.moeilijkheid,
          getal_eenheid: v.getal_eenheid,
          getal_eenheid_fr: v.getal_eenheid_fr,
          getal_eenheid_en: v.getal_eenheid_en,
        })),
    }));
    return auditAll(rows);
  });

/** Kaart aanmaken of bijwerken. Nieuwe kaarten starten altijd als concept. */
export const saveAcademy = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => academyInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_academy");
    const { id, ...fields } = data;
    if (id) {
      const { error } = await dbAdmin
        .from("academies")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await dbAdmin
      .from("academies")
      .insert({ ...fields, status: "concept", created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

/** Kaart tijdelijk uitschakelen of opnieuw zichtbaar maken. */
export const setAcademyActive = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_academy");
    const { error } = await dbAdmin
      .from("academies")
      .update({ is_active: data.is_active, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Rechtstreeks publiceren of offline halen — enkel met publicatierecht. */
export const setAcademyStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["concept", "gepubliceerd"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "publish_academy");
    if (data.status === "gepubliceerd") await assertPubliceerbaar(data.id);
    const { error } = await dbAdmin
      .from("academies")
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Kaart verwijderen — enkel met publicatierecht. */
export const deleteAcademy = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "publish_academy");
    const { error } = await dbAdmin.from("academies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Vraag toevoegen of bijwerken (drietalig). */
export const saveVraag = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => vraagInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_academy");
    if (data.vraag_type !== "getal" && data.correcte_optie_index >= data.opties.length) {
      throw new Error("Het juiste antwoord verwijst naar een optie die niet bestaat.");
    }
    const { id, ...fields } = data;
    const payload = {
      ...fields,
      module: fields.doelgroep === "kids" ? 1 : fields.module,
      opties: fields.vraag_type === "getal" ? [] : fields.opties,
      opties_fr: fields.opties_fr && fields.opties_fr.length > 0 ? fields.opties_fr : null,
      opties_en: fields.opties_en && fields.opties_en.length > 0 ? fields.opties_en : null,
      updated_at: new Date().toISOString(),
    };
    if (id) {
      const { error } = await dbAdmin.from("academy_vragen").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await dbAdmin
      .from("academy_vragen")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

/** Vraag verwijderen. */
export const deleteVraag = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_academy");
    const { error } = await dbAdmin.from("academy_vragen").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Goedkeuring vragen om een kaart live te zetten (mail naar de verantwoordelijke). */
export const requestAcademyPublication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => publishRequestSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_academy");
    await assertPubliceerbaar(data.academy_id);
    const email = (context.claims as { email?: string } | undefined)?.email ?? null;

    const { data: academy, error: aErr } = await dbAdmin
      .from("academies")
      .select("id, diersoort_naam, status")
      .eq("id", data.academy_id)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!academy) throw new Error("Academy bestaat niet");
    if (academy.status === "gepubliceerd") throw new Error("Deze kaart staat al live.");

    const { error: rErr } = await dbAdmin.from("academy_publish_requests").insert({
      academy_id: data.academy_id,
      requested_by: context.userId,
      requester_email: email,
      note: data.note,
      status: "open",
    });
    if (rErr) throw new Error(rErr.message);

    const { error: uErr } = await dbAdmin
      .from("academies")
      .update({
        status: "wacht_op_goedkeuring",
        review_requested_by: context.userId,
        review_requested_at: new Date().toISOString(),
        review_note: data.note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.academy_id);
    if (uErr) throw new Error(uErr.message);

    let notified = 0;
    try {
      const { notifyPublishRequest } = await import("./academy-admin.server");
      const res = await notifyPublishRequest({
        academy: academy.diersoort_naam,
        aanvrager: email ?? "een teamlid",
        note: data.note,
      });
      notified = res.sent ? (res.recipients ?? 0) : 0;
    } catch (e) {
      console.error("[academy] mail voor publicatieverzoek faalde", e);
    }
    return { ok: true, notified };
  });

/** Beslissen over een publicatieverzoek — enkel met publicatierecht. */
export const decideAcademyPublication = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => publishDecisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "publish_academy");

    const { data: request, error: rErr } = await dbAdmin
      .from("academy_publish_requests")
      .select("id, academy_id, requester_email, status")
      .eq("id", data.request_id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!request) throw new Error("Verzoek bestaat niet");
    if (request.status !== "open") throw new Error("Dit verzoek is al behandeld.");

    const now = new Date().toISOString();
    const { error: updErr } = await dbAdmin
      .from("academy_publish_requests")
      .update({
        status: data.approve ? "goedgekeurd" : "afgewezen",
        decided_by: context.userId,
        decided_at: now,
        decision_note: data.decision_note,
      })
      .eq("id", request.id);
    if (updErr) throw new Error(updErr.message);

    const { data: academy, error: aErr } = await dbAdmin
      .from("academies")
      .update({
        status: data.approve ? "gepubliceerd" : "concept",
        reviewed_by: context.userId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", request.academy_id)
      .select("diersoort_naam")
      .single();
    if (aErr) throw new Error(aErr.message);

    if (request.requester_email) {
      try {
        const { notifyPublishDecision } = await import("./academy-admin.server");
        await notifyPublishDecision({
          to: request.requester_email,
          academy: academy.diersoort_naam,
          approved: data.approve,
          note: data.decision_note,
        });
      } catch (e) {
        console.error("[academy] beslissingsmail faalde", e);
      }
    }
    return { ok: true };
  });
